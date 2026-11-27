import type { AutoMovieArchetypeArmour } from "../AutoMovieArchetypeArmour";
import { AutoMovieArchetypeUnits } from "../../core/index";
import type { IAutoMovieArchetypeBand } from "../../core/index";
import { AutoMovieArchetypeBand } from "../../core/index";

/*
 * The plate thickness read.
 */
export const PLATE: string =
  "Alan Williams, What can scientific analysis tell us about the effectiveness of medieval arms and armour?, p. 172: comfortable-weight breastplates between 1.5 and 3 mm, limb armour thinner; the breastplate range remains a provisional limb transfer (https://wratislavia.antiqua.uwr.edu.pl/wp-content/uploads/sites/573/2025/02/10-What-can-scientific-analysis-tell-us-about-the-effectiveness-of-medieval-arms-and-armour.pdf)";

/*
 * The helmet padding read.
 */
export const PAD: string =
  'US Army News Service, 20 April 2011, on combat helmet pads: "The current pad is three-quarters of an inch thick" (https://www.army.mil/article/55275/combat-helmet-continues-to-evolve-step-by-step/), a modern helmet\'s padding, provisional for a medieval arming cap, whose thickness no source read gives';

/*
 * A record's height, width, depth and mass, centimetres and grams.
 */
export const read = (
  height: number,
  width: number,
  depth: number,
  grams: number,
): Readonly<Partial<Record<AutoMovieArchetypeArmour.Dimension, number>>> => ({
  height: height * AutoMovieArchetypeUnits.CENTIMETRE,
  width: width * AutoMovieArchetypeUnits.CENTIMETRE,
  depth: depth * AutoMovieArchetypeUnits.CENTIMETRE,
  mass: grams / 1000,
});

/*
 * The plate's thickness band.
 */
export const thickness: IAutoMovieArchetypeBand = AutoMovieArchetypeBand.metres(
  0.0015,
  0.003,
  PLATE,
);

/*
 * A helmet's padding.
 */
export const pad: IAutoMovieArchetypeBand = AutoMovieArchetypeBand.metres(
  0.75 * AutoMovieArchetypeUnits.INCH,
  0.75 * AutoMovieArchetypeUnits.INCH,
  PAD,
  true,
);
