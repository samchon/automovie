import type { IHumanFaceHairRootReference } from "./IHumanFaceHairRootReference";

/**
 * Current source surface on which sampled roots are seated.
 *
 * @author Samchon
 */
export interface IHumanFaceHairRootSeatsProps<
  T extends IHumanFaceHairRootReference,
> {
  /** Original root references and any additional sampler identity fields. */
  roots: readonly T[];

  /** Original triangle incidence over the shared current coordinates. */
  indices: readonly number[];

  /** Current flat XYZ coordinates, head-frame metres. */
  current: readonly number[];
}
