import type { IAutoMovieHumanPair } from "../common/IAutoMovieHumanPair";
import type { IAutoMovieHumanArmIdentity } from "./IAutoMovieHumanArmIdentity";
import type { IAutoMovieHumanLegIdentity } from "./IAutoMovieHumanLegIdentity";

/** Independent hand and foot dimensions.
 * Lengths use millimetres. Omission declares the corresponding domain absent.
 * Source-geometric proxies retain their distinct acquisition meaning and do not
 * establish equivalence to the anatomical measurements of the identity fields.
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

  /** Requested ankle assembly; omitted means joined. Generation is not implemented. */
  footAssembly?: "independent" | "joined";
}
