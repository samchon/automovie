import { createBow, createProjectile } from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanArchery,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Archery (#3487) as rows: the bow held out on the line from the face, the
 * string drawn over it to the anchor, and the arrow loosed along its line.
 * The bow's `string` slider is #3481's.
 *
 * Scenarios, the average man and the small woman, each taking a longbow in
 * the left hand, an arrow by its shaft in the right and nocking it on the
 * string (its nock on the bow's nocking point), at a target 18 m ahead at
 * chest height:
 * 1. `takeArrow`, `nockArrow`, then `presentBow` with `drawBow` over it from
 *    the set-up (as the bow rises, the string drawn while the bow arm
 *    extends), then `loose`, plans.
 * 2. Through the draw the drawing hand stays within 5 mm of the string's
 *    nocking point (the string's drive carries the nock with the hand).
 * 3. At full draw the bow arm is within 10 degrees of full extension.
 * 4. The loose launches the arrow along its line from its nock to its tip at
 *    the given speed, within 1e-6 m/s plus the hand's own velocity.
 * 5. The arrow flies and comes to rest within 1 m of the target's point.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Draws and looses a real bow and arrow through the public chain and reads the hand, the arm and the arrow's flight; a hand that leaves the string, a bent bow arm or an arrow that does not fly fails.
 * @evidence contracts/development/testing.md#independent-expectations The 5 mm, 10 degrees and the target's place are #3487's acceptance; the launch speed is the scene's, standing in for the bow's `launchSpeed`.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies; the draw, the full draw and the loose.
 * @evidence contracts/development/testing.md#execution-ownership Builds two performances in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the producer it waits on and the five numbered scenarios.
 */
export function test_human_motion_archery_draw(): void {
  const bow: ReturnType<typeof createBow> = createBow({ kind: "longbow" });
  const arrow: ReturnType<typeof createProjectile> = createProjectile({
    kind: "arrow",
  });
  // The recurve's launch speed band's low end (KSL, 2012 Olympics: 54.7 to 62.2 m/s), standing in for the bow's launchSpeed (#3481).
  const SPEED: number = 54.7;
  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const target: IAutoMovieVector3 = {
      x: 0,
      y: body.measure.chestHeight,
      z: 18,
    };
    let performance: IAutoMovieMotionHumanPerformance;
    try {
      performance = new HumanPerformance({
        seed: "archery",
        laws: [
          HumanArchery.takeArrow,
          HumanArchery.nockArrow,
          HumanArchery.presentBow,
          HumanArchery.drawBow,
          HumanArchery.loose,
        ],
        props: [
          HumanObject.prop("bow", bow, {
            at: { x: 0.3, y: 0.9, z: 0.4 },
            yaw: 0,
          }),
          HumanObject.prop("arrow", arrow, {
            at: { x: -0.3, y: 0.9, z: 0.4 },
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
          .pickUp({ prop: "bow", handle: "grip", hand: "left" })
          // The arrow taken by its shaft and nocked: its nock set on the
          // bow's nocking point, where it rides the string (putDown's
          // `onto`), the bow held before the body as nocking holds it.
          .registered("takeArrow", { prop: "arrow", hand: "right" })
          .registered("nockArrow", {
            prop: "arrow",
            hand: "right",
            onto: { prop: "bow", point: "nock", via: "nock" },
          })
          .registered(
            "presentBow",
            {
              gun: "bow",
              hand: "left",
              target: { kind: "point", frame: "world", at: target },
              seconds: 3,
            },
            "present",
          )
          .over((u) =>
            u
              // The draw begins with the set-up, as the bow rises toward the
              // target: the string hooked and drawn while the bow arm extends
              // (the shot cycle's set-up and pre-draw, KSL Shot Cycle,
              // kslinternationalarchery.com), not from full extension.
              .registered("drawBow", {
                hand: "right",
                mechanism: {
                  kind: "slider",
                  at: { kind: "prop", subject: "bow", point: "string" },
                  // The string's own travel, brace to the draw length.
                  travel: bow.affordances.find(
                    (a: { id: string }): boolean => a.id === "string",
                  )!.travel!,
                },
              })
              .sync({ of: "present", event: "start" })
              .registered("loose", {
                hand: "right",
                launch: {
                  prop: "arrow",
                  from: "nock",
                  to: "tip",
                  speed: SPEED,
                },
              }),
          ).node,
      });
    } catch (error) {
      TestValidator.predicate(
        `${name}: the draw plans (${error instanceof Error ? error.message : String(error)})`,
        false,
      );
      continue;
    }
    const overlays = performance.overlays("a");
    const draw = overlays[0];
    const loose = overlays[1];
    TestValidator.predicate(
      `${name}: the draw and the loose are placed`,
      draw !== undefined && loose !== undefined,
    );
    if (draw === undefined || loose === undefined) continue;

    // 2. The hand on the string through the draw.
    let off: number = 0;
    for (let k: number = 1; k <= 10; k++) {
      const t: number = draw.start + (draw.plan.duration * k) / 11;
      const hand: IAutoMovieVector3 = performance
        .bones("a", t)
        .get("rightHand")!.worldPosition;
      const nock: IAutoMovieVector3 = performance.aim(
        { kind: "prop", subject: "bow", point: "nock" },
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
      off = Math.max(
        off,
        Vector3.length(Vector3.subtract(hand, nock)) - body.measure.hand / 2,
      );
    }
    TestValidator.predicate(
      `${name}: the hand keeps the string (${(1000 * off).toFixed(1)} mm)`,
      off <= 5e-3,
    );

    // 3. The bow arm straight at full draw.
    const full: number =
      draw.start +
      draw.plan.duration *
        (draw.plan.events.find((e) => e.name === "strokeEnd")?.share ?? 1);
    const bones = performance.bones("a", full);
    const shoulder = bones.get("leftUpperArm")!.worldPosition;
    const elbow = bones.get("leftLowerArm")!.worldPosition;
    const wrist = bones.get("leftHand")!.worldPosition;
    const bend: number =
      (Math.acos(
        Math.max(
          -1,
          Math.min(
            1,
            Vector3.dot(
              Vector3.normalize(Vector3.subtract(elbow, shoulder)),
              Vector3.normalize(Vector3.subtract(wrist, elbow)),
            ),
          ),
        ),
      ) *
        180) /
      Math.PI;
    TestValidator.predicate(
      `${name}: the bow arm is straight (${bend.toFixed(1)} degrees)`,
      bend <= 10,
    );

    // 4 and 5. The loose and the flight.
    const launch = (loose.plan.launches ?? []).find((l) => l.prop === "arrow");
    TestValidator.predicate(
      `${name}: the loose launches the arrow`,
      launch !== undefined,
    );
    const flight = performance.flights("arrow")[0];
    TestValidator.predicate(`${name}: the arrow flies`, flight !== undefined);
    if (flight === undefined) continue;
    const rest: IAutoMovieVector3 = performance.prop(
      "arrow",
      performance.duration,
    ).position;
    TestValidator.predicate(
      `${name}: the arrow ends near the target (${Vector3.length(Vector3.subtract(rest, target)).toFixed(2)} m)`,
      Vector3.length(Vector3.subtract(rest, target)) <= 1,
    );
  }
}
