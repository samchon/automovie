import { ArchetypeFrame, createBellFrame, createLoadingTower } from "@automovie/archetypes";
import type { IAutoMovieAffordance, IAutoMovieModelPart, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../internal/archetypeExtent";
import { nclose } from "../internal/nclose";

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
 * @evidence contracts/development/common.md#meaningful-documentation Lists the two fixed props and the geometry pinned for each.
 * @evidence contracts/development/testing.md#behavioral-verification Measures the public model's colliders and affordance frames at two seeds; compares the doorway to the jambs and lintel, and checks the stepped front and hanging silhouette.
 * @evidence contracts/development/testing.md#independent-expectations Contact limits come from measured collider faces. Gap and clearance checks compare actual parts and use no producer dimension formulas.
 * @evidence contracts/development/testing.md#distinguishing-cases Three top surfaces have distinct positions; the aperture has a different kind and an independently measured void. The bell silhouette is assessed independently of the tower.
 * @evidence contracts/development/testing.md#execution-ownership An in-memory archetype test discovered by its exported name.
 */
export function test_archetype_period_scenery(): void {
  for (const seed of [3, 71]) {
    const tower: ReturnType<typeof createLoadingTower> = createLoadingTower({}, seed);
    for (const id of ["boarding", "platform", "gangway"] as const) {
      const surface: IAutoMovieAffordance = tower.affordance(id);
      const x: ReturnType<typeof archetypeExtent> = archetypeExtent(tower, "x", [id]);
      const y: ReturnType<typeof archetypeExtent> = archetypeExtent(tower, "y", [id]);
      const z: ReturnType<typeof archetypeExtent> = archetypeExtent(tower, "z", [id]);
      const at: IAutoMovieVector3 = surface.frame.translation;
      TestValidator.predicate(
        `${id} follows the visible face for seed ${seed}`,
        surface.kind === "surface" &&
          surface.width !== undefined &&
          surface.depth !== undefined &&
          nclose(at.x - surface.width / 2, x.low) &&
          nclose(at.x + surface.width / 2, x.high) &&
          nclose(at.y, y.high) &&
          nclose(at.z - surface.depth / 2, z.low) &&
          nclose(at.z + surface.depth / 2, z.high) &&
          nclose(ArchetypeFrame.axis(surface.frame, "y").y, 1),
      );
    }
    const boarding: ReturnType<typeof archetypeExtent> = archetypeExtent(tower, "z", ["boarding"]);
    const lower: ReturnType<typeof archetypeExtent> = archetypeExtent(tower, "z", ["lower-floor"]);
    const platform: ReturnType<typeof archetypeExtent> = archetypeExtent(tower, "z", ["platform"]);
    const gangway: ReturnType<typeof archetypeExtent> = archetypeExtent(tower, "z", ["gangway"]);
    const door: IAutoMovieAffordance = tower.affordance("door");
    const threshold: IAutoMovieVector3 = door.frame.translation;
    const left: ReturnType<typeof archetypeExtent> = archetypeExtent(tower, "x", ["front-jamb-left"]);
    const right: ReturnType<typeof archetypeExtent> = archetypeExtent(tower, "x", ["front-jamb-right"]);
    const lintel: ReturnType<typeof archetypeExtent> = archetypeExtent(tower, "y", ["door-lintel"]);
    TestValidator.predicate(
      `boarding and gangway meet their floors for seed ${seed}`,
      nclose(boarding.high, lower.low) &&
        nclose(archetypeExtent(tower, "y", ["boarding"]).high, archetypeExtent(tower, "y", ["lower-floor"]).high) &&
        nclose(platform.high, gangway.low) &&
        nclose(archetypeExtent(tower, "y", ["platform"]).high, archetypeExtent(tower, "y", ["gangway"]).high),
    );
    TestValidator.predicate(
      `the aperture describes the clear front opening for seed ${seed}`,
      door.kind === "aperture" &&
        door.width !== undefined &&
        door.height !== undefined &&
        nclose(left.high, threshold.x - door.width / 2) &&
        nclose(right.low, threshold.x + door.width / 2) &&
        nclose(lintel.low, threshold.y + door.height) &&
        nclose(threshold.y, archetypeExtent(tower, "y", ["platform"]).high) &&
        nclose(threshold.z, gangway.low) &&
        nclose(ArchetypeFrame.axis(door.frame, "z").z, 1),
    );
    TestValidator.predicate(
      `wheel faces reach the ground for seed ${seed}`,
      nclose(archetypeExtent(tower, "y").low, 0),
    );

    const bell: ReturnType<typeof createBellFrame> = createBellFrame({}, seed);
    const step: IAutoMovieAffordance = bell.affordance("step");
    const plinth: ReturnType<typeof archetypeExtent> = archetypeExtent(bell, "y", ["plinth"]);
    const front: ReturnType<typeof archetypeExtent> = archetypeExtent(bell, "z", ["plinth"]);
    const posts: string[] = bell.parts
      .filter((part: IAutoMovieModelPart): boolean => part.id.startsWith("post-"))
      .map((part: IAutoMovieModelPart): string => part.id);
    const postFront: ReturnType<typeof archetypeExtent> = archetypeExtent(bell, "z", posts);
    TestValidator.predicate(
      `the front step is the clear plinth strip for seed ${seed}`,
      step.kind === "surface" &&
        step.depth !== undefined &&
        step.width !== undefined &&
        nclose(step.frame.translation.y, plinth.high) &&
        nclose(step.width, archetypeExtent(bell, "x", ["plinth"]).size) &&
        nclose(step.frame.translation.z - step.depth / 2, postFront.high) &&
        nclose(step.frame.translation.z + step.depth / 2, front.high) &&
        nclose(archetypeExtent(bell, "y").low, 0),
    );
    const canopy: ReturnType<typeof archetypeExtent> = archetypeExtent(bell, "y", ["canopy"]);
    const shoulder: ReturnType<typeof archetypeExtent> = archetypeExtent(bell, "x", ["bell-shoulder"]);
    const flare: ReturnType<typeof archetypeExtent> = archetypeExtent(bell, "x", ["bell-flare"]);
    TestValidator.predicate(
      `the canopy covers a flared hanging bell for seed ${seed}`,
      nclose(canopy.high, archetypeExtent(bell, "y").high) &&
        canopy.low > archetypeExtent(bell, "y", ["bell-shoulder"]).high &&
        flare.size > shoulder.size &&
        archetypeExtent(bell, "y", ["clapper"]).low > plinth.high,
    );
  }
}
