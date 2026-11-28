import type {
  IAutoMovieHumanExtremityDimensions,
  IAutoMovieHumanPair,
} from "@automovie/interface";

import type { IAutoMovieHumanArmIdentitySchema } from "./IAutoMovieHumanArmIdentitySchema";
import type { IAutoMovieHumanLegIdentitySchema } from "./IAutoMovieHumanLegIdentitySchema";

/**
 * Optional left and right hand and foot measurements for typia validation.
 * Every supplied pair records both anatomical sides and uses millimetres. Foot
 * assembly remains an inherited authoring request.
 */
export type IAutoMovieHumanExtremityDimensionsSchema =
  IAutoMovieHumanExtremityDimensions & {
    /** Independently supplied left and right hand lengths and breadth. */
    hands?: IAutoMovieHumanPair<
      Pick<
        IAutoMovieHumanArmIdentitySchema,
        "handLength" | "palmLength" | "thumbLength" | "handBreadth"
      >
    >;

    /** Independently supplied left and right foot dimensions. */
    feet?: IAutoMovieHumanPair<
      Pick<
        IAutoMovieHumanLegIdentitySchema,
        "footLength" | "footBreadth" | "ankleHeight"
      >
    >;
  };
