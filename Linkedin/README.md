# Linkedin Message Templates

Adds a **Recruiter** button to the message box toolbar on `linkedin.com/messaging`. Clicking it replaces the draft with a predefined reply addressed to the recipient's first name. The message is not sent automatically; review it and press **Send**.

## Installation

Open the install link with Tampermonkey (or Violentmonkey):

```
https://github.com/nathanredblur/GreasyForkScripts/raw/main/Linkedin/MessageTemplates.user.js
```

## Customizing

Edit the `templates` object in the script. Each key becomes a button and `[recruiterName]` is replaced with the recipient's first name.
