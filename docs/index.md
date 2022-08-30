---
sidebar_position: 1
---

# SHL Design Overview

## Overview Concept Video

https://www.youtube.com/watch?v=SbM9I20lH64

## Technical Design Review Video

https://www.youtube.com/watch?v=KxzD5E7Zzgk&t=13s

## Technical Protocol
See [specification](./spec).


## Use cases

* Share a link to any collection of FHIR data, including signed data
* Share link to a static SMART Health Card that's too big to fit in a QR
* Share link to a "dynamic" SMART Health Card -- i.e., a file that can evolve over time (e.g., "my most recent COVID-19 lab results")
* Share a link to Bundles of patient-supplied data (e.g., "my advance directive" to share with EMS, or "my at-home weight measurements" to share with a weight loss program, or "my active prescriptions" to share with a service that helps you find better drug prices)
  * Note that for specific use cases, these data don't need to be tamper-proof, and could be aggressively stripped down (e.g., for a drug pricing service, just the drug codes and dosage would go a long way)
* Provision access to a patient's SMART on FHIR API endpoint (e.g., "I'm going to see a specialist and by presenting a single QR, I can give them access to the FHIR API from my primary care provider's portal")

See requirements for vaccination record use case at https://hackmd.io/axTn7CqAS-Wd8MKmRApY8g
  
## Design goals

* Allow sharing of tamper-proof data
* Allow sharing of non-tamper-proof data
* Allow long-term sharing of data
* Allow sharing data that can evolve over time
* Mitigate the damage of QRs being leaked or scanned by the wrong party
  * Allow generate of "one-time use" QR (or a limited-time use QR), so at the time of creation there's a limited number of "claims" or a limited time period attached to it
  * Allow protecting the QR with a PIN, which the Sharer can communicate the PIN to the Recipient out-of-band
* Give Data Sharers the option to host files using encrypted cloud storage, so the hosting provider can't see file contents. (This is mainly important in cases where the data originates from a clinical data system but passes through the consumer's hands and then is hosted online in a cloud service of the consumer's choice. For example, a consumer health app might periodically upload a "most recent labs" file compiled from various sources, and the consumer shouldn't need to trust the file hosting service to actually see plaintext lab results.)
* Offer a simple UX where Data Recipients can scans a QR and immediately retrieve the data
* Offer a glide path for upgraded assurance, e.g. allowing Data Sharers to define a PIN or even (someday) require the Data Recipient party to authenticate or id-proof before accessing shared data


### Historical design notes
https://hackmd.io/@VCI/smart-health-links-historical