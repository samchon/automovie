# src/validation/IAutoMovieSceneCollision.ts#IAutoMovieSceneCollision.IGroup

## @evidence contracts/development/common.md#meaningful-documentation

Names the stable group identity and the reasons that exempt internal pairs.

## @evidence contracts/development/design.md#principled-representation

A group is a stable identity qualified by its declared assembly, formation or deformable-body owner.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Scene evaluation supplies membership, and the scene query consumes it before checking external pairs.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Path prefixes and coincident poses imply no group membership or exemption.

# src/validation/IAutoMovieSceneCollision.ts#IAutoMovieSceneCollision.IPart

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the source path, explicit grouping, optional region and world geometry authority.

## @evidence contracts/development/design.md#principled-representation

A leaf carries a supported closed solid, an enclosing solid, a conservative envelope or explicit unavailable geometry.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Scene evaluation supplies current world placement. The query consumes it without owning animation or meshes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Only exact displayed ownership can certify a displayed collision. An enclosing solid can prove clearance but never penetration. Unavailable bounds remain outside the search.

# src/validation/IAutoMovieSceneCollision.ts#IAutoMovieSceneCollision.IAllowance

## @evidence contracts/development/common.md#meaningful-documentation

Defines the named pair, included start, excluded end and maximum permitted depth.

## @evidence contracts/development/design.md#principled-representation

The pair is order-independent and its tolerance is a nonnegative world-metre depth.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The production source declares the window, and the scene query resolves overlap by minimum allowance.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A window exempts only the named pair, within the specified depth and interval, and only the named joints when it is scoped. A whole-part query cannot apply a scoped window.

# src/validation/IAutoMovieSceneCollision.ts#IAutoMovieSceneCollision.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Defines one layer clock, input geometry, native query and comparison limit.

## @evidence contracts/development/design.md#principled-representation

Placed parts and named allowances are evaluated at the same finite layer-local second.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The caller retains the evaluated layer and initialized contact query. The measurement borrows both for one synchronous call.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No geometry is resampled and no cross-layer or temporally sampled pairs enter this interface.

# src/validation/IAutoMovieSceneCollision.ts#IAutoMovieSceneCollision.IFinding

## @evidence contracts/development/common.md#meaningful-documentation

Names the ordered identities, sampled second, authority, witness and active allowance.

## @evidence contracts/development/design.md#principled-representation

Candidate, proxy, confirmed and permitted statuses preserve the scope of the reported geometry.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The query returns world-space evidence that independent consumers can place and group by pair.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A broad overlap supplies no invented point or depth. Native ambiguity stays a candidate.

# src/validation/IAutoMovieSceneCollision.ts#IAutoMovieSceneCollision.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Describes findings, skipped ownership, incomplete geometry and completed comparison counts.

## @evidence contracts/development/design.md#principled-representation

Exact findings are returned with explicit proxy, unbounded, unavailable and exhausted scopes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The query owns deterministic ordering and counts. The consumer owns any presentation or aggregation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An empty finding list never hides a proxy, an unavailable part or incomplete traversal.
