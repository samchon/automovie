# src/posture/HumanArmOvershoot.ts#HumanArmOvershoot

## @evidence contracts/development/common.md#meaningful-documentation

States the unit, each input's frame and the meaning of 0.

## @evidence contracts/development/implementation.md#principled-implementation

An elbow goes no farther across the chest's median plane than its wrist's goal, or a forearm's radius beyond its hint, and while the other arm is still to come and its goal is not across, two arms sent to places on their own sides do not cross, so the elbow then keeps the forearm's radius on its own side, or the wrist's own distance when the goal lies nearer or across; and the deepest of `SAMPLES` axis points below its needed clearance, the forearm's radius at the elbow falling linearly toward the wrist but never below the radius less `TISSUE`, the skin the contact verdicts let press in, plus the wrist's own signed clearance where a goal put it (0 for a wrist outside the body), divided by the upper arm's length: the angle the upper arm turns to carry the elbow that far. Against `others` the wrist's own depth excuses nothing, since no goal put the wrist there. Against `rests` the goal puts the hand on the surface, so the wrist lies nearer it than the forearm's room needs (a palm on a partner's chest left the wrist 1.2 mm from it, where a 41 mm forearm needs 31 mm, and the fit gave up 61 mm of its reach to clear it): the needed clearance falls by the wrist's shortfall from the room it needs there, in proportion along the forearm as the wrist's own depth does, so the wrist end asks no more than the goal gives.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The room read once, one bounding-sphere test per hull, then the samples of the shapes that pass it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The wrist end asks no more than the goal itself gives, so a palm laid on the trunk or on a partner is not refused; nothing is clamped.

## @evidence contracts/development/implementation.md#efficient-algorithms

A hull whose bounding sphere the axis stays a radius from costs one point-to-segment distance; a shape that passes costs one point query per sample, where an exact segment query would cost the tens of point queries of its line search to decide what the samples decide anyway, and a sample or a wrist that surely lies too far outside the shape for the query to raise the depth found (or lower the wrist's clearance) is not queried at all, which leaves the reading exactly as it is: the bounding sphere decides first, then a hull's face planes, the face that last decided tried first and the scan stopped at the first face that decides (`beyond`).

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same evaluate owner serves this one-off reading and prepare's varying candidates; only opaque unchanged shape geometry is shared, and every wrist/sample distance, allowance and screen remains actual.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The room is built for this call alone. This one-off call creates a query map only at an exact query, retains no point/result and releases it on return or throw.

# src/posture/HumanArmOvershoot.ts#HumanArmOvershoot.prepare

## @evidence contracts/development/common.md#meaningful-documentation

Defines fixed dependencies, the room built at preparation, varying world-metre points and operation ownership.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the same evaluate body as of; shape-frame geometry is independent of elbow/wrist candidates, so its opaque engine readers can serve every actual query in that fit.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One closure owns fixed room metadata and lazy distance readers; evaluate alone owns all screening, samples, allowances and depth calculations.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every selected point distance and candidate is evaluated in original order, with unchanged samples, ties and tolerances; no query result or resolved flag is stored.

## @evidence contracts/development/implementation.md#efficient-algorithms

Room lookup happens once and at most S exact readers are prepared across the fit's K candidates and S fixed shapes; candidate shape screening and point-distance costs remain unchanged, without a measured speedup claim.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Caller-owned fixed placed frames, shapes and scalar goal metadata establish equivalence only within this synchronous fit; the engine readers share geometry and never points, taper values or distances.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The fit owns the closure, borrowed lists and at most S lazy opaque geometry readers until return or throw; no room or frame is kept beyond the reader, a result, a body memory or a returned plan.
