import type { IAutoMovieHumanAppearance } from "@automovie/interface";

import type { IAutoMovieHumanBrowAppearanceSchema } from "./IAutoMovieHumanBrowAppearanceSchema";
import type { IAutoMovieHumanEyelashSchema } from "./IAutoMovieHumanEyelashSchema";
import type { IAutoMovieHumanPairSchema } from "./IAutoMovieHumanPairSchema";
import type { IAutoMovieHumanScalpHairSchema } from "./IAutoMovieHumanScalpHairSchema";
import type { IAutoMovieHumanSkinAppearanceSchema } from "./IAutoMovieHumanSkinAppearanceSchema";
import type { IAutoMovieHumanUnderwearSchema } from "./IAutoMovieHumanUnderwearSchema";

/** Typia admission/schema metadata for IAutoMovieHumanAppearance. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
export type IAutoMovieHumanAppearanceSchema = IAutoMovieHumanAppearance & {
  /** Skin surface finish. */
  skin: IAutoMovieHumanSkinAppearanceSchema;

  /** Scalp hair. */
  hair: IAutoMovieHumanScalpHairSchema;

  /** Eyebrows. */
  browPair: IAutoMovieHumanPairSchema<IAutoMovieHumanBrowAppearanceSchema>;

  /** Eyelashes. */
  lashPair: IAutoMovieHumanPairSchema<IAutoMovieHumanEyelashSchema>;

  /** Underwear. */
  underwear: IAutoMovieHumanUnderwearSchema;
};
