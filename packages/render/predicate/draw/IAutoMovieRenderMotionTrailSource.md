# src/draw/IAutoMovieRenderMotionTrailSource.ts#IAutoMovieRenderMotionTrailSource

## @evidence contracts/development/common.md#meaningful-documentation

The source contract describes one synchronous read after placement and the allowed missing evidence result.

## @evidence contracts/development/design.md#principled-representation

The callback sees only the selected placed object and its exact clocks. Its returned facts come from the producer's already available authored route, pose axis and support data.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The shared trail path queries the owner only when requested. The provider hands existing facts to Render, which measures the native transforms and camera.

# src/draw/IAutoMovieRenderMotionTrailSource.ts#IAutoMovieRenderMotionTrailSource.read

## @evidence contracts/development/common.md#meaningful-documentation

The method reads the selected settled node and returns source evidence or undefined. Its borrowed object remains owned by the placement.

## @evidence contracts/development/implementation.md#principled-implementation

The Draw sampler supplies the actual selected node after its awaited placement. The source reads its existing route and support binding at that clock and may return undefined for an unaddressed node. The sampler validates supplied records and derives displayed quantities through its native camera, matrix and contact owners.

## @evidence contracts/development/implementation.md#efficient-algorithms

Shared Render work invokes the source once per admitted node and sample. A source can return its prepared immutable route and current bindings by reference. The sampler performs no calls for unselected trails and retains numeric results rather than its borrowed nodes.

# src/draw/IAutoMovieRenderMotionTrailSource.ts#IAutoMovieRenderMotionTrailSource.ISample

## @evidence contracts/development/common.md#meaningful-documentation

This shape identifies the actual played occurrence, its clock and the native node being sampled.

## @evidence contracts/development/design.md#principled-representation

The path names the node actually bound for this time. The film clock and optional local shot time correspond to the same completed placement.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The production can match by native node and find its own route or support without calling another placement.

# src/draw/IAutoMovieRenderMotionTrailSource.ts#IAutoMovieRenderMotionTrailSource.IObservation

## @evidence contracts/development/common.md#meaningful-documentation

This shape documents which route, exact path frame, phase, forward axis and support binding can be supplied.

## @evidence contracts/development/design.md#principled-representation

Route descriptors are immutable across observations of one identity and carry a bounded finite polyline. Every other channel may be absent. A declared support reuses the existing native contact sample contract.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The source supplies only authoritative authoring and bindings. The same sampler extracts world heading, placed support measurements and image projection, so Draw and Viewer consume one numeric result.

# src/draw/IAutoMovieRenderMotionTrailSource.ts#IAutoMovieRenderMotionTrailSource.ISample.time

## @evidence contracts/development/common.md#meaningful-documentation

The clock belongs to the settled frame this source call reads.

# src/draw/IAutoMovieRenderMotionTrailSource.ts#IAutoMovieRenderMotionTrailSource.ISample.entry

## @evidence contracts/development/common.md#meaningful-documentation

The played occurrence is identified separately from a reusable shot ID.

# src/draw/IAutoMovieRenderMotionTrailSource.ts#IAutoMovieRenderMotionTrailSource.ISample.path

## @evidence contracts/development/common.md#meaningful-documentation

The path is the admitted inspection path of the selected object.

# src/draw/IAutoMovieRenderMotionTrailSource.ts#IAutoMovieRenderMotionTrailSource.ISample.object

## @evidence contracts/development/common.md#meaningful-documentation

The callback borrows the actual attached object after remount and ancestor checks.

# src/draw/IAutoMovieRenderMotionTrailSource.ts#IAutoMovieRenderMotionTrailSource.IObservation.route

## @evidence contracts/development/common.md#meaningful-documentation

The descriptor identifies the source path and paces. The renderer keeps one immutable descriptor for each active route segment.

# src/draw/IAutoMovieRenderMotionTrailSource.ts#IAutoMovieRenderMotionTrailSource.IObservation.baseline

## @evidence contracts/development/common.md#meaningful-documentation

The source can return the path frame it owns at the requested instant.

# src/draw/IAutoMovieRenderMotionTrailSource.ts#IAutoMovieRenderMotionTrailSource.IObservation.phase

## @evidence contracts/development/common.md#meaningful-documentation

The source may supply its exact gait phase in the half-open unit interval.

# src/draw/IAutoMovieRenderMotionTrailSource.ts#IAutoMovieRenderMotionTrailSource.IObservation.forwardAxis

## @evidence contracts/development/common.md#meaningful-documentation

A declared local forward determines the measured world direction at the placed transform.

# src/draw/IAutoMovieRenderMotionTrailSource.ts#IAutoMovieRenderMotionTrailSource.IObservation.support

## @evidence contracts/development/common.md#meaningful-documentation

The source supplies its real socket, support object and independent local anchor through the native contact binding.

# src/draw/IAutoMovieRenderMotionTrailSource.ts#IAutoMovieRenderMotionTrailSource.IObservation.compatibleRemount

## @evidence contracts/development/common.md#meaningful-documentation

Use one stable object to authorize a handoff. The sampler requires the same played entry, route descriptor and measured world origin on the same supported anchor before joining it.

# src/draw/IAutoMovieRenderMotionTrailSource.ts#IAutoMovieRenderMotionTrailSource.ICompatibleRemount

## @evidence contracts/development/common.md#meaningful-documentation

The token's object identity declares a compatible remount of a named role. It accompanies the independent native support binding.

## @evidence contracts/development/design.md#principled-representation

The role owner shares the token only across an intentional replacement. The sampler still verifies the two measured placements and the played boundary.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One token adds permission to the already selected sampling callback and reuses the native contact observation to admit the join.

# src/draw/IAutoMovieRenderMotionTrailSource.ts#IAutoMovieRenderMotionTrailSource.ICompatibleRemount.role

## @evidence contracts/development/common.md#meaningful-documentation

Names the role whose source shares the token across its approved native handoff.
