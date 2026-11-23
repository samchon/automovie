# src/geometry/construction/AutoMovieSolidIntersection.ts#AutoMovieSolidIntersection

## @evidence contracts/development/common.md#meaningful-documentation

States the equations, the parameter kinds, the trace's checks and the curve's readings.

## @evidence contracts/development/design.md#principled-representation

Represents The curve where an attached part's surface meets its host's: the surface-surface intersection of the solid merge and diff, traced by a declared parameter `t` over one turn: companion namespace of 11 members (`IPoint`, `Parameter`, `ICurve`, `IInput`, `IResult`, `trace`, ...); units and frames named in its text: local, second, world, radian, radians. It has no optional member, so no absent-value state combines with another.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the module that declares `AutoMovieSolidIntersection` in packages/engine/src/geometry/construction/AutoMovieSolidIntersection.ts; its surface is the 11 members listed and the text shows 27 other files naming it, mostly packages/engine (16), test (11), so no member is declared for a presumed future need.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.

# src/geometry/construction/AutoMovieSolidIntersection.ts#AutoMovieSolidIntersection.trace

## @evidence contracts/development/implementation.md#principled-implementation

Delegates the original continuation/publication statements with the same input and unchanged public walk controls.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The stable public namespace retains types/constants while the trace and walk owners hold the execution responsibilities.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Adds no numerical, solver, count, domain, callback or diagnostic policy.

## @evidence contracts/development/common.md#meaningful-documentation

Preserves the original public signature and distinguishes local observations from a global geometric certificate.

## @evidence contracts/development/implementation.md#efficient-algorithms

Includes C output targets, original continuation accepted-substep work and optional bounded reference walks rather than only wrapper cost.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same accepted points and law feed the original reader; no retracing or detached snapshot is introduced.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Successful curves retain original captures; the façade acquires no additional resource or cache.

# src/geometry/construction/AutoMovieSolidIntersection.ts#AutoMovieSolidIntersection.beyond

## @evidence contracts/development/implementation.md#principled-implementation

Delegates the identical optional-u-domain comparison and original outside description.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Preserves the public range reader alongside its moved implementation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not clamp, widen a domain or change exception behavior.

## @evidence contracts/development/common.md#meaningful-documentation

States null inside or absent, and the original string outside.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant scalar/property work in the implementation owner, with no jet query.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Reads the current domain on every call rather than caching its identity.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns only null or a string and retains no source.

# src/geometry/construction/AutoMovieSolidIntersection.ts#AutoMovieSolidIntersection.atlas

## @evidence contracts/development/implementation.md#principled-implementation

Delegates original host normalization, reusing an existing atlas or wrapping one surface.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Maintains the public host-union adapter used by Join and other solid callers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Adds no domain admission or boundary fallback; one-face kept/across remain true/null.

## @evidence contracts/development/common.md#meaningful-documentation

States existing-atlas identity and fixed single-surface wrapper semantics.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work and fixed wrapper allocation for a surface.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

An already supplied atlas is returned by identity, without another snapshot.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The wrapper borrows the source surface and belongs to the caller; no global adapter cache is retained.
