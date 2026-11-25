# src/geometry/construction/AutoMovieSolidBody.ts#AutoMovieSolidBody

## @evidence contracts/development/common.md#meaningful-documentation

States the faces, their cycles, the merge's steps and the published form.

## @evidence contracts/development/design.md#principled-representation

Represents A solid built by merges and diffs, as trimmed faces that share their boundaries: the base, every blend and every part, each a surface with its trim cycles in its own chart (`AutoMovieSolidCycle`), the shared boundary vertices held once in the body's mesh: companion namespace of 12 members (`IFace`, `IBody`, `IFaceInput`, `IMerge`, `IMerged`, `create`, ...); units and frames named in its text: local. It has no optional member, so no absent-value state combines with another.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the module that declares `AutoMovieSolidBody` in packages/engine/src/geometry/construction/AutoMovieSolidBody.ts; its surface is the 12 members listed and the text shows 26 other files naming it, mostly packages/engine (14), test (7), packages/human (5), so no member is declared for a presumed future need.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.

# src/geometry/construction/AutoMovieSolidBody.ts#AutoMovieSolidBody.create

## @evidence contracts/development/implementation.md#principled-implementation

Shallow-copies each input face record, adds its fresh empty cycle array and creates the original empty mesh/blend list.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One factory initializes mutable assembly state without sampling geometry.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Retains input surface/grid references and performs no validation or deep-copy substitute.

## @evidence contracts/development/common.md#meaningful-documentation

Documents the untrimmed starting body and borrowed inputs.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in face descriptors, with fresh face/cycle records and empty mesh arrays.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Does not evaluate or rebuild surfaces; their existing objects remain the source identities.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned body owns its new containers and borrows original surface/grid data; no factory cache is retained.

# src/geometry/construction/AutoMovieSolidBody.ts#AutoMovieSolidBody.atlas

## @evidence contracts/development/implementation.md#principled-implementation

Delegates to the same frozen-cycle host snapshot with live source surfaces and original body-index mapping.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Retains the public atlas API while the assembly owner keeps snapshot logic beside its transaction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves kept/across callbacks, chart-foot ranking and open-neighbour nulls; inclusive-boundary limitations remain.

## @evidence contracts/development/common.md#meaningful-documentation

States captured trim state versus borrowed surface data.

## @evidence contracts/development/implementation.md#efficient-algorithms

Includes O(F+S) snapshot work and later per-face cycle/segment scans in the helper.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One returned atlas shares its original frozen cycles and back-index map across queries.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller retains captured cycles/maps and surfaces until dropping the atlas; the façade adds no cache.

# src/geometry/construction/AutoMovieSolidBody.ts#AutoMovieSolidBody.merge

## @evidence contracts/development/implementation.md#principled-implementation

Calls the unchanged transactional assembly with the same body and input references.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Maintains the public namespace/signature while the merge owner contains the complete operation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not catch, retry, alter diagnostics or expand the checkpoint; returned failure and thrown effects remain distinct.

## @evidence contracts/development/common.md#meaningful-documentation

States in-place assembly and the original returned-failure rollback scope.

## @evidence contracts/development/implementation.md#efficient-algorithms

Includes checkpoint, atlas, join, publication and clipping costs, not just the delegation call.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The helper preserves shared boundary indices and supplied trace reuse at their original owners.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Successful body data and returned join/blend references retain their original populations; no extra façade state survives.

# src/geometry/construction/AutoMovieSolidBody.ts#AutoMovieSolidBody.draw

## @evidence contracts/development/implementation.md#principled-implementation

Draws every face on its original grid and cycles into the existing shared mesh.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One ordered face map preserves explicit chart/winding/end records and adapts a present diagnostic callback to its actual face name.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not install a no-op callback when none was supplied; named refusal then throws. A supplied receiver can leave other faces and seams present, so its result may be partial. Repeated draws still append again.

## @evidence contracts/development/common.md#meaningful-documentation

States mesh mutation, callback/default exception semantics and explicit occurrence ownership.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each face pays for its grid and constrained residual triangulation. The draw computes the starting incidence once and adds each face's emitted edges.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Draws on the existing shared rail vertices and surface owners. The append-only batch shares one incidence for its committed faces.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The body retains appended geometry. The batch incidence and temporary face work expire with the draw, and returned open-cycle arrays belong to the caller.

# src/geometry/construction/AutoMovieSolidBody.ts#AutoMovieSolidBody.publish

## @evidence contracts/development/implementation.md#principled-implementation

Publishes original domain authorities and actual trim cycles into separate fields, assigning one shared point to each first-seen mesh index across both roles.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One map preserves shared boundary identity while projecting owners to chain names and chart coordinates.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not include the full mesh or certify geometry; valid owner coordinates are the current body premise.

## @evidence contracts/development/common.md#meaningful-documentation

States renumbering, original-domain versus cutting roles, actual sampling bounds distinct from source ownership, chain/chart identity and detached boundary charts.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in faces and boundary records, with one expected-constant map lookup per referenced vertex.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same mesh index reuses its earlier published identifier across all faces.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh boundary/face/chart arrays; the local index map and body reference are not retained by that projection.

# src/geometry/construction/AutoMovieSolidBody.ts#AutoMovieSolidBody.kept

## @evidence contracts/development/implementation.md#principled-implementation

Delegates the same ordered conjunction of current cycle predicates using the surface's period.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Keeps the public face reader while atlas/assembly share its actual implementation owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Adds no boundary tolerance or domain policy; current parity does not certify inclusive boundary ownership.

## @evidence contracts/development/common.md#meaningful-documentation

States the live kept-side query and its boolean result.

## @evidence contracts/development/implementation.md#efficient-algorithms

Includes the helper's reached cycle/segment scans.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads current face cycles without introducing a stale query cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a scalar without retaining the face or coordinates.

# src/geometry/construction/AutoMovieSolidBody.ts#AutoMovieSolidBody.prepareFaces

## @evidence contracts/development/common.md#meaningful-documentation

Prepares one append-only mesh batch for an actual body or its published face data.

## @evidence contracts/development/implementation.md#principled-implementation

A structured end reads the authoritative curve's station at each phase and carries its shared indices into the closest completely retained original row. A planar end keeps its existing rule. Ordinary domains and remaining trims use the same constrained face builder.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Engine draw and Human restoration call the same prepared face function. It delegates unstructured populations to the existing constrained grid.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The source must preserve a complete ordered angular partition. A curved cut without a wholly retained row or matching native phases reports its missing premise. A returned planning refusal restores appended mesh attributes together.

## @evidence contracts/development/implementation.md#efficient-algorithms

The structured strip advances by rows and phase sectors. Generic triangulation is confined to remaining trims on the retained source grid.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the face batch's edge incidence and original boundary point indices through publication and ordinary drawing.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The closure retains the supplied mesh and one append-only incidence until the invocation ends.
