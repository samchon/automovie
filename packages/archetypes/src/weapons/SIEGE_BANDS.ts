import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core";
import type { createSiegeEngine } from "./createSiegeEngine";

/** Saimre's study, with his measurements of Hansen's replica. */
const SAIMRE: string =
  "Saimre, Trebuchet - a gravity-operated siege engine, Estonian Journal of Archaeology 10/1 (2006), p. 75, Hansen's Danish replica measured from its blueprint (https://kirj.ee/wp-content/plugins/kirj/pub/arch-2006-1-3_20210108123408.pdf)";

/** Hansen's own report of his replica. */
const HANSEN: string =
  "Hansen, Experimental reconstruction of a medieval trebuchet, Acta Archaeologica 63 (1992) (https://linnamuuseum.ee/JaanMarss/juhendid/Mehaanilised_kaugrelvad_keskajal/andmebaas/Middelaldercentret/Peter%20Vemming%20Hansen/acta.html)";

/** Tarver's traction trebuchet. */
const TARVER: string =
  "Tarver, The Traction Trebuchet: A Reconstruction of an Early Medieval Siege Engine, Technology and Culture 36/1 (1995), pp. 149-161 (https://uccshes.wordpress.com/wp-content/uploads/2012/09/reconstruction-of-a-traction-trebuchet.pdf)";

/** What was searched and not found for the engines' frames, winches and masses. */
const UNREAD: string =
  "not found (searched: Saimre 2006, Hansen 1992, Tarver 1995, Chevedden et al. 1995, Denny 2005, Siano; records-siege.md)";

/** A traction trebuchet's beam, 16 ft at al-Tarsusi's six to one. */
const BEAM: number = 16 * AutoMovieArchetypeUnits.FOOT;

/**
 * A traction trebuchet's pullers: twenty threw its 2.5 kg stones 100 m on
 * average (Tarver, p. 161).
 */
const PULLERS: number = 20;

/**
 * A puller's steady haul, kilograms of weight: an estimate, no reconstruction
 * measuring a puller's force (searched: Tarver 1995, Chevedden et al. 1995).
 */
const HAUL: number = 25;

/** The band of each dimension of a siege engine, by kind. */
export const SIEGE_BANDS: Readonly<
  Record<
    createSiegeEngine.Kind,
    Readonly<
      Partial<Record<createSiegeEngine.Dimension, IAutoMovieArchetypeBand>>
    >
  >
> = {
  trebuchet: {
    armLength: AutoMovieArchetypeBand.metres(
      5.85,
      5.85,
      `${SAIMRE}: the long arm 5.85 m`,
    ),
    shortArm: AutoMovieArchetypeBand.metres(
      1.2,
      1.2,
      `${SAIMRE}: the short arm 1.2 m`,
    ),
    axleHeight: AutoMovieArchetypeBand.metres(
      3.15,
      3.15,
      `${SAIMRE}: axle height 3.15 m`,
    ),
    counterweight: AutoMovieArchetypeBand.of(
      "kg",
      2000,
      4000,
      `${SAIMRE}: 2000 kg tested, 4000 kg rated`,
    ),
    projectile: AutoMovieArchetypeBand.of(
      "kg",
      15,
      15,
      `${SAIMRE}: 15 kg cast cement, thrown 168 m`,
    ),
    cocked: AutoMovieArchetypeBand.of(
      "degrees",
      32,
      32,
      `${SAIMRE}: the beam's initial angle to the horizon, 32 degrees`,
    ),
    release: AutoMovieArchetypeBand.of(
      "degrees",
      70,
      70,
      `${HANSEN}: the sling's free end released at about 70 degrees from the horizontal, taken as the arm's travel because the sling's swing is not modelled; provisional`,
      true,
    ),
    armMass: AutoMovieArchetypeBand.of(
      "kg",
      300,
      600,
      `${AutoMovieArchetypeBand.TYPICAL_MASS}: the beam's mass, ${UNREAD}`,
      true,
    ),
    frameWidth: AutoMovieArchetypeBand.metres(
      1.5,
      2.5,
      `the posts' spread, an estimate, ${UNREAD}`,
      true,
    ),
    winchRadius: AutoMovieArchetypeBand.metres(
      0.3,
      0.5,
      `the windlass's handle radius, an estimate: Hansen's crew cocked with block and tackle, no winch being read; ${UNREAD}`,
      true,
    ),
    winchRatio: AutoMovieArchetypeBand.of(
      "",
      10,
      20,
      `the windlass's turns per turn of the arm, an estimate, ${UNREAD}`,
      true,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      4000,
      8000,
      `${AutoMovieArchetypeBand.TYPICAL_MASS}: the whole engine with its box, ${UNREAD}`,
      true,
    ),
  },
  mangonel: {
    armLength: AutoMovieArchetypeBand.metres(
      (BEAM * 6) / 7,
      (BEAM * 6) / 7,
      `${TARVER}: the beam 16 ft at al-Tarsusi's six to one, its long arm six sevenths of it`,
    ),
    shortArm: AutoMovieArchetypeBand.metres(
      BEAM / 7,
      BEAM / 7,
      `${TARVER}: the short arm one seventh of the 16 ft beam`,
    ),
    axleHeight: AutoMovieArchetypeBand.metres(
      12 * AutoMovieArchetypeUnits.FOOT,
      12 * AutoMovieArchetypeUnits.FOOT,
      `${TARVER}: the uprights 12 ft high`,
    ),
    counterweight: AutoMovieArchetypeBand.of(
      "kg",
      PULLERS * HAUL,
      PULLERS * HAUL,
      `${TARVER}: twenty pullers, each taken to haul as hard as 25 kg hangs, an estimate (a puller's force is not measured); the weight that pulls as hard as the crew, provisional`,
      true,
    ),
    projectile: AutoMovieArchetypeBand.of(
      "kg",
      2.5,
      2.5,
      `${TARVER}: stones of around 2.5 kg, thrown 100 m on average`,
    ),
    cocked: AutoMovieArchetypeBand.of(
      "degrees",
      0,
      0,
      `${TARVER}: the arm swings a little over 90 degrees and the ropes stop it just past the vertical, so it starts about level; provisional`,
      true,
    ),
    release: AutoMovieArchetypeBand.of(
      "degrees",
      60,
      60,
      `the arm's travel at release, an estimate: Tarver gives the release hook's 30 to 40 degrees, not the arm's; ${UNREAD}`,
      true,
    ),
    armMass: AutoMovieArchetypeBand.of(
      "kg",
      40,
      80,
      `${AutoMovieArchetypeBand.TYPICAL_MASS}: the beam's mass, ${UNREAD}`,
      true,
    ),
    frameWidth: AutoMovieArchetypeBand.metres(
      12 * AutoMovieArchetypeUnits.FOOT,
      12 * AutoMovieArchetypeUnits.FOOT,
      `${TARVER}: the base's struts 12 and 16 ft, the shorter taken as the posts' spread; provisional`,
      true,
    ),
    winchRadius: AutoMovieArchetypeBand.metres(
      0.3,
      0.5,
      `the windlass's handle radius, an estimate: a traction engine is hauled by its crew; ${UNREAD}`,
      true,
    ),
    winchRatio: AutoMovieArchetypeBand.of(
      "",
      10,
      20,
      `the windlass's turns per turn of the arm, an estimate, ${UNREAD}`,
      true,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      300,
      600,
      `${AutoMovieArchetypeBand.TYPICAL_MASS}: the whole engine, ${UNREAD}`,
      true,
    ),
  },
};
