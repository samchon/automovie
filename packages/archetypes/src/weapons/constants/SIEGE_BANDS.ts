import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../../core";
import type { AutoMovieArchetypeSiegeEngine } from "../AutoMovieArchetypeSiegeEngine";
import * as SiegeBandsData from "./internal/SiegeBandsData";

/*
 * The band of each dimension of a siege engine, by kind.
 */
export const SIEGE_BANDS: Readonly<
  Record<
    AutoMovieArchetypeSiegeEngine.Kind,
    Readonly<
      Partial<Record<AutoMovieArchetypeSiegeEngine.Dimension, IAutoMovieArchetypeBand>>
    >
  >
> = {
  trebuchet: {
    armLength: AutoMovieArchetypeBand.metres(
      5.85,
      5.85,
      `${SiegeBandsData.SAIMRE}: the long arm 5.85 m`,
    ),
    shortArm: AutoMovieArchetypeBand.metres(
      1.2,
      1.2,
      `${SiegeBandsData.SAIMRE}: the short arm 1.2 m`,
    ),
    axleHeight: AutoMovieArchetypeBand.metres(
      3.15,
      3.15,
      `${SiegeBandsData.SAIMRE}: axle height 3.15 m`,
    ),
    counterweight: AutoMovieArchetypeBand.of(
      "kg",
      2000,
      4000,
      `${SiegeBandsData.SAIMRE}: 2000 kg tested, 4000 kg rated`,
    ),
    projectile: AutoMovieArchetypeBand.of(
      "kg",
      15,
      15,
      `${SiegeBandsData.SAIMRE}: 15 kg cast cement, thrown 168 m`,
    ),
    cocked: AutoMovieArchetypeBand.of(
      "degrees",
      32,
      32,
      `${SiegeBandsData.SAIMRE}: the beam's initial angle to the horizon, 32 degrees`,
    ),
    release: AutoMovieArchetypeBand.of(
      "degrees",
      70,
      70,
      `${SiegeBandsData.HANSEN}: the sling's free end released at about 70 degrees from the horizontal, taken as the arm's travel because the sling's swing is not modelled; provisional`,
      true,
    ),
    armMass: AutoMovieArchetypeBand.of(
      "kg",
      300,
      600,
      `${AutoMovieArchetypeBand.TYPICAL_MASS}: the beam's mass, ${SiegeBandsData.UNREAD}`,
      true,
    ),
    frameWidth: AutoMovieArchetypeBand.metres(
      1.5,
      2.5,
      `the posts' spread, an estimate, ${SiegeBandsData.UNREAD}`,
      true,
    ),
    winchRadius: AutoMovieArchetypeBand.metres(
      0.3,
      0.5,
      `the windlass's handle radius, an estimate: Hansen's crew cocked with block and tackle, no winch being read; ${SiegeBandsData.UNREAD}`,
      true,
    ),
    winchRatio: AutoMovieArchetypeBand.of(
      "",
      10,
      20,
      `the windlass's turns per turn of the arm, an estimate, ${SiegeBandsData.UNREAD}`,
      true,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      4000,
      8000,
      `${AutoMovieArchetypeBand.TYPICAL_MASS}: the whole engine with its box, ${SiegeBandsData.UNREAD}`,
      true,
    ),
  },
  mangonel: {
    armLength: AutoMovieArchetypeBand.metres(
      (SiegeBandsData.BEAM * 6) / 7,
      (SiegeBandsData.BEAM * 6) / 7,
      `${SiegeBandsData.TARVER}: the beam 16 ft at al-Tarsusi's six to one, its long arm six sevenths of it`,
    ),
    shortArm: AutoMovieArchetypeBand.metres(
      SiegeBandsData.BEAM / 7,
      SiegeBandsData.BEAM / 7,
      `${SiegeBandsData.TARVER}: the short arm one seventh of the 16 ft beam`,
    ),
    axleHeight: AutoMovieArchetypeBand.metres(
      12 * AutoMovieArchetypeUnits.FOOT,
      12 * AutoMovieArchetypeUnits.FOOT,
      `${SiegeBandsData.TARVER}: the uprights 12 ft high`,
    ),
    counterweight: AutoMovieArchetypeBand.of(
      "kg",
      SiegeBandsData.PULLERS * SiegeBandsData.HAUL,
      SiegeBandsData.PULLERS * SiegeBandsData.HAUL,
      `${SiegeBandsData.TARVER}: twenty pullers, each taken to haul as hard as 25 kg hangs, an estimate (a puller's force is not measured); the weight that pulls as hard as the crew, provisional`,
      true,
    ),
    projectile: AutoMovieArchetypeBand.of(
      "kg",
      2.5,
      2.5,
      `${SiegeBandsData.TARVER}: stones of around 2.5 kg, thrown 100 m on average`,
    ),
    cocked: AutoMovieArchetypeBand.of(
      "degrees",
      0,
      0,
      `${SiegeBandsData.TARVER}: the arm swings a little over 90 degrees and the ropes stop it just past the vertical, so it starts about level; provisional`,
      true,
    ),
    release: AutoMovieArchetypeBand.of(
      "degrees",
      60,
      60,
      `the arm's travel at release, an estimate: Tarver gives the release hook's 30 to 40 degrees, not the arm's; ${SiegeBandsData.UNREAD}`,
      true,
    ),
    armMass: AutoMovieArchetypeBand.of(
      "kg",
      40,
      80,
      `${AutoMovieArchetypeBand.TYPICAL_MASS}: the beam's mass, ${SiegeBandsData.UNREAD}`,
      true,
    ),
    frameWidth: AutoMovieArchetypeBand.metres(
      12 * AutoMovieArchetypeUnits.FOOT,
      12 * AutoMovieArchetypeUnits.FOOT,
      `${SiegeBandsData.TARVER}: the base's struts 12 and 16 ft, the shorter taken as the posts' spread; provisional`,
      true,
    ),
    winchRadius: AutoMovieArchetypeBand.metres(
      0.3,
      0.5,
      `the windlass's handle radius, an estimate: a traction engine is hauled by its crew; ${SiegeBandsData.UNREAD}`,
      true,
    ),
    winchRatio: AutoMovieArchetypeBand.of(
      "",
      10,
      20,
      `the windlass's turns per turn of the arm, an estimate, ${SiegeBandsData.UNREAD}`,
      true,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      300,
      600,
      `${AutoMovieArchetypeBand.TYPICAL_MASS}: the whole engine, ${SiegeBandsData.UNREAD}`,
      true,
    ),
  },
};
