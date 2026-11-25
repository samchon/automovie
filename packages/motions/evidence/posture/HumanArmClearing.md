# src/posture/HumanArmClearing.ts#HumanArmClearing

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs with their units, the result and the fallback.

## @evidence contracts/development/implementation.md#principled-implementation

Each direction is scanned outward in `STEP` degrees for its first clear turn, and the least clear turn is bisected inside that step; the first direction of `ORDER` that clears is taken, so the choice does not depend on which of several clear turns happens to lie nearest.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop over the directions, one scan and one bisection.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No margin is added; a turn that takes a joint farther out of its range than the given arm is ends its direction. A clearing that opens and closes inside one step is missed, the remaining gap.

## @evidence contracts/development/implementation.md#efficient-algorithms

One reading when the arm is clear; otherwise at most twelve readings per direction scanned (a diagonal's length reaches `SPAN` times the square root of 2) and `HALVINGS` more for the one taken.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its readings with nothing to reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/posture/HumanArmClearing.ts#HumanArmClearing.course

## @evidence contracts/development/common.md#meaningful-documentation

States the course, where its keys lie and why, the measured defect of a clearing solved per instant, what is continuous under which condition and what holds between two keys.

## @evidence contracts/development/implementation.md#principled-implementation

A course fixed at shares of the way does not depend on the instant it is read at, so two neighbouring instants read two neighbouring points of one piecewise-linear turn.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The two keys around the share, their two turns and one proportion.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is remembered between calls, so the course is the same in whatever order its instants are read; a body that moves under the arm changes the keys' turns from instant to instant, the remaining place a carried arm can step.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two clearings a call, none at an end, and a scan of the twelve keys.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Stateless by design: a memory of the keys would have to be keyed by the whole pose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/posture/HumanArmClearing.ts#HumanArmClearing.prepareCourse

## @evidence contracts/development/common.md#meaningful-documentation

States the fixed inputs, effect and sampling domain shared with course.

## @evidence contracts/development/implementation.md#principled-implementation

At fixed geometry each correction is a function of its original authored share alone. Between these shares the correction is the course's original linear function.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shares the correction and interval evaluation with the live course.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Evaluates the same clearance at the existing authored shares. No frame, intermediate pose or alternate clearance is retained.

## @evidence contracts/development/implementation.md#efficient-algorithms

One original clearance solve per interior knot, then constant-size interval selection and three current joint blends per sample.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Fixed geometry and endpoint blends establish the invariant key inputs. A moving clearance input requires the live course.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Keeps only two scalars per authored knot and the fixed blend. The clearance and planning callbacks end at preparation.
