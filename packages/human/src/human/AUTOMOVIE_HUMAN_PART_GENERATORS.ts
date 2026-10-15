import { AutoMovieHumanPart } from "../junction/AutoMovieHumanPart";
import { IAutoMovieHumanPartGenerator } from "../parts/IAutoMovieHumanPartGenerator";
import { AutoMovieHumanArmGenerator } from "../parts/arm/AutoMovieHumanArmGenerator";
import { AutoMovieHumanEarGenerator } from "../parts/ear/AutoMovieHumanEarGenerator";
import { AutoMovieHumanFootGenerator } from "../parts/foot/AutoMovieHumanFootGenerator";
import { AutoMovieHumanHandGenerator } from "../parts/hand/AutoMovieHumanHandGenerator";
import { AutoMovieHumanHeadGenerator } from "../parts/head/AutoMovieHumanHeadGenerator";
import { AutoMovieHumanLegGenerator } from "../parts/leg/AutoMovieHumanLegGenerator";
import { AutoMovieHumanNeckGenerator } from "../parts/neck/AutoMovieHumanNeckGenerator";
import { AutoMovieHumanTrunkGenerator } from "../parts/trunk/AutoMovieHumanTrunkGenerator";

/**
 * The generator of every skin part of the human profile, the one place the composition learns which class builds each part.
 *
 * Generators are stateless, so one instance serves every person. Replacing a part means replacing its entry; the other parts and the junction stay as they are, because parts meet only through the rings `AUTOMOVIE_HUMAN_RINGS` fixes.
 */
export const AUTOMOVIE_HUMAN_PART_GENERATORS: {
  readonly [Part in AutoMovieHumanPart]: IAutoMovieHumanPartGenerator<Part>;
} = {
  trunk: new AutoMovieHumanTrunkGenerator(),
  neck: new AutoMovieHumanNeckGenerator(),
  head: new AutoMovieHumanHeadGenerator(),
  ear: new AutoMovieHumanEarGenerator(),
  arm: new AutoMovieHumanArmGenerator(),
  hand: new AutoMovieHumanHandGenerator(),
  leg: new AutoMovieHumanLegGenerator(),
  foot: new AutoMovieHumanFootGenerator(),
};
