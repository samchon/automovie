import type { AutoMovieHumanoidBone, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanWalkLegClearance, IAutoMoviePhysicalProfile, IAutoMovieQuaternion, IAutoMovieResolvedBone, IAutoMovieVector3 } from "@automovie/interface";

import { Quaternion, Vector3 } from "@automovie/engine";

import {
  AutoMovieMotionHumanAuditTangleModel,
} from "../audit/AutoMovieMotionHumanAuditTangleModel";

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
  /** The leg's four bones as posed, world frame (`walkLegClearance.placed`). */
  export function bones(
    body: IAutoMovieMotionHumanBody,
    leg: IAutoMovieMotionHumanWalkLegClearance.ILeg,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    const names: Record<string, AutoMovieHumanoidBone> = NAMES[leg.side];
    const resolved = (
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
    return new Map([
      resolved(names.UpperLeg!, leg.hip, leg.thigh),
      resolved(names.LowerLeg!, leg.knee, leg.shank),
      resolved(names.Foot!, leg.ankle, leg.rotation),
      resolved(
        names.Toes!,
        Vector3.add(
          leg.ankle,
          Quaternion.rotateVector(
            leg.rotation,
            Vector3.subtract(
              body.rest.get(names.Toes!)!,
              body.rest.get(names.Foot!)!,
            ),
          ),
        ),
        leg.rotation,
      ),
    ]);
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
    body: IAutoMovieMotionHumanBody,
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
        const pose = m.rest[i]!.pose;
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
          const scatter = (v: IAutoMovieVector3): IAutoMovieVector3 => {
            let sum: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
            for (const p of points) {
              const d: IAutoMovieVector3 = Vector3.subtract(p, origin);
              sum = Vector3.add(sum, Vector3.scale(d, Vector3.dot(d, v)));
            }
            return sum;
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
  export function indices(body: IAutoMovieMotionHumanBody): ReadonlyMap<AutoMovieHumanoidBone, number> {
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
    body: IAutoMovieMotionHumanBody,
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
  const CAPSULES: WeakMap<IAutoMovieMotionHumanBody, Map<AutoMovieHumanoidBone, ICapsule>> =
    new WeakMap();

  /** Each body's segment indices among the audit model's parts (`indices`). */
  const INDICES: WeakMap<IAutoMovieMotionHumanBody, Map<AutoMovieHumanoidBone, number>> =
    new WeakMap();

  /** Each body's readable probes by ordered pair of segments (`readable`). */
  const READABLE: WeakMap<IAutoMovieMotionHumanBody, Map<number, IReadable>> = new WeakMap();

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
  export const apart = (
    p1: IAutoMovieVector3,
    q1: IAutoMovieVector3,
    p2: IAutoMovieVector3,
    q2: IAutoMovieVector3,
  ): number => {
    const d1: IAutoMovieVector3 = Vector3.subtract(q1, p1);
    const d2: IAutoMovieVector3 = Vector3.subtract(q2, p2);
    const r: IAutoMovieVector3 = Vector3.subtract(p1, p2);
    const a: number = Vector3.dot(d1, d1);
    const e: number = Vector3.dot(d2, d2);
    const f: number = Vector3.dot(d2, r);
    const clamp = (v: number): number => Math.min(1, Math.max(0, v));
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
  };
}
