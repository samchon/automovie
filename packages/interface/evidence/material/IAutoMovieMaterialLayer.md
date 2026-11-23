# src/material/IAutoMovieMaterialLayer.ts#IAutoMovieMaterialLayer

## @evidence contracts/development/design.md#principled-representation

The substance discriminator separates a solid, an air gap and a possibly zero-thickness membrane; assembly validation requires positive solid and cavity thickness, forbids cavity material and finish, and resolves non-cavity substance ids when a registry is supplied.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One layer owns thickness, substance citation, finish and reveal wrapping; stack direction, host dimension and end exposure stay on the assembly rather than being repeated here.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Roles remain production-authored strings matched across junctions, without a built-in construction catalogue; a buried finish or disconnected wrapping run is reported rather than made visible by reordering layers.

## @evidence contracts/development/common.md#meaningful-documentation

Describes stable layer identity, junction role matching, the three substance cases, thickness units, cavity null material, exposed finish reachability and contiguous reveal wrapping.
