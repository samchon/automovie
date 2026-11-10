import {
  type IAutoMovieResolvedBone,
  Quaternion,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { poseBones } from "../posture/poseBones";

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
 * the plumb line: equal spine and chest flexion (golden-section search within
 * ±15°) and neck flexion (bisection within a comfortable ±20°) that minimise
 * the squared horizontal distances of the shoulder joints' midpoint and the
 * head joint, the ear's proxy, from the hip joints' vertical, since a
 * simplified neck need not let all three stack exactly; head flexion that
 * levels the head's forward axis; and the forward lean that brings the centre of
 * mass 4 cm in front of the ankles' midpoint for a 0.93 m hip height, scaled
 * with it (a provisional value inside Winter's few centimetres).
 */
export namespace standUpright {
  /** A body's alignment. */
  export interface IAlignment {
    /** Spine, chest, neck and head flexion, clinical degrees. */
    joints: Partial<
      Record<AutoMovieHumanoidBone, readonly [number, number, number]>
    >;

    /** Forward lean of the centre of mass ahead of the ankles, metres in the body frame. */
    lean: number;
  }

  /**
   * The alignment of a body, solved once and kept per body.
   *
   * @param body The body.
   * @returns Its alignment.
   */
  export function of(body: IHumanBody): IAlignment {
    const known: IAlignment | undefined = CACHE.get(body);
    if (known !== undefined) return known;
    const solved: IAlignment = solve(body);
    CACHE.set(body, solved);
    return solved;
  }

  const CACHE: WeakMap<IHumanBody, IAlignment> = new WeakMap();

  function solve(body: IHumanBody): IAlignment {
    const bones = (
      joints: Partial<Record<AutoMovieHumanoidBone, number>>,
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
      const pose: IAutoMoviePose = {
        skeleton: body.skeleton.id,
        root: null,
        joints: Object.entries(joints).map(([bone, flexion]) => ({
          bone: bone as AutoMovieHumanoidBone,
          flexion: flexion!,
          abduction: 0,
          twist: 0,
        })),
      };
      return poseBones(body, pose);
    };
    const mid = (
      map: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
      a: AutoMovieHumanoidBone,
      b: AutoMovieHumanoidBone,
    ): IAutoMovieVector3 => {
      const p: IAutoMovieVector3 = map.get(a)!.worldPosition;
      const q: IAutoMovieVector3 = map.get(b)!.worldPosition;
      return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2, z: (p.z + q.z) / 2 };
    };
    const hips: number = mid(bones({}), "leftUpperLeg", "rightUpperLeg").z;
    // For a trunk flexion, the neck flexion within the comfortable cervical
    // range that brings the ear closest over the hips, and the squared
    // distances of the shoulders and the ear from the hips' vertical.
    const fit = (f: number): { neck: number; cost: number } => {
      const off = (n: number): number =>
        ear(bones({ spine: f, chest: f, neck: n })) - hips;
      const n: number = bisect(off, NECK);
      const map = bones({ spine: f, chest: f, neck: n });
      const s: number = mid(map, "leftUpperArm", "rightUpperArm").z - hips;
      const e: number = ear(map) - hips;
      return { neck: n, cost: s * s + e * e };
    };
    const trunk: number = golden((f: number): number => fit(f).cost, -15, 15);
    const neck: number = fit(trunk).neck;
    const head: number = bisect(
      (h: number): number =>
        Quaternion.rotateVector(
          bones({ spine: trunk, chest: trunk, neck, head: h }).get("head")!
            .worldRotation,
          { x: 0, y: 0, z: 1 },
        ).y,
      40,
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
    const model = resolveAutoMovieCenterOfMass(body.skeleton, body.profile);
    const aligned = bones({ spine: trunk, chest: trunk, neck, head });
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

  /** The minimum of a unimodal cost on [lo, hi] degrees by golden-section search to 0.01 degree. */
  function golden(
    cost: (angle: number) => number,
    lo: number,
    hi: number,
  ): number {
    const r: number = (Math.sqrt(5) - 1) / 2;
    let a: number = lo;
    let b: number = hi;
    while (b - a > 0.01) {
      const c: number = b - r * (b - a);
      const d: number = a + r * (b - a);
      if (cost(c) < cost(d)) b = d;
      else a = c;
    }
    return (a + b) / 2;
  }

  /** The zero of a monotonic residual on [-range, range] degrees by bisection, or the end nearer to it when it has none there. */
  function bisect(
    residual: (angle: number) => number,
    range: number = 25,
  ): number {
    let lo: number = -range;
    let hi: number = range;
    const a: number = residual(lo);
    const b: number = residual(hi);
    if (a * b > 0) return Math.abs(a) < Math.abs(b) ? lo : hi;
    for (let i: number = 0; i < 40; i++) {
      const m: number = (lo + hi) / 2;
      if (residual(m) * a > 0) lo = m;
      else hi = m;
    }
    return (lo + hi) / 2;
  }
}
