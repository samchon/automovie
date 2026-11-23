/**
 * Which ends of a view part close in a point: `open` neither, `bottom` the
 * first station's end, `top` the last's, `both` both.
 *
 * A closed end is a G2 dome by construction: every outline and the girth carry
 * a knot of value 0 at that end's station, and toward it they run in the root
 * of the distance from the end, so they meet the axis square to it and the
 * profile's square is smooth in the distance; the shoulders reach the ellipse's
 * at the pole, the level sets of the dome's osculating paraboloid. A missing
 * zero knot is one diagnostic and the part has no chain.
 */
export type AutoMovieConstructionPole = "open" | "bottom" | "top" | "both";
