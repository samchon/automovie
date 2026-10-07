/**
 * The anterior lid-edge rows on which free eyelashes are rooted.
 *
 * The source producer registers these native skin vertices separately from
 * the posterior palpebral margins. Both rows run medial to lateral and share
 * the margin record's surface. Evaluators read the final performed skin;
 * the registration supplies no clinical follicle spacing or tissue depth.
 *
 * @evidence contracts/common.md#principled-implementation Native vertex identity makes the roots follow the same shaped and performed skin without inferring them from a card or asset name.
 * @evidence contracts/common.md#clear-and-simple-design Two ordered rows share the containing margin surface.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The producer records source correspondence rather than introducing person-specific vertex inputs.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes anterior roots from posterior contact margins and states order and qualification.
 * @evidence contracts/modeling.md#shared-boundaries Generated strands and skin read the same performed anterior boundary.
 * @evidence contracts/modeling.md#spatial-conventions Native indices use the containing margin surface and medial-to-lateral order.
 * @evidenceExclude contracts/anatomy.md#anatomical-source This is source registration, not a measured follicle population.
 * @evidenceExclude contracts/anatomy.md#permitted-range Registers indices without admitting anatomical dimensions.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Shared source data, never person-authored geometry.
 * @author Samchon
 */
export interface IAutoMovieHumanFacePeriocularLashRoots {
  /** Anterior upper-lid skin row, medial to lateral. */
  upper: number[];

  /** Anterior lower-lid skin row, medial to lateral. */
  lower: number[];
}
