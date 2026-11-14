import { createDrinkware } from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionHumanAudit,
  HumanChain,
  HumanHand,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  type HumanSegment,
  HumanSignature,
  type IAutoMovieMotionHumanAuditMotion,
  type IHumanBody,
  seated,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "./motionHumanBody";

/**
 * A seated person picks up a glass beyond the seated arm by leaning forward
 * from the seat, on one body, which the `test_human_motion_pick_up_seated_*`
 * specs read one body each: a seated pick up was refused outright, the body
 * never leaning.
 *
 * The person sits facing +Z on a chair as high as the popliteal height,
 * 0.1 m behind the heels, then picks a glass up by its body from a low
 * table top at the seat's height straight ahead of the right shoulder.
 *
 * Scenarios:
 * 1. A glass a tenth of a metre beyond the seated arm and the grip socket:
 *    the pick up plans, and the glass ends lifted at least 5 cm above where
 *    it stood.
 * 2. At the grasp the chest has gone forward of where it sat, at least 5 cm:
 *    the trunk leans to reach.
 * 3. The pick up keeps the seat: read five times over the plan, the body's
 *    seat socket stays within 5 mm of its point on the seat (the campaign's
 *    contact bound).
 * 4. Over the pick up, the shipped audit reads no foot sliding, lifting or
 *    sinking while planted (the campaign's 5 mm bounds), its other checks
 *    left unread.
 * 5. A glass two arm lengths beyond the seated shoulder, past any lean, is
 *    refused as a `reach` refusal on `prop` that names standing up and
 *    stepping closer.
 *
 * @param name The body.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the stage, the case it comes from and the 5 scenarios with their bounds.
 * @evidence contracts/development/implementation.md#principled-implementation The chain's own sit and pick up of a real glass archetype, read on the displayed glass, chest and soles and the plan's declared contacts.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One seated pick up and one refused, one reading per scenario, gathered as complaints and asserted once.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A pick up that does not plan is a complaint with the refusal's words.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three short performances, a few readings.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Read by each body's spec, so the readings exist once.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing past the call.
 */
