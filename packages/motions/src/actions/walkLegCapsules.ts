import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePhysicalProfile,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  AutoMovieMotionHumanAuditTangleModel,
} from "../audit/AutoMovieMotionHumanAuditTangleModel";
import type { IHumanBody } from "../body/IHumanBody";
import { walkLegClearance } from "./walkLegClearance";

/**
 * The legs' geometry the clearance reads (`walkLegClearance`): a leg's
 * bones as posed, each segment's bounding capsule at rest, the tangle
 * model's indices and readable probes per body, and the least distance
 * between two segments.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read, how it is kept and who reads it.
 * @evidence contracts/development/design.md#principled-representation The per-body geometry read once and kept by body, apart from the reading over it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The bones, the capsules, the indices, the readable probes, their tables and the distance, read by `walkLegClearance` and `walkLegBinding`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every capsule is the body's own probes'.
 */
export namespace walkLegCapsules {
  /**
   * The leg's requested posed bones, world frame; omitted demand reads all four.
   *
   * @param body The unchanged body supplying the foot-to-toes rest offset.
   * @param leg The actual posed hip, knee, ankle and segment rotations.
   * @param requested Optional canonical bone demand; a binding derivative requests only its actual probe or hull segment.
   * @returns Fresh resolved-bone records in the original thigh/shank/foot/toes order, restricted only by explicit demand.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States world frames, actual leg geometry, optional canonical demand, full default and output order.
   * @evidence contracts/development/implementation.md#principled-implementation Constructs the original four rigid leg frames; toes retain the exact foot-rotated rest-joint offset, and explicit demand omits only frames the collision consumer never reads.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One resolved-record constructor serves ordered thigh/shank/foot records and the conditionally required toe offset.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No pose fitting, contact, rotation or rest offset changes; omitted demand retains all four original records and absent names are not fabricated.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work for four possible bones; a bound derivative creates one actual record and avoids the unrelated toes-vector arithmetic unless toes are requested.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the body's existing canonical rest joints and the caller's actual solved leg; no posed record or queried result is reused across legs.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each call owns a fresh bounded map/records and retains no leg, demand, query history or external handle after its caller releases them.
   */
  export function bones(
    body: IHumanBody,
    leg: walkLegClearance.ILeg,
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    const names: Record<string, AutoMovieHumanoidBone> = NAMES[leg.side];
    const resolved: (
      bone: AutoMovieHumanoidBone,
      position: IAutoMovieVector3,
      rotation: IAutoMovieQuaternion,
    ) => [AutoMovieHumanoidBone, IAutoMovieResolvedBone] = (
      bone: AutoMovieHumanoidBone,
      position: IAutoMovieVector3,
      rotation: IAutoMovieQuaternion,
    ): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [
      bone,
      {
        bone,
        localRotation: rotation,
        worldPosition: position,
        worldRotation: rotation,
      },
    ];
    const out: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map();
    for (const [bone, position, rotation] of [
      [names.UpperLeg!, leg.hip, leg.thigh],
      [names.LowerLeg!, leg.knee, leg.shank],
      [names.Foot!, leg.ankle, leg.rotation],
    ] as const)
      if (requested === undefined || requested.has(bone))
        out.set(...resolved(bone, position, rotation));
    if (requested === undefined || requested.has(names.Toes!))
      out.set(...resolved(
        names.Toes!,
        toes(body, leg),
        leg.rotation,
      ));
    return out;
  }

