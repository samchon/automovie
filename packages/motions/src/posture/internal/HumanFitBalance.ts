import { Quaternion, Vector3, AutoMovieEngineKinematics } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanJacobian, IAutoMovieResolveCenterOfMass, IAutoMovieResolvedBone, IAutoMovieVector3 } from "@automovie/interface";

import { HumanFitBalanceBase } from "./HumanFitBalanceBase";
import { HumanFoot } from "./HumanFoot";
import { HumanJacobian } from "./HumanJacobian";

/**
 * The balance of a posed body.
 *
 * @param body The body.
 * @param bones Its resolved bones.
 * @param points The points that bear, world metres, whose convex hull on the
 *   floor is the base; the feet's bearing outline (`HumanFoot.base`) when
 *   absent.
 * @param com Optional already computed centre for this unchanged body and
 *   bones, borrowed without mutation; computed here when absent.
 * @param owners The bone each of `points` rides, in their order: the base's
 *   corners then move with the posture (`IReading.riders`); absent, the base is
 *   read as fixed in the world.
 * @returns The reading.
 */
export function HumanFitBalance(
  body: IAutoMovieMotionHumanBody,
  bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  points: readonly IAutoMovieVector3[] = HumanFoot.base(body, bones),
  com: IAutoMovieVector3 = HumanFitBalance.centre(body, bones),
  owners?: readonly AutoMovieHumanoidBone[],
): HumanFitBalance.IReading {
  // Each corner of the hull keeps the index of the bearing point it
  // projects, so it is known as the point that rides its bone.
  const planes: ReturnType<typeof HumanFitBalanceBase> =
    HumanFitBalanceBase(points);
  const corners: HumanFitBalanceBase.ICorner[] = planes.corners;
  return {
    com,
    anchors: planes.anchors,
    normals: planes.normals,
    inside: planes.anchors.map((_: IOf, k: number): number =>
      HumanFitBalance.distance(planes.anchors, k, com, planes.normals[k]!),
    ),
    ...(owners === undefined
      ? {}
      : {
          riders: corners.map(
            (c: HumanFitBalanceBase.ICorner): HumanFitBalance.IRider => {
              const b: IAutoMovieResolvedBone = bones.get(owners[c.i]!)!;
              const world: IAutoMovieVector3 = points[c.i]!;
              return {
                bone: owners[c.i]!,
                local: Quaternion.rotateVector(
                  Quaternion.inverse(b.worldRotation),
                  Vector3.subtract(world, b.worldPosition),
                ),
                world,
              };
            },
          ),
          through: planes.through,
        }),
  };
}

/**
 * A posed body's static balance as rows of a whole-body fit (`HumanBodyFit`):
 * its centre of mass over the floor kept inside the outline of the feet where
 * they bear (`HumanFoot.base`), the base of support (Winter, Biomechanics and
 * Motor Control of Human Movement, ch. 4).
 *
 * The base is the convex hull of the bearing points on the floor, and each of
 * the half-planes whose intersection it is makes a row: the centre's signed
 * distance inside that half-plane, at or above nought. A hull of three or more
 * corners is the half-planes of its edges; two corners bound a segment, the two
 * sides of its line and a cap at each end; one corner is a point, four
 * half-planes along the floor's axes that meet only there. So the centre is
 * held over the base however few points bear, never over a line past the
 * segment's ends or nowhere at all. The centre of mass is the engine's mass
 * model's (`AutoMovieEngineKinematics.resolveAutoMovieCenterOfMass`) and its Jacobian the mass-weighted
 * sum of its segments' centres' point columns (`HumanJacobian.velocity`). Where
 * the bearing points' bones are given, the base's corners ride them: a row's
 * slope is the exact derivative of its half-plane's signed distance, the
 * centre's motion less the motion of the line through the corners, and a trial
 * is measured through its own corners, so a fit's model moves the base as its
 * merit's reading of the next posture does (Nocedal and Wright 2006, section
 * 18.5: an l1 merit and the model it is predicted by must price the same
 * function).
 */
