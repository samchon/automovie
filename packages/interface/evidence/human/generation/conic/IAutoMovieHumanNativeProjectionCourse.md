# src/human/generation/conic/IAutoMovieHumanNativeProjectionCourse.ts#IAutoMovieHumanNativeProjectionCourse.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

One projected material course and the sampling bounds of the same preparation.

## @evidence contracts/development/design.md#principled-representation

Material breakpoints use millimetres and the speed bound uses world millimetres per material millimetre. The projection owner validates its straight-frame premise.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanNativeProjectionCourse publishes the axis and its bound so downstream readers sample the same source.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The sampling bound describes the axis origin. Surface positions and their own speed are outside this record.

# src/human/generation/conic/IAutoMovieHumanNativeProjectionCourse.ts#IAutoMovieHumanNativeProjectionCourse.IProjectionOwner

## @evidence contracts/development/common.md#meaningful-documentation

Original endpoint projection and a reader tied to its immutable source.

## @evidence contracts/development/design.md#principled-representation

The chord is in world millimetres. Read attempts count the two kinds of source query separately. The project callback admits only its original source identity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Native breast generation reuses the original calibration while creating candidate axes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Source identity and the known straight-frame premise stay with the producer and are checked within its documented scope.
