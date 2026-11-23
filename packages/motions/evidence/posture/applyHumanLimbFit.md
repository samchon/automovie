# src/posture/applyHumanLimbFit.ts#applyHumanLimbFit

## @evidence contracts/development/common.md#meaningful-documentation

Defines the direct solve, its callers, the shared admission and the shared-record result. Member facts: continued: Names current-target correction for the owned continuous curve.

## @evidence contracts/development/implementation.md#principled-implementation

Delegates to the one direct solver, which mirrors left limbs and solves in the root-position frame. Member facts: continued: Selects the continuous policy (current hinged correction), whose curve owner admits the physical result.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One delegation per solver policy, the ordinary one here and the continuous one in `continued`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every request is solved from its own inputs; no stored answer, key or caller ownership flag. Member facts: continued: No changed goal or tolerance.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant wrapper work plus the solve. Member facts: continued: The same.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each request is solved afresh.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
