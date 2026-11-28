# src/render/IAutoMovieInspectionTrail.ts#IAutoMovieInspectionTrail

## @evidence contracts/development/common.md#meaningful-documentation

The declaration names the segment's path, ascending film seconds, world origins in metres and the limit of the stationary classification.

## @evidence contracts/development/design.md#principled-representation

Each time addresses one xyz triple. The Render sampler reads finite world coordinates after placement and keeps each continuous run separate when a path disappears or its identity changes. Stationarity describes the largest sampled displacement from the first origin under a one-micrometre tolerance.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The mark producer draws each segment independently and uses its seconds to find the present point. Consumers can read the numeric world evidence without keeping any Three.js object or rerunning scene placement.

# src/render/IAutoMovieInspectionTrail.ts#IAutoMovieInspectionTrail.path

## @evidence contracts/development/common.md#meaningful-documentation

The field identifies the sampled inspection path. Several returned segments can have this same identity.

# src/render/IAutoMovieInspectionTrail.ts#IAutoMovieInspectionTrail.times

## @evidence contracts/development/common.md#meaningful-documentation

The field states which sampled film seconds correspond to the positions and promises ascending order.

# src/render/IAutoMovieInspectionTrail.ts#IAutoMovieInspectionTrail.positions

## @evidence contracts/development/common.md#meaningful-documentation

The field defines the flat xyz representation of one measured world origin per second and names metres as its unit.

# src/render/IAutoMovieInspectionTrail.ts#IAutoMovieInspectionTrail.stationary

## @evidence contracts/development/common.md#meaningful-documentation

The field states the one-micrometre bound from the first sampled origin. Rotation and movement outside the recorded seconds are outside the result's scope.

# src/render/IAutoMovieInspectionTrail.ts#IAutoMovieInspectionTrail.motion

## @evidence contracts/development/common.md#meaningful-documentation

The optional evidence belongs to the same settled sample clock as the existing segment. Callers without a registered provider retain the original shape.

# src/render/IAutoMovieInspectionTrail.ts#IAutoMovieInspectionTrail.IMotion

## @evidence contracts/development/common.md#meaningful-documentation

The record names the authored route and the sample evidence in the order of the placed origins.

## @evidence contracts/development/design.md#principled-representation

A continuous observed segment keeps a route descriptor only when its source supplies a valid stable route. Its sample evidence has the same order and count as the segment's times.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This is a transportable value containing source descriptors and derived measurements. It contains no native scene objects.

# src/render/IAutoMovieInspectionTrail.ts#IAutoMovieInspectionTrail.IAuthoredRoute

## @evidence contracts/development/common.md#meaningful-documentation

The descriptor identifies the authored world-space points and both paces in metres per second.

## @evidence contracts/development/design.md#principled-representation

The producer supplies one immutable polyline and positive source paces. Render admits finite points and two to 1,201 vertices before holding the descriptor.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A sampler can draw the requested line and explain cycle snapping while reading world origins separately from settled placements.

# src/render/IAutoMovieInspectionTrail.ts#IAutoMovieInspectionTrail.ISample

## @evidence contracts/development/common.md#meaningful-documentation

The sample documents actual playback clock and separate baseline, phase, forward, camera and support channels.

## @evidence contracts/development/design.md#principled-representation

Every place in the segment has one observation at the film clock with the played entry when present. Optional producer-owned channels can remain absent. Image and support observations use explicit outcomes where the owner or projection permits them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The consumer reads the result without another scene placement. It can report a source pace or baseline without interpreting that as the measured object's world travel.

# src/render/IAutoMovieInspectionTrail.ts#IAutoMovieInspectionTrail.IProjectedPoint

## @evidence contracts/development/common.md#meaningful-documentation

The record distinguishes image and depth clipping and identifies the coordinate space.

## @evidence contracts/development/design.md#principled-representation

Finite homogeneous division yields normalized device coordinates in this sample's delivery camera. Status first classifies out-of-range depth, then image sides.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A reader gets the selected origin's exact coordinate and frame classification without reading scene or camera objects.

