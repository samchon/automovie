import type { IAutoMovieHumanExtremityDimensions } from "@automovie/interface";
import type { tags } from "typia";

import type { IAutoMovieHumanArmIdentitySchema } from "./IAutoMovieHumanArmIdentitySchema";
import type { IAutoMovieHumanLegIdentitySchema } from "./IAutoMovieHumanLegIdentitySchema";
import type { IAutoMovieHumanPairSchema } from "./IAutoMovieHumanPairSchema";

/** Typia admission/schema metadata for IAutoMovieHumanExtremityDimensions. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
export type IAutoMovieHumanExtremityDimensionsSchema =
  IAutoMovieHumanExtremityDimensions & {
    /** Independently supplied left and right hand lengths and breadth. */
    hands?: IAutoMovieHumanPairSchema<
      Pick<
        IAutoMovieHumanArmIdentitySchema,
        "handLength" | "palmLength" | "thumbLength" | "handBreadth"
      >
    >;

    /** Independently supplied left and right foot dimensions. */
    feet?: IAutoMovieHumanPairSchema<
      Pick<
        IAutoMovieHumanLegIdentitySchema,
        "footLength" | "footBreadth" | "ankleHeight"
      >
    >;

    /** Positive joint-centre lengths in millimetres for both legs. */
    legBones?: IAutoMovieHumanPairSchema<{
      /** Hip centre to knee centre. */
      femur: number & tags.ExclusiveMinimum<0>;
      /** Knee centre to ankle centre. */
      tibia: number & tags.ExclusiveMinimum<0>;
    }>;

    /** Positive ratio of phalangeal lengths to the derived lengths. */
    phalangealLengthScale?: number & tags.ExclusiveMinimum<0>;
  };
