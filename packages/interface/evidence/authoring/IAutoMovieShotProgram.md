# src/authoring/IAutoMovieShotProgram.ts#IAutoMovieShotProgram

## @evidence contracts/development/design.md#principled-representation

Every registration binding is an exact comparison against the contract, reported as a `contract-mismatch` diagnostic before any stage runs; the program then flows through `stageScene`, `blockBeat` and `performShot` in that order, and the event samples are compared with each contract window `[from, to]` inclusive.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The program bundles the inputs each pipeline gate already owns, script, stage, blocking and performance, and adds only the actor runtime facts and event samples that no gate input carries.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A mismatched beat, duration or scene is refused rather than overwritten from the contract, and an undeclared or repeated event sample is refused rather than ignored.

## @evidence contracts/development/common.md#meaningful-documentation

States each binding to the registration, which gate reads each member, the time unit and window rule for event samples, and what the actor facts cover.
