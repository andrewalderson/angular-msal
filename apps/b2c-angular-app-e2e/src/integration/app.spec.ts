describe('b2c-angular-app', () => {
  const msalConfig = Cypress.env('msal');
  // there may be a better way to do this
  // perhaps the tenant and policy could be seperated from the authority in msal config
  // they could then could be appended to the authority for login
  const tenant = msalConfig.authority.split('/').slice(-2)[0];

  beforeEach(() => {
    // overwrite msal settings and then log in
    // the msal settings that are loaded by the app need to match
    // the settings used for logging in during testing.
    // These settings need to match the authority, client id and scopes
    // used to get the tokens during testing so they are cached with the
    // correct values for the app top find them
    cy.intercept('GET', '**/msal-settings**', (req) => {
      delete req.headers['if-none-match']; // prevents 304 responses

      req.continue((res) => {
        // if you change the structure of the 'msal-settings.json file you need to
        // update the path to 'clientId' and 'authority' here
        res.body.clientId = msalConfig.clientId;
        res.body.authority = msalConfig.authority;
        res.body.protectedResourceMap = {
          '/resources': [`https://${tenant}/${msalConfig.clientId}/read`],
        };
      });
    })
      // Ideally we should login and get tokens seperately with the scopes needed for each area being tested
      // When we go to the home page (cy.visit below) we need a token with a scope to read the resources
      // We could also request a token with every scope in the protectedResourceMap set above
      .msalLogin({
        ...msalConfig,
        scopes: [`https://${tenant}/${msalConfig.clientId}/read`],
      });

    // to test that the tokens are configured and cached correctly
    // the app makes a get request to this endpoint when the home page loads
    cy.intercept('GET', '/resources', { statusCode: 200, body: [] }).as(
      'getResources'
    );

    cy.visit('/');
  });

  // if this test fails then the tokens are not cached or expired or don't have the correct scopes
  // if the test passes everything is configured and working correctly
  it('test the msal tokens', () => {
    cy.wait('@getResources').its('response.statusCode').should('eq', 200);
  });
});
