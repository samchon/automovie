/**
 * One comparable leaf value in an ordered plan field.
 *
 * `equalOrderedScalars` compares arrays of these, or arrays of arrays of them,
 * position by position. The two fields it serves are a WAVE speaker label
 * array, whose leaves are strings, and a downmix matrix, whose leaves are
 * numbers; naming the leaf type keeps a record or other value out of that
 * comparison at compile time.
 *
 * @evidence contracts/development/design.md#principled-representation A closed union of the two primitive types the compared fields hold lets `Object.is` decide every leaf, since strings and numbers are compared by value and need no structural recursion.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The alias exists only to give `equalOrderedScalars` a stated leaf domain; it adds no wrapper, tag or runtime value.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The union lists the leaf types of the two real compared fields and special-cases no value; nothing else is admitted for a future caller.
 * @evidence contracts/development/common.md#meaningful-documentation The doc names the comparison that reads the type, the two fields whose leaves it covers, and what the narrow domain keeps out.
 */
export type AutoMovieOrderedScalar = number | string;
