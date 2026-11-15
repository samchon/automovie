import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  physicalHullFaces,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePhysicalProfile,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangleModel } from "../audit/AutoMovieMotionHumanAuditTangleModel";
import type { IHumanBody } from "../body/IHumanBody";
import { HumanColliders } from "../posture/HumanColliders";
import type { HumanLegChain } from "../posture/HumanLegChain";

/**
 * How far two legs of one body pass into each other, read as the tangle
 * audit reads them: each leg posed as the posture shows it (its hip, knee
 * and ankle and its thigh's and shank's rotations, `HumanLegChain`, and its
 * foot's rotation), and the deepest probe of either leg's thigh, shank, foot
 * or toes in a segment of the other beyond the probe's own reference depth
 * there (`AutoMovieMotionHumanAuditTangleModel.excess`). A planner that
 * keeps it within the audit's give (`AutoMovieMotionHumanAuditTangleModel.BUILT`)
 * keeps two legs that cross, as a sideways recovery's do, clear of each
 * other where the audit would find them run through each other.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the leg, the reading and the bound a planner keeps.
 * @evidence contracts/development/design.md#principled-representation A leg is its posed joints and bones, as the posture's fit gives them; the reading is the audit's own.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The bound, the leg, the reading, the placed segments and the excess.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses `HumanColliders` and the tangle audit's model, probes and reference depths; the knee is the caller's, from the posture's own fit.
 */
export namespace walkLegClearance {
  /** How far two legs may pass into each other beyond their reference depths, metres: the skin's give, the tangle audit's own limit (`AutoMovieMotionHumanAuditTangleModel.BUILT`). */
  export const BOUND: number = AutoMovieMotionHumanAuditTangleModel.BUILT;

  /**
   * A reading of two legs' clearance (`reading`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit.
   * @evidence contracts/development/design.md#principled-representation The excess and its binding linear piece, as an active-set linearisation reads a piecewise-linear constraint.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, read by the stance course.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The piece is the audit's own reading of the binding probe.
   */
  export interface IReading {
    /** The excess, metres. */
    excess: number;

    /** The binding piece read for the two legs moved, metres; equal to the excess for the legs read. */
    at: (one: ILeg, other: ILeg) => number;
  }

  /**
   * A leg as posed (`HumanLegChain.IPosed`) with its side and its foot.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame.
   * @evidence contracts/development/design.md#principled-representation The posed leg's joints and bones, and the foot's world rotation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The posed leg and two members.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses `HumanLegChain.IPosed`.
   */
  export interface ILeg extends HumanLegChain.IPosed {
    /** The leg. */
    side: "left" | "right";

    /** The foot's world rotation from its rest. */
    rotation: IAutoMovieQuaternion;
  }
  /**
   * A leg's collider segments as posed: the thigh at the hip and the shank at
   * the knee at their rotations, and the foot and the toes at the foot's
   * rotation, the toes flat with the foot.
   *
   * @param body The body.
   * @param leg The leg.
   * @returns The placed segments, as `HumanColliders.placed` places them.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each segment's frame and the toes' assumption.
   * @evidence contracts/development/implementation.md#principled-implementation The canonical rig rests unrotated, so a bone's world rotation is its posed one.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The four bones' frames, then `HumanColliders.placed` on them.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Collider placement stays with `HumanColliders`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanColliders.placed`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh segments and retains nothing.
   */
  export function placed(
    body: IHumanBody,
    leg: ILeg,
  ): HumanColliders.IPlaced[] {
    return HumanColliders.placed(body, bones(body, leg));
  }

