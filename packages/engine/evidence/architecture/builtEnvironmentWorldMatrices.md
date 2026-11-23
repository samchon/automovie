# src/architecture/builtEnvironmentWorldMatrices.ts#builtEnvironmentWorldMatrices

## @evidence contracts/development/implementation.md#principled-implementation

Composes TRS matrices with `Matrix4.compose` and `Matrix4.multiply`, the three.js convention the renderer uses, because composing TRS triples directly shears wrong under a scaled rotating parent; a revolute displacement is the rotation about its pivot written as `T(pivot - R·pivot)·R`, and a prismatic one is a translation along the normalized axis.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One owner for element staging under operating states, shared by carriage placement and every element, part and space-content bounds query, so a change to how an element is placed reaches all of them at once.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no element, opening or connector; a member lacking the requested state or a value stays at rest by the stated rule, and unresolved parents are documented as an assumption validation enforces rather than caught and retried.

## @evidence contracts/development/common.md#meaningful-documentation

States the column-major matrices, the local and world composition order, how `stateId` selects travel by one name or per member and what a missing state, a null choice or a missing value means, the validation premises, the failure effects when they are broken, and the key set.

## @evidence contracts/development/implementation.md#efficient-algorithms

Memoized depth-first composition computes each element's world matrix once. Every opening/connector is visited; each operation scans its state list once, indexes selected values once and looks up each moving member once. Time is O(E + O + S + M + V) for elements, opening/connector records, scanned states, moving members and selected values, assuming constant-time map access and selector cost added separately.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Within one call each ancestor's world matrix is computed once and reused by every descendant; across calls nothing is cached, because the environment is the caller's mutable record and no key could prove an earlier staging still matches it.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The id index, displacement table and returned matrices grow with element count; a selected operation's temporary value index grows with its value count, and recursive staging uses ancestor-depth stack space. Only the returned matrix map escapes; deep acyclic input can still exhaust the JavaScript stack.
