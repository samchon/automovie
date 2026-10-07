/**
 * One mandibular crown's least distance to the opposing arch.
 *
 * @author Samchon
 */
export interface IHumanSourceOcclusionToothReading {
  /** ISO identity of the mandibular crown. */
  crown: string;

  /** Distance to the opposing population in metres. The coupled source evaluator uses full surfaces; the legacy rigid census reads source vertices. E5 selects upper anterior crowns, E2 the whole upper arch. */
  distanceMetres: number;

  /** Actual upper native ISO crown attaining this population's minimum. */
  against?: string;
}
