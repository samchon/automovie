import { resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { HumanChain, HumanHand, HumanPerformance, type IHumanBody, createHumanBody } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { MotionBodies } from "../../../../packages/motions/src/executable/MotionBodies";

/**
 * On polygon men of different statures and proportions, stepping over an
 * obstacle clears it and lands beyond it, and bending brings the palm to a
 * floor point, with no foot sliding.
 *
 * Scenarios, on the small woman, the tall man and the short-legged man:
 * 1. Stepping over boxes 0.15 and 0.3 m high and 0.2 m deep keeps every sole
 *    point (heel, ball, toe) of a swinging foot at least 5 cm above the box
 *    while it is over the box, and both feet end beyond it.
 * 2. Planted feet move at most 5 mm while planted during the crossing.
 * 3. An obstacle higher than the body can step over, and one behind the
 *    feet, are refused.
 * 4. A semi-squat and a squat each bring the palm within 15 mm of a floor
 *    point 0.3 m ahead of the ankles, just beyond the toes, and a stoop a
 *    point above mid-shank 0.45 m ahead (the `auto` rule's stoop range),
 *    with both feet within 5 mm.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the crossings and bends and reads posed sole and palm sockets; a foot clipping the box, a short landing, a sliding plant, a palm off its point or a missing refusal fails.
 * @evidence contracts/development/testing.md#independent-expectations The 5 cm toe clearance, 15 mm contact and 5 mm slip are the campaign's acceptance values; the box is the scene's geometry, not the law's margin.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers three bodies, two heights, both refusals and three strategies.
 * @evidence contracts/development/testing.md#execution-ownership A local test: it prepares polygon men, so its name falls under the CI exclusion of test_human_.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 scenarios and what each pins.
 */
export function test_human_motion_everyday_step_bend(): void {
  const failures: string[] = [];
  const check = (label: string, ok: boolean): void => {
    if (!ok) failures.push(label);
  };
  for (const name of ["f-small", "m-tall", "m-short-legged"]) {
    const man = MotionBodies.population(name);
    const body: IHumanBody = createHumanBody(man.body.skeleton, man.body.profile);
    const performer = { subject: "a", body, at: { x: 0, y: 0, z: 0 }, yaw: 0, proficiency: { level: "trained" as const } };
    const sole = (performance: HumanPerformance, t: number, side: "Left" | "Right", point: "heel" | "ball" | "toe"): IAutoMovieVector3 => {
      const frame = body.surfaces.sockets[`${point}${side}`];
      return resolveAutoMovieHumanoidSurfaces.place(frame, performance.bones("a", t).get(frame.bone)!).point;
    };
    for (const height of [0.15, 0.3]) {
      const near: number = 0.3;
      const depth: number = 0.2;
      const performance: HumanPerformance = new HumanPerformance({
        seed: `step-${name}-${height}`,
        performers: [performer],
        composition: HumanChain.subject("a").stepOver({ obstacle: { at: { x: 0, y: 0, z: near }, height, depth } }).node,
      });
      let clearance: number = Infinity;
      for (let t: number = 0; t <= performance.duration + 1e-9; t += 1 / 96)
        for (const side of ["Left", "Right"] as const)
          for (const point of ["heel", "ball", "toe"] as const) {
            const p: IAutoMovieVector3 = sole(performance, t, side, point);
            if (p.z > near && p.z < near + depth) clearance = Math.min(clearance, p.y - height);
          }
      check(`${name} ${height} clearance ${(clearance * 1000).toFixed(1)} mm`, clearance >= 0.05);
      const end: number = performance.duration;
      check(`${name} ${height} lands beyond`, (["Left", "Right"] as const).every((side) => sole(performance, end, side, "heel").z > near + depth));
      check(`${name} ${height} slip ${slip(performance, body).toFixed(4)}`, slip(performance, body) <= 0.005);
    }
    TestValidator.error(`${name} too high`, (): unknown =>
      new HumanPerformance({ seed: "x", performers: [performer], composition: HumanChain.subject("a").stepOver({ obstacle: { at: { x: 0, y: 0, z: 0.3 }, height: 0.7 * body.measure.hipHeight, depth: 0.2 } }).node }),
    );
    TestValidator.error(`${name} behind`, (): unknown =>
      new HumanPerformance({ seed: "x", performers: [performer], composition: HumanChain.subject("a").stepOver({ obstacle: { at: { x: 0, y: 0, z: -0.5 }, height: 0.1, depth: 0.2 } }).node }),
    );

    for (const strategy of ["stoop", "semiSquat", "squat"] as const) {
      const point: IAutoMovieVector3 = { x: -0.15, y: strategy === "stoop" ? body.measure.ankleHeight + 0.6 * body.measure.shank : 0, z: strategy === "stoop" ? 0.45 : 0.3 };
      const performance: HumanPerformance = new HumanPerformance({
        seed: `bend-${name}-${strategy}`,
        performers: [performer],
        composition: HumanChain.subject("a").bend({ toward: { kind: "point", at: point, frame: "world" }, strategy }).node,
      });
      const segment = performance.segments("a")[0]!;
      const deepest: number = segment.start + segment.plan.events.find((e) => e.name === "deepest")!.share * segment.plan.duration;
      const palm: IAutoMovieVector3 = HumanHand.frame(body, performance.bones("a", deepest), "right", "palm", "flat").point;
      const miss: number = Math.hypot(palm.x - point.x, palm.y - point.y, palm.z - point.z);
      check(`${name} ${strategy} palm ${(miss * 1000).toFixed(1)} mm`, miss <= 0.015);
      check(`${name} ${strategy} slip ${slip(performance, body).toFixed(4)}`, slip(performance, body) <= 0.005);
    }
  }
  TestValidator.predicate(failures.join("; ") || "all checks", failures.length === 0);
}

/**
 * The largest slip of a planted foot: within each plant window of the
 * person's actions, the drift of the foot's sole centre from where it was at
 * the window's start.
 */
function slip(performance: HumanPerformance, body: IHumanBody): number {
  let worst: number = 0;
  for (const segment of performance.segments("a"))
    for (const contact of segment.plan.contacts) {
      if (contact.kind !== "plant" || (contact.part !== "leftFoot" && contact.part !== "rightFoot")) continue;
      const frame = body.surfaces.sockets[contact.part === "leftFoot" ? "soleLeft" : "soleRight"];
      let first: IAutoMovieVector3 | undefined;
      for (let t: number = segment.start + contact.from * segment.plan.duration; t <= segment.start + contact.to * segment.plan.duration + 1e-9; t += 1 / 24) {
        const p: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(frame, performance.bones("a", t).get(frame.bone)!).point;
        first ??= p;
        worst = Math.max(worst, Math.hypot(p.x - first.x, p.z - first.z));
      }
    }
  return worst;
}
