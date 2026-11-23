# src/scene/AutoMoviePlayer.ts#AutoMoviePlayer

## @evidence contracts/development/design.md#principled-representation

Engine sampling supplies pose and expression at elapsed seconds, `resolveLookAt` moves a bone gaze onto the eye joints before clamping, engine clamping and dampedSpring handle optional secondary motion, and applyPose converts semantic joints to bone transforms; spring state is sequence-dependent and non-increasing timestamps hold it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The player coordinates one clip and built model while the host owns the animation loop; numerical interpolation and kinematics remain in engine and renderer mutation stays in viewer adapters.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The maximum spring step bounds integration after stalls and ROM is reapplied after intentional spring overshoot; these rules apply to every configured joint rather than to named models or fixtures.

## @evidence contracts/development/common.md#meaningful-documentation

States host rendering ownership, elapsed-second sampling, stateful spring timing, expression synchronization, bone gaze, optional clinical rest frames and post-spring ROM clamping.

# src/scene/AutoMoviePlayer.ts#AutoMoviePlayer.prototype.setMotion

## @evidence contracts/development/implementation.md#principled-implementation

Replaces the current motion reference without rewriting its samples; the next update uses the new clip while existing spring velocities remain available for continuous secondary motion.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Clip selection is a single responsibility separate from time advancement and pose application.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every motion follows the same replacement rule without resetting springs for particular clip identities.

## @evidence contracts/development/common.md#meaningful-documentation

States that selecting a new motion preserves active spring follow-through.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One reference assignment performs no sampling or processing-strategy selection.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Replacing a motion is an effect rather than a cached calculation; spring-state reuse belongs to update.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Releases the player's previous clip reference and retains exactly one replacement clip; latest sampled output is refreshed on the next update.

# src/scene/AutoMoviePlayer.ts#AutoMoviePlayer.prototype.update

## @evidence contracts/development/implementation.md#principled-implementation

Samples engine motion, optionally clamps before and after three-axis damped follow-through, applies kinematics and expression, then publishes the same applied frame to the target callback; missing configured axes decay toward neutral.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Sampling, spring coordination, viewer application and frame notification form one ordered update; applySpring keeps its three-axis settlement rule local to this player's retained state.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Equal or backward times preserve live spring values rather than reseeding them; post-spring clamping preserves the promised ROM while leaving solver velocity free to converge.

## @evidence contracts/development/common.md#meaningful-documentation

States elapsed-second input, expression application and equal/backward timestamp behavior with the maximum spring integration interval.

## @evidence contracts/development/implementation.md#efficient-algorithms

Visits sampled joints and configured spring joints once with Set membership, then delegates skeleton resolution and expression application; temporary pose arrays scale with authored joints.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Bone-keyed axis states retain previous values and velocities; sampled pose and expression are refreshed each update because clip-time output and callback effects are not interchangeable requests.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Replaces lastSample and timestamps and retains one spring state per configured bone encountered; no frame loop is scheduled and target GPU resources remain host-owned.
