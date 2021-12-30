import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import {
  MSAL_GUARD_CONFIG,
  MSAL_INSTANCE,
  MSAL_INTERCEPTOR_CONFIG,
} from '@azure/msal-angular';
import {
  BrowserCacheLocation,
  InteractionType,
  LogLevel,
  PublicClientApplication,
} from '@azure/msal-browser';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

fetch('/assets/msal-settings.json')
  .then((settings) => settings.json())
  .then((config) => getMsalProviders(config))
  .then((msalProviders) =>
    platformBrowserDynamic([msalProviders])
      .bootstrapModule(AppModule)
      .catch((err) => console.error(err))
  );

function getMsalProviders(
  config: MsalConfig
): { provide: unknown; useValue: unknown }[] {
  function loggerCallback(logLevel: LogLevel, message: string) {
    console.log(message);
  }

  // there may be a better way to do this
  // perhaps the tenant and policy could be seperated from the authority in msal config
  // they could then could be appended to the authority for login
  const tenant = config.authority.split('/').slice(-2)[0];

  const protectedResourceMap = new Map<string, Array<string>>();
  Object.keys(config.protectedResourceMap).forEach((key) => {
    protectedResourceMap.set(key, config.protectedResourceMap[key] || []);
  });

  return [
    {
      provide: MSAL_INSTANCE,
      useValue: new PublicClientApplication({
        auth: {
          clientId: config.clientId,
          authority: config.authority,
          knownAuthorities: [config.authority],
          redirectUri: config.redirectUri,
          postLogoutRedirectUri: config.postLogoutRedirectUri,
        },
        cache: {
          cacheLocation: config.cacheLocation,
        },
        system: {
          loggerOptions: {
            loggerCallback,
            logLevel: LogLevel.Info,
            piiLoggingEnabled: false,
          },
        },
      }),
    },
    {
      provide: MSAL_GUARD_CONFIG,
      useValue: {
        interactionType: config.interactionType,
        authRequest: {
          scopes: [`https://${tenant}/${config.clientId}/read`],
        },
        loginFailedRoute: config.loginFailedRoute,
      },
    },
    {
      provide: MSAL_INTERCEPTOR_CONFIG,
      useValue: {
        interactionType: config.interactionType,
        protectedResourceMap,
      },
    },
  ];
}

interface MsalConfig {
  clientId: string;
  authority: string;
  cacheLocation: BrowserCacheLocation;
  interactionType: InteractionType.Redirect | InteractionType.Popup;
  protectedResourceMap: { [key: string]: string[] };
  redirectUri: string;
  postLogoutRedirectUri: string;
  loginFailedRoute: string;
}
