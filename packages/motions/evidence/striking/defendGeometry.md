# src/striking/defendGeometry.ts#defendGeometry.ITiming

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and unit.

## @evidence contracts/development/design.md#principled-representation

The struck region, the placed strike and durations in seconds, decided once by the plan.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The values the geometry and the contact windows read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the region and placed-action types.

# src/striking/defendGeometry.ts#defendGeometry.IGeometry

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what it holds.

## @evidence contracts/development/design.md#principled-representation

A posture per second and contact windows as shares.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two values the plan reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the posture and contact window types.

# src/striking/defendGeometry.ts#defendGeometry.build

## @evidence contracts/development/common.md#meaningful-documentation

States its inputs and result; the namespace states the build.

## @evidence contracts/development/implementation.md#principled-implementation

The weapon is the attacker's limb moving most toward the struck region at the read second; the evasion and the goals follow from the line it comes in on.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The sight, the evasion's displacement, the base posture, then the limbs blended from the guard to the goals.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing about contact is decided here; the displacement shares are documented provisional values.

## @evidence contracts/development/implementation.md#efficient-algorithms

The original two attacker observations remain. Fixed requested-bone metadata and authored foot hints/MTP contacts prepare once; each posture evaluates its envelope once, one actual native trunk and the original guard/limb blends. Speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The fixed sight, displacement, entry feet and checking support selection belong to this built defence. Only their authored geometry is shared; query-scoped exact FK/ROM loans reach the native current trunk, and no changing pose, fit, actor observation or time answer is retained.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The closure retains its original sight/feet and fixed demanded-rig/foot-geometry readers until plan settle/release. Every query returns independent authored goals and releases its current map and optional borrowed FK/ROM sources on return or failure.

# src/striking/defendGeometry.ts#defendGeometry.attacked

## @evidence contracts/development/common.md#meaningful-documentation

States the rule for sided and central regions.

## @evidence contracts/development/implementation.md#principled-implementation

Reads the side from the region's own name, the surface vocabulary's convention.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One conditional chain.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its input.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/defendGeometry.ts#defendGeometry.windows

## @evidence contracts/development/common.md#meaningful-documentation

States the windows and the checking leg's exception.

## @evidence contracts/development/implementation.md#principled-implementation

The checking foot is planted until the movement starts and again at the end, the instant it is back on the floor.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One map over the two sides.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its input.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns plain data.