  /**
   * How far two legs pass into each other beyond what the body's reference
   * postures already share, the deepest probe of a segment of either in a
   * segment of the other less its reference depth there, as the tangle audit
   * reads every pair; and that reading's own piece for the legs moved: the
   * same probe's depth below the same face of the same hull, which a planner
   * differentiates, the excess being the greatest of such linear pieces.
   *
   * @param body The body.
   * @param one One leg.
   * @param other The other leg.
   * @returns The excess, metres, zero where no probe lies deeper than its reference; and its binding piece read for two legs moved, zero where nothing binds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the unit, the zero and the binding piece.
   * @evidence contracts/development/implementation.md#principled-implementation The tangle audit's own reading of every ordered pair of the two legs' segments, the probes it sets aside set aside; a pair whose bounding capsules keep apart holds the probes read apart from the other's collider.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The bones' frames, a capsule test per ordered pair, then the placements and one reading per pair that may meet.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every ordered pair of the two legs is tested, and every pair that may meet is read against the audit's reference depths.
   * @evidence contracts/development/implementation.md#efficient-algorithms Sixteen segment distances; the probes are read only for the pairs whose capsules meet, and only those the audit reads; the capsules, the readable probes, the model and its references are built once per body.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `AutoMovieMotionHumanAuditTangleModel`'s model, references and depths.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing beyond the per-body memos.
   */
  export function reading(
    body: IHumanBody,
    one: ILeg,
    other: ILeg,
  ): IReading {
    const m: AutoMovieMotionHumanAuditTangleModel.IModel =
      AutoMovieMotionHumanAuditTangleModel.model(body);
    const fits: ReadonlyMap<AutoMovieHumanoidBone, ICapsule> = capsules(body);
    const index: ReadonlyMap<AutoMovieHumanoidBone, number> = indices(body);
    const legs = [one, other].map((leg: ILeg) => {
      const k: IAutoMovieVector3 = leg.knee;
      const names: Record<string, AutoMovieHumanoidBone> = NAMES[leg.side];
      const toes: IAutoMovieVector3 = Vector3.add(
        leg.ankle,
        Quaternion.rotateVector(
          leg.rotation,
          Vector3.subtract(
            body.rest.get(names.Toes!)!,
            body.rest.get(names.Foot!)!,
          ),
        ),
      );
      // Each segment's capsule as posed: along the thigh's or the shank's
      // line from its joint, and carried rigidly with the foot for the foot
      // and the toes.
      const lined = (
        bone: AutoMovieHumanoidBone,
        joint: IAutoMovieVector3,
        end: IAutoMovieVector3,
      ): [AutoMovieHumanoidBone, IAutoMovieVector3, IAutoMovieVector3] => {
        const fit: ICapsule = fits.get(bone)!;
        const along: IAutoMovieVector3 = Vector3.normalize(
          Vector3.subtract(end, joint),
        );
        return [
          bone,
          Vector3.add(joint, Vector3.scale(along, fit.lo)),
          Vector3.add(joint, Vector3.scale(along, fit.hi)),
        ];
      };
      const rigid = (
        bone: AutoMovieHumanoidBone,
        joint: IAutoMovieVector3,
      ): [AutoMovieHumanoidBone, IAutoMovieVector3, IAutoMovieVector3] => {
        const fit: ICapsule = fits.get(bone)!;
        return [
          bone,
          Vector3.add(joint, Quaternion.rotateVector(leg.rotation, fit.from)),
          Vector3.add(joint, Quaternion.rotateVector(leg.rotation, fit.to)),
        ];
      };
      return {
        leg,
        axes: [
          lined(names.UpperLeg!, leg.hip, k),
          lined(names.LowerLeg!, k, leg.ankle),
          rigid(names.Foot!, leg.ankle),
          rigid(names.Toes!, toes),
        ],
      };
    });
    // A probe whose reference depth is unbounded, a corner of two colliders
    // that share one volume by their build, is set aside by the audit
    // (`AutoMovieMotionHumanAuditTangleModel.reference`): only the others are
    // read. A segment's collider and its probes lie inside its capsule, the
    // points of a thigh's or a shank's bone axis on its capsule's axis, so
    // the probes of one segment the audit reads can lie in another's collider
    // only where the first's capsule, or its axis where only points of a
    // thigh's or a shank's bone axis are read, comes within the second's
    // capsule's radius of its axis.
    const meeting: [number, number, number, number][] = [];
    for (const [a, p0, p1] of legs[0]!.axes)
      for (const [b, q0, q1] of legs[1]!.axes) {
        const gap: number = apart(p0, p1, q0, q1);
        for (const [from, x, to, y] of [
          [0, a, 1, b],
          [1, b, 0, a],
        ] as const) {
          const i: number = index.get(x)!;
          const j: number = index.get(y)!;
          const { probes, surface } = readable(m, body, i, j);
          if (
            probes.length > 0 &&
            gap <
              (surface || !fits.get(x)!.line ? fits.get(x)!.radius : 0) +
                fits.get(y)!.radius
          )
            meeting.push([from, i, to, j]);
        }
      }
    if (meeting.length === 0) return { excess: 0, at: (): number => 0 };
    // Each meeting pair read as the audit reads it (`depths`): every
    // readable probe of the first segment in each convex hull of the second,
    // its depth the least of its distances inside the hull's face planes,
    // less its reference; the deepest is kept with the probe, the hull and
    // the face that bound it.
    const segmentsOf = (leg: ILeg): Map<number, HumanColliders.IPlaced> =>
      new Map(
        HumanColliders.placed(body, bones(body, leg)).map(
          (segment: HumanColliders.IPlaced): [number, HumanColliders.IPlaced] => [
            index.get(segment.bone)!,
            segment,
          ],
        ),
      );
    const segments: Map<number, HumanColliders.IPlaced>[] = [
      segmentsOf(one),
      segmentsOf(other),
    ];
    let worst: number = 0;
    let binding: IBinding | undefined;
    for (const [from, i, to, j] of meeting) {
      const { probes, references } = readable(m, body, i, j);
      const a: HumanColliders.IPlaced = segments[from]!.get(i)!;
      const b: HumanColliders.IPlaced = segments[to]!.get(j)!;
      // A probe outside the bounding sphere of the second segment's corners
      // lies outside every hull of it.
      const sphere: AutoMovieMotionHumanAuditTangleModel.IPart = m.parts[j]!;
      for (let k: number = 0; k < probes.length; k++) {
        const local: IAutoMovieVector3 = relative(probes[k]!, a, b);
        if (Vector3.length(Vector3.subtract(local, sphere.centre)) >= sphere.radius)
          continue;
        for (let s: number = 0; s < b.shapes.length; s++) {
          const { depth, face } = inside(
            b.shapes[s]!,
            local,
            Math.max(0, worst + references[k]!),
          );
          if (depth > 0 && depth - references[k]! > worst) {
            worst = depth - references[k]!;
            binding = {
              from,
              i,
              to,
              j,
              probe: probes[k]!,
              shape: s,
              face,
              reference: references[k]!,
            };
          }
        }
      }
    }
    const bound: IBinding | undefined = binding;
    return {
      excess: worst,
      at: (first: ILeg, second: ILeg): number => {
        if (bound === undefined) return 0;
        const moved: Map<number, HumanColliders.IPlaced>[] = [
          segmentsOf(first),
          segmentsOf(second),
        ];
        const b: HumanColliders.IPlaced = moved[bound.to]!.get(bound.j)!;
        const local: IAutoMovieVector3 = relative(
          bound.probe,
          moved[bound.from]!.get(bound.i)!,
          b,
        );
        const shape: HumanColliders.IPlaced["shapes"][number] = b.shapes[bound.shape]!;
        return (
          (bound.face === undefined
            ? inside(shape, local, -Infinity).depth
            : planar(shape, local, bound.face)) - bound.reference
        );
      },
    };
  }

