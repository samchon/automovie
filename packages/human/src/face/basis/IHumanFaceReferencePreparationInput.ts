import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IHumanFaceNativePose } from "./IHumanFaceNativePose";
import type { IHumanFacePoseGeometry } from "./IHumanFacePoseGeometry";
import type { humanFaceBasisWeights } from "./humanFaceBasisWeights";

/** Inputs to the shared source reference stage, independent of generated assemblies.
 *
 * @author Samchon
 */
export interface IHumanFaceReferencePreparationInput {
  /** Actual admitted source basis and its canonical incidence. */
  basis: IAutoMovieHumanFaceBasis;

  /** Current admitted weights; the native owner separates persistent shape. */
  state: ReturnType<typeof humanFaceBasisWeights>;

  /** Actual numerical geometry inputs; no field is replaced for source preparation. */
  geometry?: IHumanFacePoseGeometry;

  /** Existing owned native stage, reused by normal assembly rather than evaluated twice. */
  native?: IHumanFaceNativePose;

  /** Reports actual completed reference owners; an exception aborts preparation. */
  progress?: (owner: string) => void;
}
