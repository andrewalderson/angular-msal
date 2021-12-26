import { getGreeting } from '../support/app.po';

const msalConfig = Cypress.env('msal');

describe('demo-one', () => {
  beforeEach(() => {
    // Move this to a before bock in commands
    // intercept msal-settings and change cacheLocation to use local storage
    // Use Cypress local storage
    cy.intercept('GET', '**/msal-settings**', (req) => {
      delete req.headers['if-none-match']; // prevents 304 responses
    }).as('getMsalSettings');

    // move to globel before
    cy.msalLogin({
      ...msalConfig,
      scopes: [msalConfig.clientId, 'test'],
    }).visit('/');
  });

  it('should load msal setting', () => {
    cy.wait('@getMsalSettings').its('response.statusCode').should('eq', 200);
  });

  it('should display welcome message', () => {
    getGreeting().contains('Welcome demo-one');
  });
});
