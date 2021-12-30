import {
  ExternalTokenResponse,
  PublicClientApplication,
} from '@azure/msal-browser';
import { TimeUtils } from '@azure/msal-common';
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

// This cache exists for the duration of the test run
// We cache the token responses by the scopes they were requested with
// we also cache the expiry time so we know when to login again
const tokenResponseCache = new Map<
  string[],
  { tokenResponse: ExternalTokenResponse; ttl: number }
>();

type MsalLoginOptions = {
  authority: string;
  clientId: string;
  username: string;
  password: string;
  scopes: string[];
};

/*
  This command is used to log into Azure AD or Azure AD B2C using Resource Owner Password Credential Flow
  It is used to get tokens from Azure and cache the tokens so that the MSAL library will find them
  and not attempt to do a redirect or popup login.
  This command should be called before visiting any page in the app protected by MSAL.
*/

export const msalLoginCommand: CypressCommandDefinition<
  keyof Cypress.Chainable
> = {
  name: commandName,
  command: (options: MsalLoginOptions) => {
    let chainable: Cypress.Chainable;

    // only scopes for api calls should be passed in
    // if no scopes are passed in we need to send the client id as a scope
    // as either an api scope or the client id is required
    if (!options.scopes?.length) {
      options.scopes = [options.clientId];
    }

    const currentTimeInSeconds = TimeUtils.nowSeconds();
    const cachedTokenExpiresOnBufferInScondes = 300;
    const cachedTokenResponse = tokenResponseCache.get(options.scopes);

    if (
      cachedTokenResponse &&
      cachedTokenResponse.ttl <
        currentTimeInSeconds - cachedTokenExpiresOnBufferInScondes
    ) {
      chainable = cy.then(() => cachedTokenResponse);
    } else {
      chainable = cy
        .request({
          url: `${options.authority}/oauth2/v2.0/token`,
          method: 'POST',
          body: {
            grant_type: 'password',
            client_id: options.clientId,
            scope: `openid profile ${options.scopes.join(' ')}`,
            response_type: 'token id_token',
            username: options.username,
            password: options.password,
            client_info: 1, // this is undocumented but needs to be set to return client_info in the ExternalTokenResponse when caching the tokens
          },
          form: true,
        })
        .then((response) => {
          const tokenResponse: ExternalTokenResponse = response.body;
          // need to update expires_in because of issue in 'loadExternalTokens' api
          // @see https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/4189
          // TODO - remove this code when issue resolved

          // even though 'expires_in' is typed as a number it is usually returned as a string from the server
          const expiresIn =
            (typeof tokenResponse.expires_in === 'string'
              ? parseInt(tokenResponse.expires_in, 10)
              : tokenResponse.expires_in) || 0;
          const ttl = currentTimeInSeconds + expiresIn;
          if (expiresIn < ttl) {
            tokenResponse.expires_in = ttl;
          }

          tokenResponseCache.set(options.scopes, {
            tokenResponse,
            ttl,
          });

          return response.body;
        });
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
            extendedExpiresOn: tokenResponse.expires_in,
          }
        );
    });
  },
};
