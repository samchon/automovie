/**
 * One ordered constituent of a layered build-up.
 *
 * A layer is not only a material and a thickness. It states what occupies the
 * layer, whether the layer is meant to be seen, and whether it continues around
 * the reveal of an opening cut through the host, because those three facts are
 * what decide the finished dimension a performer actually touches.
 */
export interface IAutoMovieMaterialLayer {
  /** Stable id, unique inside one assembly. */
  id: string;

  /**
   * Open construction role such as `structure`, `insulation`, `barrier`, or
   * `finish`. Roles are matched across a junction to decide which layers
   * continue and which stop, so the same word must mean the same thing on both
   * sides of that junction; nothing else reads it.
   */
  role: string;

  /**
   * What occupies the layer.
   *
   * A `solid` carries a substance and real thickness. A `cavity` is a
   * ventilated air gap: it has thickness and deliberately no substance. A
   * `membrane` is a continuous sheet whose job is to be unbroken rather than
   * thick, so it carries a substance and may measure zero.
   */
  substance: "solid" | "cavity" | "membrane";

  /** Layer thickness in metres along the assembly's stacking axis. */
  thickness: number;

  /** {@link IAutoMovieMaterialSubstance} id, or `null` for a cavity. */
  material: string | null;

  /**
   * Whether this layer is a visible finish.
   *
   * A finish must be reachable from an exposed end of the stack. A finish
   * buried behind another layer is a defect, not a decoration, and so is a
   * second finish laid over the first.
   */
  finish: boolean;

  /**
   * Whether the layer continues around the reveal of an opening in the host.
   *
   * A wrapping layer narrows the finished opening on every side and lines the
   * jamb to its own depth. A layer that stops at the jamb does neither.
   *
   * Wrapping is a run that starts at a face: a layer cannot turn the corner
   * into the reveal from behind one that already ended at the jamb, so setting
   * this on a buried layer is a defect rather than a deeper lining.
   */
  wrapsOpening: boolean;
}
