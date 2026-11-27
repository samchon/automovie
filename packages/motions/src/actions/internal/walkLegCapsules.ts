import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAuditTangleModel,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanWalkLegClearance,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangleModel } from "../../audit/internal/AutoMovieMotionHumanAuditTangleModel";
import { HumanColliders } from "../../posture/internal/HumanColliders";

/*
 * The legs' geometry the clearance reads (`walkLegClearance`): one body's
 * leg-collider preparation (each segment's bounding capsule at rest, the tangle
 * model's indices and readable probes, the toes' rest offsets and the collider
 * placement readers), a leg's bones as posed, and the least distance between
 * two segments.
 */
export namespace walkLegCapsules {
  /*
   * One body's leg-collider geometry, prepared by the owner of a clearance
   * search (`prepare`).
   */
  export interface IPrepared {
    /*
     * The body the geometry belongs to.
     */
    body: IAutoMovieMotionHumanBody;

    /*
     * The tangle audit's model of the body
     * (`IAutoMovieMotionHumanBody.tangle`).
     */
    model: IAutoMovieMotionHumanAuditTangleModel.IModel;

    /*
     * Each leg segment's bounding capsule at rest (`ICapsule`).
     */
    capsules: ReadonlyMap<AutoMovieHumanoidBone, ICapsule>;

    /*
     * Each segment's index among the audit model's parts.
     */
    indices: ReadonlyMap<AutoMovieHumanoidBone, number>;

    /*
     * The probes of segment `i` the audit reads in segment `j` (`IReadable`),
     * read once per ordered pair.
     */
    readable: (i: number, j: number) => IReadable;

    /*
     * Each side's toes joint less its foot joint at rest, metres.
     */
    toes: Record<AutoMovieHumanSide, IAutoMovieVector3>;

    /*
     * A side's collider placement reader for its four leg bones
     * (`HumanColliders.preparePlaced`), prepared when a reading first places
     * that side.
     */
    placements: (
      side: AutoMovieHumanSide,
    ) => ReturnType<typeof HumanColliders.preparePlaced>;
  }

  /*
   * Prepare one body's leg-collider geometry for a clearance search.
   * Parameter body: The body, whose rest joints and profile stay fixed while the
   * preparation is used.
   * Returns: The capsules, indices, readable-pair reader, toes offsets and
   * placement-reader source.
   */
  export function prepare(body: IAutoMovieMotionHumanBody): IPrepared {
    const model: IAutoMovieMotionHumanAuditTangleModel.IModel = body.tangle;
    const pairs: Map<number, IReadable> = new Map<number, IReadable>();
    const offset: (side: AutoMovieHumanSide) => IAutoMovieVector3 = (
      side: AutoMovieHumanSide,
    ): IAutoMovieVector3 =>
      AutoMovieEngineVector3.subtract(
        body.rest.get(`${side}Toes`)!,
        body.rest.get(`${side}Foot`)!,
      );
    const placed: Record<
      AutoMovieHumanSide,
      ReturnType<typeof HumanColliders.preparePlaced>
    > = {
      left: HumanColliders.preparePlaced(
        body,
        new Set<AutoMovieHumanoidBone>(Object.values(NAMES.left)),
      ),
      right: HumanColliders.preparePlaced(
        body,
        new Set<AutoMovieHumanoidBone>(Object.values(NAMES.right)),
      ),
    };
    return {
      body,
      model,
      capsules: capsules(body, model),
      indices: new Map(
        model.parts.map(
          (
            part: IAutoMovieMotionHumanAuditTangleModel.IPart,
            i: number,
          ): [AutoMovieHumanoidBone, number] => [part.bone, i],
        ),
      ),
      readable: (i: number, j: number): IReadable => {
        const key: number = i * model.parts.length + j;
        let out: IReadable | undefined = pairs.get(key);
        if (out === undefined) {
          out = readable(model, i, j);
          pairs.set(key, out);
        }
        return out;
      },
      toes: { left: offset("left"), right: offset("right") },
      placements: (
        side: AutoMovieHumanSide,
      ): ReturnType<typeof HumanColliders.preparePlaced> =>
        placed[side],
    };
  }