# src/render/IAutoMovieInspectionTrail.ts#IAutoMovieInspectionTrail.IUnprojectedPoint

## @evidence contracts/development/common.md#meaningful-documentation

The type identifies two ways a valid world point may lack usable image coordinates.

## @evidence contracts/development/design.md#principled-representation

The camera-relative clip w distinguishes behind-camera points. Singular or nonfinite projection instead gives unprojectable evidence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The variant carries only a reason that the projection can support.

# src/render/IAutoMovieInspectionTrail.ts#IAutoMovieInspectionTrail.Projection

## @evidence contracts/development/common.md#meaningful-documentation

This union keeps finite image measures and unavailable projection outcomes distinct.

## @evidence contracts/development/design.md#principled-representation

The projected branch carries a finite vector with a clip status. The remaining branches carry only the specific unavailable status.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The same values serve fixed or moving delivery cameras without claiming visibility behind actual geometry.

# src/render/IAutoMovieInspectionTrail.ts#IAutoMovieInspectionTrail.IObservedSupport

## @evidence contracts/development/common.md#meaningful-documentation

The result names the actual support and the placed socket's local coordinates, signed gap and slip in metres.

## @evidence contracts/development/design.md#principled-representation

The renderer checks an admitted displayed support transform and reads the placed socket. The Engine evaluates its signed normal difference and tangential magnitude against the declared local anchor.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The contact record excludes scene references and stays readable alongside world positions and source phase. It measures the selected socket without solving or judging a new pose.

# src/render/IAutoMovieInspectionTrail.ts#IAutoMovieInspectionTrail.IUnavailableSupport

## @evidence contracts/development/common.md#meaningful-documentation

A named support binding can remain unavailable for a sample.

## @evidence contracts/development/design.md#principled-representation

The renderer reports this branch when the declared socket or support is unreachable or lacks an admitted placed transform or point.

## @evidence contracts/development/design.md#minimal-and-owned-surface

No position, contact force or slip is present for a failed support measurement.

# src/render/IAutoMovieInspectionTrail.ts#IAutoMovieInspectionTrail.Support

## @evidence contracts/development/common.md#meaningful-documentation

This union separates observed support geometry from an unavailable chosen binding.

## @evidence contracts/development/design.md#principled-representation

Observed support owns a native path and numeric local distances. An unavailable binding carries only its state. A source can omit the support channel when it has no declared binding.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Support data remains independent of the original trail's world-stationary classification.

# src/render/IAutoMovieInspectionTrail.ts#IAutoMovieInspectionTrail.IMotion.route

## @evidence contracts/development/common.md#meaningful-documentation

The optional immutable authored polyline carries the producer's path identity and paces, separately from the measured origin positions.

# src/render/IAutoMovieInspectionTrail.ts#IAutoMovieInspectionTrail.IMotion.samples

## @evidence contracts/development/common.md#meaningful-documentation

Entries correspond one-for-one to sampled times and world xyz triples, in the same order.

# src/render/IAutoMovieInspectionTrail.ts#IAutoMovieInspectionTrail.IAuthoredRoute.id

## @evidence contracts/development/common.md#meaningful-documentation

The owner gives the route a stable identifier within the played occurrence. Changing this identity splits the sampled trace.

# src/render/IAutoMovieInspectionTrail.ts#IAutoMovieInspectionTrail.IAuthoredRoute.points

## @evidence contracts/development/common.md#meaningful-documentation

The points are finite world metres in authored order. The sampler accepts from two through 1,201 points.

# src/render/IAutoMovieInspectionTrail.ts#IAutoMovieInspectionTrail.IAuthoredRoute.requestedSpeed

## @evidence contracts/development/common.md#meaningful-documentation

The positive metres-per-second value comes from the source request before resolved timing constraints.

# src/render/IAutoMovieInspectionTrail.ts#IAutoMovieInspectionTrail.IAuthoredRoute.effectiveSpeed

## @evidence contracts/development/common.md#meaningful-documentation

