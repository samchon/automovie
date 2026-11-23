# src/core/IAutoMovieValueDriver.ts#IAutoMovieValueDriver

## @evidence contracts/development/design.md#principled-representation

The copy/driven union is exactly the pair of authored driver kinds with value-channel dependencies, separate from world-space aim, parent, IK and spring constraints.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Existing copy and driven records retain their own fields and validation; the union adds no duplicated channel representation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Duplicate producers remain dependencies, and ordering failure is a cycle refusal rather than an arbitrary winning driver.

## @evidence contracts/development/common.md#meaningful-documentation

Defines consumed/produced channel ownership, self-input policy, deterministic order and borrowed output records.
