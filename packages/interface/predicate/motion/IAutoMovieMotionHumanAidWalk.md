# src/motion/IAutoMovieMotionHumanAidWalk.ts#IAutoMovieMotionHumanAidWalk.IStation

## @evidence contracts/development/common.md#meaningful-documentation

The fields state the world displacement in metres, the relative heading in degrees, the time to advance, and the time to keep the aid and both feet planted with the grips held.

## @evidence contracts/development/design.md#principled-representation

An arrival and a hold are separate quantities on one station. The prop track and foot plan advance on the same clock. A hold preserves the station's material support while retaining the chosen hand contacts.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The existing station owns its optional hold. A station without a hold retains its timing. The aid-walk law derives both named hold instants and the next advance.

# src/motion/IAutoMovieMotionHumanAidWalk.ts#IAutoMovieMotionHumanAidWalk.IStation.x

## @evidence contracts/development/common.md#meaningful-documentation

The field gives the station's displacement along world X in metres relative to the entry station.

# src/motion/IAutoMovieMotionHumanAidWalk.ts#IAutoMovieMotionHumanAidWalk.IStation.z

## @evidence contracts/development/common.md#meaningful-documentation

The field gives the station's displacement along world Z in metres relative to the entry station.

# src/motion/IAutoMovieMotionHumanAidWalk.ts#IAutoMovieMotionHumanAidWalk.IStation.turn

## @evidence contracts/development/common.md#meaningful-documentation

The field gives the heading change in degrees relative to action entry, with zero as its default.

# src/motion/IAutoMovieMotionHumanAidWalk.ts#IAutoMovieMotionHumanAidWalk.IStation.seconds

## @evidence contracts/development/common.md#meaningful-documentation

The field gives positive film seconds for the advance of the aid and both feet through the station.

# src/motion/IAutoMovieMotionHumanAidWalk.ts#IAutoMovieMotionHumanAidWalk.IStation.pause

## @evidence contracts/development/common.md#meaningful-documentation

The field gives finite, nonnegative film seconds after the feet arrive, defaults to zero, and names the two timed cues a positive hold emits.
