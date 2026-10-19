# Schaefer, Warren and Zorin 2004, lofting curve networks with subdivision

Schaefer S., Warren J., Zorin D. "Lofting Curve Networks using Subdivision Surfaces." Eurographics Symposium on Geometry Processing 2004, pp. 105-116. [Author PDF](https://people.engr.tamu.edu/schaefer/research/lofting.pdf). Read: full text.

## Licence

Paper copyright the Eurographics Association. Human takes only the method.

## What it says

- Standard Catmull-Clark cannot interpolate a network of cubic splines, because the image of a curve incident on an extraordinary vertex is not piecewise polynomial.
- The method builds a cubic B-spline network from a polyline network, quadrangulates each patch bounded by a closed loop of curves, fairs the base mesh, and applies Catmull-Clark modified near the curves so the limit surface interpolates the network. Curves may be tagged as creases and may terminate or continue through corners.
- Near the curves the surface is a C2 bicubic spline except where three or more curves meet; there it is proven C1 with bounded curvature in the most common cases and observed C1 in general. Partially lofted corners can be only C0.
- Proposition 1: for a closed loop made of `k` open polylines, any quadrangulation satisfies `sum |val(p_i) - v_i| >= |k - 4|`, with `v_i` 2 at corners, 3 on the loop and 4 inside; with valences of at most 5 at least `|k - 4|` extraordinary vertices are required. Their quadrangulation uses only valences 3 and 5, at most `k - 2` of valence 5 and 2 of valence 3.
- The base mesh comes from fairing the cage under the interpolation constraint, a symmetric indefinite system on which conjugate gradient does not apply; a direct solve is acceptable up to several hundred control points. Fairing the base mesh was simpler than evaluating the surface functional of Halstead, Kass and DeRose and gave good results.

## What Human takes

The route to a cage whose limit contains named curves exactly, and the lower bound on extraordinary vertices per curve-bounded region ([subdivision and cage](../techniques/subdivision-and-cage.md), [junctions](../techniques/junction-and-seams.md#branch-patches)).
