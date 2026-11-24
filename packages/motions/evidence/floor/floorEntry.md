# src/floor/floorEntry.ts#floorEntry.standing

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the two answers and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The entry's base is the one the performance passes on from the act before (`HumanBase.after`), so the gate reads what carries the body, not a guess from its pose.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One read and one refusal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The refusal names the base found and the accepted ones; nothing is clamped.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of the entry.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/floor/floorEntry.ts#floorEntry.IStart

## @evidence contracts/development/common.md#meaningful-documentation

States what each member is and when the blend source is absent.

## @evidence contracts/development/design.md#principled-representation

The law's standing measure and, off the feet, the displayed entry it blends from; standing, there is none, so the two cases cannot be mixed up.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members, read by the three floor laws.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the posture type.

# src/floor/floorEntry.ts#floorEntry.start

## @evidence contracts/development/common.md#meaningful-documentation

States the two starts and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The gate, then the law's own stance, or an upright stance at the entry (`stand.posture` under the displayed hips or between the entry's ankles) and `displayed`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch on the gate.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work beyond one resolution off the feet.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Off the feet, one immutable displayed-entry reading serves both the blend source and any hip-based standing reference; the standing branch retains its one original stood callback without constructing a display copy.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/floor/floorEntry.ts#floorEntry.down

## @evidence contracts/development/common.md#meaningful-documentation

States the two cases, what is read once and each input.

## @evidence contracts/development/implementation.md#principled-implementation

The law's posture at the end of its way down is written by its solved joint angles (`GymnasticsFlight.frozen`), so the blend arrives on the pose the law shows from there on.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch and one blend.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Off the feet, one lazy full arrival resolution and two fixed endpoint floor readings serve the transition; each interior query keeps its actual changing floor reading and joint blend. The ordinary standing/finished branch adds no preparation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The arrival is computed once from the floor law's fixed base reference. Each actual writer query forwards synchronous parent FK/ROM sources through arrival freezing and transition floor observations, sharing only exact prerequisites while changing joints/fits remain current.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds one arrival and fixed transition for the plan's life; current-call FK/ROM sources end with return or throw and never enter that retained geometry.

# src/floor/floorEntry.ts#floorEntry.displayed

## @evidence contracts/development/common.md#meaningful-documentation

States what is read and what the result resolves to.

## @evidence contracts/development/implementation.md#principled-implementation

The displayed pose holds each joint's clinical triple and the root's frame, and `humanPostureHeading.angles` inverts the heading the resolver composes, so nothing is re-derived from bone directions.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the joints.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A pose with no root frame reads the entry posture's root and heading.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the joints.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of the entry.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/floor/floorEntry.ts#floorEntry.between

## @evidence contracts/development/common.md#meaningful-documentation

States endpoint immutability, progress, lazy endpoint-measurement lifetime and optional nonescaping synchronous FK/ROM sources on each returned read.

## @evidence contracts/development/implementation.md#principled-implementation

Interpolates the joints linearly through the one joint-map blend owner (`prepareHumanShapeBlend`), the yaw along the shortest arc and the root with the hips, raising only the blend's floor penetration beyond the endpoints' interpolated penetration.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One prepared joint interpolation and one lazy endpoint record feed each independent progress query.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Exact endpoint queries return the supplied postures; the floor clearance and its bounds are unchanged.

## @evidence contracts/development/implementation.md#efficient-algorithms

Endpoint clearances cost two floor readings once, first actual floor demand prepares native collider selection once and endpoint hips prepare one native fixed vector interpolation. Each interior query retains changing hip interpolation, actual floor placement/bounds and O(J) joints.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only fixed endpoint hip coefficients, yaw/joint pairs, floor clearances and unchanged-body collider selection share. Each interior call borrows or owns synchronous FK/ROM across actual endpoint/current floor readings; the intermediate posture, all current shape transforms and changing floor bounds remain recomputed.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One transition owns two postures, fixed joint pairs, two floor scalars and at most one native fixed collider reader until release. Optional current-call FK/ROM loans end on return or throw; no query history, posed answer, workspace or handle is retained.
