# src/service/IAutoMovieServiceSchematic.ts#IAutoMovieServiceSchematic

## @evidence contracts/development/design.md#principled-representation

System metadata, projected nodes/edges and unprojected totals are distinct quantities, so drawing coordinates do not replace physical route length or declared demand.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One derived report combines schematic rows and totals while the network owns source records and serviceSystemReach owns connectivity.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Unreachable ids and source metadata remain visible; this report neither certifies hydraulic performance nor implies its producer ran validation.

## @evidence contracts/development/common.md#meaningful-documentation

Explains projection versus physical totals, declaration order, source units and the current producer's unconsumed status.
