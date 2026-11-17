import type { IAutoMovieHumanPair } from "../IAutoMovieHumanPair";
import type { IAutoMovieHumanArmIdentity } from "./IAutoMovieHumanArmIdentity";
import type { IAutoMovieHumanLegIdentity } from "./IAutoMovieHumanLegIdentity";

/** Independent hand and foot dimensions.
 * Lengths use millimetres. Omission declares the corresponding domain absent.
 * Each field is its identity field's anatomical measurement, taken on its own
 * side; a value taken by another definition, such as a source mesh's own
 * course, is a different measurement and does not belong here.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Independent hand and foot dimensions.
 * @evidence contracts/development/design.md#principled-representation `hands`: Independently supplied left and right hand lengths and breadth. `feet`: Independently supplied left and right foot dimensions. `footAssembly`: Requested ankle assembly; omitted means joined.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanExtremityDimensions is the canonical exchange used by HandGiven.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `hands`: Independently supplied left and right hand lengths and breadth. `feet`: Independently supplied left and right foot dimensions. `footAssembly`: Requested ankle assembly; omitted means joined.
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
