import { AutoMovieArchetypeBand, type IAutoMovieArchetypeBand } from "../../core";
import type { AutoMovieArchetypeGoal } from "../AutoMovieArchetypeGoal";

/*
 * The football goal read.
 */
const IFAB: string =
  "IFAB Laws of the Game, Law 1.10: 7.32 m between the inside of the posts, 2.44 m from the crossbar's lower edge to the ground, posts and crossbar of the same width and depth, at most 12 cm (https://www.theifab.com/laws/latest/the-field-of-play/)";

/*
 * Field hockey goal dimensions and minimum depth of the posts.
 */
const FIH: string =
  "FIH Rules of Hockey 2026, Field and Equipment Specification 1.5 (https://www.fih.hockey/static-assets/pdf/fih-Rules-of-hockey-2026-final.pdf)";

/*
 * Inside dimensions of the ice hockey goal mouth.
 */
const IIHF: string =
  "IIHF Rule Book 2026–27, §2.1 (https://test.rulebook.iihf.com/documents/rule-book-2026-27/2)";

/*
 * Inside dimensions and approximate pipe diameter for Sixes.
 */
const SIXES: string =
  "World Lacrosse Sixes Rule Book 2026–28, §1.2.1 (https://worldlacrosse.sport/wp-content/uploads/2026/05/26-28-Sixes-Rule-Book_v2_0526.pdf)";

/*
 * Indoor handball aperture and bar section.
 */
const IHF: string =
  "IHF Rules of the Game for Indoor Handball, 1:2 (https://www.ihf.info/sites/default/files/2025-07/09A%20-%20Rules%20of%20the%20Game_Indoor%20Handball_E.pdf)";

/*
 * The basketball equipment read.
 */
const FIBA: string =
  "FIBA Official Basketball Rules 2026, Basketball Equipment: backboard 1,800 x 1,050 mm (1.1.3), 11.8 to 13.5 mm thick (1.1.1), its bottom edge 150 mm below the ring's top (1.1.5); ring's top 3,050 mm above the floor (1.2.4), inside diameter 450 to 459 mm, metal 16 to 20 mm (1.2.1), its nearest inside point 151 mm from the backboard's face (1.2.5) (https://assets.fiba.basketball/image/upload/documents-corporate-fiba-official-rules-2026-equipment-v1-0.pdf)";

/*
 * The volleyball net read.
 */
const FIVB: string =
  "FIVB Official Volleyball Rules 2025-2028, Rule 2: net top 2.43 m for men and 2.24 m for women (2.1.1); 1 m wide, 9.50 to 10 m long with 25 to 50 cm each side of the side bands, top band 7 cm (2.2); antennae 1.80 m long, 10 mm across, the top 80 cm above the net (2.4); posts 2.55 m high, 0.50 to 1.00 m outside the side lines (2.5.1) (https://www.fivb.com/wp-content/uploads/2025/01/FIVB-Volleyball_Rules2025_2028-EN-v05.pdf)";

/*
 * The tennis net read.
 */
const ITF: string =
  "ITF Rules of Tennis 2026, Rule 1: doubles court 10.97 m wide; net 1.07 m at the posts and 0.914 m at the centre; posts' centres 0.914 m outside the doubles court, at most 15 cm square and 2.5 cm above the net cord; cord at most 0.8 cm; band 5 to 6.35 cm deep (https://www.world.tennis/media/7221/2026-rules-of-tennis-english.pdf)";

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
    width: AutoMovieArchetypeBand.metres(7.32, 7.32, IFAB),
    height: AutoMovieArchetypeBand.metres(2.44, 2.44, IFAB),
    bar: AutoMovieArchetypeBand.metres(
      0.12,
      0.12,
      `${IFAB}; the model takes the limit`,
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
    width: AutoMovieArchetypeBand.metres(3.66, 3.66, FIH),
    height: AutoMovieArchetypeBand.metres(2.14, 2.14, FIH),
    bar: AutoMovieArchetypeBand.metres(0.05, 0.05, FIH),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      50,
      100,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  },
  iceHockeyGoal: {
    width: AutoMovieArchetypeBand.metres(1.83, 1.83, IIHF),
    height: AutoMovieArchetypeBand.metres(1.22, 1.22, IIHF),
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
    width: AutoMovieArchetypeBand.metres(1.83, 1.83, SIXES),
    height: AutoMovieArchetypeBand.metres(1.83, 1.83, SIXES),
    bar: AutoMovieArchetypeBand.metres(0.05, 0.05, SIXES),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      20,
      50,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  },
  handballGoal: {
    width: AutoMovieArchetypeBand.metres(3, 3, IHF),
    height: AutoMovieArchetypeBand.metres(2, 2, IHF),
    bar: AutoMovieArchetypeBand.metres(0.08, 0.08, IHF),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      30,
      70,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  },
  basketballHoop: {
    width: AutoMovieArchetypeBand.metres(1.8, 1.8, `${FIBA}: the backboard`),
    board: AutoMovieArchetypeBand.metres(1.05, 1.05, `${FIBA}: the backboard`),
    thickness: AutoMovieArchetypeBand.metres(0.0118, 0.0135, FIBA),
    height: AutoMovieArchetypeBand.metres(
      3.05,
      3.05,
      `${FIBA}: the ring's top`,
    ),
    ring: AutoMovieArchetypeBand.metres(
      0.45,
      0.459,
      `${FIBA}: inside diameter`,
    ),
    bar: AutoMovieArchetypeBand.metres(
      0.016,
      0.02,
      `${FIBA}: the ring's metal`,
    ),
    offset: AutoMovieArchetypeBand.metres(0.151, 0.151, FIBA),
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
      `${FIVB}: the net's length; the side bands 9 m apart, as 9.50 m less two 25 cm or 10 m less two 50 cm`,
    ),
    board: AutoMovieArchetypeBand.metres(1, 1, `${FIVB}: the net's width`),
    offset: AutoMovieArchetypeBand.metres(
      0.5,
      1,
      `${FIVB}: posts outside the side lines`,
    ),
    post: AutoMovieArchetypeBand.metres(2.55, 2.55, FIVB),
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
      `${ITF}: the doubles court`,
    ),
    height: AutoMovieArchetypeBand.metres(
      0.914,
      0.914,
      `${ITF}: at the centre`,
    ),
    post: AutoMovieArchetypeBand.metres(1.07, 1.07, `${ITF}: at the posts`),
    offset: AutoMovieArchetypeBand.metres(0.914, 0.914, ITF),
    bar: AutoMovieArchetypeBand.metres(
      0.15,
      0.15,
      `${ITF}: the post; the model takes the limit`,
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
