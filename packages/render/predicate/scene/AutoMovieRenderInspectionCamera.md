# src/scene/AutoMovieRenderInspectionCamera.ts#AutoMovieRenderInspectionCamera.observe

## @evidence contracts/development/common.md#meaningful-documentation

The camera inspection distinguishes original placed projection, known target bounds, sparse witnesses and separately supplied counts.

## @evidence contracts/development/implementation.md#principled-implementation

The projection and its normalized planes must be finite and non-degenerate. A nonfinite or inverted certified box is unavailable, so it cannot produce a framing or sparse-ray grade. Valid boxes are classified against the camera's actual projection.

## @evidence contracts/development/implementation.md#efficient-algorithms

The routine checks the projection and its six planes once, reuses certified bounds when supplied, and visits only the bounded sparse ray path when exact counts were not supplied.

# src/scene/AutoMovieRenderInspectionCamera.ts#AutoMovieRenderInspectionCamera.resolveView

## @evidence contracts/development/common.md#meaningful-documentation

Describes supported cameras, the viewport size, lens and pose choices, and projected data admission.

## @evidence contracts/development/implementation.md#principled-implementation

The view resolver preserves the camera used for the frame. Its finite invertible applied matrices and raster distinguish equal preview summaries with different crop or zoom.

## @evidence contracts/development/implementation.md#efficient-algorithms

The record copies two fixed-size transforms after camera placement. It allocates no renderer or frame buffer and does not inspect scene content merely to report a film camera.

# src/scene/AutoMovieRenderInspectionCamera.ts#AutoMovieRenderInspectionCamera.projectionKey

## @evidence contracts/development/common.md#meaningful-documentation

Names the consumed identity, what equality includes and what returns null.

## @evidence contracts/development/implementation.md#principled-implementation

The key requires positive whole dimensions, a signed layer mask and two dense finite 16-element matrices. It serializes the fields in fixed order so caller property order cannot change equality.

## @evidence contracts/development/implementation.md#efficient-algorithms

Validation and serialization touch a fixed number of camera scalars. They read no files and allocate no renderer.

# src/scene/AutoMovieRenderInspectionCamera.ts#AutoMovieRenderInspectionCamera.measurePlacedPixels

## @evidence contracts/development/common.md#meaningful-documentation

States the original placed sample, native renderer and semantic root required for exact isolated and visible pixel counts. A refusal supplies a concrete cause. The raw measurement assigns no legibility grade.

## @evidence contracts/development/implementation.md#principled-implementation

The camera and raster come from the original settled host sample. The same binary-mask owner counts isolated and visible delivery pixels. A box crossing the eye is clipped to the WebGL near plane, whose surviving corners and edge intersections bound the projected homogeneous ratios. The measured interval admits depth-disjoint blockers. Potentially ambiguous depth order, unsupported coverage, invalid renderer state and missing semantic identity leave no count.

## @evidence contracts/development/implementation.md#efficient-algorithms

Ordinary meshes project their enclosing box directly. Only boxes crossing the eye use the fixed eight corners and twelve edges of the near-plane clip. The audit draws one isolated mask and at most one composite mask over the projected target region. The host owns the renderer and the mask call releases its scratch framebuffer.

# src/scene/AutoMovieRenderInspectionCamera.ts#AutoMovieRenderInspectionCamera.PlacedPixelMeasurement

## @evidence contracts/development/common.md#meaningful-documentation

Names measured native coverage and unsupported admission as separate outcomes.

## @evidence contracts/development/design.md#principled-representation

The measured state exposes exact counts and the number of native mask draws. The unsupported state carries the reason and no substitute pixels.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Capture or delivery owns the settled sample and the renderer. The raw result carries only pixel evidence and the count of mask draws.

# src/scene/AutoMovieRenderInspectionCamera.ts#AutoMovieRenderInspectionCamera.IMeasuredPlacedPixels

## @evidence contracts/development/common.md#meaningful-documentation

Names the count basis and units at the exact sharp placed sample.

## @evidence contracts/development/design.md#principled-representation

Both counts refer to the delivery raster. Isolated pixels are the target's own footprint and visible pixels are its surviving subset.

## @evidence contracts/development/design.md#minimal-and-owned-surface

An isolated mask suffices where no opaque depth-disjoint candidate can cover the target. The optional second mask establishes surviving pixels when a supported blocker can cover it.

# src/scene/AutoMovieRenderInspectionCamera.ts#AutoMovieRenderInspectionCamera.IUnavailablePlacedPixels

## @evidence contracts/development/common.md#meaningful-documentation

States that native coverage is unavailable and records the specific admission reason.

## @evidence contracts/development/design.md#principled-representation

The distinct state avoids treating an unsupported sample as zero pixels, full occlusion, or an estimated numerical ratio.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One cause is enough to reopen the sample or select a supported measurement. The raw result carries no unrelated production policy.

# src/scene/AutoMovieRenderInspectionCamera.ts#AutoMovieRenderInspectionCamera.IMeasuredPlacedPixels.status

## @evidence contracts/development/common.md#meaningful-documentation

Identifies a finished native count.

# src/scene/AutoMovieRenderInspectionCamera.ts#AutoMovieRenderInspectionCamera.IMeasuredPlacedPixels.pixels

## @evidence contracts/development/common.md#meaningful-documentation

Carries isolated and surviving delivery pixels at the exact placed shot sample.

# src/scene/AutoMovieRenderInspectionCamera.ts#AutoMovieRenderInspectionCamera.IMeasuredPlacedPixels.passes

## @evidence contracts/development/common.md#meaningful-documentation

Carries the actual number of binary masks the native audit drew.

# src/scene/AutoMovieRenderInspectionCamera.ts#AutoMovieRenderInspectionCamera.IUnavailablePlacedPixels.status

## @evidence contracts/development/common.md#meaningful-documentation

Discriminates unavailable native counting from an observed zero footprint.

# src/scene/AutoMovieRenderInspectionCamera.ts#AutoMovieRenderInspectionCamera.IUnavailablePlacedPixels.reason

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the admission boundary that blocked exact coverage.
