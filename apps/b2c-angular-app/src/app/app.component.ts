import { Component } from '@angular/core';
import { BrowserUtils } from '@azure/msal-browser';

@Component({
  selector: 'msal-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  get isInIframe() {
    return (
      BrowserUtils.isInIframe() &&
      !(window as unknown as { Cypress?: unknown }).Cypress
    );
  }
}
