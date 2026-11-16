import { createLongGun } from "@automovie/archetypes";
import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanMusketDrill,
  HumanObject,
  HumanPerformance,
  HumanVerdicts,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The musket's recover (#3488), Make Ready's first motion in the 1764 Manual
 * Exercise: "the Butt close to the left breast, but not pressed, the
 * Firelock perpendicular, opposite the left Side of the Face".
 *
 * Scenarios, the average man and the small woman, each taking a flintlock
 * musket by its grip in the right hand and recovering it:
 * 1. The recover plans.
 * 2. At its hold the firelock's line, from the butt to the muzzle, is upright within the
 *    turn the audit's skin (`HumanVerdicts.SKIN`) at each end makes over
 *    that length.
 * 3. The butt is at the left breast's surface, within the skin.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Recovers a real musket archetype through the public chain and reads the displayed musket against the body's own breast surface; a firelock left sloped, held off the body or on the wrong side fails.
 * @evidence contracts/development/testing.md#independent-expectations The posture is the manual's words; the breast is the body's surface region; the bounds are the audit's skin.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies; the bore's line and the butt's place.
 * @evidence contracts/development/testing.md#execution-ownership Builds two performances in memory.
 * @evidence contracts/development/common.md#meaningful-documentation Quotes the drill and states the three numbered scenarios with their bounds.
 */
export function test_human_motion_musket_recover(): void {
  const musket: ReturnType<typeof createLongGun> = createLongGun({
    kind: "musket",
  });
  const point = (id: "butt" | "muzzle"): IAutoMovieVector3 =>
    musket.affordance(id).frame.translation;
  const length: number = Vector3.length(
    Vector3.subtract(point("muzzle"), point("butt")),
  );
  const bound: number =
    (Math.atan((2 * HumanVerdicts.SKIN) / length) * 180) / Math.PI;
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    let performance: HumanPerformance;
    try {
      performance = new HumanPerformance({
        seed: "recover",
        laws: [HumanMusketDrill.recover],
        props: [
          HumanObject.prop("musket", musket, {
            // Its grip within the right hand's reach: before the right
            // shoulder at the waist, a forearm ahead.
            at: Vector3.subtract(
              {
                x: -body.measure.shoulderHalfWidth,
                y: body.measure.waistHeight,
                z: body.measure.forearm,
              },
              musket.affordance("grip").frame.translation,
            ),
            yaw: 0,
          }),
        ],
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: HumanChain.subject("a")
          .pickUp({ prop: "musket", handle: "grip" })
          .registered("recover", { gun: "musket", seconds: 1 }).node,
      });
    } catch (error) {
      TestValidator.predicate(
        `${name}: the recover plans (${error instanceof Error ? error.message : String(error)})`,
        false,
      );
      continue;
    }
    const segment = performance.segments("a")[1]!;
    const t: number = segment.start + 0.75 * segment.plan.duration;
    const frame = performance.prop("musket", t);
    const world = (id: "butt" | "muzzle"): IAutoMovieVector3 =>
      Vector3.add(frame.position, Quaternion.rotateVector(frame.rotation, point(id)));
    // "The Firelock perpendicular": the whole piece upright, the line from
    // its butt to its muzzle (the law's reading, after the manual's butt
    // and face and the 1778 Britannica abstract's "straight up").
    const bore: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(world("muzzle"), world("butt")),
    );
    const tilt: number =
      (Math.acos(Math.max(-1, Math.min(1, bore.y))) * 180) / Math.PI;
    TestValidator.predicate(
      `${name}: the firelock is upright (${tilt.toFixed(2)} of ${bound.toFixed(2)} degrees)`,
      tilt <= bound,
    );
    const region: typeof body.surfaces.regions.chestLeft =
      body.surfaces.regions.chestLeft;
    const breast: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
      region,
      performance.bones("a", t).get(region.bone)!,
    ).point;
    const off: number = Vector3.length(Vector3.subtract(world("butt"), breast));
    TestValidator.predicate(
      `${name}: the butt is at the left breast (${(1000 * off).toFixed(1)} mm)`,
      off <= HumanVerdicts.SKIN,
    );
  }
}
