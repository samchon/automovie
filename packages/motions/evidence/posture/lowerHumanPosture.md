# src/posture/lowerHumanPosture.ts#lowerHumanPosture

## @evidence contracts/development/common.md#meaningful-documentation

States gravity-axis lowering, minimum knee degrees, original targets and synchronous FK borrowing; prepare binds an unchanged body/knee and prepares its fixed reach once. short/prepareShort document metre/degree inputs, live versus fixed dimensions, negative slack and the horizontally-unreachable -Infinity result.

## @evidence contracts/development/implementation.md#principled-implementation

Actual pelvis-to-hip FK supplies origins. The common reachLimit applies a*a+b*b+2*a*b*cos(knee) and its square root to actual thigh/shank lengths; reachDrop removes horizontal span through the original Pythagoras/comparison/subtraction grouping. Raw short reads live dimensions each time; prepareShort genuinely computes that fixed-body/knee prerequisite once. Taking the greatest required drop keeps the original cleanup rule.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Raw lowering and prepare share one current-goal/hip/drop owner. Its scalar source is either the original live short or prepare's fixed-reach reader, created once with it. Both use reachLimit/reachDrop, separating fixed segment geometry from every current hip/ankle query without duplicating lowering or allocating per-query callbacks.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Attached goals stay outside the world-root solve. short retains -Infinity at or beyond horizontal reach and negative slack when the leg reaches; no target, knee threshold, tolerance or replacement contact is introduced.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most two goal reads and one two-hip demand FK precede constant scalar work per leg, without an intermediate per-query goal list. No FK reader is allocated/invoked without a world plant, and an actual supplied loan dispatches directly without a discarded lazy wrapper. prepare pays fixed-body/knee cosine and reach construction once. Each query retains horizontal hypot, reach comparison and vertical square root. Runtime improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A supplied same-person reader shares exact FK prerequisites; changed root/pelvis remain visible. Raw lowering/short reread body dimensions; explicit prepare/prepareShort own only the computed fixed-knee reach and require new preparation on dimension/knee changes. Every world-plant selection, hip and ankle is read anew and no lowering answer is memoized.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Lowering's local goals, hip frames and getter end on return or throw. prepare retains its unchanged body/knee and one private scalar reader until its plan owner releases it. A prepareShort reader retains only the fixed reach constants without body or points. Neither path stores query history, handles or tasks.
