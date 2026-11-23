# src/geometry/curve/IAutoMoviePlanContourSlabs64Ring.ts#IAutoMoviePlanContourSlabs64Ring

## @evidence contracts/development/design.md#principled-representation

Millimetre cyclic samples and declared material winding keep metric scoring separate from orientation compatibility.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Slab planning needs only points, winding and local sampling refusal; richer source ownership remains on the caller's ring.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An unsupported ring receives infinite matching separation instead of a fabricated replacement boundary.

## @evidence contracts/development/common.md#meaningful-documentation

States the point frame, borrowed storage and unsupported matching behavior.
