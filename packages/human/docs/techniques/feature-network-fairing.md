# Feature network fairing

The skin's section family is generated from key sections rather than stored row by row ([#2993](https://github.com/samchon/automovie/issues/2993)). Smoothness comes from the generating formula, not from repairs after the fit.

## Why rows are not stored

The reference is a densely triangulated mesh. Its Recovery/Hermite rows follow the facets within the observation tolerance of 0.2 mm, so neighbouring rows 0.5 mm apart differ by up to 0.2 mm of noise. A layer fitted to each row keeps that noise, and the stacked layers turn it into station slopes of 20 to 40 degrees: ripples, shelves and stair steps under raking light. On f1, refitting the head layers to the rows ([#2992](https://github.com/samchon/automovie/pull/2992)) brought the shelf beside each lateral canthus within 0.15 mm of the observations only by drawing horizontal ripples across the cheek and the auricle, and a stiffer correction kept the ripples out and the shelf at 0.9 mm. Smoothing stored layers afterwards cannot separate a fitted corner from noise either.

## Generation

This is the representation of every base and appendage in the [redesign plan](../redesign-plan.md). A module stores only key sections: periodic B-spline sections at chosen stations of its own frame. Every control-point coordinate follows the natural cubic spline through its key values, the interpolant of least `integral f''^2`, with continuous second derivatives at every key. A loft chain that carries the keys as layers and the spline's derivatives as slopes reproduces the spline exactly, since between two keys it is one cubic. A wrinkle shorter than the key spacing cannot appear, and moving a key moves every section between its neighbours smoothly, which is the handle for transforming the figure (a style, an exaggeration) later. Such a module needs none of the current repair rules.

## Fit

A module's fitter under `test/src/executable/reference-experiments/human-calibration/` sets the keys against every observed row at once. The surface is linear in the keys' control points, `S(s, t) = sum_k phi_k(s) C_k(t)` with `phi_k` the natural spline's cardinal functions, and the keys minimise:

- the squared surface distance to the rows (Wang, Pottmann and Liu 2006): an in-plane miss of `t` counts as `t |N . n|`, `N` the surface normal and `n` the outline normal in space, so rows that graze the skin (under the chin, the crown, the top of a helix) do not drag it;
- the thin-plate energy `L^4 integral (S_ss^2 + 2 S_st^2 + S_tt^2)`, so a wrinkle shorter than `L` costs more than it saves.

Samples over an opening, samples whose nearest observed point lies across a dip, and samples further than 2 mm from the current surface hold their place. The thin-plate length is set by the discrepancy principle, so the residual matches the rows' own tolerance instead of zero. Keys start at a regular spacing, and a key is added at the worst observed station while its root mean square miss exceeds the tolerance, no closer than a least gap to another key: keys gather where the shape changes, not where the rows are dense.

A trial on f1's head chains (not committed) removed the forehead and temple striations and the under-eye wrinkles and turned the canthus ledge into a soft groove; the middle head stalled at 0.20 mm because the auricle's folds cannot be fair sections of the head, which is why the auricle is an appendage in the plan.
