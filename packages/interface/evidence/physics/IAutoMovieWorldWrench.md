# src/physics/IAutoMovieWorldWrench.ts#IAutoMovieWorldWrench

## @evidence contracts/development/common.md#meaningful-documentation

Defines world axes, SI units, enclosing-origin ownership and the virtual allocation meaning.

## @evidence contracts/development/design.md#principled-representation

The two vectors carry force and moment; their origin remains explicit on the allocator input or enclosing diagnostic, and the producer admits finite components.

## @evidence contracts/development/design.md#minimal-and-owned-surface

distributePhysicalSupportWrench and trackPhysicalWorld exchange this same requested, allocated and residual quantity without duplicate force/torque records.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A virtual wrench is a controller prediction, not an observed contact impulse; the origin belongs to the enclosing diagnostic.
