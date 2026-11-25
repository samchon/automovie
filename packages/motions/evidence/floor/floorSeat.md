# src/floor/floorSeat.ts#floorSeat.place

## @evidence contracts/development/common.md#meaningful-documentation

States what moves, from where to where, and when the hand bears.

## @evidence contracts/development/implementation.md#principled-implementation

Each ankle and each knee's bend point travel a straight line from where the posture's own joints put them, so the legs are continuous with the joint posture at no share, to places on the floor the leg solve then meets inside the joints' ranges.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One forward-kinematics pass, one frame, one pass over the legs and the hand.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A place out of a leg's reach is not checked here: the limb fit leaves the ankle short of it, which the contact audit reports.

## @evidence contracts/development/implementation.md#efficient-algorithms

The canonical solve remains; its FK requests only hips, knees and ankles, plus the left arm when side sitting needs its supporting hand.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Borrows a synchronous parent FK/ROM source for actual complete current direct-joint/digit admission and final demanded frames; only raw limb goals are cleared as before, and no posed answer is retained.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Local reader and current bones end on return or throw, without entering the returned authored goals or retaining either parent loan.

# src/floor/floorSeat.ts#floorSeat.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States fixed body/kind provenance, current posture/share/heading, nonpositive identity branch, original world-metre goals and optional current-query metadata lifetime.

## @evidence contracts/development/implementation.md#principled-implementation

The same native complete limb-cleared joint/digit solve supplies actual hip/knee/ankle frames and the supporting arm when required. The original table shares scale by the body's thigh into floor-frame targets; actual current hip midpoint/yaw then place every target before the same leg/hand interpolation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Fixed table scaling and native FK name preparation precede one current-placement reader. A single current HumanFrame preparation serves all leg targets and side-hand directions; raw place delegates this owner after its original zero-share guard.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps the original share clamp, complete current direct/digit admission, raw limb clearing, arm reach formula, native hand rotation/Bend hint, goals and planted threshold. No achieved pose, endpoint shortcut, contact or tolerance is prepared.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed table products and FK name indexing prepare once across Q writes; each active write retains its complete current solve, demanded ancestor frames and actual goal construction. One yaw sine/cosine pair serves all original same-frame transforms instead of rebuilding them per target/direction; speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Unchanged body measures, rig and sitting table establish static target/name equivalence. Every root, joint, goal, hip midpoint, current yaw, limb interpolation and supporting-arm reach remains evaluated; optional parent FK/ROM sources share only native checked prerequisites.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The owning plan retains four fixed local target vectors and one bounded name reader until release. Current frame/pose/map and borrowed FK/ROM end with each write; fresh goals retain neither reader nor prior-query data.
