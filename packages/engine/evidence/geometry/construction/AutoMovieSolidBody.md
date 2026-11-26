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

Includes each face's grid, constrained residual triangulation, incidence and callback costs.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads existing shared rail vertices and surface owners instead of independently welding boundaries.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The body retains appended geometry; temporary face work expires and returned open-cycle arrays belong to the caller.

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
