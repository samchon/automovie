# src/service/IAutoMovieAppendServiceNetworkNodes.ts#IAutoMovieAppendServiceNetworkNodes.IProps

## @evidence contracts/development/design.md#principled-representation

Node and port coordinates are world metres, port sections are square metres and demands use each system's unit; callbacks check finite scalar ranges while the node validator checks references and vocabulary.

## @evidence contracts/development/design.md#minimal-and-owned-surface

validateServiceNetwork supplies shared system/space/element indexes, first port paths and seen ids, then uses the accumulated paths to report unconnected ports.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Callbacks run synchronously, are not retained and may propagate exceptions; borrowed records are not repaired, and the indexes are updated even for defective port declarations.

## @evidence contracts/development/common.md#meaningful-documentation

Node and port admission context with mutable indexes for later connectivity diagnostics. Node and port coordinates are world metres, port sections are square metres and demands use each system's unit; callbacks check finite scalar ranges while the node validator checks references and vocabulary.
