import {
  Quaternion,
  bracketedCrossing,
  bracketedMinimum,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanStandUpright,
  IAutoMoviePose,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";

/**
 * The upright alignment of a body's quiet stance, solved from the body's own
 * joints by forward kinematics, once per body.
 *
 * Clinical standing alignment puts the ear, the shoulder joint and the hip
 * joint on one vertical line, the plumb line of Kendall (Kendall, McCreary and
 * Provance, Muscles: Testing and Function), with the head level so the gaze
 * is horizontal, and the whole body inclines slightly forward at the ankles
 * so the centre of mass lies a few centimetres in front of the ankle joints
 * (Winter 1995, "Human balance and posture control during standing and
 * walking", Gait & Posture 3). A rig's rest column need not stand so: the
 * polygon man's shoulders rest behind its hips. The alignment therefore fits
 * the plumb line: equal spine and chest flexion (Brent's minimisation within
 * ±15°) and neck flexion (a bracketed root within a comfortable ±20°) that minimise
 * the squared horizontal distances of the shoulder joints' midpoint and the
 * head joint, the ear's proxy, from the hip joints' vertical, since a
 * simplified neck need not let all three stack exactly; head flexion that
 * levels the head's forward axis; and the forward lean that brings the centre of
 * mass 4 cm in front of the ankles' midpoint for a 0.93 m hip height, scaled
 * with it (a provisional value inside Winter's few centimetres).
 */
export namespace standUpright {

  /**
   * The alignment of a body, solved once and kept per body.
   *
   * @param body The body.
   * @returns Its alignment.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the per-body alignment; the namespace documents its physical targets and search bounds.
   * @evidence contracts/development/implementation.md#principled-implementation The plumb-line trunk by Brent's minimisation (`bracketedMinimum`), the neck and level head by bracketed roots (`bracketedCrossing`), and the lean from the mass model's centre against the ankles, with FK requested only for each residual's measured bones.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A weak body cache in front of one synchronous search.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every bound and tolerance is a named constant with its derivation; no body-specific angle is chosen.
   * @evidence contracts/development/implementation.md#efficient-algorithms Residuals visit requested ancestry instead of every bone and prepare each of the four fixed name demands once; the final reading demands precisely its mass-model bones and the two ankles. The neck found for each trunk candidate is kept for the search's length, so the chosen trunk's neck is not searched again; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One search shares the engine's dependency reader across candidates, and each trunk candidate's neck across the cost and the final reading; the body cache keeps only the final alignment.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader, four bounded name readers and the per-candidate necks end with the search's return or throw; one alignment stays weakly owned per live body (module-level cache; the body's builder is the owner it belongs with).
   */
  export function of(body: IAutoMovieMotionHumanBody): IAutoMovieMotionHumanStandUpright.IAlignment {
    const known: IAutoMovieMotionHumanStandUpright.IAlignment | undefined = CACHE.get(body);
    if (known !== undefined) return known;
    const solved: IAutoMovieMotionHumanStandUpright.IAlignment = solve(body);
    CACHE.set(body, solved);
    return solved;
  }

  /** Each body's alignment, solved once. */
  const CACHE: WeakMap<IAutoMovieMotionHumanBody, IAutoMovieMotionHumanStandUpright.IAlignment> = new WeakMap();

  /** Solve a body's alignment: the plumb-line trunk and neck, the level head, then the lean. */
  function solve(body: IAutoMovieMotionHumanBody): IAutoMovieMotionHumanStandUpright.IAlignment {
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
          ([bone, flexion]: [string, number | undefined]): IAutoMovieJointPose => ({
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
    const hips: number = mid(
      bones({}, HIPS),
      "leftUpperLeg",
      "rightUpperLeg",
    ).z;
    // For a trunk flexion, the neck flexion within the comfortable cervical
    // range that brings the ear closest over the hips, and the squared
    // distances of the shoulders and the ear from the hips' vertical.
    const necks: Map<number, number> = new Map();
    const fit: (f: number) => number = (f: number): number => {
      const off: (n: number) => number = (n: number): number =>
        ear(bones({ spine: f, chest: f, neck: n }, HEAD)) - hips;
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
          bones({ spine: trunk, chest: trunk, neck, head: h }, HEAD).get(
            "head",
          )!.worldRotation,
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
    // The centre of mass of the aligned column, relative to the ankles' midpoint.
    const model: ReturnType<typeof resolveAutoMovieCenterOfMass> =
      body.massModel;
    const requested: Set<AutoMovieHumanoidBone> = new Set(
      model.segments.map(
        (
          segment: IAutoMovieResolveCenterOfMass.ISegment,
        ): AutoMovieHumanoidBone => segment.bone,
      ),
    );
    requested.add("leftFoot");
    requested.add("rightFoot");
    const aligned: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = bones(
      { spine: trunk, chest: trunk, neck, head },
      requested,
    );
    const ahead: number =
      resolveAutoMovieCenterOfMass.place(model, aligned).z -
      mid(aligned, "leftFoot", "rightFoot").z;
    return { joints, lean: 0.04 * (body.measure.hipHeight / 0.93) - ahead };
  }

  /** The head joint, at the atlanto-occipital joint near the ear's height, standing for the ear. */
  function ear(
    map: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): number {
    return map.get("head")!.worldPosition.z;
  }

  /** The comfortable cervical flexion range, degrees, either way (provisional, inside DEFAULT_HUMANOID_ROM). */
  const NECK: number = 20;

  /** The trunk flexion bracket of the plumb-line search, degrees either way (provisional: wide enough to hold any rest column's alignment). */
  const TRUNK: number = 15;

  /** The head flexion bracket of the level-gaze search, degrees either way (provisional). */
  const HEAD_RANGE: number = 40;

  /** Only the named output bones are needed by each alignment residual. */
  const HIPS: ReadonlySet<AutoMovieHumanoidBone> = new Set([
    "leftUpperLeg",
    "rightUpperLeg",
  ]);

  /** The ear and gaze residuals read only the head. */
  const HEAD: ReadonlySet<AutoMovieHumanoidBone> = new Set(["head"]);

  /** The plumb-line cost needs the shoulders and the head together. */
  const COLUMN: ReadonlySet<AutoMovieHumanoidBone> = new Set([
    "leftUpperArm",
    "rightUpperArm",
    "head",
  ]);

  /**
   * The angle of the pure fixed-body cost's low on [lo, hi] degrees, by
   * Brent's method (`bracketedMinimum`), to within `LOW` of it: Brent's
   * stopping rule places its point within about three tolerances of the
   * low, so the tolerance is a third of that.
   */
  function minimum(
    cost: (angle: number) => number,
    lo: number,
    hi: number,
  ): number {
    return bracketedMinimum(cost, lo, hi, LOW / 3).at;
  }

  /** How near its low the trunk's angle is found, degrees: half of a 0.01-degree bracket. */
  const LOW: number = 0.005;

  /**
   * The zero of a monotonic residual on [-range, range] degrees, or the end
   * nearer to it when it has none there: the bracket closed to the width 40
   * bisections leave, by false position on the residual and bisection for
   * whatever width that leaves (`bracketedCrossing`), and its middle taken.
   */
  function bisect(
    residual: (angle: number) => number,
    range: number,
  ): number {
    const a: number = residual(-range);
    const b: number = residual(range);
    if (a * b > 0) return Math.abs(a) < Math.abs(b) ? -range : range;
    const closed: { low: number; high: number } = bracketedCrossing({
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
