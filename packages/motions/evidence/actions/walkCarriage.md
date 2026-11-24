# src/actions/walkCarriage.ts#walkCarriage

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the result.

## @evidence contracts/development/implementation.md#principled-implementation

Every stride is read, since a turn makes strides unlike one another; the carriage holds the hands clear wherever any stride passes them by the thighs.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The spans between heel strikes, one carriage over all their phases.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No stride stands in for another; a take with no left heel strike is read over its whole length as one span.

## @evidence contracts/development/implementation.md#efficient-algorithms `HumanArmSwing.PHASES` postures per stride, once per take: linear in its strides.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `HumanArmSwing.carriage`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