  /*
   * The leg's requested posed bones, world frame; omitted demand reads all
   * four.
   * Parameter prepared: The body's leg-collider preparation, for the foot-to-toes
   * rest offset.
   * Parameter leg: The posed hip, knee, ankle and segment rotations.
   * Parameter requested: Optional canonical bone demand: a reading requests only
   * the segments that may meet the other leg.
   * Returns: Fresh resolved-bone records in thigh/shank/foot/toes order,
   * restricted only by explicit demand.
   */
  export function bones(
    prepared: IPrepared,
    leg: IAutoMovieMotionHumanWalkLegClearance.ILeg,
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
      out.set(...resolved(names.Toes!, toes(prepared, leg), leg.rotation));
    return out;
  }

  /*
   * Place the flat toes joint from the posed ankle and foot rotation.
   * Parameter prepared: The body's leg-collider preparation, for the rest offset.
   * Parameter leg: The posed foot and ankle, world frame.
   * Returns: A fresh world-metre toes origin, the toes flat with the foot.
   */
  export function toes(
    prepared: IPrepared,
    leg: IAutoMovieMotionHumanWalkLegClearance.ILeg,
  ): IAutoMovieVector3 {
    return AutoMovieEngineVector3.add(
      leg.ankle,
      AutoMovieEngineQuaternion.rotateVector(leg.rotation, prepared.toes[leg.side]),
    );
  }

  /*
   * A segment's bounding capsule (`prepare`).
   */
  export interface ICapsule {
    /*
     * Whether its axis lies on its bone's line, a thigh's or a shank's, which
     * carries it as the leg bends; otherwise it is carried rigidly with the
     * foot.
     */
    line: boolean;

    /*
     * On a bone's line, where its axis begins, metres along the line from the
     * joint toward the child joint.
     */
    lo: number;

    /*
     * On a bone's line, where its axis ends.
     */
    hi: number;

    /*
     * Carried with the foot, one end of its axis, metres from the bone's joint
     * in the rest frame.
     */
    from: IAutoMovieVector3;

    /*
     * Carried with the foot, the other end.
     */
    to: IAutoMovieVector3;

    /*
     * Its radius, metres.
     */
    radius: number;
  }

  /*
   * The probes of one segment the audit reads in another
   * (`IPrepared.readable`).
   */
  export interface IReadable {
    /*
     * The probes, in the first segment's frame.
     */
    probes: IAutoMovieVector3[];

    /*
     * Their reference depths, metres.
     */
    references: number[];

    /*
     * Whether any is a corner of the first segment's shapes rather than a point
     * of its bone's axis.
     */
    surface: boolean;
  }