export namespace HumanFitBalance {
  /** A posed body's balance. */
  export interface IReading {
    /**
     * The centre of mass, world metres; may share the same reading's positional
     * goal value and is not mutated by balance consumers.
     */
    com: IAutoMovieVector3;

    /**
     * A point on the floor each half-plane of the base of support passes
     * through: a hull's corners in order round it, a segment's first end thrice
     * and its second, or a point four times.
     */
    anchors: IReadingAnchorsItem[];

    /** Each half-plane's unit inward direction, in the anchors' order. */
    normals: IReadingNormalsItem[];

    /**
     * Each half-plane's signed distance of the centre inside it, metres, in the
     * anchors' order.
     */
    inside: number[];

    /**
     * The base's corners as points riding the bones they bear through, in hull
     * order, where the bearing points' bones were given (`of`'s `owners`);
     * absent, the base is read as fixed in the world.
     */
    riders?: IRider[];

    /**
     * Each half-plane's corners among `riders`, in the anchors' order, present
     * with `riders`.
     */
    through?: IThrough[];
  }

  /**
   * A corner of the base: a bearing point riding its bone, which moves with the
   * posture as the centre does.
   */
  export interface IRider {
    /** The bone the point rides. */
    bone: AutoMovieHumanoidBone;

    /** The point in the bone's frame, metres. */
    local: IAutoMovieVector3;

    /** The point in the world at the reading, metres. */
    world: IAutoMovieVector3;
  }

  /** Which corners a half-plane passes through (`HumanFitBalanceBase.IThrough`). */
  export type IThrough = HumanFitBalanceBase.IThrough;

  /**
   * A half-plane's signed distance of a centre at another posture, its base's
   * corners carried by their bones there (`IReading.riders`): a side's line
   * through its two corners as they are placed, a cap across the segment as
   * placed, a point's axes through its corner. Without riders the base is the
   * reading's own, fixed.
   *
   * @param reading The balance read at the linearisation.
   * @param k The half-plane.
   * @param bones The other posture's resolved bones.
   * @param com The centre at the other posture, world metres.
   * @returns Metres, positive inside.
   */
  export function at(
    reading: IReading,
    k: number,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    com: IAutoMovieVector3,
  ): number {
    const through: IThrough | undefined = reading.through?.[k];
    if (reading.riders === undefined || through === undefined)
      return distance(reading.anchors, k, com, reading.normals[k]!);
    const placed: (r: IRider) => IAutoMovieVector3 = (
      r: IRider,
    ): IAutoMovieVector3 => {
      const b: IAutoMovieResolvedBone = bones.get(r.bone)!;
      return Vector3.add(
        b.worldPosition,
        Quaternion.rotateVector(b.worldRotation, r.local),
      );
    };
    const p: IAutoMovieVector3 = placed(reading.riders[through.p]!);
    const n: IAtN = reading.normals[k]!;
    if (through.kind === "point")
      return n.x * (com.x - p.x) + n.z * (com.z - p.z);
    const q: IAutoMovieVector3 = placed(reading.riders[through.q]!);
    const length: number = Math.hypot(q.x - p.x, q.z - p.z);
    const t: IAtT = {
      x: (q.x - p.x) / length,
      z: (q.z - p.z) / length,
    };
    if (through.kind === "cap")
      return t.x * (com.x - p.x) + t.z * (com.z - p.z);

    // A side keeps the reading's inward orientation of its line.
    const was: IAtWas = side(reading, through);
    const sign: number = n.x * -was.z + n.z * was.x >= 0 ? 1 : -1;
    return sign * (-t.z * (com.x - p.x) + t.x * (com.z - p.z));
  }

