# src/geometry/construction/AutoMovieViewChain.ts#AutoMovieViewChain.of

## @evidence contracts/development/common.md#meaningful-documentation

States the admission rules.

## @evidence contracts/development/implementation.md#principled-implementation

Each arc's control point is the meeting of the two tangent lines; it must lie ahead of the start along its tangent and behind the end along its tangent, so the middle weight is positive and the arc stays in its triangle; the phase advance over the whole arc is decided exactly by the minimum of the quadratic `N x N'` on [0, 1].

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Validate inputs and phase order, build each arc, decide its advance, record its end curvatures, then the joins.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No fallback line, default weight or sampled advance check: any failed premise is the fault.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(K) arcs with constant work each.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure preparation coordinates no requests.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns its arcs; retains nothing.

# src/geometry/construction/AutoMovieViewChain.ts#AutoMovieViewChain.primal

## @evidence contracts/development/common.md#meaningful-documentation

States the projection.

## @evidence contracts/development/implementation.md#principled-implementation

Each jet's value entry.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One map per member.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None: the exact values.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(K).

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure projection coordinates no requests.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh arrays; retains nothing.

# src/geometry/construction/AutoMovieViewChain.ts#AutoMovieViewChain.read

## @evidence contracts/development/common.md#meaningful-documentation

States the reduction, the join rule and the failure value.

## @evidence contracts/development/implementation.md#principled-implementation

The native section's reduction (`phi % 2pi`, exact in binary64) from the first point's phase; the arc whose span starts at or before it by binary search; the ray direction d meets the arc where `d x N(t) = 0`, a quadratic in t solved in closed form, and an advancing arc meets each ray of its span exactly once.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reduce, look up, solve, read the point.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No interpolation between points stands in for the arc, and no loop reduces the phase.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant-time reduction, O(log K) lookup over the ascending span starts and constant arithmetic.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading coordinates no requests.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/geometry/construction/AutoMovieViewChain.ts#AutoMovieViewChain.reader

## @evidence contracts/development/common.md#meaningful-documentation

States the phase unit, input and output order, scalar fallback range, and join sidedness.

## @evidence contracts/development/implementation.md#principled-implementation

Canonical phase directions are periodic. Shifting them to the section's first phase gives two increasing runs whose arc cursors advance independently. At a span end within the rounding of the turn adjustment, use the scalar direction so the same endpoint and join side are selected.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepare and sort the phase grid, sweep the spans, intersect each ray on its arc, and return the answers at their original indices.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No point interpolation or approximate arc lookup. Each ray goes through the same rational quadratic root and parameter admission as a scalar read.

## @evidence contracts/development/implementation.md#efficient-algorithms

The preparation sorts the canonical phase requests. A subsequent chain read takes linear time in the phase count plus the arc count for the sweep, with independent scalar reads for requests outside the canonical turn.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One phase grid holds its directions and ordering for every section that uses it. The scalar and grid reads share the arc intersection and join rules.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The closure retains only its input phase grid. Every section and its results belong to one call.

# src/geometry/construction/AutoMovieViewChain.ts#AutoMovieViewChain.radius

## @evidence contracts/development/common.md#meaningful-documentation

States the reading and its failure value.

## @evidence contracts/development/implementation.md#principled-implementation

The length of the point `read` finds.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One read, one length.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No interpolation between points stands in for the arc.

## @evidence contracts/development/implementation.md#efficient-algorithms

As `read`.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading coordinates no requests.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/geometry/construction/AutoMovieViewChain.ts#AutoMovieViewChain.jets

## @evidence contracts/development/common.md#meaningful-documentation

States the output, units (mm, per mm of station, per radian), the sided flag and the failure values.

## @evidence contracts/development/implementation.md#principled-implementation `read` locates the arc and parameter t*; that arc's point B(s, t) is evaluated in the shared AD algebra with the inputs' station jets and t as the second coordinate; R = |B| and Phi = atan2(B) take their (s, t) partials (Phi's by the quotient rule on `B x B_i / |B|^2`), and the inverse function theorem gives `t_phi = 1 / Phi_t`, `t_s = -Phi_s / Phi_t` and their second partials, which compose R into the (s, phi) Hessian.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepare the numeric chain and every arc's control point and weight jets once; per phase read, lift, invert, compose.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No finite difference or sampled derivative; a vanishing phase speed yields no reading rather than a substituted value, and a join's one-sided second derivatives carry the sided flag.

## @evidence contracts/development/implementation.md#efficient-algorithms

One O(K) preparation, then an O(log K) read and constant AD work per phase.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The returned closure reuses the numeric chain and the station-only control point and weight jets across phases.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The closure retains the numeric chain and K arcs' station jets until released.

# src/geometry/construction/AutoMovieViewChain.ts#AutoMovieViewChain.evaluate

## @evidence contracts/development/common.md#meaningful-documentation

States the parameter range and units.

## @evidence contracts/development/implementation.md#principled-implementation

The rational quadratic Bezier with end weights 1 and middle weight w.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One closed form.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None: the exact formula.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant arithmetic.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading coordinates no requests.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
