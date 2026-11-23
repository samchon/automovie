# src/architecture/IAutoMovieValidateBuiltConnectorOperation.ts#IAutoMovieValidateBuiltConnectorOperation.IProps

## @evidence contracts/development/design.md#principled-representation

Connector and element records retain their travel units and frames; validateBuiltConnectorOperation checks operation references, travel, states and stops and appends path-addressed findings.

## @evidence contracts/development/design.md#minimal-and-owned-surface

validateBuiltEnvironment supplies the element inventory and collector; the driven map is shared with opening validation to reject competing drivers for one element.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No operation means no work; typed records are assumed structurally present, collectors may throw, and invalid declarations can still reserve their first driven element.

## @evidence contracts/development/common.md#meaningful-documentation

Connector-operation validation context with shared element-drive ownership tracking. Connector and element records retain their travel units and frames; validateBuiltConnectorOperation checks operation references, travel, states and stops and appends path-addressed findings.
