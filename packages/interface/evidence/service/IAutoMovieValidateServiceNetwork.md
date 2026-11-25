# src/service/IAutoMovieValidateServiceNetwork.ts#IAutoMovieValidateServiceNetwork.IProps

## @evidence contracts/development/design.md#principled-representation

The validator checks version 1, metre units, the environment id, references, port/system units, scalar ranges, capacity and conservative interference; violations retain authored values.

## @evidence contracts/development/design.md#minimal-and-owned-surface

validateServiceNetwork borrows IAutoMovieServiceNetwork and IAutoMovieBuiltEnvironment; lowerServiceNetwork refuses its failed result before drawing runs.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

This gate assumes typed record structure and separately admitted building geometry; wet-zone obligations use validateWetZones, and hydraulic or electrical performance is not certified.

## @evidence contracts/development/common.md#meaningful-documentation

Typed service graph and served building used for structural distribution-network admission. The validator checks version 1, metre units, the environment id, references, port/system units, scalar ranges, capacity and conservative interference; violations retain authored values.
