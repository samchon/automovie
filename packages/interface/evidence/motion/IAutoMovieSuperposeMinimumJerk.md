# src/motion/IAutoMovieSuperposeMinimumJerk.ts#IAutoMovieSuperposeMinimumJerk.IUnit

## @evidence contracts/development/common.md#meaningful-documentation

Each unit adds metres in the origin's frame over a positive duration on one seconds clock. Results are fresh position, velocity and acceleration vectors in metres, metres per second and metres per second squared; the producer rejects nonpositive duration and minimumJerk admits each normalized sample.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

IAutoMovieSuperposeMinimumJerk.IUnit keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.

## @evidence contracts/development/design.md#principled-representation

Each unit adds metres in the origin's frame over a positive duration on one seconds clock. Results are fresh position, velocity and acceleration vectors in metres, metres per second and metres per second squared; the producer rejects nonpositive duration and minimumJerk admits each normalized sample. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical IAutoMovieSuperposeMinimumJerk.IUnit contract belongs to interface; packages/engine/src/motion/superposeMinimumJerk.ts and packages/motions/src/handling/HumanPrehension.ts use this boundary. Runtime computation remains with those consumers.

# src/motion/IAutoMovieSuperposeMinimumJerk.ts#IAutoMovieSuperposeMinimumJerk.IState

## @evidence contracts/development/common.md#meaningful-documentation

Each unit adds metres in the origin's frame over a positive duration on one seconds clock. Results are fresh position, velocity and acceleration vectors in metres, metres per second and metres per second squared; the producer rejects nonpositive duration and minimumJerk admits each normalized sample.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

IAutoMovieSuperposeMinimumJerk.IState keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.

## @evidence contracts/development/design.md#principled-representation

Each unit adds metres in the origin's frame over a positive duration on one seconds clock. Results are fresh position, velocity and acceleration vectors in metres, metres per second and metres per second squared; the producer rejects nonpositive duration and minimumJerk admits each normalized sample. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical IAutoMovieSuperposeMinimumJerk.IState contract belongs to interface; packages/engine/src/motion/superposeMinimumJerk.ts and packages/motions/src/handling/HumanPrehension.ts use this boundary. Runtime computation remains with those consumers.
