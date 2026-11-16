import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidRegion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanHand,
  type HumanPerformance,
  type HumanSegment,
  HumanVerdicts,
  type IHumanActionLaw,
  type IHumanBody,
  type IHumanProp,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { motionUpperPhrase } from "../internal/motionUpperPhrase";

/**
 * The upper-body acts as rows over the arm's phrases (#3361).
 *
 * Every row of `HumanUpperRows` is performed after a quiet stance on every
 * body of `EXTREMES`; a row whose target is open is given one of the
 * performer's own regions, and a row that moves a held prop is performed after
 * the performer picks up a stick, named as its held prop.
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
 * 4. The two-hand rows bring the palms together: clapHands at its
 *    stroke's start, handsTogetherFront and handsClaspedBehind at their
 *    stroke, within 10 mm; handsClaspedBehind's palms lie behind the lower
 *    back's surface.
 * 5. The two-hand rows that part the hands place them as the act does at
 *    their stroke: cheerHands raises both palms above the crown, one on
 *    each side of the midline; foldArms puts each palm on the far side
 *    of the midline.
 * 6. Every phrase publishes the standard instants `ready`, `strokeStart`,
 *    `stroke`, `strokeEnd` and `relax` in time order.
 * 7. The rows that bring a held prop's point (`drinkFrom`'s lip, `eatWith`
 *    named the face) lay the stick's end within 10 mm of the mouth at
 *    `stroke`, on every body.
 *
 * The refusals and the left hand are
 * `test_human_motion_recompose_upper_phrase_cases`'s.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs each row through the public chain on generated bodies and measures the displayed hand surfaces at the phrase's instants.
 * @evidence contracts/development/testing.md#independent-expectations The issue's 10 mm self-touch bound, read as the verdicts' skin (`HumanVerdicts.SKIN`), the wave's raised and moving hand as the act describes it, and the phrase's standard instants (BML 1.0).
 * @evidence contracts/development/testing.md#distinguishing-cases Four bodies, every row, visits, strokes and oscillations, self and open targets.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit test preparing polygon men; no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the sweep and the seven scenarios with their bounds.
 */
