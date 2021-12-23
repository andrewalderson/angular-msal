import { decode, JwtPayload } from 'jsonwebtoken';

const b2cConfig = Cypress.env('b2c');

const environment = ''; // this is the host of the issuer but it doesn't need to be set to bypass the MsalGuard
const clientId = b2cConfig.clientId; // to bypass MsalGuard this can be any value
const apiScopes = [b2cConfig.clientId];

const username = b2cConfig.username;
const password = b2cConfig.password;

export type TokenResponse = {
  id_token: string;
  access_token: string;
  expires_in: number;
  ext_expires_in: number;
};

const buildAccountEntity = (
  homeAccountId: string,
  realm: string,
  localAccountId: string,
  username: string,
  name: string
) => {
  return {
    authorityType: 'MSSTS',
    homeAccountId,
    environment,
    realm,
    localAccountId,
    username,
    name,
  };
};

const buildIdTokenEntity = (
  homeAccountId: string,
  idToken: string,
  realm: string
) => {
  return {
    credentialType: 'IdToken',
    homeAccountId,
    environment,
    clientId,
    secret: idToken,
    realm,
  };
};

const buildAccessTokenEntity = (
  homeAccountId: string,
  accessToken: string,
  expiresIn: number,
  extExpiresIn: number,
  realm: string,
  scopes: string[]
) => {
  const now = Math.floor(Date.now() / 1000);
  return {
    homeAccountId,
    credentialType: 'AccessToken',
    secret: accessToken,
    cachedAt: now.toString(), // <- this cannot be more than the current time when it is checked or the access token is discarded in silent flow
    expiresOn: (now + expiresIn).toString(), // <- in silent flow the access token uses this and cachedAt to check expiry. This value can be adjusted based on how long your tests take to run
    extendedExpiresOn: (now + extExpiresIn).toString(),
    environment,
    clientId,
    realm,
    target: scopes.map((s) => s.toLowerCase()).join(' '),
    // Scopes _must_ be lowercase or the token won't be found
  };
};

const injectTokens = (tokenResponse: TokenResponse) => {
  const idToken: JwtPayload = decode(tokenResponse.id_token) as JwtPayload;
  const localAccountId = idToken?.sub as string; // the user id
  const realm = idToken?.['tid'] ?? ''; // the directory id - may be empty
  const homeAccountId = realm ? `${localAccountId}.${realm}` : localAccountId;
  const name = idToken?.['name'];

  const accountKey = `${homeAccountId}-${environment}-${realm}`;
  const accountEntity = buildAccountEntity(
    homeAccountId,
    realm,
    localAccountId,
    username,
    name
  );

  const idTokenKey = `${homeAccountId}-${environment}-idtoken-${clientId}-${realm}-`;
  const idTokenEntity = buildIdTokenEntity(
    homeAccountId,
    tokenResponse.id_token,
    realm
  );

  const accessTokenKey = `${homeAccountId}-${environment}-accesstoken-${clientId}-${realm}-${apiScopes.join(
    ' '
  )}`;
  const accessTokenEntity = buildAccessTokenEntity(
    homeAccountId,
    tokenResponse.access_token,
    tokenResponse.expires_in,
    tokenResponse.ext_expires_in,
    realm,
    apiScopes
  );
  // set the tokens on both session and local storage
  // so we don't have to try to determine where they are cached
  sessionStorage.setItem(accountKey, JSON.stringify(accountEntity));
  sessionStorage.setItem(idTokenKey, JSON.stringify(idTokenEntity));
  sessionStorage.setItem(accessTokenKey, JSON.stringify(accessTokenEntity));
  localStorage.setItem(accountKey, JSON.stringify(accountEntity));
  localStorage.setItem(idTokenKey, JSON.stringify(idTokenEntity));
  localStorage.setItem(accessTokenKey, JSON.stringify(accessTokenEntity));
};

export const login = (cachedTokenResponse: TokenResponse | null) => {
  let tokenResponse: TokenResponse | null = null;
  let chainable: Cypress.Chainable;

  if (!cachedTokenResponse) {
    chainable = cy.request({
      url: `${b2cConfig.authority}/oauth2/v2.0/token`,
      method: 'POST',
      body: {
        grant_type: 'password',
        client_id: b2cConfig.clientId,
        scope: `openid profile ${b2cConfig.clientId}`,
        response_type: 'token id_token',
        username,
        password,
      },
      form: true,
    });
  } else {
    chainable = cy.then(() => {
      return {
        body: cachedTokenResponse,
      };
    });
  }

  return chainable
    .then((response) => {
      injectTokens(response.body);
      tokenResponse = response.body;
    })
    .then(() => {
      return tokenResponse;
    });
};
