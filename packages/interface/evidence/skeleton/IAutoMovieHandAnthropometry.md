# src/skeleton/IAutoMovieHandAnthropometry.ts#IAutoMovieHandAnthropometry

## @evidence contracts/development/design.md#principled-representation

IJoint pairs caliper breadth and tape girth in millimetres for the population hand table's joint observations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHandAnthropometry owns the empirical table; human geometry and object-clearance readers reuse this pair of measurements.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The contract does not universalize the sample or fabricate a missing dimension; source population and study limits remain with the table.

## @evidence contracts/development/common.md#meaningful-documentation

Documents the two measurement methods and their millimetre unit.

# src/skeleton/IAutoMovieHandAnthropometry.ts#IAutoMovieHandAnthropometry.IJoint

## @evidence contracts/development/common.md#meaningful-documentation

States each member's measure and unit.

## @evidence contracts/development/design.md#principled-representation

The paper's two measures of one joint, in its millimetres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two figures a digit's or an object's reader takes, owned by the table.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional member, so every joint states both.
