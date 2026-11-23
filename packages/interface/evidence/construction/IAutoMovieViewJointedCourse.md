# src/construction/IAutoMovieViewJointedCourse.ts#IAutoMovieViewJointedCourse.ITurn

## @evidence contracts/development/design.md#principled-representation

Axis/angle and arclength half-span define the quintic tangent rotation; setback and start locate it between admitted segments.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Six fields carry one already admitted corner without another geometry representation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The type does not admit an angle, shorten an overlapping turn or turn a numerical zero into a straight joint.

## @evidence contracts/development/common.md#meaningful-documentation

Members state radians, millimetres, axis direction and source index.

# src/construction/IAutoMovieViewJointedCourse.ts#IAutoMovieViewJointedCourse.ICourse

## @evidence contracts/development/design.md#principled-representation

Prepared directions, lengths and turns share the same centreline definition for frame and run readings.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three finite arrays expose the admitted course without duplicating centreline geometry.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The preparation refuses inadmissible turns instead of shortening or fitting them.

## @evidence contracts/development/common.md#meaningful-documentation

Directions are unit and lengths/start/setbacks are kernel mm; callers keep preparation immutable.
