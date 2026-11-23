# src/human/generation/limb/IAutoMovieHumanMassPart.ts#IAutoMovieHumanMassPart

## @evidence contracts/development/common.md#meaningful-documentation

Describes mass footprint/profile inputs, original parent placement and retained pre-loft connections; nested declarations retain their units, frames, optional states and callback contracts.

## @evidence contracts/development/design.md#principled-representation

Mass footprint/profile inputs, original parent placement and retained pre-loft connections. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these dependency-free exchange types for AutoMovieHumanMassPart; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups the existing MassPart contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.

# src/human/generation/limb/IAutoMovieHumanMassPart.ts#IAutoMovieHumanMassPart.IInput

## @evidence contracts/development/common.md#meaningful-documentation

What a mass is built from.

## @evidence contracts/development/design.md#principled-representation `name`: Chain name, such as `breast.left`. `connection`: Actual shared whole-parent root/contact; the old curvature estimate only retains the old exterior clock. `host`: Retained standalone host reader; production originals use originalSource instead.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanMassPart.create, AutoMovieHumanMassPart.define. Also types AutoMovieHumanMassPart.p.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `connection`: Actual shared whole-parent root/contact; the old curvature estimate only retains the old exterior clock. `host`: Retained standalone host reader; production originals use originalSource instead. `originalSource`: Identical original parent and its admitted scalar owner, with declared outward orientation. `level`: Whether the axis is the host's normal levelled (its vertical component dropped): a mass whose target is the skin's extreme along the depth (the bust point, the buttock's most posterior point) has a level normal there on the finished skin, whatever slope the base has under it. `sourceFrame`: Optional original-source wall point in calibration mm and unit anatomical axis.

# src/human/generation/limb/IAutoMovieHumanMassPart.ts#IAutoMovieHumanMassPart.IDefinition

## @evidence contracts/development/common.md#meaningful-documentation

Original mass and its consumed whole-parent connection, before raw lofting.

## @evidence contracts/development/design.md#principled-representation `massConnection`: Actual placement owner; absent only for retained standalone legacy callers.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanMassPart.define. Also types AutoMovieHumanMassPart.fail.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `massConnection`: Actual placement owner; absent only for retained standalone legacy callers.
