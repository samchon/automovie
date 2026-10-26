# Feature network fairing

The skin's section family is generated from a sparse feature network rather than stored row by row ([#2993](https://github.com/samchon/automovie/issues/2993)).

## Why rows are not stored

The reference is a densely triangulated mesh. Its Recovery/Hermite rows follow the facets within the observation tolerance of 0.2 mm, so neighbouring rows 0.5 mm apart differ by up to 0.2 mm of noise. A layer fitted to each row keeps that noise, and the stacked layers turn it into station slopes of up to 20 to 40 degrees: ripples, shelves and stair steps under raking light. On f1, refitting the head layers to the rows ([#2992](https://github.com/samchon/automovie/pull/2992)) brought the shelf beside each lateral canthus within 0.15 mm of the observations only by drawing horizontal ripples across the cheek and the auricle, and a stiffer correction kept the ripples out and the shelf at 0.9 mm. Smoothing the stored layers afterwards cannot separate a fitted corner from noise either.

## Network

Per region:

- **Principal layers** at shape events only: contour births, splits, merges and contacts, and silhouette or directional-feature changes. Their spacing follows the shape, not the observation spacing.
- **Guide curves** between them: the midline profiles, the lateral silhouettes and the feature borders (lid margins, the vermilion boundary, the alar rims, the auricle rims).
- Each is a low-order curve whose coefficients the fit sets.

## Interiors

Between principal layers the sections are the solution of the network's position, tangent and continuity conditions with least bending energy, evaluated by the generator. A smooth network then gives a smooth skin by construction.

## Fit

The fitter sets the network's coefficients against every observation at once:

- the objective is the squared surface distance to the observed rows (Wang, Pottmann and Liu 2006): an in-plane miss of `t` counts as `t |N . n|`, `N` the surface normal and `n` the outline normal in space, so rows that graze the skin (under the chin, the crown, the top of a helix) do not drag it;
- a bending energy keeps the network fair, with its weight chosen so the residual matches the observations' tolerance instead of zero;
- samples over an aperture or the lip contact, samples whose nearest observed point lies across a dip, and samples further than 2 mm from the fit hold their place.

Report each region's surface distance to the observations (median, 90th and 99th percentile) with the renders.
