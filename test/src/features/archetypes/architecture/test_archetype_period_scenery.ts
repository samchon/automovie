import {
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeBellFrame,
  AutoMovieArchetypeLoadingTower,
} from "@automovie/archetypes";
import type {
  IAutoMovieAffordance,
  IAutoMoviePhysicalShape,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { archetypeExtent } from "../../internal/archetypeExtent";
import { nclose, vclose } from "../../internal/predicates";
/**
 * Fixed period scenery exposes unobstructed contact geometry at its visible surfaces.
 *
 * Scenarios:
 * 1. A loading tower's rear boarding area, upper floor and gangway describe the
 * corresponding slab faces, the gangway meets the upper floor, and the door
 * fits the gap between the jambs and lintel.
 * 2. The civic bell frame rests on its plinth, clears the front step, and the
 * canopy contains the highest point over a flared hanging bell.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the stepped stage front, separate support surfaces, tower opening and hanging bell geometry.
 * @evidence contracts/development/testing.md#behavioral-verification Measures both generated props' colliders and contact frames. Checks doorway fit against jambs and lintel and measures the stepped surfaces and hanging silhouette independently.
 * @evidence contracts/development/testing.md#independent-expectations Uses the authored fixed prop dimensions and measured adjacent solid boundaries. Each opening and support contact must agree with its own physical faces.
 */
export function test_archetype_period_scenery(): void {
  const tower: ReturnType<typeof AutoMovieArchetypeLoadingTower.create> =
    AutoMovieArchetypeLoadingTower.create({}, 3);
  const towerShapes: IAutoMoviePhysicalShape[] = tower.shapes();
  for (const id of ["boarding", "platform", "gangway"] as const) {
    const surface: IAutoMovieAffordance = tower.affordance(id);
    const x: ReturnType<typeof archetypeExtent> = archetypeExtent(
      towerShapes,
      "x",
      [id],
    );
    const y: ReturnType<typeof archetypeExtent> = archetypeExtent(
      towerShapes,
      "y",
      [id],
    );
    const z: ReturnType<typeof archetypeExtent> = archetypeExtent(
      towerShapes,
      "z",
      [id],
    );
    const at: IAutoMovieVector3 = surface.frame.translation;
    TestValidator.predicate(
      `${id} follows the visible face`,
      surface.kind === "surface" &&
        surface.width !== undefined &&
        surface.depth !== undefined &&
        nclose(at.x - surface.width / 2, x.low) &&
        nclose(at.x + surface.width / 2, x.high) &&
        nclose(at.y, y.high) &&
        nclose(at.z - surface.depth / 2, z.low) &&
        nclose(at.z + surface.depth / 2, z.high) &&
        vclose(AutoMovieArchetypeFrame.axis(surface.frame, "y"), {
          x: 0,
          y: 1,
          z: 0,
        }) &&
        vclose(AutoMovieArchetypeFrame.axis(surface.frame, "x"), {
          x: 1,
          y: 0,
          z: 0,
        }),
    );
  }
  const boarding: ReturnType<typeof archetypeExtent> = archetypeExtent(
    towerShapes,
    "z",
    ["boarding"],
  );
  const lower: ReturnType<typeof archetypeExtent> = archetypeExtent(
    towerShapes,
    "z",
    ["lower-floor"],
  );
  const platform: ReturnType<typeof archetypeExtent> = archetypeExtent(
    towerShapes,
    "z",
    ["platform"],
  );
  const gangway: ReturnType<typeof archetypeExtent> = archetypeExtent(
    towerShapes,
    "z",
    ["gangway"],
  );
  const lowerY: number = archetypeExtent(towerShapes, "y", [
    "lower-floor",
  ]).high;
  const platformY: number = archetypeExtent(towerShapes, "y", [
    "platform",
  ]).high;
  const door: IAutoMovieAffordance = tower.affordance("door");
  const threshold: IAutoMovieVector3 = door.frame.translation;
  const left: ReturnType<typeof archetypeExtent> = archetypeExtent(
    towerShapes,
    "x",
    ["front-jamb-left"],
  );
  const right: ReturnType<typeof archetypeExtent> = archetypeExtent(
    towerShapes,
    "x",
    ["front-jamb-right"],
  );
  const lintel: ReturnType<typeof archetypeExtent> = archetypeExtent(
    towerShapes,
    "y",
    ["door-lintel"],
  );
  TestValidator.predicate(
    "boarding and gangway meet their floors",
    nclose(boarding.high, lower.low) &&
      nclose(archetypeExtent(towerShapes, "y", ["boarding"]).high, lowerY) &&
      nclose(platform.high, gangway.low) &&
      nclose(archetypeExtent(towerShapes, "y", ["gangway"]).high, platformY),
  );
  TestValidator.predicate(
    "the aperture describes the clear front opening",
    door.kind === "aperture" &&
      door.width !== undefined &&
      door.height !== undefined &&
      nclose(left.high, threshold.x - door.width / 2) &&
      nclose(right.low, threshold.x + door.width / 2) &&
      nclose(lintel.low, threshold.y + door.height) &&
      nclose(threshold.y, platformY) &&
      nclose(threshold.z, gangway.low) &&
      nclose(AutoMovieArchetypeFrame.axis(door.frame, "z").z, 1),
  );
  TestValidator.predicate(
    "wheel faces reach the ground",
    nclose(archetypeExtent(towerShapes, "y").low, 0),
  );
  const bell: ReturnType<typeof AutoMovieArchetypeBellFrame.create> =
    AutoMovieArchetypeBellFrame.create({}, 71);
  const bellShapes: IAutoMoviePhysicalShape[] = bell.shapes();
  const step: IAutoMovieAffordance = bell.affordance("step");
  const plinth: ReturnType<typeof archetypeExtent> = archetypeExtent(
    bellShapes,
    "y",
    ["plinth"],
  );
  const front: ReturnType<typeof archetypeExtent> = archetypeExtent(
    bellShapes,
    "z",
    ["plinth"],
  );
  const plinthWidth: ReturnType<typeof archetypeExtent> = archetypeExtent(
    bellShapes,
    "x",
    ["plinth"],
  );
  const posts: string[] = bellShapes
    .filter((part: IAutoMoviePhysicalShape): boolean =>
      part.id.startsWith("post-"),
    )
    .map((part: IAutoMoviePhysicalShape): string => part.id);
  const postFront: ReturnType<typeof archetypeExtent> = archetypeExtent(
    bellShapes,
    "z",
    posts,
  );
  TestValidator.predicate(
    "the front step is the clear plinth strip",
    step.kind === "surface" &&
      step.depth !== undefined &&
      step.width !== undefined &&
      nclose(step.frame.translation.y, plinth.high) &&
      nclose(step.frame.translation.x - step.width / 2, plinthWidth.low) &&
      nclose(step.frame.translation.x + step.width / 2, plinthWidth.high) &&
      nclose(step.frame.translation.z - step.depth / 2, postFront.high) &&
      nclose(step.frame.translation.z + step.depth / 2, front.high) &&
      nclose(plinth.low, 0) &&
      nclose(archetypeExtent(bellShapes, "y").low, 0),
  );
  const canopy: ReturnType<typeof archetypeExtent> = archetypeExtent(
    bellShapes,
    "y",
    ["canopy"],
  );
  const shoulder: ReturnType<typeof archetypeExtent> = archetypeExtent(
    bellShapes,
    "x",
    ["bell-shoulder"],
  );
  const flare: ReturnType<typeof archetypeExtent> = archetypeExtent(
    bellShapes,
    "x",
    ["bell-flare"],
  );
  TestValidator.predicate(
    "the canopy covers a flared hanging bell",
    nclose(canopy.high, archetypeExtent(bellShapes, "y").high) &&
      canopy.low > archetypeExtent(bellShapes, "y", ["bell-shoulder"]).high &&
      flare.size > shoulder.size &&
      archetypeExtent(bellShapes, "y", ["clapper"]).low > plinth.high,
  );
}
