# Angular and MSAL

This repository contains projects that do experiments with MSAL and Angular.

Currently the projects are used to figure out how to authenticate with MSAL when writing Cypress tests.
The repository contains a library with a Cypress command used to authenticate with Azure AD and Azure AD B2C
using Resource Owner Password Credential flow and cache the tokens needed by MSAL to prevent the app being tested
from atempting a redirect or popup login.

To use this repository a application and user need to be added to your AD and/or B2C instance. Ideally you
would add 2 applications - one for the app to use and one for the Cypress tests to use. You could even
use 2 seperate instances of AD or B2C for each.

For Azure AD B2C

1. Register and application for the Angular app to use. https://docs.microsoft.com/en-us/azure/active-directory-b2c/configure-authentication-sample-angular-spa-app
2. Register and application for ROPC. https://docs.microsoft.com/en-us/azure/active-directory-b2c/add-ropc-policy?tabs=app-reg-ga&pivots=b2c-user-flow
3. Add a user - must be a local user with no MFA
4. Add an API and scopes https://docs.microsoft.com/en-us/azure/active-directory-b2c/add-web-api-application?tabs=app-reg-ga

For Azure AD

Follow the same steps for B2C but in your AD tenant. The main difference between the 2 are the format of the authority and the scopes.
In B2C the format of the authority is https://<tenant name>.b2clogin.com/tfp/<tenant domain name or id>/<policy name>
In AD the format of the authority is https://login.microsoftonline.com/<tenant id>

After these steps are complete:
( see the MSAL js repos https://github.com/AzureAD/microsoft-authentication-library-for-js/samples for samples of how to configure the apps )

1. In the Angular apps copy the /assets/msal-settings.template.json file and rename it to msal-settings.json.
2. Fill in the details for MSAL authentication.
3. In the e2e apps copy the 'cypress.env.template.json' file in the root and rename it to 'cypress.env.json'
4. Fill in the details for the ROPC flow
