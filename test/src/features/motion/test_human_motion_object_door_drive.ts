import { createDoor } from "@automovie/archetypes";
import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * An act drives the articulation it operates (#3476): a door pulled open by
 * `operate` stays open, its handle where the hand let it go.
 *
 * Scenarios, the average man and the small woman, each 0.45 m from a
 * right-hinged lever door on its pull side, facing it, pulling it open 70
 * degrees by its `pull` lever and then standing 3 s:
 * 1. The opening plans and publishes one drive of the door's `hinge`.
 * 2. Before the stroke the door's state is empty (at rest).
 * 3. At the end of the stroke and at 1, 2 and 3 s after it the hinge's travel
 *    is 70 degrees within 1e-9: the last travel holds.
 * 4. At those instants the `pull` contact the performance aims at is within
 *    1 mm of the door posed at that travel, placed where the scene put it
 *    (the archetype's own pose, not the law's arc).
 * 5. Halfway through the stroke the travel lies strictly between 0 and 70.
 * 6. The hand's grip at the stroke's end is within 0.7 hand lengths of the
 *    moved handle (the ride grips test's share), so hand and part did not
 *    drift apart.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs a real door archetype through the public chain and reads the performance's state, its aim at the moved contact and the displayed hand; a drive never published, a state that snaps shut, a handle read at rest or a hand that leaves the part fails.
 * @evidence contracts/development/testing.md#independent-expectations The 70 degrees is the scene's ask, the handle's place the archetype's own `articulate` and `placed`, and the 0.7 share the ride grips test's; none is read from the law.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies of opposite build; before, during and after the stroke.
 * @evidence contracts/development/testing.md#execution-ownership Builds two performances in memory and reads a dozen instants of each.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the six numbered scenarios with their bounds.
 */
export function test_human_motion_object_door_drive(): void {
  const door: ReturnType<typeof createDoor> = createDoor({
    hinge: "right",
    hardware: "lever",
  });
  const placement: IAutoMovieTransform = {
    translation: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  };
  const lever: IAutoMovieVector3 = door.placed("pull", placement).translation;
  const SWING: number = 70;
  const span = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    let performance: HumanPerformance;
    try {
      performance = new HumanPerformance({
        seed: "door-drive",
        props: [
          HumanObject.prop("door", door, { at: { x: 0, y: 0, z: 0 }, yaw: 0, fixed: true }),
        ],
        performers: [
          {
            subject: "a",
            body,
            at: { x: lever.x, y: 0, z: 0.45 },
            yaw: 180,
            proficiency: { level: "trained" },
          },
        ],
        composition: HumanChain.subject("a")
          .operate({
            mechanism: {
              kind: "hinge",
              at: { kind: "prop", subject: "door", point: "pull" },
              hinge: { kind: "prop", subject: "door", point: "hinge" },
              swing: SWING,
            },
          })
          .stand({ seconds: 3 }).node,
      });
    } catch (error) {
      TestValidator.predicate(
        `${name}: the opening plans (${error instanceof Error ? error.message : String(error)})`,
        false,
      );
      continue;
    }

    // 1. One drive of the hinge.
    const opening = performance.segments("a")[0]!;
    const drives = opening.plan.drives ?? [];
    TestValidator.predicate(
      `${name}: the opening drives the door's hinge`,
      drives.length === 1 &&
        drives[0]!.prop === "door" &&
        drives[0]!.articulation === "hinge",
    );
    const drive = drives[0]!;
    const from: number = opening.start + drive.from * opening.plan.duration;
    const to: number = opening.start + drive.to * opening.plan.duration;

    // 2. At rest before the stroke.
    TestValidator.predicate(
      `${name}: the door is at rest before the stroke`,
      performance.state("door", Math.max(0, from - 0.05)).hinge === undefined,
    );

    // 3 and 4. Open, and the lever where the posed door has it.
    for (const t of [to, to + 1, to + 2, to + 3]) {
      const travel: number | undefined = performance.state("door", t).hinge;
      TestValidator.predicate(
        `${name}: the hinge holds ${SWING} degrees at ${t.toFixed(2)} s (${travel})`,
        travel !== undefined && Math.abs(travel - SWING) <= 1e-9,
      );
      const aimed: IAutoMovieVector3 = performance.aim(
        { kind: "prop", subject: "door", point: "pull" },
        t,
        {
          root: { x: 0, y: 0, z: 0 },
          yaw: 0,
          heights: { low: 0.5, middle: 1, high: 1.5 },
          range: 1,
          body,
          bones: () => performance.bones("a", t),
        },
      ).point;
      const posed: IAutoMovieVector3 = door
        .articulate({ hinge: SWING })
        .placed("pull", placement).translation;
      TestValidator.predicate(
        `${name}: the lever is where the open door has it at ${t.toFixed(2)} s (${(1000 * span(aimed, posed)).toFixed(2)} mm)`,
        span(aimed, posed) <= 1e-3,
      );
    }

    // 5. Partway open halfway.
    const half: number | undefined = performance.state("door", (from + to) / 2)
      .hinge;
    TestValidator.predicate(
      `${name}: halfway through the stroke the door is partway open (${half})`,
      half !== undefined && half > 0 && half < SWING,
    );

    // 6. The hand stayed on the lever.
    const hand = performance.bones("a", to).get("rightHand")!.worldPosition;
    const moved: IAutoMovieVector3 = door
      .articulate({ hinge: SWING })
      .placed("pull", placement).translation;
    TestValidator.predicate(
      `${name}: the hand is on the moved lever at the stroke's end (${span(hand, moved).toFixed(3)} m)`,
      span(hand, moved) <= 0.7 * body.measure.hand,
    );
  }
}
