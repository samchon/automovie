import {
  Quaternion,
  bracketedCrossing,
  bracketedMinimum,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanStandUpright,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBoneGroups } from "../posture/HumanBoneGroups";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { walkRoot } from "./walkRoot";

/** The record of `IBisectClosed`'s site. */
type IBisectClosed = { low: number; high: number };

/**
 * The upright alignment of a body's quiet stance, solved from the body's own
 * joints by forward kinematics, once per body.
 *
 * Clinical standing alignment puts the ear, the shoulder joint and the hip
 * joint on one vertical line, the plumb line of Kendall (Kendall, McCreary and
 * Provance, Muscles: Testing and Function), with the head level so the gaze is
 * horizontal, and the whole body inclines slightly forward at the ankles so the
 * centre of mass lies a few centimetres in front of the ankle joints (Winter
 * 1995, "Human balance and posture control during standing and walking", Gait &
 * Posture 3). A rig's rest column need not stand so: the polygon man's
 * shoulders rest behind its hips. The alignment therefore fits the plumb line:
 * equal spine and chest flexion (Brent's minimisation within ±15°) and neck
 * flexion (a bracketed root within a comfortable ±20°) that minimise the
 * squared horizontal distances of the shoulder joints' midpoint and the head
 * joint, the ear's proxy, from the hip joints' vertical, since a simplified
 * neck need not let all three stack exactly; head flexion that levels the
 * head's forward axis. The planted entry places the hip joints ahead of the
 * ankles by the early quiet-standing separation, scaled by hip height to
 * preserve the posture's proportions across rigs.
 */
export namespace standUpright {
  /**
   * The alignment of a body, the body's own quiet-stance property
   * (`IAutoMovieMotionHumanBody.upright`), solved once by its record.
   *
   * @param body The body.
   * @returns Its alignment.
   */
  export function of(
    body: IAutoMovieMotionHumanBody,
  ): IAutoMovieMotionHumanStandUpright.IAlignment {
    return body.upright;
  }

