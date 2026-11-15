import { ArchetypeBand, type IArchetypeBand } from "../core";
import type { createGoal } from "./createGoal";

/** The football goal read. */
const IFAB: string =
  "IFAB Laws of the Game, Law 1.10: 7.32 m between the inside of the posts, 2.44 m from the crossbar's lower edge to the ground, posts and crossbar of the same width and depth, at most 12 cm (https://www.theifab.com/laws/latest/the-field-of-play/)";

/** The basketball equipment read. */
const FIBA: string =
  "FIBA Official Basketball Rules 2026, Basketball Equipment: backboard 1,800 x 1,050 mm (1.1.3), 11.8 to 13.5 mm thick (1.1.1), its bottom edge 150 mm below the ring's top (1.1.5); ring's top 3,050 mm above the floor (1.2.4), inside diameter 450 to 459 mm, metal 16 to 20 mm (1.2.1), its nearest inside point 151 mm from the backboard's face (1.2.5) (https://assets.fiba.basketball/image/upload/documents-corporate-fiba-official-rules-2026-equipment-v1-0.pdf)";

/** The volleyball net read. */
const FIVB: string =
  "FIVB Official Volleyball Rules 2025-2028, Rule 2: net top 2.43 m for men and 2.24 m for women (2.1.1); 1 m wide, 9.50 to 10 m long with 25 to 50 cm each side of the side bands, top band 7 cm (2.2); antennae 1.80 m long, 10 mm across, the top 80 cm above the net (2.4); posts 2.55 m high, 0.50 to 1.00 m outside the side lines (2.5.1) (https://www.fivb.com/wp-content/uploads/2025/01/FIVB-Volleyball_Rules2025_2028-EN-v05.pdf)";

/** The tennis net read. */
const ITF: string =
  "ITF Rules of Tennis 2026, Rule 1: doubles court 10.97 m wide; net 1.07 m at the posts and 0.914 m at the centre; posts' centres 0.914 m outside the doubles court, at most 15 cm square and 2.5 cm above the net cord; cord at most 0.8 cm; band 5 to 6.35 cm deep (https://www.world.tennis/media/7221/2026-rules-of-tennis-english.pdf)";

/**
 * The band of each free dimension of {@link createGoal}, by kind.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the table holds; each band names its source.
 * @evidence contracts/development/design.md#principled-representation One cited band per dimension per kind, keyed by the producer's closed unions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Kept beside the producer so the producer stays one readable construction; it re-exports as `createGoal.BANDS`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Where a rule states only a limit, the band is that limit, and says so.
 */
export const GOAL_BANDS: Readonly<
  Record<
    createGoal.Kind,
    Readonly<Partial<Record<createGoal.Dimension, IArchetypeBand>>>
  >
> = {
  footballGoal: {
    width: ArchetypeBand.metres(7.32, 7.32, IFAB),
    height: ArchetypeBand.metres(2.44, 2.44, IFAB),
    bar: ArchetypeBand.metres(0.12, 0.12, `${IFAB}; the model takes the limit`),
    mass: ArchetypeBand.of("kg", 100, 200, ArchetypeBand.TYPICAL_MASS, true),
  },
  basketballHoop: {
    width: ArchetypeBand.metres(1.8, 1.8, `${FIBA}: the backboard`),
    board: ArchetypeBand.metres(1.05, 1.05, `${FIBA}: the backboard`),
    thickness: ArchetypeBand.metres(0.0118, 0.0135, FIBA),
    height: ArchetypeBand.metres(3.05, 3.05, `${FIBA}: the ring's top`),
    ring: ArchetypeBand.metres(0.45, 0.459, `${FIBA}: inside diameter`),
    bar: ArchetypeBand.metres(0.016, 0.02, `${FIBA}: the ring's metal`),
    offset: ArchetypeBand.metres(0.151, 0.151, FIBA),
    mass: ArchetypeBand.of("kg", 40, 80, ArchetypeBand.TYPICAL_MASS, true),
  },
  volleyballNet: {
    width: ArchetypeBand.metres(
      9.5,
      10,
      `${FIVB}: the net's length; the side bands 9 m apart, as 9.50 m less two 25 cm or 10 m less two 50 cm`,
    ),
    board: ArchetypeBand.metres(1, 1, `${FIVB}: the net's width`),
    offset: ArchetypeBand.metres(
      0.5,
      1,
      `${FIVB}: posts outside the side lines`,
    ),
    post: ArchetypeBand.metres(2.55, 2.55, FIVB),
    mass: ArchetypeBand.of("kg", 40, 80, ArchetypeBand.TYPICAL_MASS, true),
  },
  tennisNet: {
    width: ArchetypeBand.metres(10.97, 10.97, `${ITF}: the doubles court`),
    height: ArchetypeBand.metres(0.914, 0.914, `${ITF}: at the centre`),
    post: ArchetypeBand.metres(1.07, 1.07, `${ITF}: at the posts`),
    offset: ArchetypeBand.metres(0.914, 0.914, ITF),
    bar: ArchetypeBand.metres(
      0.15,
      0.15,
      `${ITF}: the post; the model takes the limit`,
    ),
    mass: ArchetypeBand.of("kg", 30, 60, ArchetypeBand.TYPICAL_MASS, true),
  },
};