  /**
   * A point's signed distance inside one half-plane of a reading's base.
   *
   * @param anchors The reading's half-plane anchors (`IReading.anchors`).
   * @param k The half-plane.
   * @param point The point, world metres; its height is not read.
   * @param normal The half-plane's unit inward direction
   *   (`IReading.normals[k]`).
   * @returns Metres, positive inside.
   */
  export function distance(
    anchors: readonly IDistanceAnchorsItem[],
    k: number,
    point: IAutoMovieVector3,
    normal: IDistanceNormal,
  ): number {
    const a: IDistanceA = anchors[k]!;
    return normal.x * (point.x - a.x) + normal.z * (point.z - a.z);
  }

  /**
   * Each edge's row slope: how fast each variable moves the centre inside that
   * edge, metres per the variable's unit.
   *
   * @param body The body.
   * @param bones The resolved bones the motions were read on.
   * @param motions The variables' motions.
   * @param reading The balance read on those bones.
   * @param columns Optional current centre velocities for these same body,
   *   bones and ordered motions; computed here when absent.
   * @returns One slope row per edge, one entry per variable.
   */
  export function slopes(
    body: IAutoMovieMotionHumanBody,
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    motions: readonly IAutoMovieMotionHumanJacobian.IMotion[],
    reading: IReading,
    columns: readonly IAutoMovieVector3[] = velocities(body, bones, motions),
  ): number[][] {
    const riders: IRider[] | undefined = reading.riders;
    const corners: IAutoMovieVector3[][] | undefined = riders?.map(
      (r: IRider): IAutoMovieVector3[] =>
        motions.map(
          (m: IAutoMovieMotionHumanJacobian.IMotion): IAutoMovieVector3 =>
            HumanJacobian.velocity(m, r.bone, r.world),
        ),
    );
    const c: IAutoMovieVector3 = reading.com;
    return reading.anchors.map((_: ISlopes, k: number): number[] => {
      const n: ISlopesN = reading.normals[k]!;
      const through: IThrough | undefined = reading.through?.[k];
      if (corners === undefined || through === undefined)
        return columns.map(
          (v: IAutoMovieVector3): number => n.x * v.x + n.z * v.z,
        );
      const p: IAutoMovieVector3 = riders![through.p]!.world;
      const vp: IAutoMovieVector3[] = corners[through.p]!;
      if (through.kind === "point")
        return columns.map(
          (v: IAutoMovieVector3, j: number): number =>
            n.x * (v.x - vp[j]!.x) + n.z * (v.z - vp[j]!.z),
        );
      const q: IAutoMovieVector3 = riders![through.q]!.world;
      const vq: IAutoMovieVector3[] = corners[through.q]!;
      const length: number = Math.hypot(q.x - p.x, q.z - p.z);
      const t: ISlopesT = {
        x: (q.x - p.x) / length,
        z: (q.z - p.z) / length,
      };
      if (through.kind === "cap") {
        // The cap turns with the segment: the centre's offset across it
        // times the segment's own turn.
        const across: number = -t.z * (c.x - p.x) + t.x * (c.z - p.z);
        return columns.map(
          (v: IAutoMovieVector3, j: number): number =>
            t.x * (v.x - vp[j]!.x) +
            t.z * (v.z - vp[j]!.z) +
            (across *
              (-t.z * (vq[j]!.x - vp[j]!.x) + t.x * (vq[j]!.z - vp[j]!.z))) /
              length,
        );
      }

      // A side moves at its corners' velocities blended where the
      // centre projects on it.
      const s: number = (t.x * (c.x - p.x) + t.z * (c.z - p.z)) / length;
      return columns.map(
        (v: IAutoMovieVector3, j: number): number =>
          n.x * (v.x - (1 - s) * vp[j]!.x - s * vq[j]!.x) +
          n.z * (v.z - (1 - s) * vp[j]!.z - s * vq[j]!.z),
      );
    });
  }

