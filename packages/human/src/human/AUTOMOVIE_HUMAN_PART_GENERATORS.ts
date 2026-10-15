import { IAutoMovieHumanPartGenerator } from "../parts/IAutoMovieHumanPartGenerator";
import { AutoMovieHumanArmGenerator } from "../parts/arm/AutoMovieHumanArmGenerator";
import { AutoMovieHumanEarGenerator } from "../parts/ear/AutoMovieHumanEarGenerator";
import { AutoMovieHumanEyeGenerator } from "../parts/eye/AutoMovieHumanEyeGenerator";
import { AutoMovieHumanFootGenerator } from "../parts/foot/AutoMovieHumanFootGenerator";
import { AutoMovieHumanHandGenerator } from "../parts/hand/AutoMovieHumanHandGenerator";
import { AutoMovieHumanHeadGenerator } from "../parts/head/AutoMovieHumanHeadGenerator";
import { AutoMovieHumanLegGenerator } from "../parts/leg/AutoMovieHumanLegGenerator";
import { AutoMovieHumanNeckGenerator } from "../parts/neck/AutoMovieHumanNeckGenerator";
import { AutoMovieHumanTrunkGenerator } from "../parts/trunk/AutoMovieHumanTrunkGenerator";
import { IAutoMovieHumanPartGenerators } from "./IAutoMovieHumanPartGenerators";

/**
 * The generator of every skin part of the human profile, the one place the composition learns which class builds each part.
 *
 * Generators are stateless, so one instance serves every person. Replacing a part means replacing its entry; the other parts and the junction stay as they are, because parts meet only through the rings `AUTOMOVIE_HUMAN_RINGS` fixes.
 */
export const AUTOMOVIE_HUMAN_PART_GENERATORS: IAutoMovieHumanPartGenerators = {
  trunk: new AutoMovieHumanTrunkGenerator(),
  neck: new AutoMovieHumanNeckGenerator(),
  head: carryEyes(
    new AutoMovieHumanHeadGenerator(),
    new AutoMovieHumanEyeGenerator(),
  ),
  ear: new AutoMovieHumanEarGenerator(),
  arm: new AutoMovieHumanArmGenerator(),
  hand: new AutoMovieHumanHandGenerator(),
  leg: new AutoMovieHumanLegGenerator(),
  foot: new AutoMovieHumanFootGenerator(),
};

/**
 * The head generator carrying the eyeballs after its own attachments.
 *
 * The eyes ride the eye bones, which hang from the head, and are no skin part of their own, so the head carries them; the eye generator reads only the skeleton and the identity, so the head generator and it stay independent and either can be replaced alone.
 *
 * @param head The head generator
 * @param eyes The eye generator
 * @returns A generator that builds the head's cage and carries its attachments, then both eyes
 */
function carryEyes(
  head: IAutoMovieHumanPartGenerator<"head">,
  eyes: AutoMovieHumanEyeGenerator,
): IAutoMovieHumanPartGenerator<"head"> {
  return {
    part: "head",
    generate: (props) => head.generate(props),
    attachments: (props) => [
      ...(head.attachments?.(props) ?? []),
      ...eyes.generate(props),
    ],
  };
}