  /*
   * The identity frame a shape's distance is read in.
   */
  export const IDENTITY: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };

  /*
   * Each side's leg bones by their name without the side.
   */
  export const NAMES: Readonly<
    Record<AutoMovieHumanSide, Record<string, AutoMovieHumanoidBone>>
  > = {
    left: {
      UpperLeg: "leftUpperLeg",
      LowerLeg: "leftLowerLeg",
      Foot: "leftFoot",
      Toes: "leftToes",
    },
    right: {
      UpperLeg: "rightUpperLeg",
      LowerLeg: "rightLowerLeg",
      Foot: "rightFoot",
      Toes: "rightToes",
    },
  };

  /*
   * Prepare one capsule axis for its segment-distance tests (Ericson 2005,
   * Real-Time Collision Detection, 5.1.9).
   * Parameter from: The axis's first endpoint, world metres.
   * Parameter to: The axis's second endpoint, world metres.
   * Returns: The least distance, metres, from this axis to another segment
   * given by its endpoints.
   */
  export function prepareApart(
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
  ): (otherFrom: IAutoMovieVector3, otherTo: IAutoMovieVector3) => number {
    const direction: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(to, from);
    const squared: number = AutoMovieEngineVector3.dot(direction, direction);
    return (otherFrom: IAutoMovieVector3, otherTo: IAutoMovieVector3): number =>
      apartFrom(from, direction, squared, otherFrom, otherTo);
  }

  /*
   * Each leg segment's bounding capsule at rest: a thigh's or a shank's about
   * its bone's line, as far along it as any of its probes (corners and points
   * of the bone's axis) projects, so the leg carries it however the knee bends;
   * a foot's or the toes' about the principal direction of its probes through
   * their mean (the principal-axis bounding capsule, Eberly 2008, Fitting 3D
   * Data with a Cylinder), carried rigidly with the foot. Each radius is the
   * farthest any probe lies from its axis, so the capsule bounds the probes
   * whichever axis the power iteration settles on. The canonical rig rests
   * unrotated, so a bone's frame at rest is its joint.
   */
  function capsules(
    body: IAutoMovieMotionHumanBody,
    m: IAutoMovieMotionHumanAuditTangleModel.IModel,
  ): Map<AutoMovieHumanoidBone, ICapsule> {
    const out: Map<AutoMovieHumanoidBone, ICapsule> = new Map();
    m.parts.forEach(
      (part: IAutoMovieMotionHumanAuditTangleModel.IPart, i: number): void => {
        const matched: RegExpExecArray | null = LEG.exec(part.bone);
        if (matched === null) return;
        const joint: IAutoMovieVector3 = body.rest.get(part.bone)!;
        const pose: IAutoMovieRigidTransform = m.rest[i]!.pose;
        const points: IAutoMovieVector3[] = part.probes.map(
          (probe: IAutoMovieVector3): IAutoMovieVector3 =>
            AutoMovieEngineVector3.subtract(
              AutoMovieEngineVector3.add(
                pose.position,
                AutoMovieEngineQuaternion.rotateVector(pose.rotation, probe),
              ),
              joint,
            ),
        );
        const child: string | undefined = CHILD[matched[2]!];
        let origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
        let axis: IAutoMovieVector3;
        if (child !== undefined)
          axis = AutoMovieEngineVector3.normalize(
            AutoMovieEngineVector3.subtract(
              body.rest.get(`${matched[1]}${child}` as AutoMovieHumanoidBone)!,
              joint,
            ),
          );
        else {
          for (const p of points)
            origin = AutoMovieEngineVector3.add(origin, AutoMovieEngineVector3.scale(p, 1 / points.length));

          // The principal direction by power iteration on the scatter.
          const centred: IAutoMovieVector3[] = points.map(
            (p: IAutoMovieVector3): IAutoMovieVector3 =>
              AutoMovieEngineVector3.subtract(p, origin),
          );
          const scatter: (v: IAutoMovieVector3) => IAutoMovieVector3 = (
            v: IAutoMovieVector3,
          ): IAutoMovieVector3 => {
            let x: number = 0;
            let y: number = 0;
            let z: number = 0;
            for (const d of centred) {
              const weight: number = AutoMovieEngineVector3.dot(d, v);
              x += d.x * weight;
              y += d.y * weight;
              z += d.z * weight;
            }
            return { x, y, z };
          };
          axis = SEED;
          for (let k: number = 0; k < POWER_STEPS; k++) {
            const next: IAutoMovieVector3 = scatter(axis);
            if (AutoMovieEngineVector3.length(next) < DEGENERATE) break;
            axis = AutoMovieEngineVector3.normalize(next);
          }
        }
        let lo: number = Infinity;
        let hi: number = -Infinity;
        let radius: number = 0;
        for (const p of points) {
          const d: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(p, origin);
          const s: number = AutoMovieEngineVector3.dot(d, axis);
          lo = Math.min(lo, s);
          hi = Math.max(hi, s);
          radius = Math.max(
            radius,
            AutoMovieEngineVector3.length(AutoMovieEngineVector3.subtract(d, AutoMovieEngineVector3.scale(axis, s))),
          );
        }
        out.set(part.bone, {
          line: child !== undefined,
          lo,
          hi,
          from: AutoMovieEngineVector3.add(origin, AutoMovieEngineVector3.scale(axis, lo)),
          to: AutoMovieEngineVector3.add(origin, AutoMovieEngineVector3.scale(axis, hi)),
          radius,
        });
      },
    );
    return out;
  }

  /*
   * The probes of segment `i` the audit reads in segment `j`: those with a
   * bounded reference depth, and their reference depths.
   */
  function readable(
    m: IAutoMovieMotionHumanAuditTangleModel.IModel,
    i: number,
    j: number,
  ): IReadable {
    const reference: Float64Array =
      AutoMovieMotionHumanAuditTangleModel.reference(m, i, j);
    const out: IReadable = { probes: [], references: [], surface: false };
    m.parts[i]!.probes.forEach((probe: IAutoMovieVector3, k: number): void => {
      const depth: number = reference[k]!;
      if (depth === Infinity) return;
      out.probes.push(probe);
      out.references.push(depth);
      if (k < m.parts[i]!.surface) out.surface = true;
    });
    return out;
  }

  /*
   * Ericson's pair-dependent closest-points rule with the first axis supplied.
   */
  function apartFrom(
    p1: IAutoMovieVector3,
    d1: IAutoMovieVector3,
    a: number,
    p2: IAutoMovieVector3,
    q2: IAutoMovieVector3,
  ): number {
    const d2: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(q2, p2);
    const r: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(p1, p2);
    const e: number = AutoMovieEngineVector3.dot(d2, d2);
    const f: number = AutoMovieEngineVector3.dot(d2, r);
    const clamp: (v: number) => number = (v: number): number =>
      Math.min(1, Math.max(0, v));
    let s: number;
    let t: number;
    if (a <= DEGENERATE && e <= DEGENERATE) {
      s = 0;
      t = 0;
    } else if (a <= DEGENERATE) {
      s = 0;
      t = clamp(f / e);
    } else {
      const c: number = AutoMovieEngineVector3.dot(d1, r);
      if (e <= DEGENERATE) {
        t = 0;
        s = clamp(-c / a);
      } else {
        const b: number = AutoMovieEngineVector3.dot(d1, d2);
        const denom: number = a * e - b * b;
        s = denom > DEGENERATE ? clamp((b * f - c * e) / denom) : 0;
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
    return AutoMovieEngineVector3.length(
      AutoMovieEngineVector3.subtract(
        AutoMovieEngineVector3.add(p1, AutoMovieEngineVector3.scale(d1, s)),
        AutoMovieEngineVector3.add(p2, AutoMovieEngineVector3.scale(d2, t)),
      ),
    );
  }

  /*
   * A leg's bones.
   */
  const LEG: RegExp = /^(left|right)(UpperLeg|LowerLeg|Foot|Toes)$/u;

  /*
   * The child joint whose line a thigh's or a shank's capsule lies on.
   */
  const CHILD: Readonly<Record<string, string>> = {
    UpperLeg: "LowerLeg",
    LowerLeg: "Foot",
  };

  /*
   * The power iteration's start: a unit vector off every coordinate axis and
   * plane, so no principal direction of a foot's probes is orthogonal to it by
   * the rig's own alignment (0.6² + 0.48² + 0.64² = 1).
   */
  const SEED: IAutoMovieVector3 = { x: 0.6, y: 0.48, z: 0.64 };

  /*
   * Power-iteration steps for a foot's principal axis: a cap, not a tolerance,
   * since the capsule's radius is measured about whichever axis it ends on and
   * so bounds the probes either way; fifty steps shrink the off-axis share by
   * the eigenvalue ratio to the fiftieth power.
   */
  const POWER_STEPS: number = 50;

  /*
   * A squared length or a length below which a segment or a scatter is
   * degenerate, square metres or metres: 1e-12, the square of a micrometre, so
   * only endpoints that coincide within a micrometre take the degenerate branch
   * (the EPSILON of Ericson 2005, 5.1.9).
   */
  const DEGENERATE: number = 1e-12;
}
