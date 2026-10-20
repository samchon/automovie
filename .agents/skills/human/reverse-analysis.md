# Reverse Analysis

## Principal Structure

Analyze the complete [saved curves and relationships](references.md) before selecting principal layers, axes and feature boundaries. Establish correspondence across people and neighboring layers from physical features and shared frames; equal loop counts or equal curve phases do not establish it.

Choose layers at meaningful silhouette, volume, feature and topology changes, separately from mesh tessellation. Determine which existing inputs move each principal axis and boundary, then state the remaining unknown common shape coefficients.

## Recursive Intermediate Rules

Between adjacent principal axes or layers, derive an intermediate one and recurse into the two child intervals. This bisection subdivides the construction domain; it does not prescribe scalar root bisection for every equation. Use observed shape ratios, feature positions, tangents and neighboring constraints, because averaging alone cannot create the missing shape.

Separate layer position `s`, curve parameter `u`, physical inputs `q` and uncertain coefficients `theta` in the common curve family `C(s,u;q,theta)`. Fix correspondence and shared constraints before fitting `theta`; preserve inherited boundaries when refining children.

Use direct solving for determined constraints, linear least squares for linear coefficients, and bounded nonlinear methods where needed. State identifiability, initialization dependence and unsupported ranges; solver termination establishes neither a correct representation nor a global solution. Add complexity only where the observed shape requires it.

[Hierarchical spline fitting](https://www.cs.ubc.ca/sites/default/files/tr/1995/TR-95-33_0.pdf) and [curve-network interpolation](https://arxiv.org/abs/1312.5533) provide possible methods under their correspondence and compatibility assumptions. Check those premises rather than treating either method as proof of whole-body success.