The positive metres-per-second value is the source-resolved route pace, rather than an estimate from successive observed origins.

# src/render/IAutoMovieInspectionTrail.ts#IAutoMovieInspectionTrail.ISample.time

## @evidence contracts/development/common.md#meaningful-documentation

This records the placed film clock and the played shot's local second when present.

# src/render/IAutoMovieInspectionTrail.ts#IAutoMovieInspectionTrail.ISample.entry

## @evidence contracts/development/common.md#meaningful-documentation

The entry identifies the selected playback occurrence, with null for a film-clock-only subject.

# src/render/IAutoMovieInspectionTrail.ts#IAutoMovieInspectionTrail.ISample.baseline

## @evidence contracts/development/common.md#meaningful-documentation

The optional authored path-frame record carries an exact producer sample in world metres and its own baseline heading.

# src/render/IAutoMovieInspectionTrail.ts#IAutoMovieInspectionTrail.ISample.phase

## @evidence contracts/development/common.md#meaningful-documentation

The optional source-owned gait phase is in cycles from zero inclusive to one exclusive.

# src/render/IAutoMovieInspectionTrail.ts#IAutoMovieInspectionTrail.ISample.forward

## @evidence contracts/development/common.md#meaningful-documentation

This unit vector is the declared local forward axis mapped through the selected object's placed matrix.

# src/render/IAutoMovieInspectionTrail.ts#IAutoMovieInspectionTrail.ISample.projection

## @evidence contracts/development/common.md#meaningful-documentation

These coordinates or their unavailable status refer to the delivery camera placed at this sample.

# src/render/IAutoMovieInspectionTrail.ts#IAutoMovieInspectionTrail.ISample.support

## @evidence contracts/development/common.md#meaningful-documentation

The optional channel observes only a producer-declared native support socket, frame and anchor.

# src/render/IAutoMovieInspectionTrail.ts#IAutoMovieInspectionTrail.IProjectedPoint.status

## @evidence contracts/development/common.md#meaningful-documentation

The placement distinguishes within the image, outside the image and clipped depth.

# src/render/IAutoMovieInspectionTrail.ts#IAutoMovieInspectionTrail.IProjectedPoint.ndc

## @evidence contracts/development/common.md#meaningful-documentation

The finite vector is in normalized device coordinates of the sampled delivery camera.

# src/render/IAutoMovieInspectionTrail.ts#IAutoMovieInspectionTrail.IUnprojectedPoint.status

## @evidence contracts/development/common.md#meaningful-documentation

The state distinguishes a point behind the camera from an unusable finite projection.

# src/render/IAutoMovieInspectionTrail.ts#IAutoMovieInspectionTrail.IObservedSupport.status

## @evidence contracts/development/common.md#meaningful-documentation

The observed literal identifies the branch with a validated socket and support frame.

# src/render/IAutoMovieInspectionTrail.ts#IAutoMovieInspectionTrail.IObservedSupport.path

## @evidence contracts/development/common.md#meaningful-documentation

The canonical path names the actual support node beneath the sampled scene.

# src/render/IAutoMovieInspectionTrail.ts#IAutoMovieInspectionTrail.IObservedSupport.local

## @evidence contracts/development/common.md#meaningful-documentation

The socket position is reported in the support's rigid local metres.

# src/render/IAutoMovieInspectionTrail.ts#IAutoMovieInspectionTrail.IObservedSupport.gap

## @evidence contracts/development/common.md#meaningful-documentation

The signed normal distance is the extracted local Y difference from the source anchor, in metres.

# src/render/IAutoMovieInspectionTrail.ts#IAutoMovieInspectionTrail.IObservedSupport.slip

## @evidence contracts/development/common.md#meaningful-documentation

The tangential distance is the magnitude of the local XZ anchor offset, in metres.

# src/render/IAutoMovieInspectionTrail.ts#IAutoMovieInspectionTrail.IUnavailableSupport.status

## @evidence contracts/development/common.md#meaningful-documentation

The state preserves the absence of a usable reading for the selected support binding.
