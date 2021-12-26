/* eslint-disable @typescript-eslint/no-explicit-any */
export interface CypressCommandDefinition<T extends keyof Cypress.Chainable> {
  name: T;
  command: (...args: any[]) => Cypress.CanReturnChainable;
  options?: Cypress.CommandOptions & { prevSubject: false };
}
