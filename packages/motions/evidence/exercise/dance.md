# src/exercise/dance.ts#dance.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the plan and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

A beat clock with one instant per beat; each step's root and foot curves are written against the beats.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Clock, then one branch per step.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The beat is never moved by the manner: the manner scales sizes only.

## @evidence contracts/development/implementation.md#efficient-algorithms

Beat lists, world placements and fixed course pairs prepare in O(beats); each foot query uses logarithmic selection and its original observation. Fixed arcs prepare on first actual pair read; sway shifts read each foot offset once for both coordinates. Bounce uses a prepared native phase envelope with custom-callback guards; root rows request only preceding root.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each exact authored foot offset is transformed once in the unchanged entry frame. Native fixed-pair arc metadata share across actual placement reads; current progress, lateral interpolation, rigid placement and leg goals remain independently evaluated without time-result reuse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan owns O(beats) footfalls, world placements and bounded held/travelling arc preparations until release, alongside its existing beat clock; no time, solved pose, FK source or query history is retained.
