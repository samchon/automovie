# src/construction/IAutoMovieLoftSectionFrame.ts#IAutoMovieLoftSectionFrame

## @evidence contracts/development/common.md#meaningful-documentation

The comment distinguishes frame values from derivative records and gives the geometric premise for rotation frames.

## @evidence contracts/development/design.md#principled-representation

LoftFrame places a local section with origin + u × localU + v × localV. The frame-source and Hermite owners use the same layout for origin and axis derivative rows.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The frame shares one origin-and-axis layout for value placement and component derivatives. The enclosing frame jet identifies derivative order.

# src/construction/IAutoMovieLoftSectionFrame.ts#IAutoMovieLoftSectionFrame.origin

## @evidence contracts/development/common.md#meaningful-documentation

The comment assigns units and identifies the changed meaning for derivative rows.

# src/construction/IAutoMovieLoftSectionFrame.ts#IAutoMovieLoftSectionFrame.u

## @evidence contracts/development/common.md#meaningful-documentation

The comment distinguishes the local basis direction and its unnormalized derivative.

# src/construction/IAutoMovieLoftSectionFrame.ts#IAutoMovieLoftSectionFrame.v

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the second local direction and orthogonality premise.
