/**
 * Which ends of a view part close in a point: `open` neither, `bottom` the first station's end, `top` the last's, `both` both.
 *
 * A closed end is a G2 dome by construction: every outline and the girth carry a knot of value 0 at that end's station, and toward it they run in the root of the distance from the end, so they meet the axis square to it and the profile's square is smooth in the distance; the shoulders reach the ellipse's at the pole, the level sets of the dome's osculating paraboloid. A missing zero knot is one diagnostic and the part has no chain.
 *
 * @evidence contracts/development/design.md#principled-representation A smooth cap's profile rises as the square root of the distance from its apex, which the root parameter gives with no second-order term at the end (the natural spline's end condition).
 * @evidence contracts/development/design.md#minimal-and-owned-surface Four closed values name every closure of a two-ended part.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A closed end without its zero knots is refused, never closed by a cone or a fan to the last section's centre.
 * @evidence contracts/development/common.md#meaningful-documentation States each value, the zero-knot rule, the dome's form and the failure effect.
 */
export type AutoMovieConstructionPole = "open" | "bottom" | "top" | "both";