  /**
   * The body's segmental centre in world metres.
   *
   * @param body The body and its physical profile.
   * @param bones The resolved bones.
   * @returns World metres.
   */
  export function centre(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): IAutoMovieVector3 {
    return AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPlace(body.massModel, bones);
  }

  /**
   * The mass centre's velocity under each posture variable.
   *
   * @param body The body and its mass model.
   * @param bones The bones on which the motions were derived.
   * @param motions The geometric Jacobian's variable motions.
   * @returns World metres per variable unit, in motion order.
   */
  export function velocities(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    motions: readonly IAutoMovieMotionHumanJacobian.IMotion[],
  ): IAutoMovieVector3[] {
    const m: IAutoMovieResolveCenterOfMass.IModel = body.massModel;
    if (motions.length === 0) return [];

    // Laziness preserves the first variable's original prepare/velocity
    // order; later variables reuse only this unchanged reading's points.
    const points: (IAutoMovieVector3 | null | undefined)[] = new Array(
      m.segments.length,
    );
    return motions.map(
      (motion: IAutoMovieMotionHumanJacobian.IMotion): IAutoMovieVector3 => {
        let x: number = 0;
        let y: number = 0;
        let z: number = 0;
        for (let i: number = 0; i < m.segments.length; ++i) {
          const s: IAutoMovieResolveCenterOfMass.IModel["segments"][number] =
            m.segments[i]!;
          let at: IAutoMovieVector3 | null | undefined = points[i];
          if (at === undefined) {
            const b: IAutoMovieResolvedBone | undefined = bones.get(s.bone);
            if (b === undefined) {
              points[i] = null;
              continue;
            }
            at = Vector3.add(
              b.worldPosition,
              Quaternion.rotateVector(b.worldRotation, s.point),
            );
            points[i] = at;
          }
          if (at === null) continue;
          const velocity: IAutoMovieVector3 = HumanJacobian.velocity(
            motion,
            s.bone,
            at,
          );
          x = x + velocity.x * s.mass;
          y = y + velocity.y * s.mass;
          z = z + velocity.z * s.mass;
        }
        const inverseMass: number = 1 / m.mass;
        return { x: x * inverseMass, y: y * inverseMass, z: z * inverseMass };
      },
    );
  }

  /** A side's unit direction from its first corner to its second at the reading. */
  function side(reading: IReading, through: IThrough): ISideResult {
    const p: IAutoMovieVector3 = reading.riders![through.p]!.world;
    const q: IAutoMovieVector3 = reading.riders![through.q]!.world;
    const length: number = Math.hypot(q.x - p.x, q.z - p.z);
    return { x: (q.x - p.x) / length, z: (q.z - p.z) / length };
  }
}

/** The record of `ISideResult`'s site. */
type ISideResult = { x: number; z: number };

/** The record of `ISlopesT`'s site. */
type ISlopesT = { x: number; z: number };

/** The record of `ISlopesN`'s site. */
type ISlopesN = { x: number; z: number };

/** The record of `ISlopes`'s site. */
type ISlopes = { x: number; z: number };

/** The record of `IDistanceA`'s site. */
type IDistanceA = { x: number; z: number };

/** The record of `IDistanceNormal`'s site. */
type IDistanceNormal = { x: number; z: number };

/** The record of `IDistanceAnchorsItem`'s site. */
type IDistanceAnchorsItem = { x: number; z: number };

/** The record of `IAtWas`'s site. */
type IAtWas = { x: number; z: number };

/** The record of `IAtT`'s site. */
type IAtT = { x: number; z: number };

/** The record of `IAtN`'s site. */
type IAtN = { x: number; z: number };

/** The record of `IOf`'s site. */
type IOf = { x: number; z: number };

/** The record of `IReadingNormalsItem`'s site. */
type IReadingNormalsItem = { x: number; z: number };

/** The record of `IReadingAnchorsItem`'s site. */
type IReadingAnchorsItem = { x: number; z: number };

