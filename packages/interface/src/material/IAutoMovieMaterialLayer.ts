/**
 * One ordered constituent of a layered build-up.
 *
 * A layer is not only a material and a thickness. It states what occupies the layer, whether the layer is meant to be seen, and whether it continues around the reveal of an opening cut through the host, because those three facts are what decide the finished dimension a performer actually touches.
 *
 * @evidence contracts/common.md#principled-implementation The substance discriminator separates a solid, an air gap and a possibly zero-thickness membrane; assembly validation requires positive solid and cavity thickness, forbids cavity material and finish, and resolves non-cavity substance ids when a registry is supplied.
 * @evidence contracts/common.md#clear-and-simple-design One layer owns thickness, substance citation, finish and reveal wrapping; stack direction, host dimension and end exposure stay on the assembly rather than being repeated here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Roles remain production-authored strings matched across junctions, without a built-in construction catalogue; a buried finish or disconnected wrapping run is reported rather than made visible by reordering layers.
 * @evidence contracts/common.md#meaningful-documentation Describes stable layer identity, junction role matching, the three substance cases, thickness units, cavity null material, exposed finish reachability and contiguous reveal wrapping.
 * @author Samchon
 */
export interface IAutoMovieMaterialLayer {
  /** Stable id, unique inside one assembly. */
  id: string;

  /**
   * Open construction role such as `structure`, `insulation`, `barrier`, or `finish`. Roles are matched across a junction to decide which layers continue and which stop, so the same word must mean the same thing on both sides of that junction; nothing else reads it.
   */
  role: string;

  /**
   * What occupies the layer.
   *
   * A `solid` carries a substance and real thickness. A `cavity` is a ventilated air gap: it has thickness and deliberately no substance. A `membrane` is a continuous sheet whose job is to be unbroken rather than thick, so it carries a substance and may measure zero.
   */
  substance: "solid" | "cavity" | "membrane";

  /** Layer thickness in metres along the assembly's stacking axis. */
  thickness: number;

  /** {@link IAutoMovieMaterialSubstance} id, or `null` for a cavity. */
  material: string | null;

  /**
   * Whether this layer is a visible finish.
   *
   * A finish must be reachable from an exposed end of the stack. A finish buried behind another layer is a defect, not a decoration, and so is a second finish laid over the first.
   */
  finish: boolean;

  /**
   * Whether the layer continues around the reveal of an opening in the host.
   *
   * A wrapping layer narrows the finished opening on every side and lines the jamb to its own depth. A layer that stops at the jamb does neither.
   *
   * Wrapping is a run that starts at a face: a layer cannot turn the corner into the reveal from behind one that already ended at the jamb, so setting this on a buried layer is a defect rather than a deeper lining.
   */
  wrapsOpening: boolean;
}
