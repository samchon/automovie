# src/geometry/IAutoMovieCanonicalBoundary64.ts#IAutoMovieCanonicalBoundary64.IInverseAnchor

## @evidence contracts/development/common.md#meaningful-documentation

The declaration identifies one authored local coordinate and its exact phase. It documents endpoint coverage and strict monotonic direction.

## @evidence contracts/development/design.md#principled-representation

The Engine inverse requires each anchor local to be finite in [0,1], compares its phase against the forward map and checks the ordered local and directed phase sequence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Each anchor needs only its original local coordinate and the exact phase identity. The forward map and the ordered anchor collection provide the complete inverse context.

# src/geometry/IAutoMovieCanonicalBoundary64.ts#IAutoMovieCanonicalBoundary64.IInverseAnchor.local

## @evidence contracts/development/common.md#meaningful-documentation

Carries the authored local unit coordinate retained for an exact inverse hit.

# src/geometry/IAutoMovieCanonicalBoundary64.ts#IAutoMovieCanonicalBoundary64.IInverseAnchor.phase

## @evidence contracts/development/common.md#meaningful-documentation

Carries the exact canonical address used when comparing the anchor with the supplied forward map.

# src/geometry/IAutoMovieCanonicalBoundary64.ts#IAutoMovieCanonicalBoundary64.IPartitionUse

## @evidence contracts/development/common.md#meaningful-documentation

The declaration describes the nonempty exact use and authority identities, the directed normalized interval and the local traversal sign.

## @evidence contracts/development/design.md#principled-representation

The Engine rejects nonfinite bounds, empty identifiers and walks outside 1 or -1 before grouping uses by exact authority identity. Partitioning separates restriction reversal from orientation and places endpoint events in sorted order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One use refers to an existing shared authority and its interval. The partition builds incidence atoms later, while positions and render diagnostics belong to the surface consumers.

# src/geometry/IAutoMovieCanonicalBoundary64.ts#IAutoMovieCanonicalBoundary64.IPartitionUse.id

## @evidence contracts/development/common.md#meaningful-documentation

Identifies one declared use across the full partition, with duplicates refused.

# src/geometry/IAutoMovieCanonicalBoundary64.ts#IAutoMovieCanonicalBoundary64.IPartitionUse.authority

## @evidence contracts/development/common.md#meaningful-documentation

Gives the exact shared boundary identity used to group endpoint events.

# src/geometry/IAutoMovieCanonicalBoundary64.ts#IAutoMovieCanonicalBoundary64.IPartitionUse.start

## @evidence contracts/development/common.md#meaningful-documentation

Carries the finite normalized initial endpoint of the directed restriction.

# src/geometry/IAutoMovieCanonicalBoundary64.ts#IAutoMovieCanonicalBoundary64.IPartitionUse.end

## @evidence contracts/development/common.md#meaningful-documentation

Carries its final endpoint, which can be lower for the reverse direction.

# src/geometry/IAutoMovieCanonicalBoundary64.ts#IAutoMovieCanonicalBoundary64.IPartitionUse.walk

## @evidence contracts/development/common.md#meaningful-documentation

Gives the coherent local boundary walk sign which the partition converts into canonical direction.

# src/geometry/IAutoMovieCanonicalBoundary64.ts#IAutoMovieCanonicalBoundary64.IPartitionAtom

## @evidence contracts/development/common.md#meaningful-documentation

The declaration explains open normalized interval bounds, exact authority grouping, lexical membership order and aligned direction signs.

## @evidence contracts/development/design.md#principled-representation

The partition sorts distinct endpoints by authority and value, then sweeps add and remove events. It records each open segment's active members and their canonical walks, and emits explicit diagnostics for uncovered, overfull or equal-direction incidence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The atom records only declared incidence at one interval. The input uses own original direction and the consumer owns any geometric correspondence or entailment.

# src/geometry/IAutoMovieCanonicalBoundary64.ts#IAutoMovieCanonicalBoundary64.IPartitionAtom.authority

## @evidence contracts/development/common.md#meaningful-documentation

Carries the shared authority ID for the endpoint event group.

# src/geometry/IAutoMovieCanonicalBoundary64.ts#IAutoMovieCanonicalBoundary64.IPartitionAtom.start

## @evidence contracts/development/common.md#meaningful-documentation

Gives the lower endpoint from the group's increasing endpoint order.

# src/geometry/IAutoMovieCanonicalBoundary64.ts#IAutoMovieCanonicalBoundary64.IPartitionAtom.end

## @evidence contracts/development/common.md#meaningful-documentation

Gives the next strictly higher endpoint of the open atom for valid input.

# src/geometry/IAutoMovieCanonicalBoundary64.ts#IAutoMovieCanonicalBoundary64.IPartitionAtom.uses

## @evidence contracts/development/common.md#meaningful-documentation

Carries the lexically sorted IDs of active uses on this atom.

# src/geometry/IAutoMovieCanonicalBoundary64.ts#IAutoMovieCanonicalBoundary64.IPartitionAtom.walks

## @evidence contracts/development/common.md#meaningful-documentation

Carries each active use's canonical walk at the matching member index.

# src/geometry/IAutoMovieCanonicalBoundary64.ts#IAutoMovieCanonicalBoundary64.IPartitionResult.atoms

## @evidence contracts/development/common.md#meaningful-documentation

Publishes the ordered open intervals and each member's canonical walk orientation.

# src/geometry/IAutoMovieCanonicalBoundary64.ts#IAutoMovieCanonicalBoundary64.IInverseAnchors

## @evidence contracts/development/common.md#meaningful-documentation

The collection documents complete endpoints, increasing local coordinates and strict direction of the exact phase sequence.

## @evidence contracts/development/design.md#principled-representation

Inverse admission checks endpoint coverage, forward-map phase agreement and ordering. An exact authored phase uses its stored local coordinate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The collection carries authored inputs for the inverse. The algorithm's temporary bracket and binary64 key work stay in the engine.

# src/geometry/IAutoMovieCanonicalBoundary64.ts#IAutoMovieCanonicalBoundary64.IPartitionUses

## @evidence contracts/development/common.md#meaningful-documentation

The collection documents unique IDs across declared uses, authority grouping, directed endpoints and local traversal signs.

## @evidence contracts/development/design.md#principled-representation

Partition normalizes the direction relative to increasing canonical phase and sweeps distinct endpoints independently for each authority string.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The collection supplies only declared authority uses. Output incidence atoms and their diagnostics are computed separately.