  /**
   * How far two legs pass into each other beyond what the body's reference
   * postures already share (`reading`).
   *
   * @param body The body.
   * @param one One leg.
   * @param other The other leg.
   * @returns Metres; zero where no probe lies deeper than its reference.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the unit and the zero.
   * @evidence contracts/development/implementation.md#principled-implementation The reading's excess.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One reading.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Delegates to `reading`.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `reading`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function excess(body: IHumanBody, one: ILeg, other: ILeg): number {
    return reading(body, one, other).excess;
  }

  /** The probe, hull and face that bind a reading (`reading`). */
  interface IBinding {
    /** Which leg carries the probe, 0 or 1. */
    from: number;

    /** The probe's segment among the audit model's parts. */
    i: number;

    /** Which leg carries the hull. */
    to: number;

    /** The hull's segment among the audit model's parts. */
    j: number;

    /** The probe, in its segment's frame. */
    probe: IAutoMovieVector3;

    /** The hull among its segment's shapes. */
    shape: number;

    /** The face plane the probe lies least inside, in the hull's frame; none for a shape that is not a hull. */
    face: physicalHullFaces.IFace | undefined;

    /** The probe's reference depth there, metres. */
    reference: number;
  }

  /** A probe of segment `a` in segment `b`'s frame, as the audit carries it (`AutoMovieMotionHumanAuditTangleModel.depths`). */
  function relative(
    probe: IAutoMovieVector3,
    a: HumanColliders.IPlaced,
    b: HumanColliders.IPlaced,
  ): IAutoMovieVector3 {
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(b.pose.rotation);
    return Vector3.add(
      Quaternion.rotateVector(
        inverse,
        Vector3.subtract(a.pose.position, b.pose.position),
      ),
      Quaternion.rotateVector(
        Quaternion.multiply(inverse, a.pose.rotation),
        probe,
      ),
    );
  }

