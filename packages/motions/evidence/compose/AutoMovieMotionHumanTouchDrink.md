# src/compose/AutoMovieMotionHumanTouchDrink.ts#AutoMovieMotionHumanTouchDrink.drinking

## @evidence contracts/development/common.md#meaningful-documentation

States the order of the search, its assumption, the admission, the choice, the measured defect, the shared pool and the refusal; the namespace states the candidates.

## @evidence contracts/development/implementation.md#principled-implementation

Every candidate is solved by the resolver and read on its displayed bones; the arm is admitted by the shoulder range healthy drinkers use (Alt Murphy et al. 2006), the least lean that admits one is taken so the vessel tips no more than the arm needs, and of the admitted facings the hand's tilt decides.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One coarse-to-fine walk of the leans (`AutoMovieMotionHumanDrinkingLean.least`), each lean one `trial`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The monotone admission the refinement relies on is stated here and read by the drinking signature spec, which checks that the lean a step below the returned one does not admit; with none admitted the law is refused, never given a raised arm.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most seven coarse leans, three about a miss's zero and two fine ones (`AutoMovieMotionHumanDrinkingLean.least`); each lean at most thirteen entry fits, a facing whose wrist leaves no reaching elbow in the drinking range dropped before its fit (`AutoMovieMotionHumanSwivelBound.admits`, exact), ending at the first admitted facing that holds the vessel exactly on its asked axis (no later facing can beat a tilt of 0), then for its best one referred fit and, with `after`, a referred fit in the drinking phase (two solves: its reference and the fit). Each facing's hint is bounded in constant work after one trunk solve per pool.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One pool (fixed body/side reader and the fixed posture's lazy swivel bound) serves every candidate/reference/after fit, and every side of a rim search; each varying hint still runs the original closed-form bound, and every candidate fit remains actual.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The synchronous search owns or borrows one pool until return or throw; the numeric answer/refusal captures no reader, candidate pose or new query history.

# src/compose/AutoMovieMotionHumanTouchDrink.ts#AutoMovieMotionHumanTouchDrink.admitted

## @evidence contracts/development/common.md#meaningful-documentation

States the screen, the order, the choice and the admission.

## @evidence contracts/development/implementation.md#principled-implementation

The admitted arm is the one the stroke shows, fitted to the same goal and reference.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One delegation to `trial`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every facing is solved; a tie keeps the one nearest head on.

## @evidence contracts/development/implementation.md#efficient-algorithms

Thirteen entry fits and one referred fit, whose reference's entry fit the resolver's memory already holds; with `after`, two more solves for the drinking phase's reference and referred fit. Each facing's hint is bounded in constant work after one trunk solve.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The single-lean trial uses the same native fixed-body observation producer as drinking, preserving all current facing and reference fits without re-preparing rig metadata for each candidate.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Its invocation owns one reader until return or throw and returns only original numeric drink data, with no pose/result history or metadata loan retained.

# src/compose/AutoMovieMotionHumanTouchDrink.ts#AutoMovieMotionHumanTouchDrink.held

## @evidence contracts/development/common.md#meaningful-documentation

States what is fixed, what is sought, the order, the admission and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

A kept grasp fixes the hand-to-vessel rotation, not the hand, so the same drink is admitted by the same shoulder range (Alt Murphy et al. 2006) however the vessel came to the hand; the vessel's point stays on the region as the stroke keeps it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One coarse-to-fine walk (`AutoMovieMotionHumanDrinkingLean.least`) of a goal, a screen and an admission per lean.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The admitted arm is the referred one the stroke shows; with none admitted the law is refused.

## @evidence contracts/development/implementation.md#efficient-algorithms

Per lean tried (at most seven coarse, three about a miss's zero and two fine, `AutoMovieMotionHumanDrinkingLean.least`): one entry fit, and for a lean that passes it one referred fit (its reference's entry fit in the resolver's memory) and, with `after`, the drinking phase's reference and referred fit, two solves.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Rest/tip retain vessel geometry and one genuine fixed-body observation reader serves every current lean, reference and later-phase native fit; only rig/FK metadata is shared, never a candidate answer.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The synchronous held search owns one reader until return or throw; returned lean/goal payloads remain numeric and retain no reader or new candidate history.
