import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../../body/IHumanBody";
import type { AutoMovieMotionHumanTarget } from "../../compose/AutoMovieMotionHumanTarget";
import type { gestureStroke } from "../../everyday/gestureStroke";
import type { HumanPerformance } from "../../perform/HumanPerformance";
import { HumanFrame } from "../../posture/HumanFrame";
import { HumanHand } from "../../posture/HumanHand";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { MotionPlaceVerdicts } from "./MotionPlaceVerdicts";

/**
 * The checks that a gesture performs its own goal, measured on the
 * displayed poses of its stroke (from `strokeStart` to `strokeEnd`), so a
 * figure that never made the gesture fails them:
 *
 * - `nod` and `shakeHead`: the head's pitch or yaw swings 5 to 20 degrees
 *   from its starting direction, the range of conversational head nods and
 *   shakes (Hadar, Steiner, Grant and Rose 1983, Hum Mov Sci 2:35), with as
 *   many swings as the stroke declares;
 * - `wave`: the palm faces forward within 30 degrees and moves side to side
 *   at least 2 cm, as many times as declared; `rubHands`: the palms stay
 *   together within 10 mm while sliding at least 1 cm; `beckon`: the palm
 *   faces up within 30 degrees and the index finger curls at least 40
 *   degrees toward the palm, as many times as declared;
 * - `shrug`: the shoulder joints rise at least 1 cm; `squareShoulders`: they
 *   move back at least 5 mm; `slump`: the chest pitches forward at least 8
 *   degrees; `chinLift`: the head pitches up at least 8 degrees;
 * - `raiseHand` and `cheer`: the hand stands above the head's crown;
 *   `stopPalm`: the palm faces forward within 30 degrees at shoulder height
 *   within 15 cm; `palmsUp`: both palms face up within 35 degrees;
 * - `scratchHead`: the index fingertip stays within 15 mm plus the finger's
 *   radius of the temple;
 * - `wave` and `stopPalm`: the palm is at the place the law names, read back
 *   from the pose at the stroke's middle as the nearest height, lateral and
 *   distance names.
 *
 * Thresholds other than the head range are provisional, set at about half
 * of each gesture's planned size so they test that the gesture happens, not
 * its exact size.
 *
 * @param kind The gesture.
 * @param performance The performance.
 * @param body The body.
 * @param from Stroke start, film seconds.
 * @param to Stroke end, film seconds.
 * @param cycles The stroke's declared repetitions.
 * @returns The verdicts; empty for gestures the capture already checks (point, clap, touches, bow).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each gesture's check, its threshold and its source or provisional status.
 * @evidence contracts/development/implementation.md#principled-implementation Reads displayed bones and joint angles over the stroke on a 48 Hz grid and counts swings as local extremes.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One switch over the gesture with shared samplers.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Measures the performed motion, never the law's plan.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in stroke frames.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Run once per capture.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function everydayGestureVerdicts(
  kind: gestureStroke.Kind,
  performance: HumanPerformance,
  body: IHumanBody,
  from: number,
  to: number,
  cycles: number,
): IMotionCaptureCase.IVerdict[] {
  const times: number[] = [];
  for (let t: number = from; t <= to + 1e-9; t += 1 / 48) times.push(t);
  const mid: number = (from + to) / 2;
  const deg = (r: number): number => (r * 180) / Math.PI;
  const forwardOf = (
    t: number,
    bone: AutoMovieHumanoidBone,
  ): IAutoMovieVector3 =>
    Quaternion.rotateVector(
      performance.bones("a", t).get(bone)!.worldRotation,
      { x: 0, y: 0, z: 1 },
    );
  const pitch = (t: number, bone: AutoMovieHumanoidBone): number =>
    deg(Math.asin(Math.max(-1, Math.min(1, -forwardOf(t, bone).y))));
  const yaw = (t: number, bone: AutoMovieHumanoidBone): number =>
    deg(Math.atan2(forwardOf(t, bone).x, forwardOf(t, bone).z));
  const palm = (t: number, side: HumanHand.Side) =>
    HumanHand.frame(body, performance.bones("a", t), side, "palm");
  const joint = (t: number, bone: AutoMovieHumanoidBone): number =>
    (performance.pose("a", t).joints as IAutoMovieJointPose[]).find(
      (j) => j.bone === bone,
    )?.flexion ?? 0;
  const swings = (signal: number[]): number => {
    let count: number = 0;
    for (let i: number = 1; i + 1 < signal.length; i++)
      if (
        signal[i]! > signal[i - 1]! &&
        signal[i]! >= signal[i + 1]! &&
        signal[i]! - Math.min(...signal) >
          0.25 * (Math.max(...signal) - Math.min(...signal))
      )
        count++;
    return count;
  };
  const verdict = (
    name: string,
    passed: boolean,
    detail: string,
  ): IMotionCaptureCase.IVerdict => ({ name, passed, detail });
  const facing = (v: IAutoMovieVector3, d: IAutoMovieVector3): number =>
    deg(
      Math.acos(
        Math.max(
          -1,
          Math.min(1, Vector3.dot(Vector3.normalize(v), Vector3.normalize(d))),
        ),
      ),
    );
  const placed = (
    name: string,
    expected: AutoMovieMotionHumanTarget.IGrid,
  ): IMotionCaptureCase.IVerdict => {
    // The law places the hand from the rig origin, not from the hips bone.
    const root = performance.pose("a", mid).root;
    if (root === null) throw new Error("A performed pose has a root");
    return MotionPlaceVerdicts.at(
      name,
      body,
      {
        root: root.translation,
        yaw: HumanFrame.heading(root.rotation),
      },
      "right",
      palm(mid, "right").point,
      expected,
    );
  };
  switch (kind) {
    case "nod":
    case "shakeHead": {
      const read =
        kind === "nod"
          ? (t: number): number => pitch(t, "head")
          : (t: number): number => yaw(t, "head");
      const base: number = read(from);
      const signal: number[] = times.map((t: number): number =>
        kind === "nod" ? read(t) - base : Math.abs(read(t) - base),
      );
      const amplitude: number = Math.max(...signal.map(Math.abs));
      const count: number =
        kind === "nod"
          ? swings(signal)
          : swings(times.map((t: number): number => read(t) - base));
      return [
        verdict(
          `${kind} amplitude in 5 to 20 deg`,
          amplitude >= 5 && amplitude <= 20,
          `${amplitude.toFixed(1)} deg`,
        ),
        verdict(
          `${kind} swings ${cycles}`,
          count === cycles,
          `${count} swings`,
        ),
      ];
    }
    case "wave": {
      const xs: number[] = times.map(
        (t: number): number => palm(t, "right").point.x,
      );
      const facingDeg: number = facing(palm(mid, "right").normal, {
        x: 0,
        y: 0,
        z: 1,
      });
      return [
        verdict(
          "palm faces forward",
          facingDeg <= 30,
          `${facingDeg.toFixed(1)} deg`,
        ),
        verdict(
          "hand sways at least 2 cm",
          Math.max(...xs) - Math.min(...xs) >= 0.02,
          `${((Math.max(...xs) - Math.min(...xs)) * 1000).toFixed(1)} mm`,
        ),
        verdict(
          `waves ${cycles}`,
          swings(xs) === cycles,
          `${swings(xs)} swings`,
        ),
        placed("hand at eye, outside, near", {
          height: "eye",
          lateral: "outside",
          distance: "near",
        }),
      ];
    }
    case "beckon": {
      const curl: number[] = times.map((t: number): number =>
        joint(t, "rightIndexIntermediate"),
      );
      const up: number = facing(palm(mid, "right").normal, {
        x: 0,
        y: 1,
        z: 0,
      });
      return [
        verdict("palm faces up", up <= 30, `${up.toFixed(1)} deg`),
        verdict(
          "index curls at least 40 deg",
          Math.max(...curl) - Math.min(...curl) >= 40,
          `${(Math.max(...curl) - Math.min(...curl)).toFixed(1)} deg`,
        ),
        verdict(
          `beckons ${cycles}`,
          swings(curl) === cycles,
          `${swings(curl)} curls`,
        ),
      ];
    }
    case "rubHands": {
      const gaps: number[] = times.map((t: number): number =>
        Math.abs(
          Vector3.dot(
            Vector3.subtract(palm(t, "left").point, palm(t, "right").point),
            palm(t, "right").normal,
          ),
        ),
      );
      const slide: number[] = times.map(
        (t: number): number =>
          palm(t, "right").point.y - palm(t, "left").point.y,
      );
      return [
        verdict(
          "palms together",
          Math.max(...gaps) <= 0.01,
          `${(Math.max(...gaps) * 1000).toFixed(1)} mm apart across the palms at most`,
        ),
        verdict(
          "palms slide at least 1 cm",
          Math.max(...slide) - Math.min(...slide) >= 0.01,
          `${((Math.max(...slide) - Math.min(...slide)) * 1000).toFixed(1)} mm`,
        ),
      ];
    }
    case "shrug": {
      const rise: number =
        performance.bones("a", mid).get("rightUpperArm")!.worldPosition.y -
        performance.bones("a", 0).get("rightUpperArm")!.worldPosition.y;
      return [
        verdict(
          "shoulders rise at least 1 cm",
          rise >= 0.01,
          `${(rise * 1000).toFixed(1)} mm`,
        ),
      ];
    }
    case "squareShoulders": {
      const back: number =
        performance.bones("a", 0).get("rightUpperArm")!.worldPosition.z -
        performance.bones("a", mid).get("rightUpperArm")!.worldPosition.z;
      return [
        verdict(
          "shoulders move back at least 5 mm",
          back >= 0.005,
          `${(back * 1000).toFixed(1)} mm`,
        ),
      ];
    }
    case "slump": {
      const change: number = pitch(mid, "chest") - pitch(0, "chest");
      return [
        verdict(
          "chest pitches forward at least 8 deg",
          change >= 8,
          `${change.toFixed(1)} deg`,
        ),
      ];
    }
    case "chinLift": {
      const change: number = pitch(0, "head") - pitch(mid, "head");
      return [
        verdict(
          "head pitches up at least 8 deg",
          change >= 8,
          `${change.toFixed(1)} deg`,
        ),
      ];
    }
    case "raiseHand":
    case "cheer": {
      const crown = body.surfaces.regions.crown;
      const top: number = resolveAutoMovieHumanoidSurfaces.place(
        crown,
        performance.bones("a", mid).get(crown.bone)!,
      ).point.y;
      const hand: number = performance.bones("a", mid).get("rightHand")!
        .worldPosition.y;
      return [
        verdict(
          "hand above the head",
          hand > top,
          `${((hand - top) * 1000).toFixed(1)} mm above`,
        ),
      ];
    }
    case "stopPalm": {
      const p = palm(mid, "right");
      const height: number = Math.abs(
        p.point.y -
          performance.bones("a", mid).get("rightUpperArm")!.worldPosition.y,
      );
      const facingDeg: number = facing(p.normal, { x: 0, y: 0, z: 1 });
      return [
        verdict(
          "palm faces forward",
          facingDeg <= 30,
          `${facingDeg.toFixed(1)} deg`,
        ),
        verdict(
          "palm at shoulder height",
          height <= 0.15,
          `${(height * 1000).toFixed(1)} mm off`,
        ),
        placed("hand at shoulder, inside, far", {
          height: "shoulder",
          lateral: "inside",
          distance: "far",
        }),
      ];
    }
    case "palmsUp":
      return (["left", "right"] as const).map((side) => {
        const up: number = facing(palm(mid, side).normal, { x: 0, y: 1, z: 0 });
        return verdict(
          `${side} palm faces up`,
          up <= 35,
          `${up.toFixed(1)} deg`,
        );
      });
    case "scratchHead": {
      const temple = body.surfaces.regions.templeRight;
      const at: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
        temple,
        performance.bones("a", mid).get(temple.bone)!,
      ).point;
      const tip: IAutoMovieVector3 = HumanHand.frame(
        body,
        performance.bones("a", mid),
        "right",
        "indexTip",
        "flat",
      ).point;
      return [
        verdict(
          "fingertip at the temple",
          Vector3.length(Vector3.subtract(tip, at)) <= 0.015 + 0.012,
          `${(Vector3.length(Vector3.subtract(tip, at)) * 1000).toFixed(1)} mm`,
        ),
      ];
    }
    case "point":
    case "clap":
    case "touchFace":
    case "pushGlasses":
    case "palmsTogether":
    case "bow":
      return [];
  }
}
