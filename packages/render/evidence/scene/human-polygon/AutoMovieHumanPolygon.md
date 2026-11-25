# src/scene/human-polygon/AutoMovieHumanPolygon.ts#AutoMovieHumanPolygon.IPresentation

## @evidence contracts/development/common.md#meaningful-documentation

Names the subject filter, source clock and body-to-world frame convention.

## @evidence contracts/development/design.md#principled-representation

Shares canonical authored cues, placements and rigid transforms at the drawing boundary.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Render receives the existing source pose and optional staging reader without owning either timeline.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Actor staging remains caller-owned and the pose contains the original evaluated bones.

# src/scene/human-polygon/AutoMovieHumanPolygon.ts#AutoMovieHumanPolygon.IPresentation.poseAt

## @evidence contracts/development/common.md#meaningful-documentation

Reads evaluated bone placements for an arbitrary source second. Source errors propagate to the builder or drawing.

## @evidence contracts/development/implementation.md#principled-implementation

Preparation samples detach boundaries once and the prepared sampler reads the requested pose per seek. The drawing admits resulting placements before writing groups.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The callback owns source pose evaluation and the presentation adapter owns cue deltas.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads the complete source pose even when a cue replaces some of it. A release admits replaced live placements before writing its own values.

## @evidence contracts/development/implementation.md#efficient-algorithms

One source pose read per seek plus one per detach cue at preparation. The host determines the cost of each read.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Captured release placements serve later seeks. Arbitrary live poses are read at the requested time.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The sampler borrows the reader for the drawing lifetime and keeps only selected release frames. Disposal drops its sampler reference.

# src/scene/human-polygon/AutoMovieHumanPolygon.ts#AutoMovieHumanPolygon.IPresentation.actorFrameAt

## @evidence contracts/development/common.md#meaningful-documentation

Returns metre translation and an x-y-z-w unit rotation synchronously. Invalid frames and reader errors propagate.

## @evidence contracts/development/implementation.md#principled-implementation

Preparation moves detached source joints into the release world frame. Active samples cancel the current actor frame so the parent transform applies once.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The host owns the source and parent placement. The presentation adapter admits and converts the returned rigid transform.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Finite translation and squared quaternion norm within 1e-6 are checked before use. Identity is the specified behavior for an omitted reader.

## @evidence contracts/development/implementation.md#efficient-algorithms

Calls once per detach cue at preparation and at most once per seek. The host determines the cost of each read.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The first active detach cue per seek reads the live frame and its inverse for reuse by all active detach cues.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The drawing drops its borrowed reader with the sampler at disposal. Converted live frames are local to each seek.

# src/scene/human-polygon/AutoMovieHumanPolygon.ts#AutoMovieHumanPolygon.IDrawing

## @evidence contracts/development/design.md#principled-representation

Registries expose actual mesh and flat bone groups; local vertices and probe points equal registered rest points minus that bone's rest joint, then the group's evaluated placement and actor parent transform apply once.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Retains the original surface/sections/head/palette/disposal ports and adds explicit registry and pose ports without a second rig or motion controller.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Meshes are rigid modules that can overlap/separate at joints; the registries do not claim continuous skin or collision certification.

## @evidence contracts/development/common.md#meaningful-documentation

Gives local-point frame, actor-root ownership, pose admission and resource lifetime including separately owned attached faces.

# src/scene/human-polygon/AutoMovieHumanPolygon.ts#AutoMovieHumanPolygon.IDrawing.setPose

## @evidence contracts/development/implementation.md#principled-implementation

The builder checks retirement, then applyHumanPolygonPose validates finite tuples, unique and required bone identities and unit-quaternion tolerance before writing flat body-frame placements and refreshing ancestor/subtree matrices.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This port delegates numerical admission and group writes to the shared pose adapter; actor placement, body evaluation and rendering remain host-owned.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Existing actual groups and source geometry are used without quaternion normalization, hidden scaling, collider replacement or invented bone transforms.

## @evidence contracts/development/common.md#meaningful-documentation

The input carries metre joint positions and bind-relative x-y-z-w rotations; invalid poses or retired drawings throw, and the original support reference is retained.

## @evidence contracts/development/implementation.md#efficient-algorithms

The adapter costs O(B+G+A+O) for supplied/required bones, bound groups, ancestors and subtree nodes, with one O(B) placement map and no geometry rebuild.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses stable groups, geometry and matrices; mutable input placements are admitted on every call rather than cached by identity.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Temporary placement references expire after the call; drawing resources retain their existing owner and no clock or task is acquired.

# src/scene/human-polygon/AutoMovieHumanPolygon.ts#AutoMovieHumanPolygon.IDrawing.drawAt

## @evidence contracts/development/common.md#meaningful-documentation

Specifies availability, units and source clock.

## @evidence contracts/development/implementation.md#principled-implementation

Samples visual poses from the requested time and applies them through setPose.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The prepared sampler owns cue arithmetic and setPose owns graphics updates.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The source pose and graphics inventory are reused for each seek.

## @evidence contracts/development/implementation.md#efficient-algorithms

Sampling and applying a complete pose are both linear in the skeletal drawing size.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Release frames are captured once and reused by any ordering of seeks.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The drawing releases its sampler at disposal and refuses drawing after retirement.

# src/scene/human-polygon/AutoMovieHumanPolygon.ts#AutoMovieHumanPolygon.IDrawing.setPartColors

## @evidence contracts/development/implementation.md#principled-implementation

The builder refuses retired drawings; the palette validates integer RGB values, builds complete new assignments, publishes them, then attempts retirement of the previous material pool.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Palette replacement owns material selection independently of fixed anatomy, geometry and pose; drawing disposal remains the outer lifetime boundary.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

All supplied values, including unmatched keys, require integers in [0,0xffffff]; no clamping or anatomy inference substitutes for admission, and replacement failures remain sticky.

## @evidence contracts/development/common.md#meaningful-documentation

Optional bone-name RGB overrides affect emitted parts only; omitted entries use clay, and thrown retirement or replacement errors propagate to the host.

## @evidence contracts/development/implementation.md#efficient-algorithms

One replacement scans P parts and C previous colours in O(P+C) work and allocates at most one new material per distinct matched RGB value.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Equal current RGB values share a cloned material; unoverridden parts reuse clay and existing geometry remains unchanged.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The drawing owns current and bounded uncertain palette pools until its guarded retirement; caller-owned faces and equipment are outside that pool.

# src/scene/human-polygon/AutoMovieHumanPolygon.ts#AutoMovieHumanPolygon.IDrawing.dispose

## @evidence contracts/development/implementation.md#principled-implementation

The builder marks retirement before its existing fan-out attempts geometry, base and line materials, palette, scene detachment and registry cleanup; any failure is retained and rethrown on later calls.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One drawing disposer owns the complete resource fan-out and delegates ordered error reporting to the existing retirement collector.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Retired drawings refuse pose/palette updates; successful repeated disposal is a no-op, and failed resource operations are not retried or replaced by a success claim.

## @evidence contracts/development/common.md#meaningful-documentation

Disposal retires this builder's geometry/materials and graph ownership, while independently created attached faces and equipment require their own owner cleanup.

## @evidence contracts/development/implementation.md#efficient-algorithms

Retirement is linear in owned geometries, materials and registry entries; later successful calls are constant-time no-ops and failed calls rethrow the retained cause.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the existing ownership inventories and current palette pool; it does not reconstruct geometry or rerun attempted cleanup.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Successful retirement clears geometry and palette references; failure retains bounded uncertain owners and its original reported cause without opening a background cleanup task.
