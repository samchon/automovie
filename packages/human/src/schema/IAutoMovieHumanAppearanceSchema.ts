import type {
  IAutoMovieHumanAppearance,
  IAutoMovieHumanPair,
} from "@automovie/interface";

import type { IAutoMovieHumanBrowAppearanceSchema } from "./IAutoMovieHumanBrowAppearanceSchema";
import type { IAutoMovieHumanEyelashSchema } from "./IAutoMovieHumanEyelashSchema";
import type { IAutoMovieHumanScalpHairSchema } from "./IAutoMovieHumanScalpHairSchema";
import type { IAutoMovieHumanSkinAppearanceSchema } from "./IAutoMovieHumanSkinAppearanceSchema";
import type { IAutoMovieHumanUnderwearSchema } from "./IAutoMovieHumanUnderwearSchema";

/**
 * Required skin, scalp hair, eyebrow, eyelash and underwear descriptions
 * within a supplied appearance block. Eyebrows and eyelashes specify
 * anatomical left and right separately. Use this type when generating a typia
 * validator or schema.
 */
export type IAutoMovieHumanAppearanceSchema = IAutoMovieHumanAppearance & {
  /** Skin surface finish. */
  skin: IAutoMovieHumanSkinAppearanceSchema;

  /** Scalp hair. */
  hair: IAutoMovieHumanScalpHairSchema;

  /** Eyebrows. */
  browPair: IAutoMovieHumanPair<IAutoMovieHumanBrowAppearanceSchema>;

  /** Eyelashes. */
  lashPair: IAutoMovieHumanPair<IAutoMovieHumanEyelashSchema>;

  /** Underwear. */
  underwear: IAutoMovieHumanUnderwearSchema;
};
