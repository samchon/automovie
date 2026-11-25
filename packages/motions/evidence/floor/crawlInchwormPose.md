# src/floor/crawlInchwormPose.ts#crawlInchwormPose

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, their frame and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The chain's shape at the feet's and wrists' middles places the hips and the trunk's pitch; the limb goals place the feet on their balls and the palms on the floor; the resolved pose gives the joints.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Delegates one placement to the same prepare owner used by repeated stance preferences, retaining one shape, four limb goals and one complete solve.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None; the fit then meets the stance's contacts exactly.

## @evidence contracts/development/implementation.md#efficient-algorithms

One chain shape and one posture resolve per stance.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Fixed chain/frame/palm metadata share their existing owners; one synchronous exact FK source serves both original elbow searches and the final complete posture solve, with a genuine ROM loan projecting every actual current joint.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

This one stance construction releases its local FK/ROM sources and intermediate poses on return or throw; only original tilt and fresh clinical angle tuples return, with no reader/source token or pose history retained.

# src/floor/crawlInchwormPose.ts#crawlInchwormPose.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States fixed body/chain/world frame, changing local foot/wrist coordinates, actual complete four-goal solving and fresh clinical outputs.

## @evidence contracts/development/implementation.md#principled-implementation

Native HumanFrame and HumanFoot preparations retain the original floor transforms and metatarsophalangeal pivots at each current heel angle/contact. The chain still supplies actual hip/trunk shape, both default arm searches run and canonical seeded resolves every original limb/digit demand.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Fixed floor/sole/knee-scale metadata precedes one actual stance builder. Of delegates this same owner, and repeated inchworm preferences consume one producer instead of rebuilding unchanged frame/foot prerequisites.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every stance still uses its actual foot/wrist coordinates, chain scan/bisection, original KNEE share, native goal geometry and complete ROM/limb fitting; no posed answer, contact, target or tolerance is prepared.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed yaw trigonometry, two sole offsets/rotation prefixes and knee scale prepare once across N stances. Each stance retains one actual chain shape, four goals and a complete solve; its two equal sagittal knee coordinates are calculated once without changing expression grouping.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Unchanged body/chain/frame prove fixed geometric metadata only. Every changing angle, point, knee/root and fit remains current. Each stance borrows or owns synchronous FK/ROM sources; a construction-wide native source may share checked prerequisites across actual stances without reusing any pose or clinical output.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Construction owns one fixed frame, two bounded sole readers/contact vectors, knee scale and palm reader until the producer is released. Local or borrowed FK/ROM inputs and intermediate poses never enter the retained producer or clinical outputs; their synchronous owner releases them after the stance or stance batch.