  /**
   * Solve a body's alignment: the plumb-line trunk and neck, the level head,
   * then the lean. The body's record reads it once, on its first use
   * (`IAutoMovieMotionHumanBody.upright`).
   *
   * @param body The body.
   * @returns Its alignment.
   */
  export function align(
    body: IAutoMovieMotionHumanBody,
  ): IAutoMovieMotionHumanStandUpright.IAlignment {
    const prepared: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const readers: Map<
      ReadonlySet<AutoMovieHumanoidBone>,
      ReturnType<typeof poseBones.prepare>
    > = new Map();
    const bones: (
      joints: Partial<Record<AutoMovieHumanoidBone, number>>,
      requested: ReadonlySet<AutoMovieHumanoidBone>,
    ) => Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = (
      joints: Partial<Record<AutoMovieHumanoidBone, number>>,
      requested: ReadonlySet<AutoMovieHumanoidBone>,
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
      const pose: IAutoMoviePose = {
        skeleton: body.skeleton.id,
        root: null,
        joints: Object.entries(joints).map(
          ([bone, flexion]: [
            string,
            number | undefined,
          ]): IAutoMovieJointPose => ({
            bone: bone as AutoMovieHumanoidBone,
            flexion: flexion!,
            abduction: 0,
            twist: 0,
          }),
        ),
      };
      let read: ReturnType<typeof poseBones.prepare> | undefined =
        readers.get(requested);
      if (read === undefined) {
        read = poseBones.prepare(body, requested);
        readers.set(requested, read);
      }
      return read(pose, prepared());
    };
    const mid: (
      map: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
      a: AutoMovieHumanoidBone,
      b: AutoMovieHumanoidBone,
    ) => IAutoMovieVector3 = (
      map: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
      a: AutoMovieHumanoidBone,
      b: AutoMovieHumanoidBone,
    ): IAutoMovieVector3 => {
      const p: IAutoMovieVector3 = map.get(a)!.worldPosition;
      const q: IAutoMovieVector3 = map.get(b)!.worldPosition;
      return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2, z: (p.z + q.z) / 2 };
    };
    const base: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = bones(
      {},
      BASE,
    );
    const hips: number = mid(base, "leftUpperLeg", "rightUpperLeg").z;
    const ankles: number = mid(base, "leftFoot", "rightFoot").z;
    // For a trunk flexion, the neck flexion within the comfortable cervical
    // range that brings the ear closest over the hips, and the squared
    // distances of the shoulders and the ear from the hips' vertical.
    const necks: Map<number, number> = new Map();
    const fit: (f: number) => number = (f: number): number => {
      const off: (n: number) => number = (n: number): number =>
        ear(bones({ spine: f, chest: f, neck: n }, HumanBoneGroups.HEAD)) -
        hips;
      const n: number = bisect(off, NECK);
      necks.set(f, n);
      const map: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = bones(
        { spine: f, chest: f, neck: n },
        COLUMN,
      );
      const s: number = mid(map, "leftUpperArm", "rightUpperArm").z - hips;
      const e: number = ear(map) - hips;
      return s * s + e * e;
    };
    const trunk: number = minimum(fit, -TRUNK, TRUNK);
    if (!necks.has(trunk)) fit(trunk);
    const neck: number = necks.get(trunk)!;
    const head: number = bisect(
      (h: number): number =>
        Quaternion.rotateVector(
          bones(
            { spine: trunk, chest: trunk, neck, head: h },
            HumanBoneGroups.HEAD,
          ).get("head")!.worldRotation,
          { x: 0, y: 0, z: 1 },
        ).y,
      HEAD_RANGE,
    );
    const joints: Partial<
      Record<AutoMovieHumanoidBone, readonly [number, number, number]>
    > = {
      spine: [trunk, 0, 0],
      chest: [trunk, 0, 0],
      neck: [neck, 0, 0],
      head: [head, 0, 0],
    };
    // Translating the pelvis by this difference places the measured hip
    // midpoint over planted ankles regardless of the rig's neutral offset.
    const ahead: number =
      EARLY_HIP_AHEAD * (body.measure.hipHeight / walkRoot.REFERENCE_HIP);
    return { joints, lean: ahead - (hips - ankles) };
  }

  /**
   * The head joint, at the atlanto-occipital joint near the ear's height,
   * standing for the ear.
   */
  function ear(
    map: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): number {
    return map.get("head")!.worldPosition.z;
  }

  /**
   * Hip midpoint ahead of the ankle midpoint, metres, at the planted entry. Di
   * Giulio and Baltzopoulos (2019) measured the centre of gravity 47 mm ahead
   * of the ankles and 2 mm ahead of the hips at 0.50–0.55 s after stopping.
   * Their corresponding settled separation at 7.55–7.60 s was 63 mm. The entry
   * key uses the earlier measurement. https://doi.org/10.3389/fphys.2019.00625
   */
  const EARLY_HIP_AHEAD: number = (47 - 2) / 1000;

  /**
   * The comfortable cervical flexion range, degrees, either way (provisional,
   * inside DEFAULT_HUMANOID_ROM).
   */
  const NECK: number = 20;

  /**
   * The trunk flexion bracket of the plumb-line search, degrees either way
   * (provisional: wide enough to hold any rest column's alignment).
   */
  const TRUNK: number = 15;

  /**
   * The head flexion bracket of the level-gaze search, degrees either way
   * (provisional).
   */
  const HEAD_RANGE: number = 40;

  /** Joint centres of the neutral hip and ankle midpoints. */
  const BASE: ReadonlySet<AutoMovieHumanoidBone> = new Set([
    "leftUpperLeg",
    "rightUpperLeg",
    "leftFoot",
    "rightFoot",
  ]);

  /** The plumb-line cost needs the shoulders and the head together. */
  const COLUMN: ReadonlySet<AutoMovieHumanoidBone> = new Set([
    "leftUpperArm",
    "rightUpperArm",
    "head",
  ]);

  /**
   * The angle of the pure fixed-body cost's low on [lo, hi] degrees, by Brent's
   * method (`bracketedMinimum`), to within `LOW` of it: Brent's stopping rule
   * places its point within about three tolerances of the low, so the tolerance
   * is a third of that.
   */
  function minimum(
    cost: (angle: number) => number,
    lo: number,
    hi: number,
  ): number {
    return bracketedMinimum(cost, lo, hi, LOW / 3).at;
  }

  /**
   * How near its low the trunk's angle is found, degrees: half of a 0.01-degree
   * bracket.
   */
  const LOW: number = 0.005;

  /**
   * The zero of a monotonic residual on [-range, range] degrees, or the end
   * nearer to it when it has none there: the bracket closed to the width 40
   * bisections leave, by false position on the residual and bisection for
   * whatever width that leaves (`bracketedCrossing`), and its middle taken.
   */
  function bisect(residual: (angle: number) => number, range: number): number {
    const a: number = residual(-range);
    const b: number = residual(range);
    if (a * b > 0) return Math.abs(a) < Math.abs(b) ? -range : range;
    const closed: IBisectClosed = bracketedCrossing({
      f: residual,
      past: (value: number): boolean => !(value * a > 0),
      low: -range,
      high: range,
      known: { low: a, high: b },
      tolerance: 2 * range * 2 ** -40,
    });
    return (closed.low + closed.high) / 2;
  }
}
