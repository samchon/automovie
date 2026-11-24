import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAuditTangleModel,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanWalkLegClearance,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangleModel } from "../audit/AutoMovieMotionHumanAuditTangleModel";
import { walkLegBinding } from "./walkLegBinding";
import { walkLegCapsules } from "./walkLegCapsules";

/**
 * How far two legs of one body pass into each other, read as the tangle audit
 * reads them: each leg posed as the posture shows it (its hip, knee and ankle
 * and its thigh's and shank's rotations, `HumanLegChain`, and its foot's
 * rotation), and the deepest probe of either leg's thigh, shank, foot or toes
 * in a segment of the other beyond the probe's own reference depth there
 * (`AutoMovieMotionHumanAuditTangleModel.excess`). A planner that keeps it
 * within the audit's give (`AutoMovieMotionHumanAuditTangleModel.BUILT`) keeps
 * two legs that cross, as a sideways recovery's do, clear of each other where
 * the audit would find them run through each other.
 */
export namespace walkLegClearance {
  /**
   * How far two legs may pass into each other beyond their reference depths,
   * metres: the skin's give, the tangle audit's own limit
   * (`AutoMovieMotionHumanAuditTangleModel.BUILT`).
   */
  export const BOUND: number = AutoMovieMotionHumanAuditTangleModel.BUILT;

