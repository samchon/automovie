# src/motion/composition/IAutoMovieMeasureSchedule.ts#IAutoMovieMeasureSchedule

## @evidence contracts/development/common.md#meaningful-documentation

Classification callbacks use borrowed schedule entries and film-time intervals; displacements are metres, rates are per minute and shares are dimensionless. Callback exceptions propagate; returned measurement records are fresh and callers own numeric validity.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

This namespace groups the IAutoMovieMeasureSchedule contracts used by packages/engine/src/composition/measureAutoMovieSchedule.ts; each nested declaration retains its own shape and domain constraints, without an implementation-package dependency.

## @evidence contracts/development/design.md#principled-representation

Classification callbacks use borrowed schedule entries and film-time intervals; displacements are metres, rates are per minute and shares are dimensionless. Callback exceptions propagate; returned measurement records are fresh and callers own numeric validity. The namespace groups these type contracts without implementing the operation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical IAutoMovieMeasureSchedule contract belongs to interface; packages/engine/src/composition/measureAutoMovieSchedule.ts uses its nested records and callbacks. Runtime computation remains with those consumers.

# src/motion/composition/IAutoMovieMeasureSchedule.ts#IAutoMovieMeasureSchedule.IClassify

## @evidence contracts/development/common.md#meaningful-documentation

Gives classifier defaults, signed displacement interpretation, callback lifetime and presence timebase.

## @evidence contracts/development/design.md#principled-representation

Callbacks describe action membership and film-time intervals; absolute metre displacements yield lateral share. Numeric validity remains the classifier's responsibility.

## @evidence contracts/development/design.md#minimal-and-owned-surface

measureAutoMovieSchedule borrows schedule entries and executes these production policies synchronously without retaining callbacks.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Independent optional classifiers omit particular measurements; they do not represent conflicting states of one variant.

# src/motion/composition/IAutoMovieMeasureSchedule.ts#IAutoMovieMeasureSchedule.ISubject

## @evidence contracts/development/common.md#meaningful-documentation

Defines lateral fraction and uncovered presence duration, including zero displacement.

## @evidence contracts/development/design.md#principled-representation

lateralShare is a dimensionless absolute-displacement ratio; idleSeconds is presence duration minus the union of non-idle intervals, floored at zero.

## @evidence contracts/development/design.md#minimal-and-owned-surface

measureAutoMovieSchedule constructs one record per subject appearing in the entries.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Idle time is measured from interval coverage rather than summing overlapping actions twice.

# src/motion/composition/IAutoMovieMeasureSchedule.ts#IAutoMovieMeasureSchedule.IMeasure

## @evidence contracts/development/common.md#meaningful-documentation

States rate denominators, overlap handling, empty subjects and zero-duration behavior.

## @evidence contracts/development/design.md#principled-representation

Action/cut rates use minutes, combination and camera-motion values are dimensionless fractions, and subject metrics are keyed by the schedule's actual subjects.

## @evidence contracts/development/design.md#minimal-and-owned-surface

measureAutoMovieSchedule returns these fresh mutable reporting records without retaining caller classifiers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No camera or action vocabulary is embedded; the production classifies entries through IClassify.
