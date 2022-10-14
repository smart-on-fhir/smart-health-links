---
sidebar_position: 2
---

# SHL Protocol Specification

#### Actors

* **Data Sharer**. Person who decides to share health data
* **Data Recipient**. Person or organization responsible for receiving health data


## Pre-protocol step: Data Sharer Configures a new SHLink

The Data Sharer makes a few decisions at configuration time:

* **What to share**. Depending on the Data Sharer's software, this could be an explicit set of files or a "sharing policy" that matches different data over time.
* **Whether the SHLink will require a Passcode** to access. Depending on the Data Sharer's software, a Passcode may be mandatory.
* **Whether the SHLink will expire** at some pre-specified time. Depending on the Data Sharer's software, an expiration time may be mandatory.

Regarding "what to share": a single SHLink at a specific point in time will *resolve* to a manifest of files of the following types:
* `application/smart-health-card`: a JSON file with a `.verifiableCredential` array containing SMART Health Card JWS strings, as specified by https://spec.smarthealth.cards#via-file-download.
* `application/fhir+json`: a JSON file containing any FHIR resource (e.g., an individual resource or a Bundle of resources). Generally this format may not be tamper-proof.
* `application/smart-api-access`: a JSON file with a SMART Access Token Response (see [SMART App Launch](https://hl7.org/fhir/smart-app-launch/app-launch.html#response-5)). Two additional properties are defined:
  * `aud` Required string indicating the FHIR Server Base URL where this token can be used (e.g.,  ``"https://server.example.org/fhir"``)
  * `query`: Optional array of strings acting as hints to the client, indicating queries it might want to make (e.g., `["Coverage?patient=123&_tag=family-insurance"]`)


At configuration time, the Data Sharer's software SHALL generate (or obtain from the Resource Server) a random key used for encrypting/decrypting the files in the manifest (see ["Decryption"](#Encrypting-and-Decrypting-Files)). 

:::info 
**:notebook:   Design Note (trust and encryption)**

*This pattern of encrypting files allows for deployment scenarios where the Resource Server is not trusted to know the information inside of the manifest's files. In such scenarios, the Data Sharer and Data Recipient can treat the Resource Server as a blind intermediary. That said: in many deployment scenarios the Resource Server will be hosted by a healthcare provider or other entity that already has access to such files. For consistency, this protocol always applies encryption.*
:::

:::info
**:notebook:   Design Note (Data Sharer "internals")**

*We do not standardize the protocol by which the Data Sharer's local software communicates with the Resource Server. These may be provided by the same vendor and use internal APIs to communicate -- or there may be no "local" software at all.*
:::

## Data Sharer Generates a SHLink URI

### Establish a SHLink Manifest URL

Based the configuration from (1), the resource server generates a "manifest URL" for the new SHLink. The manifest URL:

* SHALL include at least **256 bits of entropy**
    * A suggested approach is to generate a cryptographically strong 32-byte random sequence and then base64url-encode this sequence to obtain a 43-character string that is used as a path segment. For example: `https://shl.example.org/manifests/I91rhba3VsuGXGchcnr6VHlQFKxfE28kuZ0ssbEuxno/manifest.json`
* SHALL NOT exceed **128 characters** in length (note, this maximum applies to the `url` field of the SHLink Payload, not to the entire SHLink URI).

The Data Sharer's software incorporates the manifest URL into a SHLink as follows:

### Construct a SHLink Payload

The SHLink Payload is a JSON object including the following properties:

* `url`: Manifest URL for this SHLink
* `key`: Decryption key for processing files returned in the manifest. 43 characters, consisting of 32 random bytes base64urlencoded.
* `exp`: Optional. Number representing expiration time in Epoch seconds, as a hint to help the Data Recipient determine if this QR is stale. (Note: epoch times should be parsed into 64-bit numeric types.)
* `flag`: Optional. String created by concatenating single-character flags in alphabetical order
  * `L` Indicates the SHLink is intended for long-term use
  * `P` Indicates the SHLink requires a Passcode to resolve
* `label`: Optional.  String no longer than 80 characters that provides a short description of the data behind the SHLink. 
* `v`: Optional. Integer representing the SHLinks protocol version this SHLink conforms to. MAY be omitted when the default value (`1`) applies.


The JSON Payload is then:
* Minified
* Base64urlencoded
* Prefixed with `shlink:/`
* Optionally prefixed with a viewer URL that ends with `#`


**:notebook: Design Note: Protocol Versioning**

Implementations can rely on the following behaviors:

* SHLink Payload processing for `shlink:` URIs
  * SHLink Payloads SHALL be constructed as per `"v":1` (i.e., payloads are Base64urlencoded, minified JSON objects)
    * Any changes to this design will require a new URI scheme, rather than a `v` bump
* SHLink Payload stability
  * `.label`, `.exp`, and `.flag` SHALL always work as defined for `"v":1`
    * Any changes to this design will require a new URI scheme, rather than a `v` bump
  * New properties MAY be introduced without a version bump, as long as they're optional and safe to ignore
  * Data Recipients SHALL ignore properties they don't recognize
  * Introduction of properties that can't safely be ignored will require a `v` bump
* SHLink Payload flags
  * New flag values MAY be introduced without a version bump, as long as they're safe to ignore. For example, the v1 flag `L` is safe to ignore because the client will still be able to handle a one-time manifest request. The `P` flag however cannot be ignored because the server will respond with an error if no passcode is provided.
  * Data Recipients SHALL ignore flag values they don't recognize
  * Introduction of new flag values that can't safely be ignored will require a `v` bump
* Manifest URL request/response
  * New request parameters or headers MAY be introducd without a version bump, as long as they're optional and safe to ignore
  * New response parameters or headers MAY be introducd without a version bump, as long as they're optional and safe to ignore
  * Data Sharers and Recipients SHALL ignore parameters and headers they don't recognize
  * Introduction of parameters or headers that can't safely be ignored will require a `v` bump
* Encryption and signature schemes
  * Changes to the cryptographic protocol will require a `v` bump

This means that Data Recipients can always recognize a SHLink Payload and display its label to the user. If a Data Recipient does not recognize and support the `v` in a SHLink Payload, it SHOULD display an appropriate message to the user and SHOULD NOT proceed with a manifest request, unless it has some reason to believe that proceeding is safe.
:::

:::info

**:notebook: Design Note: Viewer URL Prefixes**

*By using viewer URLs that end in `#`, we take advantage of the browser behavior where `#` fragments are not sent to a server at the time of a request. Thus the SHLink payload will not appear in server-side logs or be available to server-side processing when a link like `https://viewer.example.org#shlink:/ey...` is opened in a browser.*
:::

The following optional step may occur sometime after a SHLink is generated:
* **Optional: Update Shared Files**. For some sharing scenarios, the Data Sharer MAY update the shared files from time to time (e.g., when new lab results arrive or new immunizations are performed). Updated versions SHALL be encrypted using the same key as the initial version. 


###### Example SHLink Generation
```js
import { encode as b64urlencode } from 'https://deno.land/std@0.82.0/encoding/base64url.ts';

const shlinkJsonPayload = {
  "url": "https://ehr.example.org/qr/Y9xwkUdtmN9wwoJoN3ffJIhX2UGvCL1JnlPVNL3kDWM/m",
  "flag": "LP",
  "key": "rxTgYlOaKJPFtcEd0qcceN8wEU4p94SqAwIWQe6uX7Q",
  "label": "Back-to-school immunizations for Oliver Brown"
}

const encodedPayload = b64urlencode(JSON.stringify(shlinkJsonPayload))
// "eyJ1cmwiOiJodHRwczovL2Voci5leGFtcGxlLm9yZy9xci9ZOXh3a1VkdG1OOXd3b0pvTjNmZkpJaFgyVUd2Q0wxSm5sUFZOTDNrRFdNL20iLCJmbGFnIjoiTFAiLCJrZXkiOiJyeFRnWWxPYUtKUEZ0Y0VkMHFjY2VOOHdFVTRwOTRTcUF3SVdRZTZ1WDdRIiwibGFiZWwiOiJCYWNrLXRvLXNjaG9vbCBpbW11bml6YXRpb25zIGZvciBPbGl2ZXIgQnJvd24ifQ"

const shlinkBare = `shlink:/` + encodedPayload;
// "shlink:/eyJ1cmwiOiJodHRwczovL2Voci5leGFtcGxlLm9yZy9xci9ZOXh3a1VkdG1OOXd3b0pvTjNmZkpJaFgyVUd2Q0wxSm5sUFZOTDNrRFdNL20iLCJmbGFnIjoiTFAiLCJrZXkiOiJyeFRnWWxPYUtKUEZ0Y0VkMHFjY2VOOHdFVTRwOTRTcUF3SVdRZTZ1WDdRIiwibGFiZWwiOiJCYWNrLXRvLXNjaG9vbCBpbW11bml6YXRpb25zIGZvciBPbGl2ZXIgQnJvd24ifQ"

const shlink = `https://viewer.example.org#` + shlinkBare
// "https://viewer.example.org#shlink:/eyJ1cmwiOiJodHRwczovL2Voci5leGFtcGxlLm9yZy9xci9ZOXh3a1VkdG1OOXd3b0pvTjNmZkpJaFgyVUd2Q0wxSm5sUFZOTDNrRFdNL20iLCJmbGFnIjoiTFAiLCJrZXkiOiJyeFRnWWxPYUtKUEZ0Y0VkMHFjY2VOOHdFVTRwOTRTcUF3SVdRZTZ1WDdRIiwibGFiZWwiOiJCYWNrLXRvLXNjaG9vbCBpbW11bml6YXRpb25zIGZvciBPbGl2ZXIgQnJvd24ifQ"
```

## Data Sharer transmits a SHLink

The Data Sharer can convey a SHLink by any common means including e-mail, secure messaging, or other text-based communication channels. When presenting a SHLink in person, the Data Sharer can also display the link as a QR code using any standard library to create a QR image from the SHLink URI. 

When sharing a SHLink via QR code, the following recommendations apply:

* Create the QR with Error Correction Level Q
* Include the [SMART Logo](https://demo.vaxx.link/smart-logo.svg) on a white background over the center of the QR, scaled to occupy 15% of the image area


## Data Recipient processes a SHLink

The Data Recipient can process a SHLink using the following steps.

* Decode the SHLink JSON payload
* Issue a [SHLink Manifest Request](#shlink-manifest-request) to payload's `url`
* Decrypt and process files from the manifest
* Optional:  When the original QR includes the `L` flag for long-term use, the Data Recipient can re-fetch the manifest periodically, following [polling guidance](#polling-manifest-for-changes) to avoid issing too many requests
 
---

## SHLink Manifest Request

The Data recipient SHALL retrieve a SHLink's manifest by issuing a request to the `url` in the SHLink payload, with:

* Method: `POST`
* Headers:
  * `content-type: application/json`
* Body: JSON object including
  * `recipient`: Required. A string describing the recipient (e.g.,the name of an organization or person) suitable for display to the Data Sharer
  * `passcode`: Conditional. SHALL be populated with a user-supplied Passcode if the `P` flag was present in the SHLink payload
  * `embeddedLengthMax`: Optional. Integer upper bound on the length of embedded payloads (see [`.files.embedded`](#filesembedded-content))

If the SHLink is no longer active, the Resource Server SHALL respond with a 404.

If an invalid Passcode is supplied, the Resource Server SHALL reject the request and SHALL enforce a total lifetime count of incorrect Passcodes for a given SHLink, to prevent attackers from performing an exhaustive Passcode search. The error response for an invalid Passcode SHALL use the `401` HTTP status code and the response body SHALL be a JSON payload with

* `remainingAttempts`: number of attempts remaining before the SHL is disabled

If the SHlink request is valid, the Resource Server SHALL return a  SHLink Manifest File with `content-type: application/json`. The SHLink Manifest File is a JSON file with a `files` array where each entry includes:

* `contentType`: One of  the following values:
    * `"application/smart-health-card"` or
    *  `"application/smart-api-access"` or 
    *  `"application/fhir+json"`
* `location` (SHALL be present if no `embedded` content is included): URL to the file.
This URL SHALL be short-lived and intended for single use. For example, it could be a
short-lifetime signed URL to a file hosted in a cloud storage service.
* `embedded` (SHALL be present if no `location` is included): JSON string directly
embedding the encrypted contents of the file as a compact JSON Web Encryption
string (see ["Encrypting"](#encrypting-and-decrypting-files)).


### Polling manifest for changes
When the original QR includes the `L` flag for long-term use, the client MAY
periodically poll for changes in the manifest. The server MAY provide a
[`Retry-After`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After)
header on successful manifest responses, indicating the minimum time that the
client SHOULD wait before its next polling request. If manifest requests are
issued too frequently, the server MAY respond with HTTP status `429 Too Many
Requests` and a `Retry-After` header indicating the minimum time that a client
SHALL wait before re-issuing a manifest request.

:::info
**:notebook: Design Note (Rate Limiting)**
*More detailed guidance on polling will require real-world implementation experience. The current guidance provides the client a hint about how often to poll, and provides a way to convey that requests are being issued too frequently. We encourage implementers to experiment with additional capabilities.*
:::


###  `.files.location` links

The Data Sharer SHALL ensure that `.files.location` links can be dereferenced
without additional authentication, and that they are short-lived. The lifetime
of `.files.location` links SHALL NOT exceed one hour. The Data Sharer MAY create
one-time-use `.files.location` links that are consumed as soon as they are
dereferenced.

The Data Recipient SHALL treat any manifest file locations as short-lived and
potentially limited to one-time use. The Data Recipient SHALL NOT attempt to
dereference a manifest's `.files.location` link more than one hour after
requesting the manifest, and SHALL be capable of re-fetching the manifest to
obtain fresh `location` links in the event that they have expired or been
consumed.

### `.files.embedded` content

If the client has specified `embeddedLengthMax` in the manifest request, the sever SHALL NOT
embedded payload longer than the client-designated maximum.

If present, the `embedded` value SHALL be up-to-date as of the time the manifest is
requested. If the client has specified `embeddedLengthMax` in the manifest request,
the sever SHALL NOT embedded payload longer than the client-designated maximum.

---


##### Example SHLink Manifest File

```json
{
  "files": [{
    "contentType": "application/smart-health-card",
    "location": "https://bucket.cloud.example.org/file1?sas=MFXK6jL3oL3SI_lRfi_-cEfzIs5oHs6rRWmrsCAFzvk"
  }, 
  {
    "contentType": "application/smart-health-card",
    "embedded": "eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..8zH0NmUXGwMOqEya.xdGRpgyvE9vNoKzHlr4itKKW2vo<snipped>"
  },
  {
    "contentType": "application/fhir+json",
    "location": "https://bucket.cloud.example.org/file2?sas=T34xzj1XtqTYb2lzcgj59XCY4I6vLN3AwrTUIT9GuSc"
  }]
}
```

## Encrypting and Decrypting Files

SHLink files are always symmetrically encrypted with a SHLink-specific key. Encryption is performed using JOSE JWE compact serialization with `"alg": "dir"` and `"enc": "A256GCM"`.

##### Example Encryption

```ts
import * as jose from 'https://deno.land/x/jose@v4.7.0/index.ts'

const exampleShcFromWeb = await fetch("https://spec.smarthealth.cards/examples/example-00-e-file.smart-health-card");
const exampleShcBody = new Uint8Array(await exampleShcFromWeb.arrayBuffer());

const shlinkPayload =  {
  "key": "rxTgYlOaKJPFtcEd0qcceN8wEU4p94SqAwIWQe6uX7Q",
  // other properties omitted; not relevant for this example
};

const encrypted = await new jose
  .CompactEncrypt(new Uint8Array(exampleShcBody))
  .setProtectedHeader({
    alg: 'dir',
    enc: 'A256GCM'
  })
  .encrypt(jose.base64url.decode(shlinkPayload.key));
// "eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..8zH0NmUXGwMOqEya.xdGRpgyvE9vNoKzHlr4itKKW2von-aW1Feu3iSKv4S6wccXhLHW02e_Opi8hG4ma--gFCj-xv8KIisbQEmUJjxb_dZQhCpi2H5Qh-S_Ko5lUFlzC6y5blJNAEtB4Aflcnknhvn9x_2ygi7nOFkFYUKgLDU2wjXxn0g_M23lSjpnfIUdKw9nhRXPp6j55HpJT_mZGn8_fYjnqZ7zV-iVu4AIGlIs_dBYoKqVIHxjr-Is0jLK8KQ68iQcsRLxCpTZnoaeJCvJ0aW69J8-7Ndr87gbUG56CduCZPfl0USPerA4RphKd1PbYjkkbOR53sb-khs-XZgVZKHJwXmoF7G50-chmuSEFcB4w9l4w_rNbnze8DjYusuF8kBUI75Ms10ss4WoBINt7nHpiipZH0XJE0btyKC8Ew0tqqrWxJPcdQrKzQdiyv3-SgHH3_UjzwcIc2KmsP33wpViQ1BCXqwhA5njWzwWFHOZ1aQ_7gbO_Xwqc6tRx2fvVu8dTfU30HtTff__xlnQIu1gGA9bIdlO0fp6mPcZdGl_tUkjweVxX5QdddIASY1AUGg9uAi4FCdCtnWVwIgq1e9cRrqPhLC-LjOHys_ihx_Taj_53uFVh0skoQeVV132X04N1p5MPFZz0G-2OIsUQudCH5jmx0Ca0tSESYdhAnBxNHFLNJ-Dl3aW0HdRJxJuGtY0nAquwoBa2_sUkhx1Qe6ghy0khddpa9cgbbULde9gawjxe3O04K00eD9-6dxzLSNhARPO_Zs98O9L8ngoW8Mppbif43vP9SkRUwqjeiWVU_wHK55VpZYCba5owG8FIZEH3khk9DpYk_pLRwztRpN0Q2jY2BqbTXn3eD-shGucKMiY4hqzaJTd7Wwx8eRghITDtY_BbfKV0PsxbT2gIb4oaXwuXgfifUqXEsK8e4zDoc6MU62ABEoqlG_CwpkhJBg-69dXTXkiE7VapPs4TjxvxHu7Eg3dewtNKUuWRgCHht2cXD0C8if-mOltaySZCgOnrSXRJJE0Pf8gEMHZTwf0bx4XdMGydT5vmcAspKmWscy_80VIvCb4muBNMWeJdrVhBKviLjd-GwqxfUK_HQN7kFF7ZDwlzvBxq.ek65P9quBJl0ze11WteQgA"

```


##### Example Decryption

```ts
import * as jose from 'https://deno.land/x/jose@v4.7.0/index.ts'

const shlinkPayload =  {
  "key": "rxTgYlOaKJPFtcEd0qcceN8wEU4p94SqAwIWQe6uX7Q",
  // other properties omitted; not relevant for this example
};

// Output from "encrypt" example above
const fileEncrypted = "eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..8zH0NmUXGwMOqEya.xdGRpgyvE9vNoKzHlr4itKKW2von-aW1Feu3iSKv4S6wccXhLHW02e_Opi8hG4ma--gFCj-xv8KIisbQEmUJjxb_dZQhCpi2H5Qh-S_Ko5lUFlzC6y5blJNAEtB4Aflcnknhvn9x_2ygi7nOFkFYUKgLDU2wjXxn0g_M23lSjpnfIUdKw9nhRXPp6j55HpJT_mZGn8_fYjnqZ7zV-iVu4AIGlIs_dBYoKqVIHxjr-Is0jLK8KQ68iQcsRLxCpTZnoaeJCvJ0aW69J8-7Ndr87gbUG56CduCZPfl0USPerA4RphKd1PbYjkkbOR53sb-khs-XZgVZKHJwXmoF7G50-chmuSEFcB4w9l4w_rNbnze8DjYusuF8kBUI75Ms10ss4WoBINt7nHpiipZH0XJE0btyKC8Ew0tqqrWxJPcdQrKzQdiyv3-SgHH3_UjzwcIc2KmsP33wpViQ1BCXqwhA5njWzwWFHOZ1aQ_7gbO_Xwqc6tRx2fvVu8dTfU30HtTff__xlnQIu1gGA9bIdlO0fp6mPcZdGl_tUkjweVxX5QdddIASY1AUGg9uAi4FCdCtnWVwIgq1e9cRrqPhLC-LjOHys_ihx_Taj_53uFVh0skoQeVV132X04N1p5MPFZz0G-2OIsUQudCH5jmx0Ca0tSESYdhAnBxNHFLNJ-Dl3aW0HdRJxJuGtY0nAquwoBa2_sUkhx1Qe6ghy0khddpa9cgbbULde9gawjxe3O04K00eD9-6dxzLSNhARPO_Zs98O9L8ngoW8Mppbif43vP9SkRUwqjeiWVU_wHK55VpZYCba5owG8FIZEH3khk9DpYk_pLRwztRpN0Q2jY2BqbTXn3eD-shGucKMiY4hqzaJTd7Wwx8eRghITDtY_BbfKV0PsxbT2gIb4oaXwuXgfifUqXEsK8e4zDoc6MU62ABEoqlG_CwpkhJBg-69dXTXkiE7VapPs4TjxvxHu7Eg3dewtNKUuWRgCHht2cXD0C8if-mOltaySZCgOnrSXRJJE0Pf8gEMHZTwf0bx4XdMGydT5vmcAspKmWscy_80VIvCb4muBNMWeJdrVhBKviLjd-GwqxfUK_HQN7kFF7ZDwlzvBxq.ek65P9quBJl0ze11WteQgA" 

const decrypted = await jose.compactDecrypt(
  fileEncrypted,
  jose.base64url.decode(shlinkPayload.key)
);
  
const decoded = JSON.parse(new TextDecoder().decode(decrypted.plaintext));
/*
{
  verifiableCredential: [
    "eyJ6aXAiOiJERUYiLCJhbGciOiJFUzI1NiIsImtpZCI6IjNLZmRnLVh3UC03Z1h5eXd0VWZVQUR3QnVtRE9QS01ReC1pRUxMMTFX..."
  ]
}
*/
```

## Use Case Examples

### Using SHL to share an interactive experience

While the SMART Health Links spec focuses on providing access to structured data, it's often
useful to share an interactive experience such as a web-based diagnostic portal where the
SHL Data Recipient can review and add comments to a patient record. This can be accomplished
in SHL with a manifest entry of type `application/fhir+json` that provides a
[FHIR Endpoint resource](https://hl7.org/fhir/endpoint.html) where:

* `name` describes the interactive experience with sufficient detail for the SHL Recipient to decide whether to engage
* `connectionType` is `{"system": "https://smarthealthit.org", "code": "shl-interactive-experience"}`
* `address` is the URI for the interactive experience
* `period` optionally documents the window of time when the interactive experience is available

For example, the manifest for an SHL that offers the user the opportunity to "Review a case"
might include a `application/fhir+json` entry with:

```json
{
  "resourceType": "Endpoint",
  "status": "active",
  "name": "Review and comment on Alice's case in ACME Medical Diagnostic Portal",
  "address": "https://interact.example.org/case-id/521039c3-4bb9-45bd-8271-6001d2f4dea9",
  "period": {"end": "2022-10-20T12:30:00Z"},
  "connectionType": {"system": "https://smarthealthit.org", "code": "shl-interactive-experience"},
  "payloadType": [{"system": "http://terminology.hl7.org/CodeSystem/endpoint-payload-type", "code": "none"}],
}
```

Notes:

* There is no perfect FHIR resource for documenting an interactive experience URL. `Endpoint` and
`DocumentReference` are both plausible candidates, and we recommend `Endpoint` here because
`DocumentReference` is designed for static payloads.
* If the *only* content being shared via SHL is a single interactive experience, implementers 
might consider sharing the interactive experience URL directly, instead of through SHL. However,
since SHL provides a consistent pattern that users and tools can recognize, starting with SHL provides
a foundation to support future expansion.


### "Upgrading" from SHL to a consumer-mediated SMART on FHIR Connection

In addition to providing direct access to a pre-configured data set, SHLs can include information
to help establish a consumer-mediated SMART on FHIR connection to the data source. This can be
accomplished with a SHL manifest entry of type `application/fhir+json` that provides a
[FHIR Endpoint resource](https://hl7.org/fhir/endpoint.html) where:

* `name` describes the SMART on FHIR endpoint with sufficient detail for the SHL Recipient to decide whether to connect
* `connectionType` is `{"system": "http://terminology.hl7.org/CodeSystem/restful-security-service", "code": "SMART-on-FHIR"}`
* `address` is the FHIR API base URL of the server that supports [SMART App Launch](http://hl7.org/fhir/smart-app-launch/)

For example, the manifest for an SHL from Labs-R-Us might include a `application/fhir+json` entry with:

```json
{
  "resourceType": "Endpoint",
  "status": "active",
  "name": "Labs-R-Us Application Access",
  "address": "https://fhir.example.org",
  "connectionType": {"system": "http://terminology.hl7.org/CodeSystem/restful-security-service", "code": "SMART-on-FHIR"},
  "payloadType": [{"system": "http://terminology.hl7.org/CodeSystem/endpoint-payload-type", "code": "none"}],
}
```

Notes:

* Clients may need to pre-register with the SMART App Launch enabled service
before they can request a connection. A client might compare `"address"`
against an internal database to determine whether it can connect, retrieve
`{address}/.well-known/smart-configuration` to determine whether the [Dynamic
Client Registration
Protocol](https://hl7.org/fhir/smart-app-launch/app-launch.html#register-app-with-ehr)
is available or come up with another way to determine connectivity in order to
inform the user of how they can act on the SHL.

* This capability will only work in cases where the user receiving the SHL is authorized
to approve SMART App Launch requests; other recipients might see the Endpoint
but would be unable to complete a SMART App Launch
