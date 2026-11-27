/**
 * Shortest measured subject height, in metres, that framing trusts.
 *
 * A measured span below it, such as a 20 mm plaza slab, a rig with one bone, or
 * a group of flat formations, is not a height a camera can be aimed up, so the
 * framing solve substitutes {@link AutoMovieEngineDefaultSubjectHeight} while keeping any
 * measured width.
 */
export const AutoMovieEngineMinMeasuredSubjectHeight: number = 0.1;
