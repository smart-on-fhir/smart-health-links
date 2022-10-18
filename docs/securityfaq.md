# SMART Health Links Security FAQ (draft)

## Can someone guess my SHL and access my data?

A SHL manifest URL contains at least 256 bits of entropy, which makes guessing a valid URL unfeasible.

## Can someone modify my SHL?

The SHL manifest is encrypted using AES-CGM, which provides integrity as well as confidentiality; guaranteeing that only an entity knowing the encryption key could have produced the content. For individual files contained in the manifest, SHCs are signed by a specific issuers and therefore provide strong integrity guarantees; SMART API access and directly encoded FHIR resources rely on the integrity of the retrieval access point. 

## Can someone with my SHL access my data?

Someone with access to the SHL (or able to take a picture of its QR encoding) can retrieve the data. If the data is sensitive, a Passcode should be used.

## What are the risks of clicking or scanning a SHL?

Applications and libraries should implement conventional input sanitization to make sure encoded SHL, SHL URL, and QR-encoded SHL are well-formed before interpreting the data.

## Can I be phished using a SHL?

Like any other web-based access data, a SHL could be used to mount a phishing attack against a user, e.g., to learn login information to an EHR or the Passcode of a SHL. Conventional anti-phishing measures should be followed by applications and libraries to minimize this risk. 

## Can someone invalidate my SHL by guessing my Passcode?
If a Passcode is used, then enough bad guesses will invalidate the link. A malicious party could perform such a denial of service attack if it has access to the SHL URL; care must be taken to minimize exposure of such link. As a fallback, a user can obtain a fresh SHL. Conventional denial of service countermeasures can be employed to filter repeated attacks.

## Can someone snoop the retrieval of a SHL and manifest?
The SHL payload is itself encrypted using AES-GCM, making it infeasible to eavesdrop. The SHL manifest items should be retrieved over TLS using [recommended best practices](https://www.rfc-editor.org/info/bcp195) to protect the data.
