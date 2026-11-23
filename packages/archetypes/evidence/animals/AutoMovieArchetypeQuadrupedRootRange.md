# src/animals/AutoMovieArchetypeQuadrupedRootRange.ts#AutoMovieArchetypeQuadrupedRootRange.IConstraint

## @evidence contracts/development/common.md#meaningful-documentation

Defines metre coordinates before the shared vertical translation and the folded-chain radial interval.

## @evidence contracts/development/design.md#principled-representation

A complete attachment/goal/reach tuple constrains one limb without encoding a second skeleton or a preferred fitted pose.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Consumed by the common body-root intersection; reach imports the exact limb owner's contract.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

All three quantities are required and are checked for finite representability; a missing limb cannot be replaced by a default.

# src/animals/AutoMovieArchetypeQuadrupedRootRange.ts#AutoMovieArchetypeQuadrupedRootRange.IRange

## @evidence contracts/development/common.md#meaningful-documentation

Both endpoints are finite model-space translations, possibly negative, and minimum never exceeds maximum.

## @evidence contracts/development/design.md#principled-representation

An interval represents the complete feasible above-foot branch shared by all four limbs and the supplied body-floor lower bound.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Reports feasibility to the body-root trajectory owner without choosing, clamping or retaining its preferred path.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The interval is not an anatomical range, an error tolerance or permission to change a requested root trajectory.

# src/animals/AutoMovieArchetypeQuadrupedRootRange.ts#AutoMovieArchetypeQuadrupedRootRange.intersect

## @evidence contracts/development/common.md#meaningful-documentation

Gives the exact geometric interval, above-foot branch, metre frames and physical floor requirement, distinguishing feasibility from path selection.

## @evidence contracts/development/implementation.md#principled-implementation

Derive each limb's vertical-drop interval from its radial reach and fixed horizontal separation, translate it into root coordinates and intersect all four with the body-floor lower bound; a limb's upper bound is relaxed by its unloaded share (`IConstraint.load`) of its reach, so the planted hooves set the body's height and a swinging hoof adapts to it (the orthodox quadruped rule), exactly while a hoof bears and continuously as it lifts and lands. A fore limb with a shoulder blade takes the highest bound its blade reaches within range (`QuadrupedScapula.high`), and the two hinds the highest at which one turn of the pelvis within its range lets both reach (`QuadrupedPelvis.high`); that shared turn is chosen once the root is (`QuadrupedPelvis.turn`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit each complete constraint, derive its two bounds once and accumulate their intersection before one final emptiness check.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Targets, attachments and reach radii remain unchanged. Squared-radius arithmetic is normalized to avoid avoidable overflow; an empty or unrepresentable interval is refused rather than padded or projected.

## @evidence contracts/development/implementation.md#efficient-algorithms

Exactly four constant-size constraints take O(1) work and storage with no root search, event enumeration, physical simulation or retained samples.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each horizontal norm and folded reach is used for both vertical bounds; the exact limb owner supplies the already prepared radial interval.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one fresh scalar interval and retains no model, input record, frame cache, process or external handle.

# src/animals/AutoMovieArchetypeQuadrupedRootRange.ts#AutoMovieArchetypeQuadrupedRootRange.relax

## @evidence contracts/development/common.md#meaningful-documentation

States the conflict, the relaxation and its bound.

## @evidence contracts/development/implementation.md#principled-implementation

The fold is a requested swing carriage and the limb's upper bound rises monotonically as it unfolds, so the largest admissible fold is found by bisection between none and the request; planted limbs, goals and attachments never move.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Bound, find the binding swinging limb, unfold it, repeat for at most the four limbs.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No goal, attachment or reach is padded; a fold is only lowered, never raised.

## @evidence contracts/development/implementation.md#efficient-algorithms

Only a conflicting sample unfolds: 48 halvings of one fold per binding limb, at most four.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the per-limb bounds intersect computes.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh record.

# src/animals/AutoMovieArchetypeQuadrupedRootRange.ts#AutoMovieArchetypeQuadrupedRootRange.IRelaxed

## @evidence contracts/development/common.md#meaningful-documentation

States both members.

## @evidence contracts/development/design.md#principled-representation

The interval and each limb's fold as used.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by relax.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.
