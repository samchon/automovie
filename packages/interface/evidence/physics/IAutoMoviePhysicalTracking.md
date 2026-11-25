# src/physics/IAutoMoviePhysicalTracking.ts#IAutoMoviePhysicalTracking.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Bounded joint-frame PD torque demand and its angular tracking diagnostics.

## @evidence contracts/development/design.md#principled-representation

torque uses N m and error uses radians in the joint frame; saturated lists axes whose uncapped demand exceeds their strength-scaled cap.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMoviePhysicalTracking.torque allocates the vectors and axis list without applying them to a body or retaining controller state.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The producer admits positive timestep and effective inertia and strength in [0,1]; callers supply admitted axes and normalized orientations. A capped command is not a measurement of achieved native torque.