  /**
   * Place the flat toes joint from the actual ankle and foot rotation.
   *
   * @param body The unchanged body owning canonical rest joints.
   * @param leg The actual solved foot/ankle, world frame.
   * @returns A fresh world-metre toes origin, with the same flat-toes assumption as bones.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States rest-body identity, actual varying ankle/rotation, world-metre output and the existing flat-toes convention.
   * @evidence contracts/development/implementation.md#principled-implementation Preserves the original toes-minus-foot rest offset, actual foot quaternion rotation and ankle addition used by both collider bones and broad-phase axes.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One intrinsic offset lookup precedes the shared current rigid-point expression, removing duplicated toe placement from its two collision consumers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No toes articulation, world pose, rest frame or rotation convention is altered; every current foot is actually transformed without rounding or sampling.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work shares one private rest offset per body/side, omitting repeated rest-map reads and offset subtraction from current collision readings.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Canonical rest joints stay unchanged for one body, as the existing capsule/reference caches already require; another body is required for geometry edits, while no posed output is shared.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One weak body entry owns at most two private rest offsets and releases with the body; only a fresh world point escapes and no leg, pose or query history is retained.
   */
  export function toes(body: IHumanBody, leg: walkLegClearance.ILeg): IAutoMovieVector3 {
    let sides: Partial<Record<"left" | "right", IAutoMovieVector3>> | undefined = TOES.get(body);
    if (sides === undefined) {
      sides = {};
      TOES.set(body, sides);
    }
    let local: IAutoMovieVector3 | undefined = sides[leg.side];
    if (local === undefined) {
      local = Vector3.subtract(body.rest.get(`${leg.side}Toes`)!, body.rest.get(`${leg.side}Foot`)!);
      sides[leg.side] = local;
    }
    return Vector3.add(leg.ankle, Quaternion.rotateVector(leg.rotation, local));
  }
  /** A segment's bounding capsule (`capsules`). */
  export interface ICapsule {
    /** Whether its axis lies on its bone's line, a thigh's or a shank's, which carries it as the leg bends; otherwise it is carried rigidly with the foot. */
    line: boolean;

    /** On a bone's line, where its axis begins, metres along the line from the joint toward the child joint. */
    lo: number;

    /** On a bone's line, where its axis ends. */
    hi: number;

    /** Carried with the foot, one end of its axis, metres from the bone's joint in the rest frame. */
    from: IAutoMovieVector3;

    /** Carried with the foot, the other end. */
    to: IAutoMovieVector3;

    /** Its radius, metres. */
    radius: number;
  }

  /**
   * Each leg segment's bounding capsule at rest, read once per body: a
   * thigh's or a shank's about its bone's line, as far along it as any of
   * its probes (corners and points of the bone's axis) projects, so the leg
   * carries it however the knee bends; a foot's or the toes' about the
   * principal direction of its probes through their mean (the principal-axis
   * bounding capsule, Eberly 2008, Fitting 3D Data with a Cylinder), carried
   * rigidly with the foot. Each radius is the farthest any probe lies from
   * its axis. The canonical rig rests unrotated, so a bone's frame at rest
   * is its joint.
   */
  export function capsules(
    body: IHumanBody,
  ): ReadonlyMap<AutoMovieHumanoidBone, ICapsule> {
    const known: Map<AutoMovieHumanoidBone, ICapsule> | undefined =
      CAPSULES.get(body);
    if (known !== undefined) return known;
    const m: AutoMovieMotionHumanAuditTangleModel.IModel =
      AutoMovieMotionHumanAuditTangleModel.model(body);
    const out: Map<AutoMovieHumanoidBone, ICapsule> = new Map();
    m.parts.forEach(
      (part: AutoMovieMotionHumanAuditTangleModel.IPart, i: number): void => {
        const matched: RegExpExecArray | null = LEG.exec(part.bone);
        if (matched === null) return;
        const joint: IAutoMovieVector3 = body.rest.get(part.bone)!;
        const pose: IAutoMoviePhysicalProfile.ITransform = m.rest[i]!.pose;
        const points: IAutoMovieVector3[] = part.probes.map(
          (probe: IAutoMovieVector3): IAutoMovieVector3 =>
            Vector3.subtract(
              Vector3.add(
                pose.position,
                Quaternion.rotateVector(pose.rotation, probe),
              ),
              joint,
            ),
        );
        const child: string | undefined = CHILD[matched[2]!];
        let origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
        let axis: IAutoMovieVector3;
        if (child !== undefined)
          axis = Vector3.normalize(
            Vector3.subtract(
              body.rest.get(`${matched[1]}${child}` as AutoMovieHumanoidBone)!,
              joint,
            ),
          );
        else {
          for (const p of points)
            origin = Vector3.add(origin, Vector3.scale(p, 1 / points.length));

          // The principal direction by power iteration on the scatter.
          const centred: IAutoMovieVector3[] = points.map((p: IAutoMovieVector3): IAutoMovieVector3 => Vector3.subtract(p, origin));
          const scatter: (v: IAutoMovieVector3) => IAutoMovieVector3 = (v: IAutoMovieVector3): IAutoMovieVector3 => {
            let x: number = 0;
            let y: number = 0;
            let z: number = 0;

            // Retain each original component's ordered scaled-point sum,
            // without two temporary vector records per probe and iteration.
            for (const d of centred) {
              const weight: number = Vector3.dot(d, v);
              x += d.x * weight;
              y += d.y * weight;
              z += d.z * weight;
            }
            return { x, y, z };
          };
          axis = { x: 0.6, y: 0.48, z: 0.64 };
          for (let k: number = 0; k < 50; k++) {
            const next: IAutoMovieVector3 = scatter(axis);
            if (Vector3.length(next) < 1e-12) break;
            axis = Vector3.normalize(next);
          }
        }
        let lo: number = Infinity;
        let hi: number = -Infinity;
        let radius: number = 0;
        for (const p of points) {
          const d: IAutoMovieVector3 = Vector3.subtract(p, origin);
          const s: number = Vector3.dot(d, axis);
          lo = Math.min(lo, s);
          hi = Math.max(hi, s);
          radius = Math.max(
            radius,
            Vector3.length(Vector3.subtract(d, Vector3.scale(axis, s))),
          );
        }
        out.set(part.bone, {
          line: child !== undefined,
          lo,
          hi,
          from: Vector3.add(origin, Vector3.scale(axis, lo)),
          to: Vector3.add(origin, Vector3.scale(axis, hi)),
          radius,
        });
      },
    );
    CAPSULES.set(body, out);
    return out;
  }

