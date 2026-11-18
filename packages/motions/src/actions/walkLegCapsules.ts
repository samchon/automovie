import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanWalkLegClearance,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangleModel } from "../audit/AutoMovieMotionHumanAuditTangleModel";
import { HumanColliders } from "../posture/HumanColliders";

/**
 * The legs' geometry the clearance reads (`walkLegClearance`): one body's
 * leg-collider preparation (each segment's bounding capsule at rest, the
 * tangle model's indices and readable probes, the toes' rest offsets and the
 * collider placement readers), a leg's bones as posed, and the least
 * distance between two segments.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read, who prepares it and who reads it.
 * @evidence contracts/development/design.md#principled-representation The per-body geometry prepared once by the owner of a clearance search and passed down, apart from the reading over it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The preparation, the bones, the capsule and readable records, the side names, the identity frame and the prepared segment distance, read by `walkLegClearance`, `walkLegBinding` and `staggerAdmission`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every capsule is the body's own probes'.
 */
export namespace walkLegCapsules {
  /** One body's leg-collider geometry, prepared by the owner of a clearance search (`prepare`). */
  export interface IPrepared {
    /** The body the geometry belongs to. */
    body: IAutoMovieMotionHumanBody;

    /** The tangle audit's model of the body (`AutoMovieMotionHumanAuditTangleModel.model`). */
    model: AutoMovieMotionHumanAuditTangleModel.IModel;

    /** Each leg segment's bounding capsule at rest (`ICapsule`). */
    capsules: ReadonlyMap<AutoMovieHumanoidBone, ICapsule>;

    /** Each segment's index among the audit model's parts. */
    indices: ReadonlyMap<AutoMovieHumanoidBone, number>;

    /** The probes of segment `i` the audit reads in segment `j` (`IReadable`), read once per ordered pair. */
    readable: (i: number, j: number) => IReadable;

    /** Each side's toes joint less its foot joint at rest, metres. */
    toes: Record<"left" | "right", IAutoMovieVector3>;

    /** A side's collider placement reader for its four leg bones (`HumanColliders.preparePlaced`), prepared when a reading first places that side. */
    placements: (
      side: "left" | "right",
    ) => ReturnType<typeof HumanColliders.preparePlaced>;
  }

