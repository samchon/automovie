# src/executable/buildMotionCaptureCases.ts#buildMotionCaptureCases

## @evidence contracts/development/common.md#meaningful-documentation

States what is built, when names are checked and cases built, the filter's two applications and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The registry's factories are pure functions of their filter returning iterables, and they are consumed as iterables, so building is the whole of turning names into cases.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One check of the names, then one loop over their factories, shared by the capture harness and the props writer.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unknown name or an empty selection throws instead of building nothing.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the cases the factories build.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Built once per run.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds no case once the caller asks for the next, so a run of every case keeps one case's data at a time.
