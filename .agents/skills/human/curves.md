# Original 2D Curves

Author the shape through anatomical points, construction lines and visible curve controls before composing its source or judging its loft. Choose a convenient authoring representation; changing a polynomial basis alone preserves its shape and cannot repair wrong datums, domains or boundary conditions.

## Start With A Sketch

1. Declare the anatomical plane, local origin, axes, units, actual domain and parameter. Place the measured landmarks, widths, heights, extrema and shared boundary from their generating owners. Keep direct shape controls separate from locked measurements under [Construction](construction.md#parametric-identity-and-binding).
2. Draw the straight scaffold between those points, the intended tangent lines and the source's actual support limits. An anatomically dimensioned local rectangle is useful for Hermite too: it supplies support limits, while endpoints, tangents and curvature still determine the curve. Compare these aids with the reference individually and with neighbours before adding curvature. Check the ordering of every connection's start, course and end, including phase-dependent heights. An impossible ordering is an input or construction problem, not a reason to relax admission.
3. Use a few local segments and expose their actual controls: a polynomial control polygon or equivalent Hermite handles, conic controls, or the native field's own geometric guides. Do not invent a Bézier representation by sampling a different source. Distinguish interpolation points, off-curve control points and evaluated points. Derive handles from dimensions, anatomy or a declared geometric construction; they do not become new public anatomical parameters. Uniform polynomial control points on a chord give an exact straight baseline, not a measured shape prior.
4. Show the actual curve with its scaffold, control polygon and endpoint tangent directions through the existing line/curve display adapters. Keep authoring aids distinct from original anatomical curves and generated loft curves. Inspect the actual curve over the reference with its neighbours; do not build another editor or make full physical2, raw lofting or a whole test run prerequisites for available Point0 inspection.

## Choose The Representation

| Need                                              | Choice and limit                                                                                                                                                                                                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A justified straight or conic feature             | Reuse the existing line/conic owner. A polynomial Bézier is not an exact circle or ellipse; a rational representation has its own weights and derivative rules.                                                                                                                           |
| A short span controlled by endpoints and tangents | A cubic Bézier has four control points. Its nonzero first and last edges expose the endpoint tangent directions. It cannot independently prescribe both endpoint second derivatives as well.                                                                                              |
| Positions and two derivatives fixed at both ends  | A quintic Hermite span and its six-point polynomial Bézier form are exactly interchangeable in the same parameter. Use visible handles for authoring while retaining the existing engine evaluator when it carries the contract.                                                          |
| Many segments needing local edits                 | A clamped B-spline offers local support. At an interior knot, degree minus multiplicity determines continuity; an interior control point is generally not an interpolation point. Use it when that editing/domain contract is needed, rather than raising one global polynomial's degree. |
| A monotone scalar sketch                          | PCHIP can avoid scalar overshoot, but its second derivative can jump. It is not a replacement for a promised C2 skin source without a construction that supplies that continuity.                                                                                                         |

These choices follow the primary descriptions of [Bézier construction](https://pages.mtu.edu/~shene/COURSES/cs3621/NOTES/spline/bezier-construct.html), [endpoint derivatives](https://pages.mtu.edu/~shene/COURSES/cs3621/NOTES/spline/bezier-der.html), [B-spline local support](https://pages.mtu.edu/~shene/COURSES/cs3621/NOTES/spline/bspline-curve-prop.html), [CAD knot continuity](https://occt3d.com/dev/doc/refman/html/class_geom2d___b_spline_curve.html) and [PCHIP's continuity limit](https://docs.scipy.org/doc/scipy/reference/generated/scipy.interpolate.PchipInterpolator.html). They establish geometric properties, not an anatomical law or a measured speedup.

## Preserve The Actual Parameter

For a polynomial quintic span in its original parameter `q`, let `h = q1 - q0 > 0`. Let `A`, `B` be endpoint positions, `A1`, `B1` their first derivatives in `q`, and `A2`, `B2` their second derivatives. Its Bézier control points are:

```text
P0 = A
P1 = A + h*A1/5
P2 = A + 2*h*A1/5 + h*h*A2/20
P3 = B - 2*h*B1/5 + h*h*B2/20
P4 = B - h*B1/5
P5 = B
```

This is a basis conversion derived from the Bézier endpoint derivative equations, not a sampled fit. It applies componentwise only where the coordinates are polynomial in that same parameter. The current engine's `AutoMovieViewHermite` already uses these controls for sufficient scalar hull admission and evaluates the equivalent quintic. Reuse its actual source data rather than create a second evaluator or clamp an authored handle to pass a range check.

Convert units and apply the declared parameter/frame chain rule first. Existing knot jets can be normalized by the whole source span, while the formula uses derivatives in `q` and this segment's span. A physical-height interval is not an angle/root interval. An exact scalar conversion in that chart does not make a non-polynomial world-coordinate map an exact polynomial Bézier. Keep original poles and unavailable derivatives explicit.

## Diagnose The Controls

The Bézier convex-hull property bounds a polynomial span by its control points in the same coordinate frame. Ordered control-point components give a sufficient monotonicity condition through the derivative's control polygon. Failure of that sufficient condition does not prove a bad curve; use the actual derivative and supported extrema analysis. A finite set of values does not prove that no reversal lies between them.

Aligned nonzero incoming and outgoing handles with the same directed tangent establish G1, not equal parameter speed or C2 continuity. Verify the shared owner's actual derivatives under direction, scale and frame maps. If an endpoint derivative points against an intended monotone interval, another basis cannot satisfy both demands: resolve the datum, domain, anatomical expectation or incompatible source condition first. Do not zero a genuine derivative, move a locked measurement, fit the reference, or hide the original defect under a downstream blend.

Follow [Verification](verification.md#curves-against-the-reference) for acceptance. Move an accepted original immediately to its actual loft-curve, curve-plus-clay and skin observations with the affected neighbours.