  /**
   * Prepare one body's leg-collider geometry for a search that reads its legs'
   * clearance many times (`walkLegCapsules.prepare`).
   *
   * @param body The body, whose rest joints and profile stay fixed while the
   *   preparation is used.
   * @returns The preparation `excess` reads.
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
  ): walkLegCapsules.IPrepared {
    return walkLegCapsules.prepare(body);
  }

  /**
   * How far two legs pass into each other beyond what the body's reference
   * postures already share: the deepest probe of a segment of either in a
   * segment of the other less its reference depth there, as the tangle audit
   * reads every pair.
   *
   * @param prepared The body's leg-collider preparation (`prepare`).
   * @param one One leg.
   * @param other The other leg.
   * @returns Metres; zero where no probe lies deeper than its reference.
   */
  export function excess(
    prepared: walkLegCapsules.IPrepared,
    one: IAutoMovieMotionHumanWalkLegClearance.ILeg,
    other: IAutoMovieMotionHumanWalkLegClearance.ILeg,
  ): number {
    const m: IAutoMovieMotionHumanAuditTangleModel.IModel = prepared.model;
    const fits: ReadonlyMap<AutoMovieHumanoidBone, walkLegCapsules.ICapsule> =
      prepared.capsules;
    const index: ReadonlyMap<AutoMovieHumanoidBone, number> = prepared.indices;

    // Each segment's capsule as posed: along the thigh's or the shank's line
    // from its joint, and carried rigidly with the foot for the foot and the
    // toes.
    const axes: (
      leg: IAutoMovieMotionHumanWalkLegClearance.ILeg,
    ) => [AutoMovieHumanoidBone, IAutoMovieVector3, IAutoMovieVector3][] = (
      leg: IAutoMovieMotionHumanWalkLegClearance.ILeg,
    ): [AutoMovieHumanoidBone, IAutoMovieVector3, IAutoMovieVector3][] => {
      const names: Record<string, AutoMovieHumanoidBone> =
        walkLegCapsules.NAMES[leg.side];
      const lined: (
        bone: AutoMovieHumanoidBone,
        joint: IAutoMovieVector3,
        end: IAutoMovieVector3,
      ) => [AutoMovieHumanoidBone, IAutoMovieVector3, IAutoMovieVector3] = (
        bone: AutoMovieHumanoidBone,
        joint: IAutoMovieVector3,
        end: IAutoMovieVector3,
      ): [AutoMovieHumanoidBone, IAutoMovieVector3, IAutoMovieVector3] => {
        const fit: walkLegCapsules.ICapsule = fits.get(bone)!;
        const along: IAutoMovieVector3 = Vector3.normalize(
          Vector3.subtract(end, joint),
        );
        return [
          bone,
          Vector3.add(joint, Vector3.scale(along, fit.lo)),
          Vector3.add(joint, Vector3.scale(along, fit.hi)),
        ];
      };
      const rigid: (
        bone: AutoMovieHumanoidBone,
        joint: IAutoMovieVector3,
      ) => [AutoMovieHumanoidBone, IAutoMovieVector3, IAutoMovieVector3] = (
        bone: AutoMovieHumanoidBone,
        joint: IAutoMovieVector3,
      ): [AutoMovieHumanoidBone, IAutoMovieVector3, IAutoMovieVector3] => {
        const fit: walkLegCapsules.ICapsule = fits.get(bone)!;
        return [
          bone,
          Vector3.add(joint, Quaternion.rotateVector(leg.rotation, fit.from)),
          Vector3.add(joint, Quaternion.rotateVector(leg.rotation, fit.to)),
        ];
      };
      return [
        lined(names.UpperLeg!, leg.hip, leg.knee),
        lined(names.LowerLeg!, leg.knee, leg.ankle),
        rigid(names.Foot!, leg.ankle),
        rigid(names.Toes!, walkLegCapsules.toes(prepared, leg)),
      ];
    };

    // A probe whose reference depth is unbounded, a corner of two colliders
    // that share one volume by their build, is set aside by the audit
    // (`AutoMovieMotionHumanAuditTangleModel.reference`): only the others are
    // read. A segment's collider and its probes lie inside its capsule, the
    // points of a thigh's or a shank's bone axis on its capsule's axis, so
    // the probes of one segment the audit reads can lie in another's collider
    // only where the first's capsule, or its axis where only points of a
    // thigh's or a shank's bone axis are read, comes within the second's
    // capsule's radius of its axis.
    const meeting: [
      number,
      number,
      number,
      number,
      walkLegCapsules.IReadable,
    ][] = [];
    const first: [
      AutoMovieHumanoidBone,
      IAutoMovieVector3,
      IAutoMovieVector3,
    ][] = axes(one);
    const second: [
      AutoMovieHumanoidBone,
      IAutoMovieVector3,
      IAutoMovieVector3,
    ][] = axes(other);
    for (const [a, p0, p1] of first) {
      const apart: ReturnType<typeof walkLegCapsules.prepareApart> =
        walkLegCapsules.prepareApart(p0, p1);
      for (const [b, q0, q1] of second) {
        const gap: number = apart(q0, q1);
        for (const [from, x, to, y] of [
          [0, a, 1, b],
          [1, b, 0, a],
        ] as const) {
          const i: number = index.get(x)!;
          const j: number = index.get(y)!;
          const pair: walkLegCapsules.IReadable = prepared.readable(i, j);
          if (
            pair.probes.length > 0 &&
            gap <
              (pair.surface || !fits.get(x)!.line ? fits.get(x)!.radius : 0) +
                fits.get(y)!.radius
          )
            meeting.push([from, i, to, j, pair]);
        }
      }
    }
    if (meeting.length === 0) return 0;

    // Each meeting pair read as the audit reads it: every readable probe of
    // the first segment in each convex hull of the second, its depth the
    // least of its distances inside the hull's face planes, less its
    // reference; the deepest is kept.
    const legs: readonly IAutoMovieMotionHumanWalkLegClearance.ILeg[] = [
      one,
      other,
    ];
    const requested: readonly Set<AutoMovieHumanoidBone>[] = [
      new Set<AutoMovieHumanoidBone>(),
      new Set<AutoMovieHumanoidBone>(),
    ];
    for (const [from, i, to, j] of meeting) {
      requested[from]!.add(m.parts[i]!.bone);
      requested[to]!.add(m.parts[j]!.bone);
    }
    const segments: Map<number, IAutoMovieMotionHumanColliders.IPlaced>[] =
      legs.map(
        (
          leg: IAutoMovieMotionHumanWalkLegClearance.ILeg,
          which: number,
        ): Map<number, IAutoMovieMotionHumanColliders.IPlaced> =>
          new Map(
            prepared
              .placements(leg.side)(
                walkLegCapsules.bones(prepared, leg, requested[which]),
              )
              .map(
                (
                  segment: IAutoMovieMotionHumanColliders.IPlaced,
                ): [number, IAutoMovieMotionHumanColliders.IPlaced] => [
                  index.get(segment.bone)!,
                  segment,
                ],
              ),
          ),
      );
    const depths: Map<
      IAutoMovieMotionHumanColliders.IPlaced["shapes"][number],
      ReturnType<typeof walkLegBinding.prepareInside>
    > = new Map();
    let worst: number = 0;
    for (const [from, i, to, j, pair] of meeting) {
      const a: IAutoMovieMotionHumanColliders.IPlaced = segments[from]!.get(i)!;
      const b: IAutoMovieMotionHumanColliders.IPlaced = segments[to]!.get(j)!;
      const relative: ReturnType<typeof walkLegBinding.prepareRelative> =
        walkLegBinding.prepareRelative(a, b);

      // A probe outside the bounding sphere of the second segment's corners
      // lies outside every hull of it.
      const sphere: IAutoMovieMotionHumanAuditTangleModel.IPart = m.parts[j]!;
      for (let k: number = 0; k < pair.probes.length; k++) {
        const local: IAutoMovieVector3 = relative(pair.probes[k]!);
        if (
          Vector3.length(Vector3.subtract(local, sphere.centre)) >=
          sphere.radius
        )
          continue;
        for (const shape of b.shapes) {
          let inside:
            | ReturnType<typeof walkLegBinding.prepareInside>
            | undefined = depths.get(shape);
          if (inside === undefined) {
            inside = walkLegBinding.prepareInside(shape);
            depths.set(shape, inside);
          }
          const depth: number = inside(
            local,
            Math.max(0, worst + pair.references[k]!),
          );
          if (depth > 0 && depth - pair.references[k]! > worst)
            worst = depth - pair.references[k]!;
        }
      }
    }
    return worst;
  }
}
