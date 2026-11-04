# View-section lofting

A part is lofted from its own views in its own frame: the front and side outlines make a box about the part's axis at every station, the section touches the box once on each side, and the girth (or a sourced fullness law, or the top view) owns how full the section is between the touches. The operator is `AutoMovieHumanViewLoft.create`; its input is `IAutoMovieHumanViewPart`, its sections are `AutoMovieHumanViewSection`'s, and its frames are `AutoMovieHumanViewAxis`'s.

## Ownership

| Quantity | Owner | Read where |
| --- | --- | --- |
| the four extremes of a section | the four outlines (natural cubic splines in station through knots at named sites) | the guide points at 0, `pi/2`, `pi`, `3 pi/2` |
| the fullness of each quarter | the taut-tape girth, a sourced shoulder law, or the top view | the conic shoulder `r` of each quarter |
| the radii along the corner diagonals | nobody | `ISection.diagonals`, observations for checks |

A breadth, a depth and a girth then hold together at one station: scaling a section about its centre to its girth moved its extremes, and here the girth moves only the fullness.

## The section

The box is `e = [e0, e1, e2, e3]`, the half extents along `+u`, `+v`, `-u`, `-v`. Quarter `q` runs from guide `q` to guide `q + 1` over the corner `(a, b) = (e_q, e_{q+1})`.

- Touch. Guide `g` has the radius `e_g` and the angular slope 0. A polar curve meets the side `x = e_0` at angle 0 tangentially only when `rho_phi = 0` there, because `x_phi = rho_phi cos phi - rho sin phi`.
- Shoulder. The conic of Liming's lofting through both touch points with shoulder `r` (the share from the chord's middle to the corner) is the rational quadratic Bezier of the touch points and the corner with middle weight `w = r / (1 - r)`. `r = sqrt(2) - 1` is the ellipse, `r -> 0` the chord, `r -> 1` the corner.
- Guide curvature. The conic's curvature at the touch of the guide of extent `a`, across the extent `b`, is `kappa = a / (2 w^2 b^2)`. Each guide takes the mean of its two quarters' values, the least-squares compromise. Since `rho_phiphi = e - kappa e^2` where `rho_phi = 0`, it is also the mean second derivative. A symmetric box at the ellipse's shoulder gives `a / b^2`, the ellipse's own curvature.
- Representation. Each quarter is the quintic Hermite of its guides' jets plus the bump `f 64 xi^3 (1 - xi)^3` of `AutoMovieHumanPolarSector`, with `f` solved so that the section passes through the conic's shoulder point `(1 + r)(a, b) / 2`. The section is C2 across every guide for any shoulders. A raw conic meets its neighbour only C1, and a quarter superellipse of exponent above 2 is flat at its guide.

## The girth solve

A section is valid while its radius stays positive, it stays convex (so the tape lies on it and the girth is its length) and it stays inside its box (so the outlines stay its extremes). `range` finds the valid common shoulders around the ellipse's by bisection, and `solve` finds the girth's shoulder by the Illinois rule on the length, computed by Gauss-Legendre quadrature. The box bounds every girth between the rhombus `2 sqrt(W^2 + D^2)` and the rectangle `2 (W + D)`, and the quintic reaches the part of that range its valid shoulders span. A girth outside the reach is an input contradiction: the section is the reach's end shape and one diagnostic names the part, the station and the numbers.

## The chain

Each section is written as the periodic cubic B-spline through its points at `order` uniform polar angles (`order` a multiple of 4, so each guide is a knot), in the plane the part's axis gives at its station:

- `straight`: a part straight in its bone frame at the neutral pose;
- `horizontal`: the level plane at each height, the framed twin of an unframed chain such as the trunk's;
- `minimal`: a curved axis, with the axes carried by minimal rotation (the double reflection of Wang, Juttler, Zheng and Liu, 2008).

`AutoMovieHumanSeamStation.continuous` makes every coefficient and plane C2 in station, so the chain carries the jets `AutoMovieHumanSolidChain.surface` needs. Merge and diff then take it as a part or a host unchanged. Every emitted layer carries `view` (its box, shoulders and guide curvatures), which marks the layers the guide-touch audit applies to. An unframed host from an older producer reads as a solid through `AutoMovieHumanSolidChain.framed`.

## Limits

- The touch points lie on the chart axes through the part's axis. A section whose extreme lies off those lines is drawn about a different axis point.
- Between two layers the section is the station spline of the layers' coefficients, not a new solve, so a girth or an outline reads back exactly only at a layer. Every knot station must therefore be a layer.
- A tip (`pole`) closes as a dome. Toward the pole every outline and the girth run as natural splines in `sigma = sqrt(|s - s_pole|)`, through a knot of 0 at the pole, so each meets the axis square to it. The natural end condition leaves no `sigma^2` term, so the profile's square is smooth in the distance, which is the form of a smooth cap. The shoulders reach the ellipse's at the pole by a quintic smoothstep over the span to the nearest other outline knot: a cap is G2 at its apex only when its sections there tend to the ellipses of its osculating paraboloid. Rings are added at equal steps of `sigma` (equal arc steps near the apex), as many as the nearest station's mean half extent holds of the part's mean station gap, and the last ring closes on the pole by the skin's fan.

## Sources

- Liming, R. A., conic lofting of aircraft lines, 1947.
- Conic shoulder and rho: https://pointwise.com/doc/glyph2/files/Glyph/cxx/GlyphSegmentConic-cxx.html
- Dowell and Jarratt, A modified regula falsi method for computing the root of an equation, BIT 11, 1971.
- Wang, Juttler, Zheng and Liu, Computation of rotation minimizing frames, ACM Transactions on Graphics 27(1), 2008.
- Abramowitz and Stegun, Handbook of Mathematical Functions, table 25.4 (Gauss-Legendre nodes and weights).
