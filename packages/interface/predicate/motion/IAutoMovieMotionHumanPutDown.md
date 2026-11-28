# src/motion/IAutoMovieMotionHumanPutDown.ts#IAutoMovieMotionHumanPutDown.IParams

## @evidence contracts/development/common.md#meaningful-documentation

The comments identify the held subject, the world mark in metres, the optional bone and prop attachments, the resting attitude in degrees or a unit quaternion, and the default hand.

## @evidence contracts/development/design.md#principled-representation

A placement takes named scene entities and physical frames. The planner computes the hand frame from its stored prop offset and the chosen destination. It constrains the displayed origin to the task's positional bound even with a free heading.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The action reuses the scene subject, human side, world point and quaternion types. Its planner owns the wrist fit and the phase durations.

# src/motion/IAutoMovieMotionHumanPutDown.ts#IAutoMovieMotionHumanPutDown.IParamsOnto

## @evidence contracts/development/common.md#meaningful-documentation

The fields distinguish the receiver's affordance from the held prop's optional source socket and state which origin applies when the source socket is absent.

## @evidence contracts/development/design.md#principled-representation

A prop-mounted placement retains the receiver and its named frame so playback follows the material it actually rides. The optional source point changes the source frame while preserving the destination frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The receiver lookup owns both named material frames. The mounting record carries their identifiers so the planner can read each frame on the production clock.

# src/motion/IAutoMovieMotionHumanPutDown.ts#IAutoMovieMotionHumanPutDown.IParamsOn

## @evidence contracts/development/common.md#meaningful-documentation

The fields identify the performer's bone and describe the local transform and its translation units.

## @evidence contracts/development/design.md#principled-representation

A worn placement stores its target in the posed bone's frame. The rigid transform preserves the prop pose relative to that bone while the performer moves.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The bone uses the shared humanoid slot type. The offset uses the shared rigid transform. The performance owns applying them to its body pose.

# src/motion/IAutoMovieMotionHumanPutDown.ts#IAutoMovieMotionHumanPutDown.IParams.prop

## @evidence contracts/development/common.md#meaningful-documentation

The scene subject identifies the prop currently held by the chosen hand.

# src/motion/IAutoMovieMotionHumanPutDown.ts#IAutoMovieMotionHumanPutDown.IParams.to

## @evidence contracts/development/common.md#meaningful-documentation

The target marks the prop origin in world metres and is required for a placement without a receiver.

# src/motion/IAutoMovieMotionHumanPutDown.ts#IAutoMovieMotionHumanPutDown.IParams.on

## @evidence contracts/development/common.md#meaningful-documentation

The performer bone and its local frame take over the prop at the played placed instant.

# src/motion/IAutoMovieMotionHumanPutDown.ts#IAutoMovieMotionHumanPutDown.IParams.onto

## @evidence contracts/development/common.md#meaningful-documentation

The receiving prop and socket take the prop at placed. The documented fit constraints and release phase apply if the receiver is moving.

# src/motion/IAutoMovieMotionHumanPutDown.ts#IAutoMovieMotionHumanPutDown.IParams.yaw

## @evidence contracts/development/common.md#meaningful-documentation

Yaw gives the resting heading about world +Y in degrees. The omitted heading allows a reachable fit around the entered attitude.

# src/motion/IAutoMovieMotionHumanPutDown.ts#IAutoMovieMotionHumanPutDown.IParams.rotation

## @evidence contracts/development/common.md#meaningful-documentation

The optional unit quaternion gives the resting attitude of a world-point placement. Its up axis constrains the fit even when heading is free.

# src/motion/IAutoMovieMotionHumanPutDown.ts#IAutoMovieMotionHumanPutDown.IParams.hand

## @evidence contracts/development/common.md#meaningful-documentation

The holding hand owns the approach and release, with the right hand used by default.

# src/motion/IAutoMovieMotionHumanPutDown.ts#IAutoMovieMotionHumanPutDown.IParamsOnto.prop

## @evidence contracts/development/common.md#meaningful-documentation

This subject selects the prop whose posed socket receives the held object.

# src/motion/IAutoMovieMotionHumanPutDown.ts#IAutoMovieMotionHumanPutDown.IParamsOnto.point

## @evidence contracts/development/common.md#meaningful-documentation

This affordance selects the receiver's actual mounted site.

# src/motion/IAutoMovieMotionHumanPutDown.ts#IAutoMovieMotionHumanPutDown.IParamsOnto.via

## @evidence contracts/development/common.md#meaningful-documentation

An optional affordance on the held prop aligns it to the receiving site. Otherwise its origin takes that position.

# src/motion/IAutoMovieMotionHumanPutDown.ts#IAutoMovieMotionHumanPutDown.IParamsOn.bone

## @evidence contracts/development/common.md#meaningful-documentation

The bone names the receiving segment on the performer.

# src/motion/IAutoMovieMotionHumanPutDown.ts#IAutoMovieMotionHumanPutDown.IParamsOn.offset

## @evidence contracts/development/common.md#meaningful-documentation

This local rigid frame places the prop relative to the posed bone, with translation in metres.
