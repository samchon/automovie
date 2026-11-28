# src/construction/IAutoMovieLoftSectionBoundary.ts#IAutoMovieLoftSectionBoundary.IEnd

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the actual endpoint data and why it is retained separately from transformed controls.

## @evidence contracts/development/design.md#principled-representation

SectionBoundary.create requires positive extent values, interior shoulder shares and two increasing station endpoints. The read path returns a copy of the original scalar jets at either endpoint.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The endpoint reuses ViewRead's scalar jet representation. The bridge owns transformed interpolation controls separately.

# src/construction/IAutoMovieLoftSectionBoundary.ts#IAutoMovieLoftSectionBoundary.IEnd.station

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the reference chart and units of the span bounds.

# src/construction/IAutoMovieLoftSectionBoundary.ts#IAutoMovieLoftSectionBoundary.IEnd.inputs

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the actual quantities and the reason the original data remain stored.

# src/construction/IAutoMovieLoftSectionBoundary.ts#IAutoMovieLoftSectionBoundary.IBridge

## @evidence contracts/development/common.md#meaningful-documentation

The comment relates endpoint values to the distinct interior representation and names the preparing owner.

## @evidence contracts/development/design.md#principled-representation

SectionBoundary.create transforms extent jets with log and shoulder jets with logit. Readers validate span order and compare prepared controls with their originals before evaluating an interior query.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The bridge contains the bounds and scalar controls required for an actual generating field. ViewRead owns the common endpoint jet shape.

# src/construction/IAutoMovieLoftSectionBoundary.ts#IAutoMovieLoftSectionBoundary.IBridge.kind

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the law selected by the literal.

# src/construction/IAutoMovieLoftSectionBoundary.ts#IAutoMovieLoftSectionBoundary.IBridge.ends

## @evidence contracts/development/common.md#meaningful-documentation

The comment specifies how the exact samples align to the interval bounds.

# src/construction/IAutoMovieLoftSectionBoundary.ts#IAutoMovieLoftSectionBoundary.IBridge.controls

## @evidence contracts/development/common.md#meaningful-documentation

The comment fixes ordering and derivative coordinate after scalar transformation.
