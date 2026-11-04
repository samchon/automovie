# Kernel worker log

Three-view campaign (#3044), kernel worker: #3046 the view-to-section operator, and the solid merge and diff operators. Moved here from `modeler-log.md` on the supervisor's order (the move written 13:41:27, `date`).

## Start (section started 13:23:44, `date`)

Paths I own and commit: `packages/human/src/lofting/` (the view-to-section operator files `IAutoMovieHumanViewPart`, `AutoMovieHumanViewAxis`, `AutoMovieHumanViewSection`, `AutoMovieHumanViewLoft`, `AutoMovieHumanIllinois`; the solid operators `AutoMovieHumanSolid*`; `AutoMovieHumanNaturalSpline.derivative`; the `view` field of `IAutoMovieHumanLoftChain.ILayer`), `packages/human/docs/techniques/view-section-lofting.md` when written, and this section. Collectors started 13:07:17 (`Get-Date`): human `ttsc --noEmit --watch -p tsconfig.debug.json` launcher process id 22208, test `ttsc --noEmit --watch` launcher process id 56092; logs in my scratch directory outside the checkout.

### Design (written before the interface commit)

- Box: at each station the four outlines (natural cubic splines in station through named knots, signed chart coordinates of the `+u`, `-u`, `+v`, `-v` edges) give four positive half extents about the axis.
- Guides at 0, pi/2, pi, 3pi/2: radius the half extent, angular slope 0 (tangent to the side exactly then), curvature shared by both quarters: the mean of the two quarters' conic end curvatures `a / (2 w^2 b^2)`, `w = r / (1 - r)` (rational quadratic Bezier end curvature); the mean is the least-squares compromise and gives the ellipse's `a / b^2` for a symmetric box at `r = sqrt(2) - 1`.
- Fullness: one conic shoulder `r` per quarter (Liming); the quintic polar sector's bump is solved so the section passes through the conic's shoulder point `(1 + r)(a, b)/2`. The girth owner solves one common `r` (plus sourced departures) by the Illinois rule on the section's length, over the valid range (positive radius, convex, inside the box) found by bisection from the ellipse's shoulder; outside it the end shape and one diagnostic.
- Output: each section as the periodic cubic B-spline through `order` (multiple of 4) points at uniform polar angles, so each guide is a knot; layers framed by the part's axis (straight, horizontal twin, or minimal rotation by double reflection), made C2 by `AutoMovieHumanSeamStation.continuous`; every layer carries `view` (box, shoulders, guide curvatures) so audits know which layers the guide-touch rule applies to (tester's question, answered by message).
- Merge and diff for lofted hosts: `AutoMovieHumanSolidChain.framed` gives an unframed chain (trunk, neck) its level planes with exact plane jets, or the C2 twin through its layers; `IJoin.continuity` declares G2.
- Tests: the tester writes the #3046 operator tests (#3044 team table); oracle cases sent to the tester and stated in the JSDoc.

Violation recorded 13:38:07 (`date`): a shell command of mine sent between 13:34:47 and this entry began with a stray `python -` (and a `cat` waiting on standard input) before its `grep`s; it ran no script, read nothing and hung until I stopped it (my background task). No Python helper is used; my commands are plain `grep`/`sed`, my experiments only the tester's tracked tests and the compiler.

### 13:34:47 interface commit, then the solids' domain

- `8194f8923` (13:34:47, pushed): the operator files, `SolidChain.framed`, `IJoin.continuity`, `ILayer.view`, the technique doc. Compiled clean on my human collector's 13:28:16 cycle (errors there only in `AutoMovieHumanBodyAnatomy`, not mine).
- Then: `IAutoMovieHumanSolidSurface.domain` (a chain's first and last layer stations), and the trace and the join report a curve point or a rail past either surface's layers ("inside the layers") instead of reading a chain's held end section (the merge-and-diff worker's hand-over item).
- Compile: my human collector's 13:39:33 cycle read no error in `src/lofting` (its errors are in `AutoMovieHumanBodySurfaceLoft` and `AutoMovieHumanBodySurface`, not mine). Committed at 13:42:54 with this log.

### Operator gaps from the body modeler's map (received from the supervisor before 13:42:54)

In the order of need: (1) merge onto a host that is itself a merge (faces with trim loops, the trace switching face); (2) a part lying along its host (trace by another parameter where a phase's station line crosses the host twice or never); (3) corners where two blends' host rails would cross (setback and an N-sided G2 patch); (4) a part trimmed at both ends; (5) the tessellation of merge results with loft coordinates. Survey of each against the operators comes next, then one plan, then the build.
