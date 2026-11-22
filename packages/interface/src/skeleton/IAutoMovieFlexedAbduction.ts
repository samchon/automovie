/**
 * How a ball joint's abduction ceiling rises with its flexion: from the
 * `abduction` interval's own `max` at neutral flexion to `max` at `flexion`
 * degrees, linearly in the flexion angle, and held at `max` beyond. Extension
 * (negative flexion) keeps the neutral ceiling.
 *
 * A hip abducts further flexed than straight, because flexion slackens the
 * ischiofemoral, pubofemoral and iliofemoral ligaments (Kapandji): the clinical
 * norm is 0-45° with the hip straight and 45-60° with the hip and knee flexed
 * 90° (AAOS 1965, as tabulated by Cejudo, Sainz de Baranda, Santonja and Ayala
 * 2016, SporTK 5(1):35-46, Table 1).
 *
 * @evidence contracts/development/design.md#principled-representation Two finite degree scalars define one linear ceiling over flexion, the measured coupling of the two clinical axes.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The flexion at which the raised ceiling is reached and that ceiling; the neutral ceiling stays the joint's `abduction.max`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Only the abduction ceiling moves; the adduction floor and the other axes keep their intervals, and the swing cap still applies.
 * @evidence contracts/development/common.md#meaningful-documentation States the coupling, its units, its shape beyond both ends and its clinical source.
 */
export interface IAutoMovieFlexedAbduction {
  /** The flexion at which the ceiling reaches `max`, degrees, above zero. */
  flexion: number;

  /** The abduction ceiling at and beyond that flexion, degrees, at least the interval's own `max`. */
  max: number;
}
