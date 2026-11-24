# src/human/generation/IAutoMovieHumanBodyLane.ts#IAutoMovieHumanBodyLane

## @evidence contracts/development/common.md#meaningful-documentation

Original limb/head inputs, attachment folds and production-tree results, retaining source failures before realization. Member comments specify the individual units, frames and optional-value meanings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups only IFold, ISide, IDigit, IToe, IInput, IOutput, IDefinition declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.

## @evidence contracts/development/design.md#principled-representation

IFold, ISide, IDigit, IToe, IInput, IOutput, IDefinition separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanBodyLane exchanges the named IFold, ISide, IDigit, IToe, IInput, IOutput, IDefinition contracts with its Human callers. Interface owns these type declarations without importing that implementation.

# src/human/generation/IAutoMovieHumanBodyLane.ts#IAutoMovieHumanBodyLane.IFold

## @evidence contracts/development/common.md#meaningful-documentation

A join's seed search and fold, calibration mm.

## @evidence contracts/development/design.md#principled-representation `search`: Where the seed is searched: the part's phase and the shares of its station range from inside the host to outside it. `radius`: The fold's radius, mm. `cap`: The widest chord either side, mm; absent, the lane's own cap for that join.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanBodyLane.fold, AutoMovieHumanBodyLaneInterim.fold.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `cap`: The widest chord either side, mm; absent, the lane's own cap for that join.

# src/human/generation/IAutoMovieHumanBodyLane.ts#IAutoMovieHumanBodyLane.ISide

## @evidence contracts/development/common.md#meaningful-documentation

One side's limbs and extremities.

## @evidence contracts/development/design.md#principled-representation `leg`: The leg's bones and its sites' laws. `arm`: The arm's bones, the palm's last centre and reach, its sites' laws and joints, its fold onto the trunk. `foot`: The foot.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanBodyLane.side, AutoMovieHumanBodyLaneInterim.side.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `leg`, `arm`, `foot`, `footDefinition`, `fingers`, `digitNames`, `toes`, `toeNames`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanBodyLane.ts#IAutoMovieHumanBodyLane.IDigit

## @evidence contracts/development/common.md#meaningful-documentation

A digit's input and its web's fold.

## @evidence contracts/development/design.md#principled-representation `definition`: Same prepared original consumed by both the selected reader and production raw loft. `digit`: The digit. `fold`: Its web's fold onto the host.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanBodyLane.branches, AutoMovieHumanBodyLane.baseOf.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `definition`, `digit`, `fold`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanBodyLane.ts#IAutoMovieHumanBodyLane.IToe

## @evidence contracts/development/common.md#meaningful-documentation

A toe's foot-axis skin source and its declared fold onto the forefoot.

## @evidence contracts/development/design.md#principled-representation `definition`: Same final fixed-chart original consumed by production and selected readers. `toe`: Fixed observation-plane input, distinct from a finger's bone-normal walk. `fold`: The source attachment's fold declaration; final realization remains separate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanBodyLane.branches, AutoMovieHumanBodyLane.baseOf.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `definition`, `toe`, `fold`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanBodyLane.ts#IAutoMovieHumanBodyLane.IInput

## @evidence contracts/development/common.md#meaningful-documentation

What the lane is built from.

## @evidence contracts/development/design.md#principled-representation `diagnostics`: Earlier anatomical source failures, retained verbatim before any tree or join operation. `trunk`: The trunk's build. `preparedTrunk`: Same already prepared trunk/tape-pass result, when an original reader evaluated it first.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanBodyLaneInterim.of, AutoMovieHumanBodyLaw.bodyInput, AutoMovieHumanBodyPreparation.bodyInput. Read by AutoMovieHumanBodyLane.create, AutoMovieHumanBodyLane.define. Also types AutoMovieHumanBodyPreparation.input.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `diagnostics`: Earlier anatomical source failures, retained verbatim before any tree or join operation. `preparedTrunk`: Same already prepared trunk/tape-pass result, when an original reader evaluated it first. `preparedSources`: Actually requested raw originals from this same preparation context. `head`: The head's subtree and its fold onto the trunk (`AutoMovieHumanHeadLane`); absent, no head.

# src/human/generation/IAutoMovieHumanBodyLane.ts#IAutoMovieHumanBodyLane.IOutput

## @evidence contracts/development/common.md#meaningful-documentation

The assembled subtree.

## @evidence contracts/development/design.md#principled-representation `chains`: Every part's chain and every blend's. `bodies`: The realized body of trimmed faces, every face a chain of `chains`. `diagnostics`: Every broken premise.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanBodyLane.create, AutoMovieHumanBodyLane.realize, AutoMovieHumanBodyPublication.of. Also types AutoMovieHumanBodyLaw.lane.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `chains`, `bodies`, `diagnostics`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanBodyLane.ts#IAutoMovieHumanBodyLane.IDefinition

## @evidence contracts/development/common.md#meaningful-documentation

The actual production tree and source diagnostics, before any solid realization.

## @evidence contracts/development/design.md#principled-representation `sourceParts`: Actual immutable millimetre originals resolved by source leaves during this realization. When present, `loopSources` supplies paired original charts indexed by this invocation's source-backed join references. These charts accompany the head subtree into the same realization. `handAttachments`: Actual consumed hand contact records, retaining the same parent original and anatomical joint separately. `root`: The assembled production tree; null when its trunk definition failed.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanBodyLane.define. Read by AutoMovieHumanBodyLane.realize. Also types AutoMovieHumanBodyLaw.lane.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `sourceParts`, `handAttachments`, `root`, `limits`, `diagnostics`, `sources`. A defined head supplies `loopSources` to resolve its source-backed joins.