  /** Each segment's index among the audit model's parts, read once per body. */
  export function indices(body: IHumanBody): ReadonlyMap<AutoMovieHumanoidBone, number> {
    const known: Map<AutoMovieHumanoidBone, number> | undefined =
      INDICES.get(body);
    if (known !== undefined) return known;
    const out: Map<AutoMovieHumanoidBone, number> = new Map(
      AutoMovieMotionHumanAuditTangleModel.model(body).parts.map(
        (
          part: AutoMovieMotionHumanAuditTangleModel.IPart,
          i: number,
        ): [AutoMovieHumanoidBone, number] => [part.bone, i],
      ),
    );
    INDICES.set(body, out);
    return out;
  }

  /** The probes of one segment the audit reads in another (`readable`). */
  export interface IReadable {
    /** The probes, in the first segment's frame. */
    probes: IAutoMovieVector3[];

    /** Their reference depths, metres. */
    references: number[];

    /** Whether any is a corner of the first segment's shapes rather than a point of its bone's axis. */
    surface: boolean;
  }

  /**
   * The probes of segment `i` the audit reads in segment `j`, those with a
   * bounded reference depth, and their reference depths, read once per body
   * and pair.
   */
  export function readable(
    m: AutoMovieMotionHumanAuditTangleModel.IModel,
    body: IHumanBody,
    i: number,
    j: number,
  ): IReadable {
    let pairs: Map<number, IReadable> | undefined = READABLE.get(body);
    if (pairs === undefined) {
      pairs = new Map();
      READABLE.set(body, pairs);
    }
    const key: number = i * m.parts.length + j;
    const known: IReadable | undefined = pairs.get(key);
    if (known !== undefined) return known;
    const reference: Float64Array =
      AutoMovieMotionHumanAuditTangleModel.reference(m, i, j);
    const out: IReadable = { probes: [], references: [], surface: false };
    m.parts[i]!.probes.forEach((probe: IAutoMovieVector3, k: number): void => {
      if (!Number.isFinite(reference[k]!)) return;
      out.probes.push(probe);
      out.references.push(reference[k]!);
      if (k < m.parts[i]!.surface) out.surface = true;
    });
    pairs.set(key, out);
    return out;
  }

  /** Each body's bounding capsules of its leg segments (`capsules`). */
  const CAPSULES: WeakMap<IHumanBody, Map<AutoMovieHumanoidBone, ICapsule>> =
    new WeakMap();

  /** Intrinsic toes-minus-foot rest offsets only, at most two per weak body. */
  const TOES: WeakMap<IHumanBody, Partial<Record<"left" | "right", IAutoMovieVector3>>> = new WeakMap();

  /** Each body's segment indices among the audit model's parts (`indices`). */
  const INDICES: WeakMap<IHumanBody, Map<AutoMovieHumanoidBone, number>> =
    new WeakMap();

  /** Each body's readable probes by ordered pair of segments (`readable`). */
  const READABLE: WeakMap<IHumanBody, Map<number, IReadable>> = new WeakMap();

