# src/striking/StrikingRollHand.ts#StrikingRollHand

## @evidence contracts/development/common.md#meaningful-documentation

Defines fixed tool/body/axis/cone inputs, changing world-metre placement/posture and actual per-call physical selection.

## @evidence contracts/development/implementation.md#principled-implementation

Retains the original 10-degree lean, 45-degree azimuth and 30-degree roll grid and straight-wrist residual rank, then delegates the original TRIED candidates and freedoms to StrikingRoll.chosen. Only rigid alignment/kept-point offsets independent of position and posture are prepared.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One explicit fixed candidate-grid producer owns tool/axis geometry; each invocation owns its actual shoulder, ranks, stable sort and physical chooser. Fixed-axis insertion retains this producer; the general one-shot StrikingRoll.hand separately preserves original callback observation order.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

All original grid entries, rank penalty, strict ordering, refusal handling, TRIED count and refinement freedoms remain. No pose, rank, shoulder, fitted result or chosen angle is reused; frame outputs are fresh and a changing posture callback is evaluated for every original candidate.

## @evidence contracts/development/implementation.md#efficient-algorithms

G fixed grid entries prepare O(G) rigid alignment/offset readers once. Each query retains O(G) actual ranking and sorting plus the original numerical fit/refinement cost; grid frame placement is constant subtraction and fresh copying, while nongrid refinement geometry is computed normally. Speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Explicitly fixed body/tool/back/axis/cone geometry determines grid readers, and fixed raw-shoulder demand shares only name/rig preparation while actual authored admission/FK repeats. Both plain and callback postures retain current direct admission and all raw getters/ROM reads for every actual fit; no borrowed posture is certified by identity. The explicit factory fixes tool geometry only, and callbacks may not mutate that fixed tool. Signed-zero angle keys remain distinct and no changing point/time/contact answer is retained.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The enclosing one-shot search or fixed-axis action owns G angle records and G rigid readers, bounded by its original cone grid; nongrid refinements are not retained. Each query releases ranks, temporary frames and FK/direct-pose workspaces on return or failure, and the output retains no reader or history.
