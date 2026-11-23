# src/production/IAutoMovieComputeModelRestExtentY.ts#IAutoMovieComputeModelRestExtentY.IResult

## @evidence contracts/development/design.md#principled-representation

min and max are model-Y metres; height is max - min, not a skeleton joint span. Null is forwarded when computeModelRestExtent has no measurable extent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

computeModelRestExtentY projects the canonical three-axis measurement for formationMemberExtent and other height-only framing consumers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No default height is embedded in this result; formation and subject framing apply their own documented fallback after observing null or insufficient height.

## @evidence contracts/development/common.md#meaningful-documentation

Vertical projection of portable model rest geometry for framing. min and max are model-Y metres; height is max - min, not a skeleton joint span. Null is forwarded when computeModelRestExtent has no measurable extent.
