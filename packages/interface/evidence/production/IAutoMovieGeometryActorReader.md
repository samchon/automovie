# src/production/IAutoMovieGeometryActorReader.ts#IAutoMovieGeometryActorReader

## @evidence contracts/development/common.md#meaningful-documentation

Documents lookup failures, shot/performance timebases, world-space answers, borrowing and reader lifetime; each operation states its sampling and ownership differences.

## @evidence contracts/development/design.md#principled-representation

Selectors use the canonical selector union, and spatial results preserve node TRS and rigid pose-root stages separately. The engine validates actor times and lookup references; direct spatial callers supply a resolved actor and matching rig.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Distance, reach, pose, camera, effect and formation measurements share actor lookup and spatial sampling through these five operations.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Ambiguous multi-shot actors refuse instead of selecting by file order; separate transform stages avoid collapsing nonuniform node scale and pose-root rotation into an inaccurate TRS.

# src/production/IAutoMovieGeometryActorReader.ts#IAutoMovieGeometryActorReader.ICompiledActor

## @evidence contracts/development/common.md#meaningful-documentation

States source ownership and the node-to-model relationship without promising deep copies.

## @evidence contracts/development/design.md#principled-representation

The node belongs to compiled.scene and its model ID resolves within compiled.models; find rejects missing models and ambiguous shots before constructing this result.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Reach and formation sampling use the compiled shot, scene placement and rig-bearing model together; these are indexed from existing canonical shot contracts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No synthetic model or fallback shot is introduced; consumers must not mutate borrowed source records through this wrapper.

# src/production/IAutoMovieGeometryActorReader.ts#IAutoMovieGeometryActorReader.ISpatialSample

## @evidence contracts/development/common.md#meaningful-documentation

Gives the affine application order, units, null meaning and nested borrowing of a spatial sample.

## @evidence contracts/development/design.md#principled-representation

Separate pose, rigid root and node TRS retain the composition required under nonuniform scale; position stores only the resulting world root point in metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Bone selectors and reach/formation measurements need all four views; the sample reuses canonical pose, transform and vector contracts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A null pose root is explicit absence, not a fabricated transform, and root scale is not silently promoted into FK deformation.
