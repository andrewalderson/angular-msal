import { CypressCommandDefinition } from './command-definition';

export function registerCommands<T extends keyof Cypress.Chainable>(
  availableCommands: CypressCommandDefinition<T>[]
): void {
  availableCommands.forEach((commandDefinition) => {
    if (commandDefinition.options) {
      Cypress.Commands.add(
        commandDefinition.name,
        commandDefinition.options,
        commandDefinition.command
      );
    } else {
      Cypress.Commands.add(commandDefinition.name, commandDefinition.command);
    }
  });
}
