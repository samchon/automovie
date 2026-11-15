import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanoidRegion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanHand,
  HumanPerformance,
  HumanUpperRows,
  type HumanSegment,
  type IHumanActionLaw,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The upper-body acts as rows over the arm's phrases (#3361).
 *
 * Every row of `HumanUpperRows` is performed after a quiet stance on every
 * body of `EXTREMES`; a row whose target is open is given one of the
 * performer's own regions.
 *
 * Scenarios:
 *
 * 1. Every row plans, placed under its own name, on every body.
 * 2. A self-touch row (`handOnHip`, `chinOnFist`, `pressOn` on the chest)
 *    brings its surface within 10 mm of its region at `stroke`, the issue's
 *    bound for a self-touch, on every body.
 * 3. `waveHand` keeps the palm above the shoulder through its stroke, and
 *    its hand moves out and back: the palm's lateral travel over the stroke
 *    exceeds a twentieth of the arm's length.
 * 4. Every phrase publishes the standard instants `ready`, `strokeStart`,
 *    `stroke`, `strokeEnd` and `relax` in time order.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs each row through the public chain on generated bodies and measures the displayed hand surfaces at the phrase's instants.
 * @evidence contracts/development/testing.md#independent-expectations The issue's 10 mm self-touch bound, the wave's raised and moving hand as the act describes it, and the phrase's standard instants (BML 1.0).
 * @evidence contracts/development/testing.md#distinguishing-cases Four bodies, every row, visits, strokes and oscillations, self and open targets.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit test preparing polygon men; no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the sweep and the four scenarios with their bounds.
 */
export function test_human_motion_recompose_upper_phrase(): void {
  const complaints: string[] = [];
  const rows: IHumanActionLaw<never>[] = Object.values(HumanUpperRows).filter(
    (v: unknown): v is IHumanActionLaw<never> => typeof v === "object" && v !== null && "plan" in v,
  );
  const open: Record<string, AutoMovieHumanoidRegion> = {
    pointAt: "kneeRight",
    tapOn: "thighFrontRight",
    pressOn: "chestRight",
    rubOn: "thighFrontRight",
    strokeDown: "upperArmLeft",
    wipeAcross: "thighFrontRight",
  };
  const touches: Record<string, [AutoMovieHumanoidRegion, HumanHand.Surface]> = {
    handOnHip: ["hipRight", "palm"],
    chinOnFist: ["chin", "fist"],
    pressOn: ["chestRight", "palm"],
  };
  for (const name of motionHumanBody.EXTREMES) {
    const body: IHumanBody = motionHumanBody(name);
    const reach: number = body.measure.upperArm + body.measure.forearm + body.measure.hand;
    for (const row of rows) {
      const params: object =
        open[row.name] === undefined
          ? row.name === "armPhrase"
            ? { phrase: "visit", target: { kind: "self", region: "hipRight" } }
            : {}
          : { target: { kind: "self", region: open[row.name] } };
      try {
        const p: HumanPerformance = new HumanPerformance({
          seed: "upper",
          laws: rows,
          performers: [{ subject: "a", body, at: { x: 0, y: 0, z: 0 }, yaw: 0, proficiency: { level: "trained" } }],
          composition: HumanChain.subject("a").stand({ seconds: 0.3 }).registered(row.name, params).node,
        });
        const s: HumanSegment.ISegment = p.segments("a").at(-1)!;
        if (s.name !== row.name) {
          complaints.push(`${name} ${row.name}: placed as ${s.name}`);
          continue;
        }
        const at = (event: string): number =>
          s.start + (s.plan.events.find((e) => e.name === event)?.share ?? NaN) * s.plan.duration;
        const instants: number[] = ["ready", "strokeStart", "stroke", "strokeEnd", "relax"].map(at);
        if (!instants.every((t: number, i: number): boolean => Number.isFinite(t) && (i === 0 || t >= instants[i - 1]!)))
          complaints.push(`${name} ${row.name}: the phrase's instants are missing or out of order`);
        const touch: [AutoMovieHumanoidRegion, HumanHand.Surface] | undefined = touches[row.name];
        if (touch !== undefined) {
          const t: number = at("stroke");
          const bones = p.bones("a", t);
          const region: resolveAutoMovieHumanoidSurfaces.IFrame = body.surfaces.regions[touch[0]];
          const goal: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(region, bones.get(region.bone)!).point;
          const hand: IAutoMovieVector3 = HumanHand.frame(body, bones, "right", touch[1], touch[1] === "fist" ? "fist" : "flat").point;
          const miss: number = Vector3.length(Vector3.subtract(hand, goal));
          if (!(miss <= 0.01))
            complaints.push(`${name} ${row.name}: the ${touch[1]} lies ${(miss * 1000).toFixed(1)} mm from ${touch[0]}, within 10 mm expected`);
        }
        if (row.name === "waveHand") {
          const shoulder: number = p.bones("a", at("stroke")).get("rightShoulder")!.worldPosition.y;
          let low: number = Infinity;
          let minX: number = Infinity;
          let maxX: number = -Infinity;
          for (let t: number = at("strokeStart"); t <= at("strokeEnd"); t += 1 / 24) {
            const palm: IAutoMovieVector3 = HumanHand.frame(body, p.bones("a", t), "right", "palm", "flat").point;
            low = Math.min(low, palm.y);
            minX = Math.min(minX, palm.x);
            maxX = Math.max(maxX, palm.x);
          }
          if (!(low > shoulder)) complaints.push(`${name} waveHand: the palm drops ${((shoulder - low) * 1000).toFixed(1)} mm below the shoulder`);
          if (!(maxX - minX > reach / 20))
            complaints.push(`${name} waveHand: the palm sweeps ${((maxX - minX) * 1000).toFixed(1)} mm, more than ${((reach / 20) * 1000).toFixed(1)} mm expected`);
        }
      } catch (error) {
        complaints.push(`${name} ${row.name}: expected to plan, got ${(error as Error).message}`);
      }
    }
  }
  TestValidator.equals("the upper-body acts as rows over the arm's phrases", complaints, []);
}
