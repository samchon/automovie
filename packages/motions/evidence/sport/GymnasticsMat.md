# src/sport/GymnasticsMat.ts#GymnasticsMat.lie

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the result's timebase.

## @evidence contracts/development/implementation.md#principled-implementation

Joint space blended on minimum-jerk progress, the tip to the nearest supine tip, the root height from the shapes' rest and the root's floor place from the centre carried by the engine's `carriedRate`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One blend, one centre and one rest per instant; the query's fresh frame posture receives its final root Y before ownership transfers to the caller.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

The joint-map blend (`prepareHumanShapeBlend`) prepares J start/difference triples once, and the settled progress and carried-time coefficients are read once. Each query keeps actual ROM/FK/COM/floor evaluation and transfers its fresh posture/root directly, omitting two discarded shallow copies. No bound or phase time changes; speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only the authored interpolation prefix is fixed: the shared joint blend's union/start/difference and the scalar kernels at clipped t=SETTLE. Fresh triples isolate output mutations; current velocity/root requests and every actual body/ROM/profile/context reading remain evaluated. COM/floor share one query map and optional synchronous FK/projector loans share only prerequisites.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan retains original inputs and one O(J) joint blend reader (`prepareHumanShapeBlend`). Query frame, bone map and floor reader release on return/throw; optional FK/projector loans stay with the synchronous parent and neither enters the returned posture, frame floor callback or retained landing closure.
