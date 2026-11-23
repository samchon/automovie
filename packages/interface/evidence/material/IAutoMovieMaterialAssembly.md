# src/material/IAutoMovieMaterialAssembly.ts#IAutoMovieMaterialAssembly

## @evidence contracts/development/design.md#principled-representation

Ordered layers advance on one host-local axis with a signed offset and sense; `resolveAutoMovieMaterialAssembly` validates the build-up before accumulating thickness into layer placements, preserving the stated order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Assembly orientation and exposed ends live once around the ordered layer list, while each layer owns substance, finish and wrapping; the host owns the dimension the validator compares against the sum.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No wall or material catalogue is embedded; exposed-face finish and wrapping rules apply to authored stacks, including the single-layer case whose two faces share one layer.

## @evidence contracts/development/common.md#meaningful-documentation

Gives local-axis, sense and metre-offset semantics, end exposure rules and nonempty layer ordering, including who supplies production-specific build-ups.
