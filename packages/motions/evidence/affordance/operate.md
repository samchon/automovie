# src/affordance/operate.ts#operate.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the operation's world effector goal, original reach/stroke clock, articulation drive and standing/carrier overlay; operateHand documents the full-target versus wrist-only consumers.

## @evidence contracts/development/implementation.md#principled-implementation

The hand follows the mechanism's original geometry or actual posed articulation; the original least-reaching lean is found by the same balanced pitch scan/bisection. Full arm targets retain actual default elbow selection and contact-aware arm placement.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Fixed mechanism/timing preparation delegates one hand-frame owner to the lean's wrist observation and the arm phrase's full target, then composes the unchanged base, lean and stroke.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves every nine planning reach probes, balance solve, pitch scan/bisection, insertion roll fit, full target Bend, contact window, drive, refusal and phase time; only wrist-only probes omit the elbow result they never consume.

## @evidence contracts/development/implementation.md#efficient-algorithms

Entry FK requests only the actual origin surface. Fixed hand geometry or insertion axis/grid prepares once; reach observations avoid an unconsumed bounded Bend sweep and repeated hand geometry. Native grounded hinge strokes evaluate the current elbow once and use only wrist placement for the discarded onset. The downstream display fit and the original lean remain.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One unchanged body/side/mechanism/initial place and clock fix only shared hand geometry. Hinge onset validation retains the original second, progress and part observation after the current target. Opaque bodies and changed posture readers use the ordinary stroke.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan owns fixed mechanism/clock/hand metadata and the original bounded lean-shift table until release. Current frames, targets and wrist observations remain query-local with no new time/pose/fit history or borrowed solver reader retained.
