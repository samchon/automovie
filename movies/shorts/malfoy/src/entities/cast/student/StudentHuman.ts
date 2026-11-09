import {
  AutoMovieHumanSex,
  AutoMovieHumanSkeleton,
  type IAutoMovieHumanParameters,
} from "@automovie/human";

import type { IBodyMeasure } from "../../../laws/body/IBodyMeasure";
import type { IStudentProfile } from "./IStudentProfile";
import { carinaMalfoy } from "./carinaMalfoy";
import { harryPotter } from "./harryPotter";

/**
 * The Human body a student's polygon figure is built from: Carina and Harry
 * calibrate their own parameters; every practice player borrows the body of
 * the hero of the same sex, scaled to the player's stature, so a mount
 * calibrates at most two bodies. Each calibration runs once per process.
 *
 * ```ts
 * const human = StudentHuman.of(profile); // { neutral, scale }
 * ```
 *
 * @evidence docs/body/settings/cast/carina-malfoy.md#measures Carina's own Human body.
 * @evidence docs/body/settings/cast/harry-potter.md#measures Harry's own Human body.
 * @evidence docs/body/settings/crowds/practice-teams.md#players Players are drawn from the hero body of their sex at their own stature.
 * @evidence contracts/development/common.md#meaningful-documentation States which body each student uses, the scale and the memo.
 * @evidence contracts/development/implementation.md#principled-implementation `AutoMovieHumanSkeleton.prepare` calibrates the parameters in process; the neutral output is the figure's bind.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One memo keyed by template id.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The players' shared bodies are a stated production choice, scaled to each stature.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most two calibrations per process.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Every mount and figure shares the memoized neutral bodies.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The memo holds two neutral skeleton outputs for the process lifetime.
 */
export namespace StudentHuman {
  /** A student's Human body: the neutral skeleton and its scale to the student's stature. */
  export interface IHuman {
    /** Neutral bones and placements, metres, at the template's stature. */
    neutral: AutoMovieHumanSkeleton.IOutput;

    /** Student stature over the template's stature. */
    scale: number;
  }

  /**
   * The Human body of a student.
   *
   * @param profile The student's record.
   * @returns The body.
   */
  export function of(profile: IStudentProfile): IHuman {
    const template: IStudentProfile =
      profile.id === carinaMalfoy.id || profile.id === harryPotter.id
        ? profile
        : profile.parameters.body.anatomy.sex === AutoMovieHumanSex.Female
          ? carinaMalfoy
          : harryPotter;
    let neutral: AutoMovieHumanSkeleton.IOutput | undefined = memo.get(template.id);
    if (neutral === undefined) {
      const params: IAutoMovieHumanParameters = template.parameters;
      const key: string = `${template.id}-${hash(JSON.stringify(params))}`;
      neutral = read(key);
      if (neutral === undefined) {
        neutral = AutoMovieHumanSkeleton.prepare(params)({});
        write(key, neutral);
      }
      memo.set(template.id, neutral);
    }
    return { neutral, scale: profile.stature / template.stature };
  }

  /**
   * The student's body measures, read from the scaled Human neutral skeleton
   * standing on the floor, so the motion laws scale from the body that is drawn.
   * Head height and foot length keep the segment convention, which Human's
   * joints do not name.
   *
   * @param profile The student's record.
   * @returns The measures, metres.
   */
  export function measure(profile: IStudentProfile): IBodyMeasure {
    const k: ISkeletonPoints = points(profile);
    const reach: number = k.upperArm + k.forearm + k.hand;
    return Object.freeze({
      stature: profile.stature,
      hip: k.hip,
      hipHalfWidth: k.hipHalfWidth,
      shoulder: k.shoulder,
      shoulderHalfWidth: k.shoulderHalfWidth,
      head: 0.936 * profile.stature,
      armReach: reach,
      legLength: k.thigh + k.shank,
      ankle: k.ankle,
      foot: 0.152 * profile.stature,
    });
  }

  /**
   * Segment lengths and offsets of the scaled Human neutral skeleton, metres:
   * what `StudentBody` solves with, so solved joints coincide with the drawn bones.
   */
  export interface ISkeletonPoints {
    /** Hip joint height. */
    hip: number;
    /** Half the hip joint spacing. */
    hipHalfWidth: number;
    /** Shoulder joint height. */
    shoulder: number;
    /** Half the shoulder joint spacing. */
    shoulderHalfWidth: number;
    /** Shoulder line ahead of the hips along the body's forward. */
    shoulderForward: number;
    /** Neck joint above the shoulder line. */
    neck: number;
    /** Shoulder to elbow. */
    upperArm: number;
    /** Elbow to wrist. */
    forearm: number;
    /** Wrist to the hand's centre. */
    hand: number;
    /** Hip to knee. */
    thigh: number;
    /** Knee to ankle. */
    shank: number;
    /** Ankle height. */
    ankle: number;
  }

