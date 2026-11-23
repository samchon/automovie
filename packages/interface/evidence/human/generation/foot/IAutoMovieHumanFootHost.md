# src/human/generation/foot/IAutoMovieHumanFootHost.ts#IAutoMovieHumanFootHost

## @evidence contracts/development/common.md#meaningful-documentation

Describes floor-aligned foot frames, shared host stations and dimensionless transverse supports; nested declarations retain their units, frames, optional states and callback contracts.

## @evidence contracts/development/design.md#principled-representation

Floor-aligned foot frames, shared host stations and dimensionless transverse supports. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these dependency-free exchange types for AutoMovieHumanFootHost; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups the existing FootHost contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.

# src/human/generation/foot/IAutoMovieHumanFootHost.ts#IAutoMovieHumanFootHost.IFrame

## @evidence contracts/development/common.md#meaningful-documentation

A foot's frame on the floor.

## @evidence contracts/development/design.md#principled-representation `heel`: The heel's rearmost point on the floor. `along`: The unit direction from the heel to the toes. `lateral`: The unit lateral direction on the floor.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanFootHost.place. Read by AutoMovieHumanFootHost.create. Also types AutoMovieHumanFootInterim.frame.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `heel`, `along`, `lateral`, `back`; callers supply the complete record.

# src/human/generation/foot/IAutoMovieHumanFootHost.ts#IAutoMovieHumanFootHost.IPlan

## @evidence contracts/development/common.md#meaningful-documentation

The exact stations and cap used by both source normalization and the actual foot builder.

## @evidence contracts/development/design.md#principled-representation `named`: Named sites and table rows, strictly rising shares. `end`: Hidden forefoot cap share. `first`: Public first-ball skin station share.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanFootHost.sourcePlan. Read by AutoMovieHumanFootHost.create, AutoMovieHumanFootHost.acrossSupport. Also types AutoMovieHumanFootInterim.plan.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `named`, `end`, `first`, `fifth`; callers supply the complete record.

# src/human/generation/foot/IAutoMovieHumanFootHost.ts#IAutoMovieHumanFootHost.ITransverse

## @evidence contracts/development/common.md#meaningful-documentation

Retained host's independent dimensionless regional supports, not the group's public breadth or one cut's radii.

## @evidence contracts/development/design.md#principled-representation `lateral`: Largest retained lateral support, before the common group scale. `medial`: Largest retained medial support, before the common group scale.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanFootHost.acrossSupport. Read by AutoMovieHumanFootHost.create. Also types AutoMovieHumanFootInterim.support.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `lateral`, `medial`; callers supply the complete record.
