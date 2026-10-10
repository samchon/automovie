import type { IAutoMovieHumanFaceHairCurve } from "./IAutoMovieHumanFaceHairCurve";
import type { IAutoMovieHumanFaceHairRootedTransition } from "./IAutoMovieHumanFaceHairRootedTransition";
import type { IHumanFaceHairContact } from "./IHumanFaceHairContact";
import type { IHumanFaceHairStrandSample } from "./IHumanFaceHairStrandSample";

/**
 * One strand's placement request to `growHumanFaceHairStrand`.
 *
 * The rooted stem was already admitted by the owning metric walk; placement
 * projects the remainder with the same contact and, on rejection, resumes that
 * walk once through `integrate`.
 *
 * @author Samchon
 */
export interface IHumanFaceHairStrandPlacement {
  /** The interpolated strand to place. */
  strand: IHumanFaceHairStrandSample;

  /** Contact of the owning walk. */
  contact: IHumanFaceHairContact;

  /** Canonical stem, already admitted by the owning metric walk. */
  rooted: IAutoMovieHumanFaceHairRootedTransition;

  /**
   * Placement rejection resumes the same walk; standalone callers may grow it.
   */
  integrate: () => IAutoMovieHumanFaceHairCurve | undefined;
}