  /** The identity frame a shape's distance is read in. */
  export const IDENTITY: IAutoMoviePhysicalProfile.ITransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };

  /** A leg's bones. */
  export const LEG: RegExp = /^(left|right)(UpperLeg|LowerLeg|Foot|Toes)$/u;

  /** The child joint whose line a thigh's or a shank's capsule lies on. */
  export const CHILD: Readonly<Record<string, string>> = {
    UpperLeg: "LowerLeg",
    LowerLeg: "Foot",
  };

  /** Each side's leg bones by their name without the side. */
  export const NAMES: Readonly<Record<"left" | "right", Record<string, AutoMovieHumanoidBone>>> = {
    left: { UpperLeg: "leftUpperLeg", LowerLeg: "leftLowerLeg", Foot: "leftFoot", Toes: "leftToes" },
    right: { UpperLeg: "rightUpperLeg", LowerLeg: "rightLowerLeg", Foot: "rightFoot", Toes: "rightToes" },
  };
  /**
   * The least distance between two segments (Ericson 2005, Real-Time Collision
   * Detection, 5.1.9).
   */
  export const apart: (p1: IAutoMovieVector3, q1: IAutoMovieVector3, p2: IAutoMovieVector3, q2: IAutoMovieVector3) => number = (
    p1: IAutoMovieVector3,
    q1: IAutoMovieVector3,
    p2: IAutoMovieVector3,
    q2: IAutoMovieVector3,
  ): number => {
    const d1: IAutoMovieVector3 = Vector3.subtract(q1, p1);
    return apartFrom(p1, d1, Vector3.dot(d1, d1), p2, q2);
  };

  /**
   * Prepare one unchanged capsule axis for its ordered segment-distance tests.
   *
   * @param from The axis's first endpoint, world metres.
   * @param to The axis's second endpoint, world metres.
   * @returns The same metre gap for each actual other segment's endpoints during this synchronous broad phase.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States fixed and varying world-metre endpoints, metre gap and same-reading lifetime.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates Ericson's original segment closest-points algorithm to apartFrom with the first segment's unchanged direction and squared length.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure First-axis preparation precedes one second-axis reader; raw apart and the prepared path share all pair-dependent decisions in apartFrom.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the original degeneracy and denominator thresholds, endpoint clamps and vector arithmetic; every ordered pair still computes its actual gap.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant preparation shares the first direction and squared length across its four opposite-leg segments, avoiding their repeated subtraction and dot product without changing the sixteen pair tests.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A leg reading holds the same actual capsule endpoints throughout its nested broad-phase traversal; moved endpoints require a new reader and no pair result is shared.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each outer-loop reader holds its fixed origin, direction and squared length until that loop completes or throws; no other segment, gap or pose history is retained.
   */
  export function prepareApart(
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
  ): (otherFrom: IAutoMovieVector3, otherTo: IAutoMovieVector3) => number {
    const direction: IAutoMovieVector3 = Vector3.subtract(to, from);
    const squared: number = Vector3.dot(direction, direction);
    return (otherFrom: IAutoMovieVector3, otherTo: IAutoMovieVector3): number =>
      apartFrom(from, direction, squared, otherFrom, otherTo);
  }

  /** Ericson's unchanged pair-dependent closest-points rule with the first axis supplied. */
  function apartFrom(
    p1: IAutoMovieVector3,
    d1: IAutoMovieVector3,
    a: number,
    p2: IAutoMovieVector3,
    q2: IAutoMovieVector3,
  ): number {
    const d2: IAutoMovieVector3 = Vector3.subtract(q2, p2);
    const r: IAutoMovieVector3 = Vector3.subtract(p1, p2);
    const e: number = Vector3.dot(d2, d2);
    const f: number = Vector3.dot(d2, r);
    const clamp: (v: number) => number = (v: number): number => Math.min(1, Math.max(0, v));
    let s: number;
    let t: number;
    if (a <= 1e-12 && e <= 1e-12) {
      s = 0;
      t = 0;
    } else if (a <= 1e-12) {
      s = 0;
      t = clamp(f / e);
    } else {
      const c: number = Vector3.dot(d1, r);
      if (e <= 1e-12) {
        t = 0;
        s = clamp(-c / a);
      } else {
        const b: number = Vector3.dot(d1, d2);
        const denom: number = a * e - b * b;
        s = denom > 1e-12 ? clamp((b * f - c * e) / denom) : 0;
        t = (b * s + f) / e;
        if (t < 0) {
          t = 0;
          s = clamp(-c / a);
        } else if (t > 1) {
          t = 1;
          s = clamp((b - c) / a);
        }
      }
    }
    return Vector3.length(
      Vector3.subtract(
        Vector3.add(p1, Vector3.scale(d1, s)),
        Vector3.add(p2, Vector3.scale(d2, t)),
      ),
    );
  }
}
