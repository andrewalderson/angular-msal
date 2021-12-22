import { getGreeting } from '../support/app.po';

describe('demo-one', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/msal-settings**', (req) => {
      delete req.headers['if-none-match']; // prevents 304 responses
    }).as('getMsalSettings');

    cy.visit('/');
  });

  it('should load msal setting', () => {
    cy.wait('@getMsalSettings').its('response.statusCode').should('eq', 200);
  });

  // sThis test fails because user needs to be logged in
  // skipping until we set up login command.
  it.skip('should display welcome message', () => {
    // Custom command example, see `../support/commands.ts` file
    cy.login('my-email@something.com', 'myPassword');

    // Function helper example, see `../support/app.po.ts` file
    getGreeting().contains('Welcome demo-one');
  });
});
