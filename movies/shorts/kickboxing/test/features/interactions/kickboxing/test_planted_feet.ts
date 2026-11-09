import type { IAutoMovieSchedule } from "@automovie/engine";
import assert from "node:assert/strict";

import { PlantedFeet } from "../../../../src/interactions/kickboxing/PlantedFeet";
import { KickboxingAction } from "../../../../src/laws/kickboxing/KickboxingAction";
import { StanceShape } from "../../../../src/laws/kickboxing/StanceShape";
import { polygonCast } from "../../../internal/polygonCast";

/**
 * The planted feet of a standing and a switching fighter.
 *
 * Scenarios: standing, each ankle is the stance placement about the origin
 * along the facing and nothing reports a switch; half way through a switch
 * the feet stand mirrored across the line on the floor and the body turns
 * the other way; a quarter of the way the feet are in the air above the
 * stance height.
 */
export function test_planted_feet(): void {
  const cast = polygonCast();
  const measure = cast.a.body.measure;
  const schedule = { entries: [] } as unknown as IAutoMovieSchedule;
  const point = { x: 1, z: 0.5 };
  const facing = { x: 1, z: 0 };
  const stance = StanceShape.feet(measure);
  const near = (x: number, y: number): void =>
    assert.ok(Math.abs(x - y) < 1e-12, `${x} != ${y}`);

  const standing: PlantedFeet.IHere = { point };
  const stood = PlantedFeet.at(cast.a, schedule, standing, facing, cast);
  for (const side of ["left", "right"] as const) {
    near(stood[side].x, point.x + stance[side].x);
    near(stood[side].y, stance[side].y);
    near(stood[side].z, point.z + stance[side].z);
  }
  assert.equal(PlantedFeet.switching(standing, measure), null);

  const switching = (share: number): PlantedFeet.IHere => ({
    point,
    moving: {
      entry: {
        intent: KickboxingAction.intent(cast.a.id, {
          kind: "move",
          movement: "switch",
          steps: 2,
        }),
      } as IAutoMovieSchedule.IEntry,
      share,
      from: point,
      about: point,
    },
  });
  const half = PlantedFeet.at(cast.a, schedule, switching(0.5), facing, cast);
  for (const side of ["left", "right"] as const) {
    near(half[side].x, point.x - stance[side].x);
    near(half[side].y, stance[side].y);
    near(half[side].z, point.z + stance[side].z);
  }
  near(PlantedFeet.switching(switching(0.5), measure)!.yaw, -StanceShape.TURN);
  const quarter = PlantedFeet.at(
    cast.a,
    schedule,
    switching(0.25),
    facing,
    cast,
  );
  assert.ok(quarter.left.y > stance.left.y && quarter.right.y > stance.right.y);
}
