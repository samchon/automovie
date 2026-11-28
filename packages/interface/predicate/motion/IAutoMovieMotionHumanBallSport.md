# src/motion/IAutoMovieMotionHumanBallSport.ts#IAutoMovieMotionHumanBallSport.IDribblePush

## @evidence contracts/development/common.md#meaningful-documentation

The parameter record gives the grounded carrier, ball subject, optional side, outgoing world velocity and placement of a later touch.

## @evidence contracts/development/design.md#principled-representation

The missing incoming field selects a sphere already held by the chosen hand. A provided incoming reference requires both a push anchor and the elapsed seconds from launch. The emitted flight remains owned by the staged prop solver, which validates the referenced approach and the final boundary.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The subject and side reuse canonical identifiers. The vector uses the same world frame as the prop flight. The carrier still determines travel and support, and the flight owner decides the bounce and custody.

# src/motion/IAutoMovieMotionHumanBallSport.ts#IAutoMovieMotionHumanBallSport.IDribblePush.ball

## @evidence contracts/development/common.md#meaningful-documentation

Names the live portable sphere that the law reads and launches.

# src/motion/IAutoMovieMotionHumanBallSport.ts#IAutoMovieMotionHumanBallSport.IDribblePush.hand

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the hand that opens its grip or follows the rising ball. The selected side defaults to the right.

# src/motion/IAutoMovieMotionHumanBallSport.ts#IAutoMovieMotionHumanBallSport.IDribblePush.velocity

## @evidence contracts/development/common.md#meaningful-documentation

Every component is finite in world metres per second. Negative y makes each publication a downward push.

# src/motion/IAutoMovieMotionHumanBallSport.ts#IAutoMovieMotionHumanBallSport.IDribblePush.incoming

## @evidence contracts/development/common.md#meaningful-documentation

An incoming reference places a touch on the named rising flight. Omitting it enters the push from an existing hold.

# src/motion/IAutoMovieMotionHumanBallSport.ts#IAutoMovieMotionHumanBallSport.IDribbleIncoming

## @evidence contracts/development/common.md#meaningful-documentation

The anchor names the source push and the positive offset gives the touch relative to that push's actual release.

## @evidence contracts/development/design.md#principled-representation

The anchor and offset identify one planned arrival without saving a sampled ball frame. The action resolves it against the native trajectory.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The same placed anchor and seconds used by other staging actions identify the source and time. The prop reader owns the actual incoming frame.

# src/motion/IAutoMovieMotionHumanBallSport.ts#IAutoMovieMotionHumanBallSport.IDribbleIncoming.from

## @evidence contracts/development/common.md#meaningful-documentation

The named anchor belongs to this performer's preceding push of the same sphere.

# src/motion/IAutoMovieMotionHumanBallSport.ts#IAutoMovieMotionHumanBallSport.IDribbleIncoming.seconds

## @evidence contracts/development/common.md#meaningful-documentation

The positive offset measures seconds from the earlier release to the palm touch.
