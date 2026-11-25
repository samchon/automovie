/**
 * The degrees past a joint's range of motion read as within it: the range
 * verdict's tolerance (`HumanVerdicts`' `range`), and the resolution to which a
 * solver need resolve a joint's angle. A swivel resolved to it moves a leg's
 * knee by at most its length times it, 0.15 mm on a 0.87 m leg, finer than
 * every clearance and contact verdict, which read millimetres.
 */
export const ROM_TOLERANCE: number = 0.01;
