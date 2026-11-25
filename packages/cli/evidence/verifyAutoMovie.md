# src/verifyAutoMovie.ts#verifyAutoMovie

## @evidence contracts/development/common.md#meaningful-documentation

States the module owner, working directory, output formats, status behavior and stage exit.

## @evidence contracts/development/implementation.md#principled-implementation

Node resolves the editable module from its production directory. The shared evaluator computes one report, and both output formats present that report.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Loading, evaluating and printing belong here. Admitting arguments and deciding outcomes belong to their separate owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Status reads follow the same evidence rules as required runs. Output mode has no bearing on gate status.

## @evidence contracts/development/implementation.md#efficient-algorithms

Beyond module evaluation and the evaluator, JSON uses one report traversal; text sorts one copy of the bounded selection and emits its entries.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The report determines its output and exit together; no outcome cache persists in the command.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The module is retained by Node during the command process. The formatter holds one report and one text or JSON output. Stream ownership remains with Node.
