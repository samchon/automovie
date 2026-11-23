# src/geometry/curve/IAutoMoviePreparedContourEvent64.ts#IAutoMoviePreparedContourEvent64

## @evidence contracts/development/design.md#principled-representation

Exact saved cut coordinates and local signed loop ordinals preserve the declared event's incidence independently of positional proximity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Preparation, slab planning and terminal emission share one record rather than declaring structurally identical event views in each stage.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The 0/1 link flags are explicitly a translation of minimum/maximum and regular declarations; they do not certify mesh topology or repair unsupported incidence.

## @evidence contracts/development/common.md#meaningful-documentation

Names millimetre coordinates, local loop addresses, null terminal behavior, flag derivation, local omission and generation lifetime.

# src/geometry/curve/IAutoMoviePreparedContourEvent64.ts#IAutoMoviePreparedContourEvent64.IIncident

## @evidence contracts/development/design.md#principled-representation

The loop address is interpreted only in the saved section named by the containing event side, and winding comes from that loop.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two scalars are the complete incidence data used by slab grouping; generating curve coefficients remain in the saved section.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A local ordinal is never treated as a source-mesh address or matched by coordinate proximity.

## @evidence contracts/development/common.md#meaningful-documentation

States ordinal scope, orientation meaning and the producing lookup.
