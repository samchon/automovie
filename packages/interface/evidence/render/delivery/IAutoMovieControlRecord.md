# src/render/delivery/IAutoMovieControlRecord.ts#IAutoMovieControlRecord

## @evidence contracts/development/design.md#principled-representation

One record per render attempt's control folder: the film's name, revision and backend copied from the attempt, the frame clock as an exact rate ratio with whole frame count and pixel raster, the film's SHA-256, and the channels. Digests are bare 64-digit lowercase hex like the report's `source.sha256` so they compare as strings. That the film digest equals the report's, and that every frame index appears once per pass, are guaranteed by the writer and checked by a reader, not by the type.

## @evidence contracts/development/design.md#minimal-and-owned-surface

`renderAutoMovieVideo` writes it as `controls/record.json`; a production's request record and manifest name the file and its digest. Revision and backend are the report's own values, so a reader matches the two files without a second source.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The record is not a scene export: it holds pixel conventions and file digests, no geometry or camera. No member is optional, so a record always names its film digest.

## @evidence contracts/development/common.md#meaningful-documentation

States who writes it, what a request does with it, when it can be trusted, the digest form and the uniqueness of (pass, index).
# src/render/delivery/IAutoMovieControlRecord.ts#IAutoMovieControlRecord.IClock

## @evidence contracts/development/design.md#principled-representation

An exact `[numerator, denominator]` rate, whole frames and whole pixels, the film's own grid, so channels are never resampled.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Copied from the render result's `frameRate`, frame count and the subject's raster; a request checks a model's rate and size against it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No float fps, which would blur rates such as 30000/1001.

## @evidence contracts/development/common.md#meaningful-documentation

States each member's unit.
# src/render/delivery/IAutoMovieControlRecord.ts#IAutoMovieControlRecord.IChannel

## @evidence contracts/development/design.md#principled-representation

A pass name typed to exclude `beauty`, its convention, its frame pattern relative to the record, the frame count and the sequence digest over the frames' hex digests as lines.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Produced by `AutoMovieControlChannelWriter`; every member is read by a reader that locates and verifies the files.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The pattern is relative so the folder can move with its record.

## @evidence contracts/development/common.md#meaningful-documentation

States the sequence digest's exact byte form.
# src/render/delivery/IAutoMovieControlRecord.ts#IAutoMovieControlRecord.IFrame

## @evidence contracts/development/design.md#principled-representation

A whole index, the drawn second `index / fps` and the file bytes' SHA-256, not the pixel hash the report keeps.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Written per frame by the channel writer and checked against files by a reader.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A pixel hash would not match a manifest digest of the file.

## @evidence contracts/development/common.md#meaningful-documentation

States what each digest covers.
# src/render/delivery/IAutoMovieControlRecord.ts#IAutoMovieControlRecord.Convention

## @evidence contracts/development/design.md#principled-representation

A union tagged by `pass` and `kind`, so each variant states one convention and #3542 adds a variant beside the shipped one without changing it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Each variant is produced by `autoMovieControlConvention` from what the draw page drew.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Optional fields would combine meaningless states such as a positional mask with a digest; the variants separate them.

## @evidence contracts/development/common.md#meaningful-documentation

States the tagging rule and its purpose.
# src/render/delivery/IAutoMovieControlRecord.ts#IAutoMovieControlRecord.IDepthLinear

## @evidence contracts/development/design.md#principled-representation

Grey linear in camera distance over a metric range in metres, the formula `applyRenderMode` applies.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Produced by `autoMovieControlConvention` and read from the record. The range is the one the pass drew with.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No member beyond what the pass's pixels need.

## @evidence contracts/development/common.md#meaningful-documentation

States the pixel meaning and each member's unit.
# src/render/delivery/IAutoMovieControlRecord.ts#IAutoMovieControlRecord.IMaskSemantic

## @evidence contracts/development/design.md#principled-representation

The palette digest and its entries with exact colours, so a colour maps to an entity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Produced by `autoMovieControlConvention` and read from the record. Entries reuse the semantic palette's own entry type.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No member beyond what the pass's pixels need.

## @evidence contracts/development/common.md#meaningful-documentation

States the pixel meaning and each member's unit.
# src/render/delivery/IAutoMovieControlRecord.ts#IAutoMovieControlRecord.IMaskPositional

## @evidence contracts/development/design.md#principled-representation

A tag only: colours by child index carry no identity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Produced by `autoMovieControlConvention` and read from the record. No palette member exists to misread.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No member beyond what the pass's pixels need.

## @evidence contracts/development/common.md#meaningful-documentation

States the pixel meaning and each member's unit.
# src/render/delivery/IAutoMovieControlRecord.ts#IAutoMovieControlRecord.INormalCamera

## @evidence contracts/development/design.md#principled-representation

Camera-space unit normals half-offset into RGB with no colour conversion, as `MeshNormalMaterial` writes them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Produced by `autoMovieControlConvention` and read from the record. A tag only; the axes are documented.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No member beyond what the pass's pixels need.

## @evidence contracts/development/common.md#meaningful-documentation

States the pixel meaning and each member's unit.
# src/render/delivery/IAutoMovieControlRecord.ts#IAutoMovieControlRecord.IOutlineHull

## @evidence contracts/development/design.md#principled-representation

Inverted-hull contours with the model-space extrusion the pass used.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Produced by `autoMovieControlConvention` and read from the record. The width is the pass's own constant.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No member beyond what the pass's pixels need.

## @evidence contracts/development/common.md#meaningful-documentation

States the pixel meaning and each member's unit.
# src/render/delivery/IAutoMovieControlRecord.ts#IAutoMovieControlRecord.IPoseSegments

## @evidence contracts/development/design.md#principled-representation

Bone segments over black, meshes hidden.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Produced by `autoMovieControlConvention` and read from the record. A tag; #3542 adds a keypoint variant.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No member beyond what the pass's pixels need.

## @evidence contracts/development/common.md#meaningful-documentation

States the pixel meaning and each member's unit.
# src/render/delivery/IAutoMovieControlRecord.ts#IAutoMovieControlRecord.IAlbedoBaseColour

## @evidence contracts/development/design.md#principled-representation

Unlit base colour encoded to sRGB once.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Produced by `autoMovieControlConvention` and read from the record. A tag; the pass definition carries the rest.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No member beyond what the pass's pixels need.

## @evidence contracts/development/common.md#meaningful-documentation

States the pixel meaning and each member's unit.

# src/render/delivery/IAutoMovieControlRecord.ts#IAutoMovieControlRecord.IGraphicsPlate

## @evidence contracts/development/design.md#principled-representation

The graphics pass's convention: straight-alpha colour over a transparent background, the one control pass whose alpha is data.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Written by autoMovieControlConvention for the `graphics` pass and read by a finishing step that composites from it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No matte threshold or premultiplied variant: the record names the one encoding the writer produces.

## @evidence contracts/development/common.md#meaningful-documentation

States what the plate holds, what is held out and how its alpha is encoded.
