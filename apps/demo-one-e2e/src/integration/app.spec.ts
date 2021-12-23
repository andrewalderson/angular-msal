import { getGreeting } from '../support/app.po';

describe('demo-one', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/msal-settings**', (req) => {
      delete req.headers['if-none-match']; // prevents 304 responses
    }).as('getMsalSettings');

    cy.login().visit('/');
  });

  it('should load msal setting', () => {
    cy.wait('@getMsalSettings').its('response.statusCode').should('eq', 200);
  });

  it('should display welcome message', () => {
    getGreeting().contains('Welcome demo-one');
  });
});