  /**
   * Prepare one body's leg-collider geometry for a clearance search.
   *
   * @param body The body, whose rest joints and profile stay fixed while the preparation is used.
   * @returns The capsules, indices, readable-pair reader, toes offsets and placement-reader source.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the fixed-body premise and every prepared member.
   * @evidence contracts/development/implementation.md#principled-implementation Builds each leg segment's capsule from its audit probes (`capsules`), the part indices, the toes-minus-foot rest offsets and HumanColliders' placement reader for each side's four leg bones.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record owns everything a clearance reads per body, so each search owner builds it once and passes it down instead of every reading looking it up.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No capsule, probe, reference or placement is approximated; a body without a leg bone yields no capsule for it.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the leg segments' probes for the capsules; a side's placement reader and each readable pair are built only when a reading first asks for them, each once.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the body's capsules, indices, toes offsets, placement readers and each ordered pair's readable probes across every reading of one search; a different body needs another preparation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the record and releases it with its search; it holds at most two placement readers and one readable record per ordered pair of the body's parts, and no pose or reading.
   */
  export function prepare(body: IAutoMovieMotionHumanBody): IPrepared {
    const model: AutoMovieMotionHumanAuditTangleModel.IModel =
      AutoMovieMotionHumanAuditTangleModel.model(body);
    const pairs: Map<number, IReadable> = new Map<number, IReadable>();
    const offset: (side: "left" | "right") => IAutoMovieVector3 = (
      side: "left" | "right",
    ): IAutoMovieVector3 =>
      Vector3.subtract(
        body.rest.get(`${side}Toes`)!,
        body.rest.get(`${side}Foot`)!,
      );
    const placed: Partial<
      Record<"left" | "right", ReturnType<typeof HumanColliders.preparePlaced>>
    > = {};
    return {
      body,
      model,
      capsules: capsules(body, model),
      indices: new Map(
        model.parts.map(
          (
            part: AutoMovieMotionHumanAuditTangleModel.IPart,
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
        side: "left" | "right",
      ): ReturnType<typeof HumanColliders.preparePlaced> =>
        (placed[side] ??= HumanColliders.preparePlaced(
          body,
          new Set<AutoMovieHumanoidBone>(Object.values(NAMES[side])),
        )),
    };
  }

  /**
   * The leg's requested posed bones, world frame; omitted demand reads all four.
   *
   * @param prepared The body's leg-collider preparation, for the foot-to-toes rest offset.
   * @param leg The posed hip, knee, ankle and segment rotations.
   * @param requested Optional canonical bone demand: a reading requests only the segments that may meet the other leg.
   * @returns Fresh resolved-bone records in thigh/shank/foot/toes order, restricted only by explicit demand.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States world frames, the posed leg, optional canonical demand, full default and output order.
   * @evidence contracts/development/implementation.md#principled-implementation Builds the four rigid leg frames from the posed joints and rotations; the toes sit at the foot-rotated rest offset from the ankle, flat with the foot, and demand omits only frames the collision reading does not read.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One resolved-record constructor serves the thigh, shank, foot and toes records.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No pose fitting, contact, rotation or rest offset changes; absent demand returns all four records and absent names are not fabricated.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work for four possible bones; the toes' rotated offset is computed only when the toes are requested.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the prepared rest offset and the caller's posed leg; no posed record is reused across legs.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each call returns a fresh bounded map and retains nothing.
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

  /**
   * Place the flat toes joint from the posed ankle and foot rotation.
   *
   * @param prepared The body's leg-collider preparation, for the rest offset.
   * @param leg The posed foot and ankle, world frame.
   * @returns A fresh world-metre toes origin, the toes flat with the foot.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the prepared rest offset, the posed ankle and rotation, the world-metre output and the flat-toes convention.
   * @evidence contracts/development/implementation.md#principled-implementation Rotates the toes-minus-foot rest offset by the foot's quaternion and adds it to the ankle, the canonical rig resting unrotated.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One rigid-point expression serves both the collider bones and the capsule axes.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No toes articulation, world pose or rotation convention is altered; every foot is transformed.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work on a prepared offset.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the offset the preparation holds; no posed output is shared.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one fresh point and retains nothing.
   */
  export function toes(
    prepared: IPrepared,
    leg: IAutoMovieMotionHumanWalkLegClearance.ILeg,
  ): IAutoMovieVector3 {
    return Vector3.add(
      leg.ankle,
      Quaternion.rotateVector(leg.rotation, prepared.toes[leg.side]),
    );
  }

  /** A segment's bounding capsule (`prepare`). */
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

  /** The probes of one segment the audit reads in another (`IPrepared.readable`). */
  export interface IReadable {
    /** The probes, in the first segment's frame. */
    probes: IAutoMovieVector3[];

    /** Their reference depths, metres. */
    references: number[];

    /** Whether any is a corner of the first segment's shapes rather than a point of its bone's axis. */
    surface: boolean;
  }

  /** The identity frame a shape's distance is read in. */
  export const IDENTITY: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };

  /** Each side's leg bones by their name without the side. */
  export const NAMES: Readonly<
    Record<"left" | "right", Record<string, AutoMovieHumanoidBone>>
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

  /**
   * Prepare one capsule axis for its segment-distance tests (Ericson 2005,
   * Real-Time Collision Detection, 5.1.9).
   *
   * @param from The axis's first endpoint, world metres.
   * @param to The axis's second endpoint, world metres.
   * @returns The least distance, metres, from this axis to another segment given by its endpoints.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the fixed and varying world-metre endpoints and the metre gap.
   * @evidence contracts/development/implementation.md#principled-implementation Ericson's closest points of two segments, with the first segment's direction and squared length computed once.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure First-axis preparation precedes one second-axis reader; the pair-dependent cases live in one private function.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Degenerate segments and parallel axes take Ericson's own branches, with endpoint clamps; every pair computes its gap.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant preparation shares the first direction and squared length across the four segments of the other leg; each pair is constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One reading's broad phase holds the same axis endpoints throughout its nested loop; moved endpoints need a new reader.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each reader holds its origin, direction and squared length until its loop completes; no gap or pose is retained.
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

  /**
   * Each leg segment's bounding capsule at rest: a thigh's or a shank's about
   * its bone's line, as far along it as any of its probes (corners and points
   * of the bone's axis) projects, so the leg carries it however the knee
   * bends; a foot's or the toes' about the principal direction of its probes
   * through their mean (the principal-axis bounding capsule, Eberly 2008,
   * Fitting 3D Data with a Cylinder), carried rigidly with the foot. Each
   * radius is the farthest any probe lies from its axis, so the capsule
   * bounds the probes whichever axis the power iteration settles on. The
   * canonical rig rests unrotated, so a bone's frame at rest is its joint.
   */
  function capsules(
    body: IAutoMovieMotionHumanBody,
    m: AutoMovieMotionHumanAuditTangleModel.IModel,
  ): Map<AutoMovieHumanoidBone, ICapsule> {
    const out: Map<AutoMovieHumanoidBone, ICapsule> = new Map();
    m.parts.forEach(
      (part: AutoMovieMotionHumanAuditTangleModel.IPart, i: number): void => {
        const matched: RegExpExecArray | null = LEG.exec(part.bone);
        if (matched === null) return;
        const joint: IAutoMovieVector3 = body.rest.get(part.bone)!;
        const pose: IAutoMovieRigidTransform = m.rest[i]!.pose;
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
          const centred: IAutoMovieVector3[] = points.map(
            (p: IAutoMovieVector3): IAutoMovieVector3 =>
              Vector3.subtract(p, origin),
          );
          const scatter: (v: IAutoMovieVector3) => IAutoMovieVector3 = (
            v: IAutoMovieVector3,
          ): IAutoMovieVector3 => {
            let x: number = 0;
            let y: number = 0;
            let z: number = 0;
            for (const d of centred) {
              const weight: number = Vector3.dot(d, v);
              x += d.x * weight;
              y += d.y * weight;
              z += d.z * weight;
            }
            return { x, y, z };
          };
          axis = SEED;
          for (let k: number = 0; k < POWER_STEPS; k++) {
            const next: IAutoMovieVector3 = scatter(axis);
            if (Vector3.length(next) < DEGENERATE) break;
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
    return out;
  }

  /** The probes of segment `i` the audit reads in segment `j`: those with a bounded reference depth, and their reference depths. */
  function readable(
    m: AutoMovieMotionHumanAuditTangleModel.IModel,
    i: number,
    j: number,
  ): IReadable {
    const reference: Float64Array =
      AutoMovieMotionHumanAuditTangleModel.reference(m, i, j);
    const out: IReadable = { probes: [], references: [], surface: false };
    m.parts[i]!.probes.forEach((probe: IAutoMovieVector3, k: number): void => {
      if (!Number.isFinite(reference[k]!)) return;
      out.probes.push(probe);
      out.references.push(reference[k]!);
      if (k < m.parts[i]!.surface) out.surface = true;
    });
    return out;
  }

  /** Ericson's pair-dependent closest-points rule with the first axis supplied. */
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
      const c: number = Vector3.dot(d1, r);
      if (e <= DEGENERATE) {
        t = 0;
        s = clamp(-c / a);
      } else {
        const b: number = Vector3.dot(d1, d2);
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
    return Vector3.length(
      Vector3.subtract(
        Vector3.add(p1, Vector3.scale(d1, s)),
        Vector3.add(p2, Vector3.scale(d2, t)),
      ),
    );
  }

  /** A leg's bones. */
  const LEG: RegExp = /^(left|right)(UpperLeg|LowerLeg|Foot|Toes)$/u;

  /** The child joint whose line a thigh's or a shank's capsule lies on. */
  const CHILD: Readonly<Record<string, string>> = {
    UpperLeg: "LowerLeg",
    LowerLeg: "Foot",
  };

  /** The power iteration's start: a unit vector off every coordinate axis and plane, so no principal direction of a foot's probes is orthogonal to it by the rig's own alignment (0.6² + 0.48² + 0.64² = 1). */
  const SEED: IAutoMovieVector3 = { x: 0.6, y: 0.48, z: 0.64 };

  /** Power-iteration steps for a foot's principal axis: a cap, not a tolerance, since the capsule's radius is measured about whichever axis it ends on and so bounds the probes either way; fifty steps shrink the off-axis share by the eigenvalue ratio to the fiftieth power. */
  const POWER_STEPS: number = 50;

  /** A squared length or a length below which a segment or a scatter is degenerate, square metres or metres: 1e-12, the square of a micrometre, so only endpoints that coincide within a micrometre take the degenerate branch (the EPSILON of Ericson 2005, 5.1.9). */
  const DEGENERATE: number = 1e-12;
}
