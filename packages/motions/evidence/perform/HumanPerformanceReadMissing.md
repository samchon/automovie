# src/perform/HumanPerformanceReadMissing.ts#HumanPerformanceReadMissing

## @evidence contracts/development/common.md#meaningful-documentation

States the refused object kind, id, supplied alternatives and optional caller-specific axis.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the existing HumanRefusal representation so kind, axis, value, alternatives, explanation and repair remain consistent with its formatted message.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One typed refusal construction owns no lookup or numerical evaluation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves prop affordance versus participant kind, the default axis and supplied alternatives; does not invent a fallback result.

## @evidence contracts/development/implementation.md#efficient-algorithms

Record assembly is constant work before HumanRefusal formats the K alternatives and their text.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each failure describes its actual inputs; no mutable Error or alternatives snapshot is memoized.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The new error retains the supplied alternatives reference through its feasible record; this constructor stores no global state or handle.


# src/perform/HumanPerformanceReadMissing.ts#HumanPerformanceReadMissing.What

## @evidence contracts/development/common.md#meaningful-documentation

Names the two kinds of subject a performance read can miss.

## @evidence contracts/development/design.md#principled-representation

A performer or a prop: the refusal's kind and wording follow from which.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `HumanPerformanceReadMissing` and its callers.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

A two-literal union; no optional combination arises.
