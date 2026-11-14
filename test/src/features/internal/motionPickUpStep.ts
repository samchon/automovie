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
  type IHumanContactWindow,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "./motionHumanBody";

/**
 * A standing pick up that takes one adjustment step toward a glass beyond
 * the arm and the trunk's turn, on one body, which the
 * `test_human_motion_pick_up_step_*` specs read one body each.
 *
 * The person stands at the origin facing +Z; a glass stands at chest
 * height ahead and to the right, 30 degrees off the facing, its grip an
 * eighth of the stature beyond the arm and the grip socket from the right
 * shoulder.
 *
 * Scenarios:
 * 1. The pick up plans, and the glass ends lifted at least 5 cm.
 * 2. The right foot, on the glass's side, steps: its plant window is
 *    split, the foot off the floor for part of the reach, and it lands
 *    nearer the glass than it stood; the left foot stays planted
 *    throughout.
 * 3. The shipped audit reads no foot sliding, lifting or sinking while
 *    planted over the pick up (the campaign's 5 mm bounds), its other
 *    checks left unread.
 * 4. A glass a metre beyond the arm, past one step, is refused as a
 *    `reach` refusal on `prop` that names stepping closer.
 *
 * @param name The body.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the stage and the 4 scenarios with their bounds.
 * @evidence contracts/development/implementation.md#principled-implementation The chain's own pick up of a real glass archetype, read on the displayed glass and feet and the plan's declared plants.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One stepping pick up and one refused, one reading per scenario, gathered as complaints and asserted once.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A pick up that does not plan is a complaint with the refusal's words.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three short performances, a few readings.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Read by each body's spec, so the readings exist once.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing past the call.
 */
export function motionPickUpStep(name: motionHumanBody.Name): void {
  const body: IHumanBody = motionHumanBody(name);
  const complaints: string[] = [];
  const arm: number = body.measure.upperArm + body.measure.forearm;
  const glass: ReturnType<typeof createDrinkware> = createDrinkware({
    kind: "glass",
  });
  const perform = (at: IAutoMovieVector3 | null): HumanPerformance =>
    new HumanPerformance({
      seed: "step",
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
        ? HumanChain.subject("a").stand({ seconds: 0.5 })
        : HumanChain.subject("a").pickUp({ prop: "glass", handle: "body" })
      ).node,
    });
  const said = (error: unknown): string =>
    error instanceof Error ? error.message : String(error);

  // The standing right shoulder.
  const still: HumanPerformance = perform(null);
  const shoulder: IAutoMovieVector3 = HumanSignature.joint(
    HumanSignature.of(still, "a", body, 0),
    0,
    "rightUpperArm",
  );
  const socket: number = Vector3.length(
    HumanHand.offset(body, "right", "grip").point,
  );
  const grip: IAutoMovieVector3 = glass.affordance("body").frame.translation;
  // The glass placed so its grip lies `ahead` from the shoulder, 30 degrees
  // to the right of the facing, at the shoulder's height.
  const placed = (ahead: number): IAutoMovieVector3 => ({
    x: shoulder.x - ahead * Math.sin(Math.PI / 6) - grip.x,
    y: shoulder.y - grip.y,
    z: shoulder.z + ahead * Math.cos(Math.PI / 6) - grip.z,
  });

  // 1 to 3. One step.
  try {
    const at: IAutoMovieVector3 = placed(
      arm + socket + body.measure.stature / 8,
    );
    const film: HumanPerformance = perform(at);
    const pick: HumanSegment.ISegment = film.segments("a")[0]!;
    const lifted: number = film.prop("glass", pick.end).position.y - at.y;
    if (!(lifted >= 0.05))
      complaints.push(
        `${name}: the glass ends ${(lifted * 1000).toFixed(0)} mm above where it stood, at least 50 expected`,
      );
    const plants = (part: "leftFoot" | "rightFoot"): IHumanContactWindow[] =>
      pick.plan.contacts.filter(
        (c: IHumanContactWindow): boolean =>
          c.part === part && c.kind === "plant",
      );
    const right: IHumanContactWindow[] = plants("rightFoot");
    const left: IHumanContactWindow[] = plants("leftFoot");
    if (
      right.length === 1 &&
      right[0]!.from <= 1e-6 &&
      right[0]!.to >= 1 - 1e-6
    )
      complaints.push(`${name}: the right foot never leaves the floor`);
    if (
      !(left.length === 1 && left[0]!.from <= 1e-6 && left[0]!.to >= 1 - 1e-6)
    )
      complaints.push(`${name}: the left foot is not planted throughout`);
    const foot = (t: number): IAutoMovieVector3 =>
      film.bones("a", t).get("rightFoot")!.worldPosition;
    // Where the foot lands: the plant after its swing.
    const landed: number =
      pick.start + (right[1]?.from ?? 0) * pick.plan.duration + 0.01;
    const before: number = Vector3.length(
      Vector3.subtract({ ...at, y: 0 }, { ...foot(pick.start), y: 0 }),
    );
    const after: number = Vector3.length(
      Vector3.subtract({ ...at, y: 0 }, { ...foot(landed), y: 0 }),
    );
    if (!(after < before - 0.05))
      complaints.push(
        `${name}: the right foot lands ${(after * 1000).toFixed(0)} mm from the glass against ${(before * 1000).toFixed(0)} mm where it stood, at least 50 mm nearer expected`,
      );
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
    }).findings.filter((f: AutoMovieMotionHumanAudit.IFinding): boolean =>
      /Foot|Toes/.test(f.where),
    ))
      complaints.push(
        `${name}: ${finding.check} ${(finding.value * 1000).toFixed(1)} mm at ${finding.seconds.toFixed(2)} s (${finding.where}), within ${(finding.limit * 1000).toFixed(0)} mm expected`,
      );
  } catch (error) {
    complaints.push(
      `${name}: a glass one step away: expected to plan, got ${said(error)}`,
    );
  }

  // 4. Past one step.
  let thrown: unknown = null;
  try {
    perform(placed(arm + 1));
  } catch (error) {
    thrown = error;
  }
  if (
    !(
      thrown instanceof HumanRefusal &&
      thrown.kind === "reach" &&
      thrown.axis === "prop" &&
      /step closer/.test(thrown.fix ?? "")
    )
  )
    complaints.push(
      `${name}: a glass a metre beyond the arm: expected a reach refusal on prop that names stepping closer, got ${said(thrown)}`,
    );

  TestValidator.equals(
    `a standing pick up takes one adjustment step (${name})`,
    complaints,
    [],
  );
}
