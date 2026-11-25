import type { IAutoMovieVector3 } from "@automovie/interface";
import { StrikingRoom } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** The clearance to a wall at z = 1 of a sample swept along +Z. */
const WALL = (
  point: IAutoMovieVector3,
  radius: number,
  distance: number,
): number => 1 - (point.z + distance) - radius;

/** A feint along +Z from (0, 1.5, 0) to 0.8 m, aimed at 1 m, declared 0.6. */
const FEINT: StrikingRoom.IFeint = {
  declared: 0.6,
  aimed: { x: 0, y: 1.5, z: 1 },
  origin: { x: 0, y: 1.5, z: 0 },
  end: { x: 0, y: 1.5, z: 0.8 },
  reach: 0.1,
  line: { x: 0, y: 0, z: 1 },
  launch: 0,
};

/**
 * A strike's room (`StrikingRoom.room`, `share`): the least sweep at which any
 * sample of the limb meets the target, bisected, none when one already touches,
 * the limit when none meets; and the share of a feint's way out that stays
 * clear of the guard by the reach and both forearms' girth.
 *
 * Scenarios:
 *
 * 1. A 0.1 m sample at the origin and a 0.05 m one 0.2 m ahead, before a wall at 1
 *    m, have 0.75 m of room within 2 m; one at the wall has none; a wall beyond
 *    the limit leaves the limit.
 * 2. A guard 0.3 m out leaves 0.52 of the feint's 0.8 m, more than the 0.6
 *    declared; 0.5 m out it leaves 0.4; a metre out none; a feint without a way
 *    out keeps its declared share.
 */
export function test_unit_motions_striking_room(): void {
  const samples: StrikingRoom.ISample[] = [
    { point: { x: 0, y: 0, z: 0 }, radius: 0.1 },
    { point: { x: 0, y: 0, z: 0.2 }, radius: 0.05 },
  ];
  TestValidator.predicate(
    "the room",
    nclose(StrikingRoom.room(samples, WALL, 2), 0.75, 1e-4) &&
      StrikingRoom.room(
        [{ point: { x: 0, y: 0, z: 0.95 }, radius: 0.1 }],
        WALL,
        2,
      ) === 0 &&
      StrikingRoom.room(samples, WALL, 0.5) === 0.5,
  );
  TestValidator.predicate(
    "the feint",
    nclose(StrikingRoom.share(FEINT, 0.3, 0.08), 0.6, 1e-12) &&
      nclose(StrikingRoom.share(FEINT, 0.5, 0.08), 0.4, 1e-12) &&
      StrikingRoom.share(FEINT, 1, 0.08) === 0 &&
      StrikingRoom.share({ ...FEINT, end: FEINT.origin }, 0.3, 0.08) === 0.6,
  );
}
