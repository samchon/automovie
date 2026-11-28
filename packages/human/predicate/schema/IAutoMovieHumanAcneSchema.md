# src/schema/IAutoMovieHumanAcneSchema.ts#IAutoMovieHumanAcneSchema

## @evidence contracts/development/common.md#meaningful-documentation

The documentation names the facial density, maximum diameter on the rest surface and pigment severity. Each field has its own purpose.

## @evidence contracts/development/design.md#principled-representation

Typia tags constrain density to [0, 10] spots per square centimetre, maximum diameter to [3, 10] millimetres and redness coverage to [0, 1]. Placement and visual support belong to the consumer.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The skin appearance schema owns the optional group. The source record describes surface color and has three authored scalars. Geometry and scar models have their own contracts.
