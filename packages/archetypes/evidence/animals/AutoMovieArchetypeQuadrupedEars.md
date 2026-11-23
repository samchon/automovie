# src/animals/AutoMovieArchetypeQuadrupedEars.ts#AutoMovieArchetypeQuadrupedEars.IProfile

## @evidence contracts/development/common.md#meaningful-documentation

Length, width and plateThickness are positive fractions of current withers height; direction is a nonzero neutral-model vector for the left plate, mirrored in X for the right.

## @evidence contracts/development/design.md#principled-representation

Keeps two independently sourced dimensions separate from authored plate thickness and pose; no statistical band or biological orientation is encoded.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The optional head profile supplies only what the two existing box primitives need.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No implicit thickness, pose, radius expansion or borrowed mass coefficient fills a missing member.

# src/animals/AutoMovieArchetypeQuadrupedEars.ts#AutoMovieArchetypeQuadrupedEars.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

Volume is the sum of both rectangular solids; emit consumes an optional weight budget for the pair, not a biological density or ear-mass estimate.

## @evidence contracts/development/design.md#principled-representation

One admitted immutable-dimension plan connects physical volume and emission so the whole-head source share can be divided without a second geometry calculation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The head assembler reads volume and calls emit; the existing lay seam uses the same plan for standalone callers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No unrepresented tissue, inferred density, changed head dimensions or duplicate planning supplies the weight allocation.

# src/animals/AutoMovieArchetypeQuadrupedEars.ts#AutoMovieArchetypeQuadrupedEars.IPrepared.emit

## @evidence contracts/development/common.md#meaningful-documentation

States builder mutation, model-metre geometry, optical colour, optional complete-pair weight and admission ownership.

## @evidence contracts/development/implementation.md#principled-implementation

The prepared equal-volume boxes retain their admitted rigid frames and split a finite representably positive pair weight equally; absent weight preserves the builder's volume allocation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Validate the optional weight, then append the two prepared boxes through the existing builder.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No biological ear density, massless proxy or dimension change is introduced; invalid pair weights refuse before either append.

## @evidence contracts/development/implementation.md#efficient-algorithms

Exactly two box appends and constant scalar checks use O(1) time and new storage per emission, without repeating root admission.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each emission reuses the same admitted dimensions and root frames that supplied pair volume, while copying transforms and shapes for the independent builder.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The prepared plan retains two bounded frames and scalar dimensions; emitted parts transfer to the builder and no builder, emitted model or external handle is retained.

# src/animals/AutoMovieArchetypeQuadrupedEars.ts#AutoMovieArchetypeQuadrupedEars.lay

## @evidence contracts/development/common.md#meaningful-documentation

States model frame, normalized input and SI construction, complete base-to-tip/breadth definitions, head seating and existing mass ownership.

## @evidence contracts/development/implementation.md#principled-implementation

Prepare the two-plate geometry and emit that same admitted plan with the supplied pair weight or volume default.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One prepare call and one emission call share the complete-root and volume premises.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A plate never stretches to join the skull or changes sourced body values. Unknown biology remains authored geometry. Dimension/root refusal happens before either ear is appended; builder identity/material admission remains the builder's responsibility.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed scalar/vector work and two capsule root queries take O(1) time and storage during construction, with no render, search history or per-frame solve.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The prepared owner supplies the same dimensions, volume and roots as the full-head assembler; no standalone layout duplicates its geometry.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Two call-local plans hold fresh scalar points/quaternions; no caller profile, source model, completed result cache or external resource is retained.

# src/animals/AutoMovieArchetypeQuadrupedEars.ts#AutoMovieArchetypeQuadrupedEars.prepare

## @evidence contracts/development/common.md#meaningful-documentation

Inputs are neutral head geometry, positive current height and explicit ear profile; output carries pair volume and independent emission into real builders.

## @evidence contracts/development/implementation.md#principled-implementation

Convert normalized dimensions, admit their exact box mass-volume domain, seat each root rectangle's enclosing disk inside the head capsule and snapshot both rigid frames. Equal boxes divide a supplied pair weight equally.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit dimensions/volume, prepare the two roots and return one volume/emission closure.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Unsupported dimensions, unrepresentable volume and impossible roots refuse before emission. A caller's profile is not retained, nor is a biological density, thickness or angular bound inferred.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two constant-size root queries and fixed primitive arithmetic are paid once; each emission creates exactly two independent box parts.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The existing primitive mass owner gives volume and the shared head attachment owner supplies complete-root seating. The head's allocation and this emitter read the same prepared dimensions.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only three scalar dimensions, pair volume and two bounded frame records; every emitted transform/shape is independently copied and no model, caller profile, process or result cache is retained.
