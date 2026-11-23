# src/animals/EquineFootwork.ts#EquineFootwork.Technique

## @evidence contracts/development/common.md#meaningful-documentation

Defines both techniques and the authored slide values and units.

## @evidence contracts/development/design.md#principled-representation

Each legal variant has the fields necessary for its motion and no fields for the other variant.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The ride already declares travel and speed. This type adds only the footwork performed over it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The caller supplies the brief motion window. The documented kinematic form does not imply a default measured duration or fit.

# src/animals/EquineFootwork.ts#EquineFootwork.IInstant

## @evidence contracts/development/common.md#meaningful-documentation

States the units.

## @evidence contracts/development/design.md#principled-representation

The shape of a ride's instants.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the ride's instant list.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/EquineFootwork.ts#EquineFootwork.IReinBack

## @evidence contracts/development/common.md#meaningful-documentation

Names the technique.

## @evidence contracts/development/design.md#principled-representation

A marker; the reversed walk leg carries the travel.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A member of `Technique`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/EquineFootwork.ts#EquineFootwork.ISlideStop

## @evidence contracts/development/common.md#meaningful-documentation

States each authored value's unit.

## @evidence contracts/development/design.md#principled-representation

Two durations in seconds and an advance in metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A member of `Technique`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The caller supplies the window; no measured duration is implied.

# src/animals/EquineFootwork.ts#EquineFootwork.IPlan

## @evidence contracts/development/common.md#meaningful-documentation

Defines phase and goal sampling as well as event ownership.

## @evidence contracts/development/design.md#principled-representation

A fixed set of per-leg rein-back flags and an optional terminal slide replace only the contact pattern that the author requests.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The horse phase reader and pose emitter share one admitted technique plan.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The flag and geometric goals come from the admitted course. No call inspects eventual render output to select a result.

# src/animals/EquineFootwork.ts#EquineFootwork.IPlan.distance

## @evidence contracts/development/common.md#meaningful-documentation

States the film second it takes and the course distance it returns.

## @evidence contracts/development/implementation.md#principled-implementation

Reads the distance of the admitted course's sample at the second.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One sample and one field read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The distance is the course's own; nothing is interpolated here.

## @evidence contracts/development/implementation.md#efficient-algorithms

One course sample per call.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call reads a different second.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/EquineFootwork.ts#EquineFootwork.prepare

## @evidence contracts/development/common.md#meaningful-documentation

Describes the source identity, route and typed refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Read route boundaries and ensure the diagonal backing is on a reversed level straight walk leg and a slide consumes only an independently authored terminal deceleration.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Inspect each explicitly authored technique at its own typed leg and use the native plan to validate its applicability.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No generated measurements substitute for authored input and no other species receives horse footwork.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(L) pass over L legs plus the bounded native plan queries for explicitly selected techniques.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the checked course plan's times and speeds rather than constructing another trajectory.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains one flag per backing leg and at most one terminal slide and its three cues.

# src/animals/EquineFootwork.ts#EquineFootwork.reinBackPhase

## @evidence contracts/development/common.md#meaningful-documentation

States the origin and normalized phases.

## @evidence contracts/development/implementation.md#principled-implementation

FEI Dressage Rules Article 406 defines a two-beat rearward diagonal without aerial time. The ride uses a duty greater than one half to retain ground support. https://inside.fei.org/system/files/FEI_Dressage_Rules_2022_Clean_Version_V2.pdf

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One division into the two named diagonal pairs.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The result names contact order. It supplies no invented measured speed or stride period.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the quadruped limb vocabulary.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds no sample or external resource.

# src/animals/EquineFootwork.ts#EquineFootwork.slideGoal

## @evidence contracts/development/common.md#meaningful-documentation

States time, model metres and the scope of the slide.

## @evidence contracts/development/implementation.md#principled-implementation

The NRHA Judges' Guide depicts sliding ground contact at both hind feet while the horse proceeds straight into the stop. Minimum-jerk progress transitions the existing gait into that authored model-space stance. The admitted deceleration carries it to zero world speed. https://nrha.com/wp-content/uploads/2026/05/2026-NRHA-Handbook.pdf

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Compute one blend and retain a fixed terminal pose after contact.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The candidate still goes through the geometric contact solver and will refuse an infeasible foot placement.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work and output per hind hoof.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Blends the existing gait goal and uses the same prepared terminal solver.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Changes no history and retains no caller state.

# src/animals/EquineFootwork.ts#EquineFootwork.sit

## @evidence contracts/development/common.md#meaningful-documentation

States the unit, sign and source of the pitch.

## @evidence contracts/development/implementation.md#principled-implementation

The sit's share of `AutoMovieArchetypeEquineBank.SIT`, nose-up.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One product.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the few slides.

## @evidence contracts/development/implementation.md#reuse-equivalent-work `AutoMovieArchetypeEquineBank.share`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one number.

# src/animals/EquineFootwork.ts#EquineFootwork.limbGoal

## @evidence contracts/development/common.md#meaningful-documentation

States the frames and the order the techniques apply in.

## @evidence contracts/development/implementation.md#principled-implementation

Each technique replaces the gait's goal only inside its own window.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A chain of compositions.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work outside a technique's window.

## @evidence contracts/development/implementation.md#reuse-equivalent-work `AutoMovieArchetypeEquineScramble.goal`, `slideGoal` and `AutoMovieArchetypeEquineBank.goal`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one goal.
