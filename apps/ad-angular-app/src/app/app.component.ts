import { Component } from '@angular/core';
import { BrowserUtils } from '@azure/msal-browser';

@Component({
  selector: 'msal-root',
  template: `<router-outlet *ngIf="!isInIframe"></router-outlet>`,
  styles: [],
})
export class AppComponent {
  get isInIframe() {
    return (
      BrowserUtils.isInIframe() &&
      !(window as unknown as { Cypress?: unknown }).Cypress
    );
  }
}
