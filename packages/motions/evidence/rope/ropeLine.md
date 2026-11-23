# src/rope/ropeLine.ts#ropeLine.ILine

## @evidence contracts/development/common.md#meaningful-documentation

States each member's frame and unit.

## @evidence contracts/development/design.md#principled-representation

Ends ordered by height, a unit axis from low to high (or along +X when level), a length and the floor.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The values the crossings read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Built only by read.

# src/rope/ropeLine.ts#ropeLine.read

## @evidence contracts/development/common.md#meaningful-documentation

States the result and refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Transforms the bar's centre and axis to the world and takes half its length each way.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admission, then one transform.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses a rope it cannot read.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the prop's affordances.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Read once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/rope/ropeLine.ts#ropeLine.atHeight

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the clamp and the result.

## @evidence contracts/development/implementation.md#principled-implementation

Solves the line's height linearly along its axis.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One solve and clamp.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A level line returns its middle.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/rope/ropeLine.ts#ropeLine.refusal

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and result.

## @evidence contracts/development/implementation.md#principled-implementation

One refusal kind for a rope that cannot carry the request.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Builds one record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names the actual parameter and value.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one record.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/rope/ropeLine.ts#ropeLine.aim

## @evidence contracts/development/common.md#meaningful-documentation

States the lookup and the fallback.

## @evidence contracts/development/implementation.md#principled-implementation

A prop target on this rope reads its staged point: a hand's facing from the rope toward the climber square to its axis, a foot's up; any other target the context's own aim.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unstaged point falls back to the context rather than a guess.

## @evidence contracts/development/implementation.md#efficient-algorithms

One map lookup per read.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Built once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains the staged map for the plan.
