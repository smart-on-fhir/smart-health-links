---
sidebar_position: 1
---

# SHL User Stories

SMART Health Links supports multiple patterns of sharing. While the technology
is designed for flexibility and reuse in diverse contexts, the user stories
below represent flows that have explicitly informed design of the protocol.


## "Powerful Portals"

Alice signs in to her state's public health portal where she can see her 
vaccination history and recommendations. She selects an option to "Share my
records with SMART Health Links", which prompts her to create a passcode
and then generates a SHL. Alice is presented with options that include:

* Copy link to clipboard.
Alice can share this SHL with others using any channel she choose. For example
she could paste it into a "vaccine history" form in her school's vaccine
management site as part of an online registration process. She could also share
the SHL with a friend, caregiver, or healthcare provider. The recipient can view
data online or automatically load data into an SHL-enabled app. This workflow
can enable integration with clinician-facing EHR systems as well as
patient-facing care management apps.

* Display link as QR code.
Alice can present this QR to others. For eample she might display it to a school
nurse as part of an on-site registration process.

* Open link in health app.
Alice can open this link in her personal health app to import her historical vaccine
records. Her app will prompt her for the passcode and then will automatically 
retrieve the set of vacccine records and recommendations. The app can periodically
re-fetch the link to look for updates.

### Additional use cases for the "Powerful Portals" pattern

* Lab results from a pharmacy portal
* Clinical history from a provider portal


## "Paper+"

Alice visits a Labs-R-Us, where she has blood drawn for a basic metabolic panel.
She receives a print-out with details about the test that was performed, as well
as a QR code labeled as a "SMART Health Link." 

Alice can:

* Scan the SHL QR using a generic QR reader app.
This takes her to a Labs-R-Us web-based viewer where she can enter a passcode to view her lab
result. Initially she might see a "pending" result, indicaing that the analysis
has not been completed. Eventually she will see a "final" result with the
details available.

* Scan the SHL QR using a SHL-aware health record managment app.
Alice's health record app prompts her for a passcode and automatically retrieves the lab
results. Initially this might be a "pending" result, and eventualy it will
resolve to a "final" result.

  * Optional follow-up step: upgrade to a long-term SMART on FHIR connection.
  If Labs-R-Us supports [SMART on FHIR for patient
  access](https://hl7.org/fhir/smart-app-launch/), Alice's health record app
  might prompt Alice to "connect to your full Labs-R-Us record." If she selects
  this option, she will be taken to the Labs-R-Us authorization screen where she
  can sign in or create an account and authorize long-term access.

* Share the SHL with a friend, caregiver, or healthcare provider.
As in the "Powerful Portals" user story above, Alice can copy/paste the SHL to
share this lab result with a recipient of her choice. The recipient can open the
link in a web brower or in an SHL-aware health record management app, just as
Alice can. This workflow can enable integration with clinician-facing EHR
systems as well as patient-facing care management apps.

### Additional use cases for the "Paper+" pattern

* Vaccine results after a pharmacy visit
* Vision prescription after an optometrist visit
* Encounter summary after a hospital visit
* Coverage details embedded on an insurance card


## "Personal Platforms" 

Alice uses a personal health record app on her phone. She connects to data from
various sources including clincal providers, labs, pharmacies, and others. When
she wants to share a subset of these data, she selects an option to "Share my
records with SMART Health Links", which prompts her to create a passcode and
then generates a SHL. Using this technique, Alice can mix and match data from
multiple sources, to share a relevant subset of her records that might not exist
within any one source. Alice taps a "share" button and is prompted to copy the
link to her clipboard or display the link as a QR.

Alice can proceed to share this link as in ["Powerful Portals"](#powerful-portals).