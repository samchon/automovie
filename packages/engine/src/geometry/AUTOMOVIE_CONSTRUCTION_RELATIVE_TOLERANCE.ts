/**
 * Relative geometric tolerance for construction admission.
 *
 * A source value derived through chained floating-point laws can land a hair
 * past an exact boundary it meets by construction: a pole knot that should be
 * 0, a knot that should equal its declared range bound, a station that should
 * equal a parameter endpoint. Admission accepts such a value when its excess is
 * within this fraction of the outline's own extent (its largest value magnitude
 * or its parameter span) and treats it as lying on the boundary; a larger
 * excess is still refused. Construction sources carry no fixed length unit, so
 * the allowance scales with the source: five parts in a thousand of a 76 mm
 * head half-breadth is under 0.4 mm, below anything a staging figure shows.
 */
export const AUTOMOVIE_CONSTRUCTION_RELATIVE_TOLERANCE: number = 5e-3;
