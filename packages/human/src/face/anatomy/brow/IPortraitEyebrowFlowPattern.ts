/**
 * The grain of an eyebrow in four numbers.
 *
 * A brow's hairs follow one pattern with three fixed stretches: the medial
 * head, where they fan upward; the body, where the hairs of the upper border
 * run down and outward and those of the lower border up and outward until
 * they meet; and the tail, where they keep that converged course. The head is
 * the medial three tenths of the brow, an authored fixed division. An author
 * states where the hairs end across the band and how far they sweep toward
 * the tail, for the head and for the rest; the owner builds the direction
 * field from that. No per-hair or per-station value exists.
 *
 * Fractions run across the registered band from its lower boundary, zero, to
 * its upper boundary, one. Sweeps are millimetres of the authored free guide
 * along the band's lateral tangent at its tip. The connected builder lifts
 * that guide through its registered native chart; the final surface-tip
 * displacement is measured separately and is not assumed equal on a warped
 * chart. These controls supply no clinical shaft-length measurement.
 *
 * The pattern is the one clinical hair-restoration practice describes; it is
 * a convention and no measured direction field, and the four values are
 * authored.
 *
 * @evidence contracts/common.md#principled-implementation Three fixed stretches with two quantities each, shared between body and tail, are the least that states the described pattern; the direction field between them is interpolated by the flow owner.
 * @evidence contracts/common.md#clear-and-simple-design Four named numbers replace a variable list of direction witnesses as the authoring input.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No value addresses a hair, a station or a vertex.
 * @evidence contracts/common.md#meaningful-documentation States the pattern, the fixed division, each quantity's unit and direction and the conventional status.
 * @evidence contracts/modeling.md#parameter-channels Each number varies one trait: where head hairs end, how far they sweep, where the two borders meet, and how far body and tail hairs sweep. None is normalized around a neutral; they are absolute fractions and millimetres.
 * @evidence contracts/modeling.md#spatial-conventions Fractions of the registered band, lower boundary zero to upper boundary one; sweeps in millimetres along the band toward the lateral end.
 * @evidence contracts/anatomy.md#anatomical-source The pattern follows the description of brow hair direction in hair-restoration practice, a convention; no primary measurement of brow hair direction was read, and the default values are authored.
 * @evidence contracts/anatomy.md#permitted-range The profile admission bounds fractions to [0,1] and requires finite sweeps; no anatomical interval was read.
 * @evidence contracts/anatomy.md#parametric-authority Four named quantities of the brow's grain; the same record serves either side, and a document states an asymmetry by giving the sides different records.
 *
 * @author Samchon
 */
export interface IPortraitEyebrowFlowPattern {
  /** Fraction across the band at which hairs rooted at the lower border of the medial head end; hairs rooted at its upper border end at the upper boundary. In [0,1]. */
  headTip: number;

  /** Millimetre lateral bend of medial-head authored guides at their tips. */
  headSweepMm: number;

  /** Fraction across the band at which the hairs of both borders meet along the body and tail. In [0,1]. */
  convergence: number;

  /** Millimetre lateral bend of body and tail authored guides at their tips. */
  sweepMm: number;
}
