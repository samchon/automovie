import type { IAutoMovieHumanPair } from "../IAutoMovieHumanPair";
import type { IAutoMovieHumanArmIdentity } from "./IAutoMovieHumanArmIdentity";
import type { IAutoMovieHumanLegIdentity } from "./IAutoMovieHumanLegIdentity";

/** Independent hand and foot dimensions.
 * Lengths use millimetres. Omission declares the corresponding domain absent.
 * Each field is its identity field's anatomical measurement, taken on its own
 * side; a value taken by another definition, such as a source mesh's own
 * course, is a different measurement and does not belong here.
 */
export interface IAutoMovieHumanExtremityDimensions {
  /** Independently supplied left and right hand lengths and breadth. */
  hands?: IAutoMovieHumanPair<
    Pick<
      IAutoMovieHumanArmIdentity,
      "handLength" | "palmLength" | "thumbLength" | "handBreadth"
    >
  >;

  /** Independently supplied left and right foot dimensions. */
  feet?: IAutoMovieHumanPair<
    Pick<
      IAutoMovieHumanLegIdentity,
      "footLength" | "footBreadth" | "ankleHeight"
    >
  >;

  /** Optional leg lengths, measured between joint centres in millimetres. */
  legBones?: IAutoMovieHumanPair<{
    /** Hip centre to knee centre. */
    femur: number;
    /** Knee centre to ankle centre. */
    tibia: number;
  }>;

  /** Positive ratio applied to every derived finger and toe phalanx length, with the digit roots held. Omission uses the anatomical proportions at the supplied hand and foot dimensions. */
  phalangealLengthScale?: number;

  /** Requested ankle assembly; omitted means joined. Generation is not implemented. */
  footAssembly?: "independent" | "joined";
}
