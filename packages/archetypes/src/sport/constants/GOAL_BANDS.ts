import { AutoMovieArchetypeBand, type IAutoMovieArchetypeBand } from "../../core";
import type { AutoMovieArchetypeGoal } from "../AutoMovieArchetypeGoal";
import * as GoalBandsData from "./internal/GoalBandsData";

/*
 * The band of each free dimension of createGoal, by kind.
 */
export const GOAL_BANDS: Readonly<
  Record<
    AutoMovieArchetypeGoal.Kind,
    Readonly<Partial<Record<AutoMovieArchetypeGoal.Dimension, IAutoMovieArchetypeBand>>>
  >
> = {
  footballGoal: {
    width: AutoMovieArchetypeBand.metres(7.32, 7.32, GoalBandsData.IFAB),
    height: AutoMovieArchetypeBand.metres(2.44, 2.44, GoalBandsData.IFAB),
    bar: AutoMovieArchetypeBand.metres(
      0.12,
      0.12,
      `${GoalBandsData.IFAB}; the model takes the limit`,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      100,
      200,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  },
  fieldHockeyGoal: {
    width: AutoMovieArchetypeBand.metres(3.66, 3.66, GoalBandsData.FIH),
    height: AutoMovieArchetypeBand.metres(2.14, 2.14, GoalBandsData.FIH),
    bar: AutoMovieArchetypeBand.metres(0.05, 0.05, GoalBandsData.FIH),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      50,
      100,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  },
  iceHockeyGoal: {
    width: AutoMovieArchetypeBand.metres(1.83, 1.83, GoalBandsData.IIHF),
    height: AutoMovieArchetypeBand.metres(1.22, 1.22, GoalBandsData.IIHF),
    bar: AutoMovieArchetypeBand.metres(
      0.05,
      0.05,
      "Coarse pipe diameter for the visual frame",
      true,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      30,
      60,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  },
  lacrosseGoal: {
    width: AutoMovieArchetypeBand.metres(1.83, 1.83, GoalBandsData.SIXES),
    height: AutoMovieArchetypeBand.metres(1.83, 1.83, GoalBandsData.SIXES),
    bar: AutoMovieArchetypeBand.metres(0.05, 0.05, GoalBandsData.SIXES),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      20,
      50,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  },
  handballGoal: {
    width: AutoMovieArchetypeBand.metres(3, 3, GoalBandsData.IHF),
    height: AutoMovieArchetypeBand.metres(2, 2, GoalBandsData.IHF),
    bar: AutoMovieArchetypeBand.metres(0.08, 0.08, GoalBandsData.IHF),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      30,
      70,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  },
  basketballHoop: {
    width: AutoMovieArchetypeBand.metres(1.8, 1.8, `${GoalBandsData.FIBA}: the backboard`),
    board: AutoMovieArchetypeBand.metres(1.05, 1.05, `${GoalBandsData.FIBA}: the backboard`),
    thickness: AutoMovieArchetypeBand.metres(0.0118, 0.0135, GoalBandsData.FIBA),
    height: AutoMovieArchetypeBand.metres(
      3.05,
      3.05,
      `${GoalBandsData.FIBA}: the ring's top`,
    ),
    ring: AutoMovieArchetypeBand.metres(
      0.45,
      0.459,
      `${GoalBandsData.FIBA}: inside diameter`,
    ),
    bar: AutoMovieArchetypeBand.metres(
      0.016,
      0.02,
      `${GoalBandsData.FIBA}: the ring's metal`,
    ),
    offset: AutoMovieArchetypeBand.metres(0.151, 0.151, GoalBandsData.FIBA),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      40,
      80,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  },
  volleyballNet: {
    width: AutoMovieArchetypeBand.metres(
      9.5,
      10,
      `${GoalBandsData.FIVB}: the net's length; the side bands 9 m apart, as 9.50 m less two 25 cm or 10 m less two 50 cm`,
    ),
    board: AutoMovieArchetypeBand.metres(1, 1, `${GoalBandsData.FIVB}: the net's width`),
    offset: AutoMovieArchetypeBand.metres(
      0.5,
      1,
      `${GoalBandsData.FIVB}: posts outside the side lines`,
    ),
    post: AutoMovieArchetypeBand.metres(2.55, 2.55, GoalBandsData.FIVB),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      40,
      80,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  },
  tennisNet: {
    width: AutoMovieArchetypeBand.metres(
      10.97,
      10.97,
      `${GoalBandsData.ITF}: the doubles court`,
    ),
    height: AutoMovieArchetypeBand.metres(
      0.914,
      0.914,
      `${GoalBandsData.ITF}: at the centre`,
    ),
    post: AutoMovieArchetypeBand.metres(1.07, 1.07, `${GoalBandsData.ITF}: at the posts`),
    offset: AutoMovieArchetypeBand.metres(0.914, 0.914, GoalBandsData.ITF),
    bar: AutoMovieArchetypeBand.metres(
      0.15,
      0.15,
      `${GoalBandsData.ITF}: the post; the model takes the limit`,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      30,
      60,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  },
};
