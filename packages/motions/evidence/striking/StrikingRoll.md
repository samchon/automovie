# src/striking/StrikingRoll.ts#StrikingRoll.miss

## @evidence contracts/development/common.md#meaningful-documentation

States what is fitted, on which body and what is measured.

## @evidence contracts/development/implementation.md#principled-implementation

The plan's own goal for the pose is resolved by the posture resolver, the fitted hand's grip frame is read by forward kinematics, and the tool's two points are carried by it: the displacement a viewer would see.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One goal, one resolution, one read-back.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Both the kept point and the working point are read, so a tool that keeps its point and points elsewhere is counted; when the kept point is the working point, the line is read at the tool's length, so the count holds there too.

## @evidence contracts/development/implementation.md#efficient-algorithms

One original elbow search and complete posture fit precede demanded hand FK. Every candidate keeps current direct admission, ROM projection and limb/digit/rival solving; a genuine local exact reader can share only equal FK prerequisites, with speedup unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The explicit parent FK supplier checks exact scalar dependencies only within this synchronous search. Current tool goal, raw posture fields and native direct/ROM admission are read afresh, including mutable fields or getters; no posture identity certifies fixed authoring and no fitted answer is cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The optional exact reader is borrowed through synchronous return or throw; each candidate releases its independent pose/map and temporary goal, while only the scalar miss escapes. No direct-pose snapshot or ROM mapper enters retained state.

# src/striking/StrikingRoll.ts#StrikingRoll.hand

## @evidence contracts/development/common.md#meaningful-documentation

States what is fixed, what is chosen, by which rule, and each input.

## @evidence contracts/development/implementation.md#principled-implementation

Candidates are the turns about the tool's line and the lines of the cone. A straight wrist puts the elbow one forearm back from the wrist along the hand, and the arm can only hold the frame when that elbow lies one upper arm from the shoulder, so the residual of that distance ranks the candidates cheaply; the `TRIED` best are then fitted and the one the fitted hand misses least is taken, a line nearer the asked axis winning a tie.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The one-shot path normalizes its axis, reads the fixed shoulder when present, constructs each actual frame and ranks the original grid before chosen; the separate StrikingRollHand factory requires explicitly unchanged tool geometry.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The steps (10 degrees of cone, 45 of azimuth, 30 of turn) are a search resolution; the placed point is on its place for every candidate; the choice is made by the fit, never by the residual alone.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each invocation retains the original 12 turns times cone lines and TRIED fits/refinements. Canonical body/side anatomical metadata is weakly shared by StrikingStrain, while every frame, callback, raw direct/ROM admission and actual fit remains current; speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A plain posture is not proof of immutable direct fields or getters. All hand candidates retain original current tool/frame and raw direct admission, with the original axis-to-shoulder-to-frame-to-callback/shoulder-to-strain observation order. Only canonical immutable body anatomy is shared; no posture, tool geometry or ROM answer is inferred from object identity.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Candidate ranks and actual chooser workspaces end with this synchronous search; only the independent chosen hand frame escapes. No future callback's tool geometry or pose is retained as an answer.

# src/striking/StrikingRoll.ts#StrikingRoll.strain

## @evidence contracts/development/common.md#meaningful-documentation

States what is measured, why it ranks and each input.

## @evidence contracts/development/implementation.md#principled-implementation

The wrist follows rigidly from the grip frame and the elbow from a straight wrist; the arm holds the pose only with the elbow one upper arm from the shoulder.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One shoulder read and one closed form, the one `hand` ranks its candidates by.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A ranking only: no pose is accepted by it, `best` and `reachable` fit.

## @evidence contracts/development/implementation.md#efficient-algorithms

One raw trunk query admits all current authored joints and evaluates only shoulder ancestry, then fixed anatomical vector work returns the residual; no limb fit is performed and speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares only the canonical StrikingStrain body/side anatomical metadata with hand. Each call first reads its current raw shoulder, then obtains the current side's anatomical rank reader; no shoulder, raw posture or rank answer is reused.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The anatomical closure and fresh raw-trunk map end on return or throw. Only the scalar rank escapes, with no pose, FK workspace, hand frame or numerical history retained.

# src/striking/StrikingRoll.ts#StrikingRoll.chosen

## @evidence contracts/development/common.md#meaningful-documentation

States who chooses, by which judge, and who judges the result.

## @evidence contracts/development/implementation.md#principled-implementation

Each pose is judged by `miss`, the fit that counts the shoulder's, the forearm's and the wrist's ranges, so the angle chosen is one the wrist can make.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One delegation with a one-instant judge, then the frame of the chosen values.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The freedoms are the law's; the result is still judged by `reachable`.

## @evidence contracts/development/implementation.md#efficient-algorithms

The original lazy fit/refinement budget remains. Every callback candidate rebuilds its actual tool goal and re-admits direct posture/ROM inputs before the complete original limb/digit/rival fits; exact FK prerequisites alone may share a native workspace, with no measured speedup.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One exact FK reader checks actual scalar dependencies within this synchronous search. Frame callbacks and raw field getters may change current authoring, so every candidate retains cold seeded admission; neither object identity nor a pure frame producer certifies borrowed posture immutability.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The local exact reader and each independent current goal/fit/map end on search return or failure. No direct snapshot, tool geometry, ROM mapper or candidate answer is retained by the chosen fresh hand frame.

# src/striking/StrikingRoll.ts#StrikingRoll.best

## @evidence contracts/development/common.md#meaningful-documentation

States the order, the rule and each input.

## @evidence contracts/development/implementation.md#principled-implementation

Each candidate is judged by `miss`, the fit that counts the shoulder's, the forearm's and the wrist's ranges; an exact hold (under 0.1 mm) cannot be beaten, so the search ends there, and a later candidate wins only by more than that.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop with one early end.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The choice is the fit's; the caller's refusal (`reachable`) still judges the chosen pose.

## @evidence contracts/development/implementation.md#efficient-algorithms

Candidates are built and fitted lazily, so a law whose first pose holds pays one fit.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One local exact FK reader checks actual scalar dependencies; each arbitrary candidate callback is followed by a fresh current tool goal, direct-joint admission and ROM projection, retaining in-place posture/tool/table changes and all arm/rival/digit fitting.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The exact reader and each independent fitted pose/map end with the synchronous loop on return or throw. No posture snapshot, fixed tool geometry, ROM projector or candidate history is retained, and only the chosen frame escapes.

# src/striking/StrikingRoll.ts#StrikingRoll.reachable

## @evidence contracts/development/common.md#meaningful-documentation

States what is measured and both refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The wrist follows rigidly from the grip frame, and a wrist farther from the shoulder than the two arm segments has no solution; inside the reach the pose is fitted and read back (`miss`), so the shoulder's, the forearm's and the wrist's ranges all count.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One distance, then one fit.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No clamp: a pose that is out of reach or that the hand cannot turn to is refused with the measured miss and what to change.

## @evidence contracts/development/implementation.md#efficient-algorithms

One trunk resolution and one fit per plan.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses canonical grip/shoulder geometry and the original miss owner. The actual shoulder reach test and subsequent full fit borrow one exact same-body FK workspace within this synchronous check; distinct postures and calls remain independent.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One lazy exact workspace and temporary raw/fitted maps end on normal return or either refusal; no query result, reader, goal or new history is retained by a returned plan.
