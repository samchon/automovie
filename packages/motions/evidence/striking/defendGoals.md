# src/striking/defendGoals.ts#defendGoals.ISight

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and frame.

## @evidence contracts/development/design.md#principled-representation

World unit vectors, a sign and a closed side union.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The four values the goals and the evasions read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the vector type.

# src/striking/defendGoals.ts#defendGoals.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what it holds.

## @evidence contracts/development/design.md#principled-representation

The body, its posture at the instant, the defence's kind, the struck region with the strike's own point in it, and the sight.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The values the goals read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the body, posture, kind, region and plan types.

# src/striking/defendGoals.ts#defendGoals.at

## @evidence contracts/development/common.md#meaningful-documentation

States the result; the namespace states each kind's goal.

## @evidence contracts/development/implementation.md#principled-implementation

Each goal is placed on the defender's own posed trunk and the seen incoming line, so it follows the body's evasion and the strike's aim.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The shared points first, then one exhaustive switch over the kinds.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The segment shares are documented provisional values; no body is special-cased.

## @evidence contracts/development/implementation.md#efficient-algorithms

Evasions return no limb changes without trunk resolution; selected limb defences read at most one actual trunk. Cover/parry request only the struck-region point and omit unused normal/forward rotations/wrappers; elbow/high blocks retain every normal they consume. Speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A supplied trunk belongs to this exact synchronous body/posture observation. Original frame-property and bone lookup order remain; only the demanded fixed body-region fields are placed through their canonical owner. The two cover gloves share their one original current region observation, and no world point/pose enters another call or time.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new record and retains nothing.
