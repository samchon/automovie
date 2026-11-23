# src/animals/EquineHobbleRows.ts#EquineHobbleRows

## @evidence contracts/development/common.md#meaningful-documentation

States the order, the pitch, what the fores keep and the refusal.

## @evidence contracts/development/design.md#principled-representation

A stance row in the rows' own plan form.

## @evidence contracts/development/design.md#minimal-and-owned-surface `owns` and `plan`, dispatched by `EquineStanceExtras`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The pitch, lift and load share are named authored values.

# src/animals/EquineHobbleRows.ts#EquineHobbleRows.owns

## @evidence contracts/development/common.md#meaningful-documentation

States the result.

## @evidence contracts/development/implementation.md#principled-implementation

The discriminator.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One comparison.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure test.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/EquineHobbleRows.ts#EquineHobbleRows.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the output and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Per hop three pieces: the fores' joint arc with the trunk pitched about the hind hooves' middle and carried half the length, then each hind's weight transfer (`EquineStanceSupport.transfer`) and arc with the trunk carried a quarter each.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admission, the states, the events, then the pose by share.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Both fores move by one offset, so their separation never changes.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two weight transfers per hop, solved once.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The states and loads are prepared once per plan.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan holds its states.
