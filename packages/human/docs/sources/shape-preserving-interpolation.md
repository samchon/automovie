# Shape-preserving cubic interpolation

Primary papers: Fritsch F.N., Carlson R.E. "Monotone Piecewise Cubic Interpolation." *SIAM J. Numer. Anal.* 17(2):238-246, 1980. Fritsch F.N., Butland J. "A method for constructing local monotone piecewise cubic interpolants." *SIAM J. Sci. Stat. Comput.* 5(2):300-304, 1984. Steffen M. "A simple method for monotonic interpolation in one dimension." *Astron. Astrophys.* 239:443-450, 1990. Akima H. "A new method of interpolation and smooth curve fitting based on local procedures." *J. ACM* 17(4):589-602, 1970, https://doi.org/10.1145/321607.321609. Read: their descriptions in [Wikipedia](https://en.wikipedia.org/wiki/Monotone_cubic_interpolation), the [splines package documentation](https://splines.readthedocs.io/en/latest/euclidean/piecewise-monotone.html), the [SciPy Akima documentation](https://docs.scipy.org/doc/scipy-1.16.1/reference/generated/scipy.interpolate.Akima1DInterpolator.html) and [Moler's makima note](https://blogs.mathworks.com/cleve/?p=4707); the primary texts were not read.

## Licence

Methods only; no code is copied.

## What it says

- Fritsch and Carlson give necessary and sufficient conditions on the endpoint derivatives, relative to the secant slope, for a cubic Hermite segment to be monotone; initial tangents that violate them are reduced, and the tangent is zero where the data is flat.
- Fritsch and Butland's weighted harmonic mean slopes underlie MATLAB `pchip` and SciPy `PchipInterpolator`; the slope is zero at a data point that is a local extremum.
- Steffen's method allows no minimum or maximum between adjacent data points; its first derivative is continuous everywhere.
- Akima's slopes are weighted averages of neighbouring secant slopes from five points; the modified makima weights remove overshoot in flat runs, and its undulation lies between a C2 spline and `pchip`.
- All four are piecewise cubic Hermite interpolants with continuous first derivative only.

## What Human takes

Channel interpolation choices along a lofting axis and their curvature cost ([parametric curve families](../techniques/parametric-curve-family.md#station-channels)).
