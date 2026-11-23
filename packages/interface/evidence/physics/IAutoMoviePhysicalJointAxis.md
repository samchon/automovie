# src/physics/IAutoMoviePhysicalJointAxis.ts#IAutoMoviePhysicalJointAxis

## @evidence contracts/development/design.md#principled-representation

Physical angular limits and torque-control coefficients retain their SI units while channel and coordinateSign link them to a provider's authored coordinate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Motor tracking, passive damping and range auditing share one axis record; optional sourceDomain records only an available provider interval.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A named channel does not invent a range or axis, and omitted sourceDomain makes no claim that the physical limits cover an external clinical range.

## @evidence contracts/development/common.md#meaningful-documentation

Defines frame, radian limits, PD units, optional defaults and source-to-physical sign correspondence.
