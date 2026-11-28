import { AutoMovieArchetypeBox } from "@automovie/archetypes";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionHumanChain,
  AutoMovieMotionHumanObject,
  AutoMovieMotionHumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { FamilyCaseKit } from "../../../../../packages/motions/src/executable/cases/FamilyCaseKit";
import { HumanHand } from "../../../../../packages/motions/src/posture/internal/HumanHand";

const BOX_DIMENSIONS = { width: 0.43, height: 0.33, depth: 0.36 };
const RADIUS = 0.018;
const HALF_RAIL = 0.11;

/**
 * Two selectable side handles put the grip frames on real carton bars.
 *
 * The saved default retains one body collider and both original side frames.
 * The enabled model exposes two rounded rails attached to the carton body. Both
 * named grips let an actor approach and place their displayed pads on the
 * physical rail during an ordinary pickup.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names both construction choices, the saved geometry control, and the posed material contacts.
 * @evidence contracts/development/testing.md#behavioral-verification Builds both boxed configurations, reads the render parts and collider parts, and performs normal public pickups with both hand/side combinations on a stored body.
 * @evidence contracts/development/testing.md#independent-expectations A 430 mm carton with rails 65 mm out from its walls has rail centres at x ±0.28 m. The displayed index and middle pads meet the 18 mm-radius cylinder surface within 3 mm, with measurable clearance before closure.
 */
export function test_archetype_box_side_handles(): void {
  const absent = AutoMovieArchetypeBox.create(BOX_DIMENSIONS, 11);
  const disabled = AutoMovieArchetypeBox.create(
    { ...BOX_DIMENSIONS, sideHandles: false },
    11,
  );
  const enabled = AutoMovieArchetypeBox.create(
    { ...BOX_DIMENSIONS, sideHandles: true },
    11,
  );
  const fingerprint = (model: typeof absent) => ({
    parts: model.parts,
    body: model.body,
    materials: model.materials,
    affordances: model.affordances,
    dimensions: model.dimensions,
    shapes: model.shapes(),
  });
  TestValidator.equals(
    "omitted and disabled handles retain the saved carton",
    fingerprint(absent),
    fingerprint(disabled),
  );
  TestValidator.equals(
    "the saved model still uses one geometry part",
    absent.parts.length,
    1,
  );
  TestValidator.equals(
    "the saved model still uses one collider",
    absent.shapes().length,
    1,
  );
  TestValidator.equals(
    "two bars and their mounts are visible",
    enabled.parts.length,
    7,
  );

  const shapes = enabled.shapes();
  const mountIds = ["left", "right"].flatMap((side) =>
    [-1, 1].map((end) => side + "-handle-mount-" + end),
  );
  for (const id of mountIds) {
    TestValidator.predicate(
      id + " has matching render geometry and collider",
      enabled.parts.some((part) => part.id === id) &&
        shapes.some((shape) => shape.id === id),
    );
  }
  const rails = shapes.filter(
    ({ id }) => id === "left-handle" || id === "right-handle",
  );
  TestValidator.equals(
    "two round rails have material colliders",
    rails.length,
    2,
  );

  const { body } = FamilyCaseKit.body("m-average");
  const prop = AutoMovieMotionHumanObject.prop(
    "carton",
    enabled,
    { at: { x: 0, y: 0.9, z: 0.37 }, yaw: 0 },
    () => ({ at: { x: 0, y: 0.9, z: 0.37 }, yaw: 0 }),
  );
  for (const [actor, hand, site, sign, wait] of [
    ["first", "left", "right", -1, 0.4],
    ["second", "right", "left", 1, 1.18],
  ] as const) {
    const receipt = enabled.affordance(site);
    const rail = rails.find(
      ({ transform }) => Math.sign(transform.position.x) === sign,
    )!;
    const archivedContact = absent.affordance(site).frame.translation;
    TestValidator.predicate(
      site + " retains the old wall plane when disabled",
      Math.abs(archivedContact.x - sign * 0.215) < 1e-9,
    );
    TestValidator.predicate(
      site + " locates the material rail",
      () =>
        Math.abs(rail.transform.position.x - sign * 0.28) < 1e-9 &&
        rail.kind === "capsule" &&
        rail.radius === RADIUS &&
        rail.halfLength === HALF_RAIL &&
        receipt.aperture === 2 * RADIUS &&
        receipt.length === 2 * HALF_RAIL,
    );
    const film = new AutoMovieMotionHumanPerformance({
      seed: "joint-approach-by-role",
      performers: [
        {
          subject: actor,
          body,
          at: { x: sign * 0.57, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      props: [prop],
      composition: AutoMovieMotionHumanChain.subject(actor)
        .stand({ hold: wait })
        .pickUp({ prop: "carton", handle: site, hand, lift: 0 }, "grasp")
        .stand({ hold: 0.2 }).node,
    });
    const closed = film.instant({ of: "grasp", event: "gripClosed" });
    const centre = film.site("carton", site, closed).position;
    const gap = (
      seconds: number,
      pad: "palm" | "indexPad" | "middlePad",
    ): number =>
      railGap(
        HumanHand.frame(body, film.bones(actor, seconds), hand, pad).point,
        centre,
      );
    for (const pad of ["palm", "indexPad", "middlePad"] as const) {
      const title = site + " " + pad;
      TestValidator.predicate(
        title + " approaches clear of the rail",
        gap(closed - 0.08, pad) > 0.007,
      );
      TestValidator.predicate(
        title + " contacts material at closure",
        Math.abs(gap(closed, pad)) < 0.003,
      );
      TestValidator.predicate(
        title + " remains at the rail during loading",
        Math.abs(gap(closed + 0.045, pad)) < 0.004,
      );
    }
  }
}

function railGap(point: IAutoMovieVector3, centre: IAutoMovieVector3): number {
  return (
    Math.hypot(
      point.x - centre.x,
      point.y - centre.y,
      Math.max(0, Math.abs(point.z - centre.z) - HALF_RAIL),
    ) - RADIUS
  );
}
