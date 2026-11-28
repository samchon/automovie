# src/fitting/AutoMovieRecoveryFitting.ts#AutoMovieRecoveryFitting.fitImageLoft

## @evidence contracts/development/common.md#meaningful-documentation

The public comment states the aligned ellipse prior, known calibration, common interval and pixel budget. The result uses metres for the fitted loft and reports its partial physical coverage and refusal outcome.

## @evidence contracts/development/implementation.md#principled-implementation

Each squared silhouette half-width gives a linear constraint on the squared radii and each midpoint on the two centre coordinates. Three separated squared directions test the family. Common-domain interpolation stays between measured stations, and the solver qualifies positive controls and checks fitted support against the caller's residual threshold. Cancellation and callback exceptions preserve their distinct outcomes.

## @evidence contracts/development/implementation.md#efficient-algorithms

The fitter prepares the common row chart and direction factorizations once. It visits the common stations for each trial spline size until the residual qualifies or a work limit is reached. The caller bounds measured rows, views and trial spans. Temporary fits belong to the call, with only the accepted recipe and fit report transferred.

# src/fitting/AutoMovieRecoveryFitting.ts#AutoMovieRecoveryFitting.fitSupportLoft

## @evidence contracts/development/common.md#meaningful-documentation

The public comment identifies the finite-view convex prior, continuous support profiles, measured common interval and qualified residual. The result explains the uncertainty of an unobserved concavity or interior and provides explicit refusal and cancellation outcomes.

## @evidence contracts/development/implementation.md#principled-implementation

Each measured interval yields one support inequality in its camera direction and one in the opposite direction. The fit evaluates both scalar offsets and the implied polygon's actual supports against the measured rows. Engine control admission and realization check the generation bounds and active boundary changes before transfer, with Recovery retaining its own diagnostics.

## @evidence contracts/development/implementation.md#efficient-algorithms

The routine prepares one shared station chart and one support-pair query outside the trial loop. Its coordinate scratch is bounded by the admitted plane count and reused across station evaluations. Each cubic candidate is bounded by the Recovery span limit and the number of common rows. No generation mesh transfers on refusal.