  /**
   * Read the scaled neutral skeleton's joints.
   *
   * @param profile The student's record.
   * @returns Lengths and offsets, metres.
   */
  export function points(profile: IStudentProfile): ISkeletonPoints {
    const human: IHuman = of(profile);
    const s: number = human.scale;
    const p = (bone: string): [number, number, number] => {
      const found: AutoMovieHumanSkeleton.IPlacement | undefined = human.neutral.posed.find(
        (placement: AutoMovieHumanSkeleton.IPlacement): boolean => placement.bone === bone,
      );
      if (found === undefined) throw new Error(`Human neutral skeleton lacks ${bone}`);
      return [found.position[0] * s, found.position[1] * s, found.position[2] * s];
    };
    const d = (a: [number, number, number], b: [number, number, number]): number =>
      Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    const hips = p("hips");
    const lUpLeg = p("leftUpperLeg");
    const rUpLeg = p("rightUpperLeg");
    const lUpArm = p("leftUpperArm");
    const rUpArm = p("rightUpperArm");
    const left: [number, number, number] = [lUpLeg[0] - rUpLeg[0], 0, lUpLeg[2] - rUpLeg[2]];
    const ln: number = Math.hypot(left[0], left[2]) || 1;

    // Forward is left × up, as StudentPolygon defines it: (-lz, 0, lx) for a horizontal left.
    const forward: [number, number] = [-left[2] / ln, left[0] / ln];
    const shoulderMid: [number, number, number] = [(lUpArm[0] + rUpArm[0]) / 2, 0, (lUpArm[2] + rUpArm[2]) / 2];
    return {
      hip: (lUpLeg[1] + rUpLeg[1]) / 2,
      hipHalfWidth: d(lUpLeg, rUpLeg) / 2,
      shoulder: (lUpArm[1] + rUpArm[1]) / 2,
      shoulderHalfWidth: d(lUpArm, rUpArm) / 2,
      shoulderForward: (shoulderMid[0] - hips[0]) * forward[0] + (shoulderMid[2] - hips[2]) * forward[1],
      neck: p("neck")[1] - (lUpArm[1] + rUpArm[1]) / 2,
      upperArm: d(lUpArm, p("leftLowerArm")),
      forearm: d(p("leftLowerArm"), p("leftHand")),
      hand: d(p("leftHand"), p("leftMiddleProximal")),
      thigh: d(lUpLeg, p("leftLowerLeg")),
      shank: d(p("leftLowerLeg"), p("leftFoot")),
      ankle: p("leftFoot")[1],
    };
  }

  /** Neutral bodies by template id. */
  const memo: Map<string, AutoMovieHumanSkeleton.IOutput> = new Map();

  /** Node's file system when running in Node (capture, tests), absent in the browser. */
  interface IFs {
    existsSync(path: string): boolean;
    readFileSync(path: string, encoding: "utf8"): string;
    writeFileSync(path: string, data: string): void;
    mkdirSync(path: string, options: { recursive: true }): void;
  }

  /** The stage cache folder of neutral bodies, under the working directory's `.cache`. */
  const FOLDER: string = ".cache/human-neutral";

  /** Node's fs, or undefined in a browser. */
  function fs(): IFs | undefined {
    const host: { getBuiltinModule?: (id: string) => unknown } | undefined = (
      globalThis as { process?: { getBuiltinModule?: (id: string) => unknown } }
    ).process;
    return host?.getBuiltinModule?.("node:fs") as IFs | undefined;
  }

  /** A cached neutral body, if present. */
  function read(key: string): AutoMovieHumanSkeleton.IOutput | undefined {
    const file: IFs | undefined = fs();
    const path: string = `${FOLDER}/${key}.json`;
    if (file === undefined || !file.existsSync(path)) return undefined;
    return JSON.parse(file.readFileSync(path, "utf8")) as AutoMovieHumanSkeleton.IOutput;
  }

  /** Store a neutral body in the stage cache when running in Node. */
  function write(key: string, neutral: AutoMovieHumanSkeleton.IOutput): void {
    const file: IFs | undefined = fs();
    if (file === undefined) return;
    file.mkdirSync(FOLDER, { recursive: true });
    file.writeFileSync(`${FOLDER}/${key}.json`, JSON.stringify(neutral));
  }

  /** FNV-1a hash of a string, hex. */
  function hash(text: string): string {
    let h: number = 0x811c9dc5;
    for (let i: number = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193) >>> 0;
    return h.toString(16);
  }
}
