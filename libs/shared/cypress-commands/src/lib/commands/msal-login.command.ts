import {
  ExternalTokenResponse,
  PublicClientApplication,
} from '@azure/msal-browser';
import { CypressCommandDefinition } from '../command-definition';

const commandName = 'msalLogin';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Chainable<Subject> {
      [commandName]: (options: MsalLoginOptions) => Chainable<Element>;
    }
  }
}

let cachedTokenExpiryTime = new Date().getTime();
let cachedTokenResponse: ExternalTokenResponse | null = null;

type MsalLoginOptions = {
  authority: string;
  clientId: string;
  username: string;
  password: string;
  scopes: string[];
};

export const msalLoginCommand: CypressCommandDefinition<
  keyof Cypress.Chainable
> = {
  name: commandName,
  command: (options: MsalLoginOptions) => {
    if (cachedTokenExpiryTime <= new Date().getTime()) {
      cachedTokenResponse = null;
    }

    let chainable: Cypress.Chainable;

    if (cachedTokenResponse) {
      chainable = cy.then(() => cachedTokenResponse);
    } else {
      chainable = cy
        .request({
          url: `${options.authority}/oauth2/v2.0/token`,
          method: 'POST',
          body: {
            grant_type: 'password',
            client_id: options.clientId,
            scope: `openid profile ${options.clientId}`,
            response_type: 'token id_token',
            username: options.username,
            password: options.password,
            client_info: 1, // this is undocumented but needs to be set to return client_info in the ExternalTokenResponse. This is needed to cache the tokens.
          },
          form: true,
        })
        .then((response) => response.body);
    }

    return chainable.then((tokenResponse: ExternalTokenResponse) => {
      const pca = new PublicClientApplication({
        auth: { clientId: options.clientId, authority: options.authority },
      });
      pca
        .getTokenCache()
        .loadExternalTokens(
          { authority: options.authority, scopes: options.scopes },
          tokenResponse,
          {
            extendedExpiresOn: 6599,
          }
        );

      cachedTokenResponse = tokenResponse;
      // Set expiry time to 1 hour - this is the default for the token response
      cachedTokenExpiryTime = new Date().getTime() + 60 * 60 * 1000;
    });
  },
};
