# src/actions/walkFoot.ts#walkFoot.prepareStance

## @evidence contracts/development/common.md#meaningful-documentation

States fixed footprint/time inputs, angular conventions, defaults and the random-access stance reader.

## @evidence contracts/development/implementation.md#principled-implementation

The forward, backward and raised-heel rockers on minimum-jerk profiles, the heel rocker over `HEEL_SHARE` of the stance and the forefoot rocker over its last `PUSH_SHARE`, a stance with one end taking those shares of the gait's typical stance, an opening stance's rocker beginning no sooner than the take; the heel and toe-joint pivots are prepared outside the time reader.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Fixed temporal terms and lazy rigid pivots precede one selected forward, backward or raised-heel reader.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every share and angle is a named constant, sourced or provisional; the toes extend at the ball by the foot's pitch so they stay flat on the floor.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant preparation and evaluation; gait-kind selection and the interval endpoints and denominators leave the time reader. A flat stance copies its fixed rotation, while each rocker contact and yaw/roll prefix is prepared at most once per footprint.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Body, side, footprint, heading, strike/toe-off, push, typical stance and raised/backward gait values fix this stance; queried seconds are never cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One reader holds one flat rotation and at most two rigid-pivot readers until its step plan releases it, with no time history.

# src/actions/walkFoot.ts#walkFoot.prepareSwing

## @evidence contracts/development/common.md#meaningful-documentation

States the fixed inputs, random-access share reader and lifetime.

## @evidence contracts/development/implementation.md#principled-implementation

Minimum-jerk travel with the carried departure rates, a raised-cosine lift, a sole-clearance correction that keeps the sole at least as high as the lift up to the least clearance, and the lowest departing socket held horizontally until the lift interval passes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Fixed swing geometry precedes one reader of its varying share.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The authored lift, stiffness, rates, duration and landing rule enter as given; `CLEARANCE` is the cited minimum toe clearance.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant preparation and work per share; endpoint quaternion decompositions, coordinate deltas, lift height, fixed time prefixes and terminal-settle inverse trigonometry run once per prepared swing. Read the departure socket's horizontal components only while the release correction is active.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The reader shares preparation only for the fixed body, side and endpoint inputs it closes over.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Each reader holds one swing's fixed inputs and scalar terms until its owning plan releases it, with no query-dependent growth.
