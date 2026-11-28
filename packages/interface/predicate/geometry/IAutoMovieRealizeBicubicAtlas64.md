# src/geometry/IAutoMovieRealizeBicubicAtlas64.ts#IAutoMovieRealizeBicubicAtlas64.IOptions

## @evidence contracts/development/common.md#meaningful-documentation

The options document independent switches and their false defaults. The realizer initializes the triangle-parameter and coefficient arrays according to the corresponding request.

## @evidence contracts/development/design.md#principled-representation

The realizer requires boolean values for supplied flags before work. Each flag controls one independently observed result field. Returned coefficient grids belong to patches with retained triangles.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The recipe already supplies tolerances and resource budgets. These option fields own only optional retained observations. Construction requests the exact post-binding field, while triangle consumers can request per-corner coordinates separately.

# src/geometry/IAutoMovieRealizeBicubicAtlas64.ts#IAutoMovieRealizeBicubicAtlas64.IResult

## @evidence contracts/development/common.md#meaningful-documentation

The result explains model metre coordinates, partial budget stops and retained triangle order. Its properties distinguish optional patch data, domain completion, approximation estimates and numerical messages.

## @evidence contracts/development/design.md#principled-representation

The realizer returns an indexed mesh with completion and approximation as separate flags. It checks append order and indices as it accepts chunks. It keeps previous chunks at a resource stop, and vertex compaction preserves the ordinal and chart records of each triangle.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result gives downstream consumers the retained mesh, ordered diagnostics and canonical counts and ranges. Optional coordinates and bound coefficients use their respective chart and generator representations. Requested arrays survive in the result after the streaming iterator is released.

# src/geometry/IAutoMovieRealizeBicubicAtlas64.ts#IAutoMovieRealizeBicubicAtlas64.IResultCounts

## @evidence contracts/development/common.md#meaningful-documentation

The four fields distinguish coarse cells, omitted triangles, unresolved vertex normals and the maximum millimetre error estimate. They describe retained chunks, including vertices emitted before compaction.

## @evidence contracts/development/design.md#principled-representation

The realizer sums each occurrence count across accepted chunks and takes the maximum cell estimate. It reports zero counts if no patch reaches realization. The maximum estimate describes the generated field-to-triangle approximation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical count record projects the shared fields to preserve the Engine record's existing dictionary assignment. Both consumers retain the same three populations and maximum estimate.

# src/geometry/IAutoMovieRealizeBicubicAtlas64.ts#IAutoMovieRealizeBicubicAtlas64.IPrimitiveRange

## @evidence contracts/development/common.md#meaningful-documentation

The record documents a zero-based global triangle ordinal, its consecutive count, the generating patch, four normalized cell bounds and its millimetre approximation estimate.

## @evidence contracts/development/design.md#principled-representation

The realizer converts a chunk-local triangle start to the returned mesh's ordinal before storing the range. It copies the generating patch and cell limits from the chunk. It compacts render vertices while preserving triangle order. The error estimate can exceed tolerance under coarse retention.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One range binds triangle ordinals to the patch and parameter cell used by Engine and Recovery consumers. The field projection retains the earlier inline result's dictionary assignment. Per-corner coordinates remain a separately requested observation.

# src/geometry/IAutoMovieRealizeBicubicAtlas64.ts#IAutoMovieRealizeBicubicAtlas64.IResultCountFields

## @evidence contracts/development/common.md#meaningful-documentation

The four properties distinguish coarse cells, triangle omissions, unresolved vertex normals, and the maximum cell estimate in millimetres.

## @evidence contracts/development/design.md#principled-representation

The owner sums the three occurrence counts over retained chunks and records the maximum error estimate across represented cells.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The fields have one owner. Engine retains its record alias and Recovery inherits the same fields through its original interface.

# src/geometry/IAutoMovieRealizeBicubicAtlas64.ts#IAutoMovieRealizeBicubicAtlas64.IPrimitiveRangeFields

## @evidence contracts/development/common.md#meaningful-documentation

The properties document the generating patch, triangle span, normalized chart bounds and millimetre approximation estimate.

## @evidence contracts/development/design.md#principled-representation

The realizer adjusts the chunk-local first ordinal for previously accepted triangles. The retained span and cell bounds remain aligned through mesh compaction.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This interface owns the common cell and span fields used by the Engine result alias and Recovery interface.

# src/geometry/IAutoMovieRealizeBicubicAtlas64.ts#IAutoMovieRealizeBicubicAtlas64.IOptions.retainTriangleParameters

## @evidence contracts/development/common.md#meaningful-documentation

Documents the opt-in corner data. The default leaves its array absent. The requested array is aligned to the retained index stream.

# src/geometry/IAutoMovieRealizeBicubicAtlas64.ts#IAutoMovieRealizeBicubicAtlas64.IOptions.retainPatchCoefficients

## @evidence contracts/development/common.md#meaningful-documentation

Documents the opt-in field snapshots. The realizer retains post-binding grids only for patches with retained triangles.

# src/geometry/IAutoMovieRealizeBicubicAtlas64.ts#IAutoMovieRealizeBicubicAtlas64.IResult.mesh

## @evidence contracts/development/common.md#meaningful-documentation

States the caller owns the indexed model-metre mesh and that triangle order survives render-vertex compaction.

# src/geometry/IAutoMovieRealizeBicubicAtlas64.ts#IAutoMovieRealizeBicubicAtlas64.IResult.triangleParameters

