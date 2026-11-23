# src/animals/rideQuadruped.ts#rideQuadruped

## @evidence contracts/development/implementation.md#principled-implementation

Integrate declared stride clocks and plan each real foot's stance travel from the course. Swing uses the minimum-jerk path; a swing in a jump's flight is carried in the flying body's frame from its own liftoff (`EquineFlightClock.swing`). The body placement adds a lateral figure's heading and a jump's push-off, flight about the centre of mass and landing (`EquinePitch`). The four folded chains and body-floor support intersect into one vertical root interval, with the gait bob as a soft preference.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit requests, prepare techniques, assemble the stride plan, instants and stateless pose sampler once, or again when a jump's flight is known.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No species case, undeclared-speed clamp, independent proximal translation, distance projection, stretched bone or endpoint-only floor proxy hides an infeasible request. Impossible common-root geometry refuses.

## @evidence contracts/development/implementation.md#efficient-algorithms

Builds S phase rows per assembly, one more per jump candidate. A sample uses binary phase searches, existing clock reads, four constant-size reach intersections and closed-form IK solves, two B-bone FK passes and O(P+A+V) emission, the model posed only when its archetype is read; a contact a body bone carries is read from one body FK and one contact move, with no limb solve or emission (`QuadrupedRidePose.IPrepared.frame`).

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The admitted plan/table, phase rows, neutral source chains, prepared solvers, rig and carrier maps serve every sample; no rest animal or solver graph is rebuilt per frame.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the final assembly's S+1 phases, its strides and instants, plus the prepared source; each sample owns independent geometry with no completed-pose cache or external handle.

## @evidence contracts/development/common.md#meaningful-documentation

States what moves, where the timing comes from, how the gait is chosen and changed, the techniques and instants added, and what the support frame is.