export function test_human_motion_recompose_upper_phrase(): void {
  const complaints: string[] = [];
  const rows: IHumanActionLaw<never>[] = motionUpperPhrase.ROWS;
  const open: Record<string, AutoMovieHumanoidRegion> = motionUpperPhrase.OPEN;
  const held: readonly string[] = motionUpperPhrase.HELD;
  const end: IAutoMovieVector3 = motionUpperPhrase.END;
  const perform: typeof motionUpperPhrase.perform = motionUpperPhrase.perform;
  const touches: Record<string, [AutoMovieHumanoidRegion, HumanHand.Surface]> =
    {
      handOnHip: ["hipRight", "palm"],
      chinOnFist: ["chin", "fist"],
      pressOn: ["chestRight", "palm"],
      holdOn: ["upperArmLeft", "palm"],
    };
  for (const name of motionHumanBody.EXTREMES) {
    const body: IHumanBody = motionHumanBody(name);
    const reach: number =
      body.measure.upperArm + body.measure.forearm + body.measure.hand;
    for (const row of rows) {
      const given: object =
        open[row.name] === undefined
          ? row.name === "armPhrase"
            ? { phrase: "visit", target: { kind: "self", region: "hipRight" } }
            : {}
          : { target: { kind: "self", region: open[row.name] } };
      const params: object = held.includes(row.name)
        ? {
            ...given,
            held: "stick",
            ...(row.name === "eatWith" ? { point: "face" } : {}),
          }
        : given;
      try {
        const p: HumanPerformance = perform(
          body,
          row.name,
          params,
          held.includes(row.name),
        );
        const s: HumanSegment.ISegment = p.segments("a").at(-1)!;
        if (s.name !== row.name) {
          complaints.push(`${name} ${row.name}: placed as ${s.name}`);
          continue;
        }
        const at = (event: string): number =>
          s.start +
          (s.plan.events.find((e) => e.name === event)?.share ?? NaN) *
            s.plan.duration;
        const instants: number[] = [
          "ready",
          "strokeStart",
          "stroke",
          "strokeEnd",
          "relax",
        ].map(at);
        if (
          !instants.every(
            (t: number, i: number): boolean =>
              Number.isFinite(t) && (i === 0 || t >= instants[i - 1]!),
          )
        )
          complaints.push(
            `${name} ${row.name}: the phrase's instants are missing or out of order`,
          );
        const touch: [AutoMovieHumanoidRegion, HumanHand.Surface] | undefined =
          touches[row.name];
        if (touch !== undefined) {
          const t: number = at("stroke");
          const bones = p.bones("a", t);
          const region: resolveAutoMovieHumanoidSurfaces.IFrame =
            body.surfaces.regions[touch[0]];
          const goal: IAutoMovieVector3 =
            resolveAutoMovieHumanoidSurfaces.place(
              region,
              bones.get(region.bone)!,
            ).point;
          const hand: IAutoMovieVector3 = HumanHand.frame(
            body,
            bones,
            "right",
            touch[1],
            touch[1] === "fist" ? "fist" : "flat",
          ).point;
          const miss: number = Vector3.length(Vector3.subtract(hand, goal));
          if (!(miss <= HumanVerdicts.SKIN))
            complaints.push(
              `${name} ${row.name}: the ${touch[1]} lies ${(miss * 1000).toFixed(1)} mm from ${touch[0]}, within ${(HumanVerdicts.SKIN * 1000).toFixed(0)} mm expected`,
            );
        }
        const palms = (t: number): [IAutoMovieVector3, IAutoMovieVector3] => {
          const bones = p.bones("a", t);
          return [
            HumanHand.frame(body, bones, "left", "palm", "flat").point,
            HumanHand.frame(body, bones, "right", "palm", "flat").point,
          ];
        };
        if (
          row.name === "clapHands" ||
          row.name === "handsTogetherFront" ||
          row.name === "handsClaspedBehind"
        ) {
          const t: number =
            row.name === "clapHands" ? at("strokeStart") : at("stroke");
          const [left, right] = palms(t);
          const apart: number = Vector3.length(Vector3.subtract(left, right));
          if (!(apart <= HumanVerdicts.SKIN))
            complaints.push(
              `${name} ${row.name}: the palms lie ${(apart * 1000).toFixed(1)} mm apart when they meet, within ${(HumanVerdicts.SKIN * 1000).toFixed(0)} mm expected`,
            );
          if (row.name === "handsClaspedBehind") {
            const back: resolveAutoMovieHumanoidSurfaces.IFrame =
              body.surfaces.regions.lowerBack;
            const surface: IAutoMovieVector3 =
              resolveAutoMovieHumanoidSurfaces.place(
                back,
                p.bones("a", t).get(back.bone)!,
              ).point;
            for (const [hand, palm] of [
              ["left", left],
              ["right", right],
            ] as const)
              if (!(palm.z < surface.z))
                complaints.push(
                  `${name} handsClaspedBehind: the ${hand} palm lies ${((palm.z - surface.z) * 1000).toFixed(1)} mm ahead of the lower back, behind it expected`,
                );
          }
        }
        // The performer faces +z at yaw 0, so its right side is -x.
        if (row.name === "cheerHands") {
          const t: number = at("stroke");
          const [left, right] = palms(t);
          const crown: resolveAutoMovieHumanoidSurfaces.IFrame =
            body.surfaces.regions.crown;
          const top: number = resolveAutoMovieHumanoidSurfaces.place(
            crown,
            p.bones("a", t).get(crown.bone)!,
          ).point.y;
          if (!(left.y > top && right.y > top))
            complaints.push(
              `${name} cheerHands: the palms rise to ${(left.y * 1000).toFixed(0)} and ${(right.y * 1000).toFixed(0)} mm, above the crown's ${(top * 1000).toFixed(0)} mm expected`,
            );
          if (!(left.x > 0 && right.x < 0))
            complaints.push(
              `${name} cheerHands: the palms lie at x ${(left.x * 1000).toFixed(0)} and ${(right.x * 1000).toFixed(0)} mm, each on its own side expected`,
            );
        }
        if (row.name === "foldArms") {
          const [left, right] = palms(at("stroke"));
          if (!(left.x < 0 && right.x > 0))
            complaints.push(
              `${name} foldArms: the palms lie at x ${(left.x * 1000).toFixed(0)} and ${(right.x * 1000).toFixed(0)} mm, each across the midline expected`,
            );
        }
        if (row.name === "drinkFrom" || row.name === "eatWith") {
          const t: number = at("stroke");
          const mouth: resolveAutoMovieHumanoidSurfaces.IFrame =
            body.surfaces.regions.mouth;
          const lips: IAutoMovieVector3 =
            resolveAutoMovieHumanoidSurfaces.place(
              mouth,
              p.bones("a", t).get(mouth.bone)!,
            ).point;
          const f: IHumanProp.IFrame = p.prop("stick", t);
          const tip: IAutoMovieVector3 = Vector3.add(
            f.position,
            Quaternion.rotateVector(f.rotation, end),
          );
          const miss: number = Vector3.length(Vector3.subtract(tip, lips));
          if (!(miss <= HumanVerdicts.SKIN))
            complaints.push(
              `${name} ${row.name}: the held stick's end lies ${(miss * 1000).toFixed(1)} mm from the mouth, within ${(HumanVerdicts.SKIN * 1000).toFixed(0)} mm expected`,
            );
        }
        if (row.name === "waveHand") {
          const shoulder: number = p
            .bones("a", at("stroke"))
            .get("rightShoulder")!.worldPosition.y;
          let low: number = Infinity;
          let minX: number = Infinity;
          let maxX: number = -Infinity;
          for (
            let t: number = at("strokeStart");
            t <= at("strokeEnd");
            t += 1 / 24
          ) {
            const palm: IAutoMovieVector3 = HumanHand.frame(
              body,
              p.bones("a", t),
              "right",
              "palm",
              "flat",
            ).point;
            low = Math.min(low, palm.y);
            minX = Math.min(minX, palm.x);
            maxX = Math.max(maxX, palm.x);
          }
          if (!(low > shoulder))
            complaints.push(
              `${name} waveHand: the palm drops ${((shoulder - low) * 1000).toFixed(1)} mm below the shoulder`,
            );
          if (!(maxX - minX > reach / 20))
            complaints.push(
              `${name} waveHand: the palm sweeps ${((maxX - minX) * 1000).toFixed(1)} mm, more than ${((reach / 20) * 1000).toFixed(1)} mm expected`,
            );
        }
      } catch (error) {
        complaints.push(
          `${name} ${row.name}: expected to plan, got ${(error as Error).message}`,
        );
      }
    }
  }
  TestValidator.equals(
    "the upper-body acts as rows over the arm's phrases",
    complaints,
    [],
  );
}