## @evidence contracts/development/common.md#meaningful-documentation

Defines six chart coordinates in corner order per retained triangle. The realizer appends the coordinates only when requested and matches each range to its generating patch.

# src/geometry/IAutoMovieRealizeBicubicAtlas64.ts#IAutoMovieRealizeBicubicAtlas64.IResult.patchCoefficients

## @evidence contracts/development/common.md#meaningful-documentation

Defines the optional prepared grids in millimetres and restricts them to patches with retained faces.

# src/geometry/IAutoMovieRealizeBicubicAtlas64.ts#IAutoMovieRealizeBicubicAtlas64.IResult.complete

## @evidence contracts/development/common.md#meaningful-documentation

Describes retained coverage of the patch domain. The realizer marks it false for omitted patches or a budget stop.

# src/geometry/IAutoMovieRealizeBicubicAtlas64.ts#IAutoMovieRealizeBicubicAtlas64.IResult.approximationQualified

## @evidence contracts/development/common.md#meaningful-documentation

Describes terminal generator qualification, which requires its requested approximation estimate and a complete result.

# src/geometry/IAutoMovieRealizeBicubicAtlas64.ts#IAutoMovieRealizeBicubicAtlas64.IResult.diagnostics

## @evidence contracts/development/common.md#meaningful-documentation

Describes the ordered messages from admission and accepted chunks through the stopping or terminal condition.

# src/geometry/IAutoMovieRealizeBicubicAtlas64.ts#IAutoMovieRealizeBicubicAtlas64.IResult.counts

## @evidence contracts/development/common.md#meaningful-documentation

Explains that numerical counts come from retained chunks before final vertex compaction.

# src/geometry/IAutoMovieRealizeBicubicAtlas64.ts#IAutoMovieRealizeBicubicAtlas64.IResult.primitiveRanges

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the patch and parameter bounds for consecutive retained triangles and their stable output ordinals.

# src/geometry/IAutoMovieRealizeBicubicAtlas64.ts#IAutoMovieRealizeBicubicAtlas64.IResultCountFields.retainedCoarseCells

## @evidence contracts/development/common.md#meaningful-documentation

Describes the selected policy's retained over-tolerance cells. The realizer sums that count over retained chunks.

# src/geometry/IAutoMovieRealizeBicubicAtlas64.ts#IAutoMovieRealizeBicubicAtlas64.IResultCountFields.omittedZeroAreaTriangles

## @evidence contracts/development/common.md#meaningful-documentation

Identifies proposed faces omitted for zero or nonfinite geometric area, in retained chunks.

# src/geometry/IAutoMovieRealizeBicubicAtlas64.ts#IAutoMovieRealizeBicubicAtlas64.IResultCountFields.unresolvedVertexNormals

## @evidence contracts/development/common.md#meaningful-documentation

Counts unresolved analytic normals on emitted vertices, including vertices later compacted.

# src/geometry/IAutoMovieRealizeBicubicAtlas64.ts#IAutoMovieRealizeBicubicAtlas64.IResultCountFields.maxErrorBoundMm

## @evidence contracts/development/common.md#meaningful-documentation

Records the largest represented cell estimate in millimetres. The realizer takes a maximum across accepted chunk estimates.

# src/geometry/IAutoMovieRealizeBicubicAtlas64.ts#IAutoMovieRealizeBicubicAtlas64.IPrimitiveRangeFields.patch

## @evidence contracts/development/common.md#meaningful-documentation

Names the generating patch in the atlas. The realizer copies the source chunk's patch identity.

# src/geometry/IAutoMovieRealizeBicubicAtlas64.ts#IAutoMovieRealizeBicubicAtlas64.IPrimitiveRangeFields.firstTriangle

## @evidence contracts/development/common.md#meaningful-documentation

Documents a zero-based output ordinal. The realizer adds the preceding output triangle count to the chunk-local start.

# src/geometry/IAutoMovieRealizeBicubicAtlas64.ts#IAutoMovieRealizeBicubicAtlas64.IPrimitiveRangeFields.triangleCount

## @evidence contracts/development/common.md#meaningful-documentation

Documents the number of consecutive triangles from the generating cell. The realizer copies this length from each chunk range.

# src/geometry/IAutoMovieRealizeBicubicAtlas64.ts#IAutoMovieRealizeBicubicAtlas64.IPrimitiveRangeFields.u0

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the lower normalized U bound of the generating cell, in its original patch chart.

# src/geometry/IAutoMovieRealizeBicubicAtlas64.ts#IAutoMovieRealizeBicubicAtlas64.IPrimitiveRangeFields.u1

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the upper normalized U bound of the generating cell, in its original patch chart.

# src/geometry/IAutoMovieRealizeBicubicAtlas64.ts#IAutoMovieRealizeBicubicAtlas64.IPrimitiveRangeFields.v0

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the lower normalized V bound of the generating cell, in its original patch chart.

# src/geometry/IAutoMovieRealizeBicubicAtlas64.ts#IAutoMovieRealizeBicubicAtlas64.IPrimitiveRangeFields.v1

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the upper normalized V bound of the generating cell, in its original patch chart.

# src/geometry/IAutoMovieRealizeBicubicAtlas64.ts#IAutoMovieRealizeBicubicAtlas64.IPrimitiveRangeFields.approximationBoundMm

## @evidence contracts/development/common.md#meaningful-documentation

Documents the actual retained cell estimate in millimetres and the coarse-policy condition under which it can exceed tolerance.
