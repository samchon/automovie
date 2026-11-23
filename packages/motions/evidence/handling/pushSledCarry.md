# src/handling/pushSledCarry.ts#pushSledCarry.IHold

## @evidence contracts/development/common.md#meaningful-documentation

States world-metre wrist/elbow placement and the hand rotation's rest-relative convention.

## @evidence contracts/development/design.md#principled-representation

A measured wrist frame and elbow hint are exactly the existing arm-goal inputs carried by the load; both are required.

## @evidence contracts/development/design.md#minimal-and-owned-surface

pushSled's grasp, candidate samples and runtime carry read both members; HumanHand owns the wrist type.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No guessed hand placement, redundant body model or optional half-hold is represented.

# src/handling/pushSledCarry.ts#pushSledCarry.IFrame

## @evidence contracts/development/common.md#meaningful-documentation

The turn is a world yaw quaternion and hold places an arrival wrist/elbow on this actual current chest while preserving heights.

## @evidence contracts/development/design.md#principled-representation

One rigid floor-motion transform serves both hands and retains the original world-metre hold type.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Candidate judgement reads turn for its handle point and runtime/choice use hold for each actual hand.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The current chest and fixed arrival establish the transform; the record contains no fitted result or contact verdict.

# src/handling/pushSledCarry.ts#pushSledCarry.IFrame.hold

## @evidence contracts/development/common.md#meaningful-documentation

States the fixed arrival/current-frame relation, world-metre hold, fresh output and preserved point heights.

## @evidence contracts/development/implementation.md#principled-implementation

prepare returns this operation as currentChest + RY(point-arrivalChest), restoring each point's original world Y, with wrist rotation normalize(RY * originalRotation); RY is the actual current-minus-arrival chest heading.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The same moved point transform places the wrist and elbow hint, while one quaternion composition carries the hand's attitude.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The operation changes no IK goal, contact threshold, capsule or tolerance and retains the original yaw-only floor-load motion.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each hold performs two fixed-size rigid point transforms and one normalized quaternion product; no skeleton traversal or numerical fit runs here.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both hands share the same current frame's actual yaw quaternion and point transform while the borrowed arrival/current frames remain unchanged; different holds still calculate their own points and attitudes.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Each call returns fresh IHold, wrist, point, bend and rotation records. Its owning frame closure borrows arrival/current bone frames and the fixed yaw for that frame's lifetime, with no queried-hold history or external handle.

# src/handling/pushSledCarry.ts#pushSledCarry.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States the arrival/current frames, the world-metre hold and returned yaw quaternion.

## @evidence contracts/development/implementation.md#principled-implementation

Retains the original rigid translation and yaw rotation about the arrival chest, followed by restoring each carried point's own height; hand rotation composes and normalizes that same yaw.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Arrival heading is fixed once; each supplied chest frame defines one turn and each hold uses the same point transform.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No posture fit, contact tolerance or grip geometry is changed or inferred by this transform.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed arrival heading is prepared once; callers resolve a current chest once for both hands or once per immutable search sample rather than once per hold.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One actual arrival frame serves the load's two hands throughout its action; each differing current chest or hold computes its own transform without a result cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned closure retains only the fixed arrival position and heading for the plan's lifetime; it retains no solver reader or sampled-time history.