  /**
   * How deep a point lies in a shape, metres, zero outside, as the audit
   * reads it: a hull's least distance inside its face planes, with the face
   * that gives it, read no further once it is no deeper than `floor`; any
   * other shape by the engine's shape distance.
   */
  function inside(
    shape: HumanColliders.IPlaced["shapes"][number],
    local: IAutoMovieVector3,
    floor: number,
  ): { depth: number; face: physicalHullFaces.IFace | undefined } {
    if (shape.kind !== "hull")
      return {
        depth: Math.max(
          0,
          -physicalShapeSegmentDistance(IDENTITY, shape, local, local),
        ),
        face: undefined,
      };
    const point: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(shape.transform.rotation),
      Vector3.subtract(local, shape.transform.position),
    );
    // A point outside the sphere about the hull's vertices lies outside it.
    const hull: physicalHullFaces.IHull = physicalHullFaces(shape.points);
    if (Vector3.length(Vector3.subtract(point, hull.centre)) >= hull.radius)
      return { depth: 0, face: undefined };
    let depth: number = Infinity;
    let face: physicalHullFaces.IFace | undefined;
    for (const f of hull.faces) {
      const d: number = f.offset - Vector3.dot(f.normal, point);
      if (d < depth) {
        depth = d;
        face = f;
      }
      if (depth <= floor) break;
    }
    return { depth: Math.max(0, depth), face };
  }

  /** How far a point lies inside one face plane of a hull, metres, negative outside. */
  function planar(
    shape: HumanColliders.IPlaced["shapes"][number],
    local: IAutoMovieVector3,
    face: physicalHullFaces.IFace,
  ): number {
    const point: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(shape.transform.rotation),
      Vector3.subtract(local, shape.transform.position),
    );
    return face.offset - Vector3.dot(face.normal, point);
  }

  /**
   * How far a leg's probes move between two posings of it: the farthest any
   * probe the tangle audit reads of its thigh, shank, foot or toes lies from
   * where the other posing puts it. A depth below a convex hull's faces moves
   * no further than the probe and the hull do, so two legs each moved within
   * half a tolerance leave their clearance within the tolerance.
   *
   * @param body The body.
   * @param one The leg posed once.
   * @param other The same leg posed again.
   * @returns Metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the unit and what the bound covers.
   * @evidence contracts/development/implementation.md#principled-implementation A probe's depth in a convex hull is 1-Lipschitz in the probe's place and in the hull's.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Both posings placed, then every probe of every segment compared.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every probe of the audit's model is compared.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the leg's probes.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `placed` and the audit's model.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function moved(body: IHumanBody, one: ILeg, other: ILeg): number {
    const m: AutoMovieMotionHumanAuditTangleModel.IModel =
      AutoMovieMotionHumanAuditTangleModel.model(body);
    const index: ReadonlyMap<AutoMovieHumanoidBone, number> = indices(body);
    const a: HumanColliders.IPlaced[] = placed(body, one);
    const b: HumanColliders.IPlaced[] = placed(body, other);
    let out: number = 0;
    a.forEach((segment: HumanColliders.IPlaced, s: number): void => {
      const twin: HumanColliders.IPlaced = b[s]!;
      for (const probe of m.parts[index.get(segment.bone)!]!.probes)
        out = Math.max(
          out,
          Vector3.length(
            Vector3.subtract(
              Vector3.add(
                segment.pose.position,
                Quaternion.rotateVector(segment.pose.rotation, probe),
              ),
              Vector3.add(
                twin.pose.position,
                Quaternion.rotateVector(twin.pose.rotation, probe),
              ),
            ),
          ),
        );
    });
    return out;
  }

  /** The leg's four bones as posed, world frame (`placed`). */  function bones(
    body: IHumanBody,
    leg: ILeg,
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
  interface ICapsule {
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
  function capsules(
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
  function indices(body: IHumanBody): ReadonlyMap<AutoMovieHumanoidBone, number> {
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
  interface IReadable {
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
  function readable(
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

  /** Each body's segment indices among the audit model's parts (`indices`). */
  const INDICES: WeakMap<IHumanBody, Map<AutoMovieHumanoidBone, number>> =
    new WeakMap();

  /** Each body's readable probes by ordered pair of segments (`readable`). */
  const READABLE: WeakMap<IHumanBody, Map<number, IReadable>> = new WeakMap();

  /** The identity frame a shape's distance is read in. */
  const IDENTITY: IAutoMoviePhysicalProfile.ITransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };

  /** A leg's bones. */
  const LEG: RegExp = /^(left|right)(UpperLeg|LowerLeg|Foot|Toes)$/u;

  /** The child joint whose line a thigh's or a shank's capsule lies on. */
  const CHILD: Readonly<Record<string, string>> = {
    UpperLeg: "LowerLeg",
    LowerLeg: "Foot",
  };

  /** Each side's leg bones by their name without the side. */
  const NAMES: Readonly<Record<"left" | "right", Record<string, AutoMovieHumanoidBone>>> = {
    left: { UpperLeg: "leftUpperLeg", LowerLeg: "leftLowerLeg", Foot: "leftFoot", Toes: "leftToes" },
    right: { UpperLeg: "rightUpperLeg", LowerLeg: "rightLowerLeg", Foot: "rightFoot", Toes: "rightToes" },
  };
}

/**
 * The least distance between two segments (Ericson 2005, Real-Time Collision
 * Detection, 5.1.9).
 */
const apart = (
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