export function motionPickUpSeated(name: motionHumanBody.Name): void {
  const body: IHumanBody = motionHumanBody(name);
  const complaints: string[] = [];
  const arm: number = body.measure.upperArm + body.measure.forearm;
  const glass: ReturnType<typeof createDrinkware> = createDrinkware({
    kind: "glass",
  });
  const chair: seated.ISeat = {
    at: { x: 0, y: seated.popliteal(body), z: -0.1 },
    yaw: 0,
    depth: 0.45,
  };
  const perform = (at: IAutoMovieVector3 | null): HumanPerformance => {
    const sitting: HumanChain = HumanChain.subject("a").sit({
      seat: chair,
      seconds: 0.5,
    });
    return new HumanPerformance({
      seed: "seated",
      props:
        at === null ? [] : [HumanObject.prop("glass", glass, { at, yaw: 0 })],
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: (at === null
        ? sitting
        : sitting.pickUp({ prop: "glass", handle: "body" })
      ).node,
    });
  };
  const said = (error: unknown): string =>
    error instanceof Error ? error.message : String(error);

  // The seated shoulder and chest, from a film that only sits.
  const still: HumanPerformance = perform(null);
  const sat: HumanSegment.ISegment = still.segments("a")[0]!;
  const reader0: HumanSignature.IReader = HumanSignature.of(
    still,
    "a",
    body,
    0,
  );
  const shoulder: IAutoMovieVector3 = HumanSignature.joint(
    reader0,
    sat.end,
    "rightUpperArm",
  );
  const chest: IAutoMovieVector3 = HumanSignature.joint(
    reader0,
    sat.end,
    "chest",
  );
  const socket: number = Vector3.length(
    HumanHand.offset(body, "right", "grip").point,
  );
  const grip: IAutoMovieVector3 = glass.affordance("body").frame.translation;
  // The glass placed so its grip lies `ahead` beyond the shoulder.
  const placed = (ahead: number): IAutoMovieVector3 => ({
    x: shoulder.x - grip.x,
    y: chair.at.y,
    z: shoulder.z + ahead - grip.z,
  });

  // 1 to 4. A glass just beyond the seated arm.
  try {
    const at: IAutoMovieVector3 = placed(arm + socket + 0.1);
    const film: HumanPerformance = perform(at);
    const reader: HumanSignature.IReader = HumanSignature.of(
      film,
      "a",
      body,
      0,
    );
    const pick: HumanSegment.ISegment = film
      .segments("a")
      .find((s: HumanSegment.ISegment): boolean => s.name === "pickUp")!;
    const grasp: number =
      pick.start +
      (pick.plan.events.find((e): boolean => e.name === "gripClosed")?.share ??
        Number.NaN) *
        pick.plan.duration;
    const lifted: number = film.prop("glass", pick.end).position.y - at.y;
    if (!(lifted >= 0.05))
      complaints.push(
        `${name}: the glass ends ${(lifted * 1000).toFixed(0)} mm above where it stood, at least 50 expected`,
      );
    const forward: number =
      HumanSignature.joint(reader, grasp, "chest").z - chest.z;
    if (!(forward >= 0.05))
      complaints.push(
        `${name}: at the grasp the chest has gone ${(forward * 1000).toFixed(0)} mm forward, at least 50 expected`,
      );
    const sitting: IAutoMovieVector3 = seated.point(body, chair);
    let drift: number = 0;
    for (let i: number = 0; i <= 4; i++) {
      const t: number = (pick.plan.duration * i) / 4;
      drift = Math.max(
        drift,
        Vector3.length(
          Vector3.subtract(seated.socket(body, pick.plan.posture(t)), sitting),
        ),
      );
    }
    if (!(drift <= 0.005))
      complaints.push(
        `${name}: the seat socket leaves the seat by ${(drift * 1000).toFixed(1)} mm during the pick up, within 5 mm expected`,
      );
    // The shipped audit's floor, slip and lift on the feet, its other
    // checks left unread (`AutoMovieMotionHumanAudit.run`'s null limits).
    const motion: IAutoMovieMotionHumanAuditMotion = {
      duration: film.duration,
      segments: (
        subject: string,
      ): ReturnType<IAutoMovieMotionHumanAuditMotion["segments"]> =>
        film.segments(subject),
      bones: (
        subject: string,
        seconds: number,
      ): ReturnType<IAutoMovieMotionHumanAuditMotion["bones"]> =>
        film.bones(subject, seconds),
    };
    for (const finding of AutoMovieMotionHumanAudit.run(motion, "a", body, {
      limits: {
        tangle: null,
        jump: null,
        reversal: null,
        speed: null,
        balance: null,
      },
    }).findings.filter(
      (f: AutoMovieMotionHumanAudit.IFinding): boolean =>
        f.seconds >= pick.start - 1e-6 &&
        f.seconds <= pick.end + 1e-6 &&
        /Foot|Toes/.test(f.where),
    ))
      complaints.push(
        `${name}: ${finding.check} ${(finding.value * 1000).toFixed(1)} mm at ${finding.seconds.toFixed(2)} s (${finding.where}), within ${(finding.limit * 1000).toFixed(0)} mm expected`,
      );
  } catch (error) {
    complaints.push(
      `${name}: a glass just beyond the seated arm: expected to plan, got ${said(error)}`,
    );
  }

  // 5. Past any lean.
  let thrown: unknown = null;
  try {
    perform(placed(2 * arm));
  } catch (error) {
    thrown = error;
  }
  if (
    !(
      thrown instanceof HumanRefusal &&
      thrown.kind === "reach" &&
      thrown.axis === "prop" &&
      /stand/.test(thrown.fix ?? "")
    )
  )
    complaints.push(
      `${name}: a glass two arm lengths ahead: expected a reach refusal on prop that names standing, got ${said(thrown)}`,
    );

  TestValidator.equals(
    `a seated person leans to pick up (${name})`,
    complaints,
    [],
  );
}
