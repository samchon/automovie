# src/construction/IAutoMovieViewJointedCourse.ts#IAutoMovieViewJointedCourse.ITurn

## @evidence contracts/development/common.md#meaningful-documentation

The comment relates angular change, arclength and symmetrical preparation to the straight-joint case.

## @evidence contracts/development/design.md#principled-representation

ViewJointedCourse.prepare derives angle and axis from the adjoining unit directions. Integration of turn displacement supplies the setback, and accepted segments reserve that distance before assigning the turn start.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The record carries geometry and station placement needed by straight-run extraction and by analytic axis evaluation. The original centreline inputs live with the course owner.

# src/construction/IAutoMovieViewJointedCourse.ts#IAutoMovieViewJointedCourse.ITurn.centre

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the index space for the turn owner.

# src/construction/IAutoMovieViewJointedCourse.ts#IAutoMovieViewJointedCourse.ITurn.half

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives the half-length unit and the straight case.

# src/construction/IAutoMovieViewJointedCourse.ts#IAutoMovieViewJointedCourse.ITurn.angle

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the angle whose quintic progression is evaluated.

# src/construction/IAutoMovieViewJointedCourse.ts#IAutoMovieViewJointedCourse.ITurn.axis

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives the directional scale and straight sentinel.

# src/construction/IAutoMovieViewJointedCourse.ts#IAutoMovieViewJointedCourse.ITurn.setback

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the length that sets straight-run offsets.

# src/construction/IAutoMovieViewJointedCourse.ts#IAutoMovieViewJointedCourse.ITurn.start

## @evidence contracts/development/common.md#meaningful-documentation

The comment fixes the timebase used by turn evaluation.

# src/construction/IAutoMovieViewJointedCourse.ts#IAutoMovieViewJointedCourse.ICourse

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the two index spaces and what the shared preparation establishes.

## @evidence contracts/development/design.md#principled-representation

ViewJointedCourse.prepare computes positive segment lengths and turning data, rejects opposed bends and overlapping setbacks, and assigns each remaining turn its physical arclength start.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One preparation feeds both ViewAxis.runs and the transported frame. Callers can reuse it without rediscovering setbacks.

# src/construction/IAutoMovieViewJointedCourse.ts#IAutoMovieViewJointedCourse.ICourse.directions

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the direction array's indexing and scale.

# src/construction/IAutoMovieViewJointedCourse.ts#IAutoMovieViewJointedCourse.ICourse.lengths

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the source separation represented by the length array.

# src/construction/IAutoMovieViewJointedCourse.ts#IAutoMovieViewJointedCourse.ICourse.turns

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the turns shared by station placement and evaluation.
