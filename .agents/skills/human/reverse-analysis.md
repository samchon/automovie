# Reverse Analysis

## Principal Structure

Begin with the complete [recovered Hermite material](references.md), its curve relationships and comparable whole-body measurements. Identify which curves belong to the same physical feature across layers and people before fitting. Equal loop counts, curve order and equal phase values do not establish correspondence.

Choose principal layers where silhouette, volume, feature placement or topology changes. Choose principal axes and guide curves that locate these layers and respond to named [parameters](parameters.md). Determine the layer count from the represented features and supported error, separately from renderer tessellation. Establish shared origins, directions, planes, endpoints and branch relationships before solving coefficients.

For each region, state independent inputs, determined constraints and remaining unknown shape coefficients. Trace each common equation from its recovered observations to its generating function and skin consumer. Keep person-specific absolute controls in observation storage; transfer common rules and coefficients rather than per-person control tables or normalized specimen copies.

## Hierarchical Identification

Between adjacent principal layers or axes, derive an intermediate layer or axis, then recurse into the two child intervals. This bisection subdivides a construction domain; it is not a requirement to solve every equation with scalar root bisection. A split adds representational freedom only where the observed shape or a feature requires it. Arithmetic averaging alone cannot invent a waist, pelvic transition, knuckle or facial feature.

Use recovered shape ratios, feature locations, tangents and neighboring constraints to identify the intermediate rule. A useful mathematical organization is `C(s,u;q,theta)`: `s` locates the layer, `u` addresses its curve, `q` contains independent physical parameters and `theta` contains uncertain shared coefficients. Fix correspondence and explicit constraints first, then solve only `theta`; do not alter an independent breadth or depth to compensate for a wrong branch or interpolation operator.

Use direct constraint solving when the system determines a solution, linear least squares when the unknown coefficients enter linearly, and bounded nonlinear least squares when they do not. Scale residuals by their physical meaning and retain hard shared-boundary constraints rather than hiding them in an aggregate score. State rank deficiency, non-uniqueness, initialization dependence and unsupported extrapolation. A solver's termination is not proof of the chosen model or a global solution.

Keep principal structure stable while evaluating child refinement, and preserve inherited boundaries and continuity. Prefer a compact common rule over increasing order, arbitrary cuts or person-specific traits to chase small residuals. Identify an unresolved relationship with a minimal controlled pair changing one cause, rather than expanding every observation at once.

## Method Evidence

[Forsey and Bartels' local refinement](https://graphicsinterface.org/wp-content/uploads/2015/03/gi1988-17.pdf) motivates local hierarchical control; their [surface fitting study](https://www.cs.ubc.ca/sites/default/files/tr/1995/TR-95-33_0.pdf) decomposes fitting into smaller problems under structured parameter correspondence. These are possible mathematical tools, not evidence that an arbitrary human branch network has a valid rectangular parameterization.

[Curve-network interpolation](https://arxiv.org/abs/1312.5533) provides a constructive result for its specified spline network and compatibility conditions. Check those premises before applying an operator to recovered sections and guides. [Bounded linear least squares](https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.lsq_linear.html) and [nonlinear least squares](https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.least_squares.html) document solver choices; neither SciPy nor one particular solver is mandatory.

## Distinguish The Claims

Report reference reproduction, independent parameter response and prediction of unobserved forms separately. Reserve observations or parameter combinations before fitting when evaluating prediction; samples from the fitted generator are not independent evidence. More curves from the same people increase observation density, not population coverage.

Use [Verification](verification.md) for actual parameter observations, complete correction rounds and the response to a repeatedly failed representation.
