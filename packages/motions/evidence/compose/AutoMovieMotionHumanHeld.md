# src/compose/AutoMovieMotionHumanHeld.ts#AutoMovieMotionHumanHeld

## @evidence contracts/development/common.md#meaningful-documentation

States each input, the result's frame and the two refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The prop's displayed frame at the entry second taken into the displayed hand's grip frame (inverse(hand) times prop), the offset the performance itself keeps while the grip holds.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The fact of holding, then one change of frame.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A prop that is not in the hand is refused instead of being carried from where it lies.

## @evidence contracts/development/implementation.md#efficient-algorithms

One entry FK admits all authored joints and computes only HumanHand.frameBones' actual grip-frame dependencies; unrelated world frames are omitted.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanHeld.ts#AutoMovieMotionHumanHeld.grasped

## @evidence contracts/development/common.md#meaningful-documentation

States what is read and in which frame.

## @evidence contracts/development/implementation.md#principled-implementation

The same change of frame as `of` (inverse(hand) times prop, from the grip socket), with the grip socket the candidate wrist puts at its hand's offset.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One grip socket and one change of frame.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Holding is not asserted: the record is what the grip would hold.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The held record `point` and the tool reading (`StrikingHeld.read`) take, so a grasp's use is judged on the frame the hold will keep.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanHeld.ts#AutoMovieMotionHumanHeld.point

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the two results with their frame and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

An affordance's translation is its point and its rotated `+Y` its outward direction, the affordance record's own convention, each carried by the held frame's rigid transform.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup and one rigid transform.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing contact is refused, never replaced by the prop's origin.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Linear in the prop's few contacts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/compose/AutoMovieMotionHumanHeld.ts#AutoMovieMotionHumanHeld.grip

## @evidence contracts/development/common.md#meaningful-documentation

States what the window does.

## @evidence contracts/development/implementation.md#principled-implementation

A held hand may be driven only by an action that declares a grip on its prop, the performance's rule; the window spans the action, so the prop never leaves the hand in it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its input.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/compose/AutoMovieMotionHumanHeld.ts#AutoMovieMotionHumanHeld.hold

## @evidence contracts/development/common.md#meaningful-documentation

States what is left held and with which fingers.

## @evidence contracts/development/implementation.md#principled-implementation

The action's grip window ends the earlier hold, so it leaves a hold of its own from its start; the fingers are the displayed ones, which the grip closed until contact.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The fingers are read from the entry pose, never closed again, so the hand does not re-seat what it holds.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One scan of the entry pose's joints.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Reuses `HumanGrip.fingers`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
