# src/motion/human/perform/IAutoMovieMotionHumanPropDynamics.ts#IAutoMovieMotionHumanPropDynamics.IHingeDrive

## @evidence contracts/development/common.md#meaningful-documentation

Specifies the starting state, hold, torque sign and local clock, scheduling, duration and inertia units.

## @evidence contracts/development/design.md#principled-representation

A named hinge selects one degree of freedom. The required start uses the canonical scheduled instant and the required torque provider receives elapsed seconds. The planner admits the hinge, positive finite scalars, sampled torque and travel.

## @evidence contracts/development/design.md#minimal-and-owned-surface

HumanPropDynamics.hingeProp integrates the specified inertia and local torque, then publishes the selected articulation on the existing prop track clock.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The same fields describe any named hinge with an admitted articulation input. All physical values are authored explicitly.

# src/motion/human/perform/IAutoMovieMotionHumanPropDynamics.ts#IAutoMovieMotionHumanPropDynamics.ISlideDrive

## @evidence contracts/development/common.md#meaningful-documentation

States the world direction, film interval, newton input and who supplies the contact coefficients.

## @evidence contracts/development/design.md#principled-representation

A ground direction and scalar force describe translation along a single axis, with independent film start and end times.

## @evidence contracts/development/design.md#minimal-and-owned-surface

HumanPropDynamics.slideProp uses the same force profile as the numerical slide while reading mass and friction from the prop model.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

There are no defaults for contact coefficients, applied force or the slide interval.

# src/motion/human/perform/IAutoMovieMotionHumanPropDynamics.ts#IAutoMovieMotionHumanPropDynamics.ISlide

## @evidence contracts/development/common.md#meaningful-documentation

force: The horizontal force along the push at a second, newtons, positive along it. Pure. from: Start, seconds. to: End, seconds.

## @evidence contracts/development/design.md#principled-representation

force: The horizontal force along the push at a second, newtons, positive along it. Pure. from: Start, seconds. to: End, seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: perform/HumanPropDynamics.ts (HumanPropDynamics.slide, props).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanPropDynamics.slide.
