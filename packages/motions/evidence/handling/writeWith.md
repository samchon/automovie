# src/handling/writeWith.ts#writeWith.stationary

## @evidence contracts/development/common.md#meaningful-documentation

States both stationary cases.

## @evidence contracts/development/implementation.md#principled-implementation

A hold persists still while the active action does not drive that hand, so a held surface keeps its entry frame.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One read of the prop and of the entry holds.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A moving or articulated surface is not stationary.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

No equivalent predicate exists.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/handling/writeWith.ts#writeWith.reach

## @evidence contracts/development/common.md#meaningful-documentation

States the wrist premise and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The pick up's reach owner refuses each wrist goal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One check per point.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refused, never clamped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the points.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `pickUp.reachable`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/handling/writeWith.ts#writeWith.steady

## @evidence contracts/development/common.md#meaningful-documentation

States what the steadying hand contributes, its group and its refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The same held lever `write` aims by, held at one point under the stroke's envelope; in the stroking arm's group the two arms' probes are kept clear of each other as both move, since planning one after the other is incomplete where their paths are coupled (Erdmann and Lozano-Perez 1987, Algorithmica 2:477).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read the held tool, its lever and target, then build the carried arm.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The held owner refuses a hand that does not hold the tool; the reach owner a point beyond the arm.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work per call.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the held, hand-offset and carried-arm owners `write` uses.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The goal closes over its fixed point and lever only.

# src/handling/writeWith.ts#writeWith.steadyAim

## @evidence contracts/development/common.md#meaningful-documentation

States what the aim holds.

## @evidence contracts/development/implementation.md#principled-implementation

The held lever `write` aims by, read once per plan.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read the held tool, its attitude, its lever and its target.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The held owner refuses a hand that does not hold the tool.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shared by `steady` and `write`'s splay.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh records.

# src/handling/writeWith.ts#writeWith.splay

## @evidence contracts/development/common.md#meaningful-documentation

States the premise, the rule, the bound, the path and when nothing turns.

## @evidence contracts/development/implementation.md#principled-implementation

A grip is its working point less its lever, so a turn of the lever about the normal through the point moves the grip on a circle of the lever's flat length, and along the stroke the grip traces the path's segments shifted by the lever; two hands within half a hand's length of their grips are clear when the grips are a hand's length apart (disjoint bounding spheres); the separation is monotone in an equal outward turn on [0, 90] degrees, so bisection finds its least sufficient turn.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Flatten, choose each outward sense, bisect one angle on the least separation along the path.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The bound is the hand's own length and the planner's own clearance; a separation the right angle cannot reach turns to the right angle.

## @evidence contracts/development/implementation.md#efficient-algorithms

A fixed number of bisection steps, once per plan, each one closed-form distance a stroke segment.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

No equivalent owner exists.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns two fresh turns.

# src/handling/writeWith.ts#writeWith.ILever

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its frame and unit.

## @evidence contracts/development/design.md#principled-representation

World metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What the splay reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/handling/writeWith.ts#writeWith.ISplay

## @evidence contracts/development/common.md#meaningful-documentation

Names both turns.

## @evidence contracts/development/design.md#principled-representation

World rotations applied before each held attitude.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What `write` and `steady` read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/handling/writeWith.ts#writeWith.IAim

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and frame.

## @evidence contracts/development/design.md#principled-representation

The held record, a world rotation, a wrist-frame contact and a world point.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What `steady` and `write` read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/handling/writeWith.ts#writeWith.drives

## @evidence contracts/development/common.md#meaningful-documentation

States the span, the start travel and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Each travel runs from the performance's state at the start to its target by a smoothstep over the span, at rest velocity at both ends.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit each articulation, then return its drive.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A target outside `[0, travel]` is refused with the range.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the drives; each travel is a closed form.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

No equivalent drive builder takes a held prop.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Each drive closes over its two travels and the span.

# src/handling/writeWith.ts#writeWith.mount

## @evidence contracts/development/common.md#meaningful-documentation

States the instant and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The plan's mount record; the performance keeps the prop where it lies at that instant.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup and one record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing contact is refused with the prop's contacts.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

No equivalent builder exists.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/handling/writeWith.ts#writeWith.ISteadied

## @evidence contracts/development/common.md#meaningful-documentation

Names the arm primitive, the grip and the hold.

## @evidence contracts/development/design.md#principled-representation

The plan's own record types.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What `write` merges into its plan.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

All three are required.
