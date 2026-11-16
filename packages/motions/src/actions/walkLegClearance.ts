import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  AutoMovieMotionHumanAuditTangleModel,
} from "../audit/AutoMovieMotionHumanAuditTangleModel";
import type { IHumanBody } from "../body/IHumanBody";
import { HumanColliders } from "../posture/HumanColliders";
import type { HumanLegChain } from "../posture/HumanLegChain";
import { walkLegBinding } from "./walkLegBinding";
import { walkLegCapsules } from "./walkLegCapsules";

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
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A weak body/side preparation snapshots only the four canonical leg names' neutral profile membership through HumanColliders.preparePlaced; every query still places its actual solved bones.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources At most two neutral-entry readers belong to each weak live body, without placed frames or query history; returned placed records remain fresh and release with their caller.
   */
  export function placed(
    body: IHumanBody,
    leg: ILeg,
  ): HumanColliders.IPlaced[] {
    return legPlacements(body, leg.side)(walkLegCapsules.bones(body, leg));
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
   * @evidence contracts/development/implementation.md#efficient-algorithms Sixteen segment distances; only meeting segments are placed and only their readable probes are tested. Per-pair relative and per-shape fixed frames prepare once rather than per probe; the binding derivative places only its two actual segments. Body geometry/reference preparation remains once per body.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the audit model/references, one unchanged relative frame per meeting pair and one fixed-frame depth reader per visited shape. The binding keeps its original immutable profile shape/face and requests only its actual probe and hull bones from HumanColliders on each moved-leg query.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Pair frames and nonbinding shape readers release after reading; the returned binding owns its two fixed bone-entry selections and selected shape/plane reader until released, without moved-leg or query history.
   */
  export function reading(
    body: IHumanBody,
    one: ILeg,
    other: ILeg,
  ): IReading {
    const m: AutoMovieMotionHumanAuditTangleModel.IModel =
      AutoMovieMotionHumanAuditTangleModel.model(body);
    const fits: ReadonlyMap<AutoMovieHumanoidBone, walkLegCapsules.ICapsule> = walkLegCapsules.capsules(body);
    const index: ReadonlyMap<AutoMovieHumanoidBone, number> = walkLegCapsules.indices(body);
    const legs: { leg: ILeg; axes: [AutoMovieHumanoidBone, IAutoMovieVector3, IAutoMovieVector3][] }[] = [one, other].map((leg: ILeg): { leg: ILeg; axes: [AutoMovieHumanoidBone, IAutoMovieVector3, IAutoMovieVector3][] } => {
      const k: IAutoMovieVector3 = leg.knee;
      const names: Record<string, AutoMovieHumanoidBone> = walkLegCapsules.NAMES[leg.side];
      const toes: IAutoMovieVector3 = walkLegCapsules.toes(body, leg);
      // Each segment's capsule as posed: along the thigh's or the shank's
      // line from its joint, and carried rigidly with the foot for the foot
      // and the toes.
      const lined: (bone: AutoMovieHumanoidBone, joint: IAutoMovieVector3, end: IAutoMovieVector3) => [AutoMovieHumanoidBone, IAutoMovieVector3, IAutoMovieVector3] = (
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
      const rigid: (bone: AutoMovieHumanoidBone, joint: IAutoMovieVector3) => [AutoMovieHumanoidBone, IAutoMovieVector3, IAutoMovieVector3] = (
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
    for (const [a, p0, p1] of legs[0]!.axes) {
      const apart: ReturnType<typeof walkLegCapsules.prepareApart> = walkLegCapsules.prepareApart(p0, p1);
      for (const [b, q0, q1] of legs[1]!.axes) {
        const gap: number = apart(q0, q1);
        for (const [from, x, to, y] of [
          [0, a, 1, b],
          [1, b, 0, a],
        ] as const) {
          const i: number = index.get(x)!;
          const j: number = index.get(y)!;
          const { probes, surface } = walkLegCapsules.readable(m, body, i, j);
          if (
            probes.length > 0 &&
            gap <
              (surface || !fits.get(x)!.line ? fits.get(x)!.radius : 0) +
                fits.get(y)!.radius
          )
            meeting.push([from, i, to, j]);
        }
      }
    }
    if (meeting.length === 0) return { excess: 0, at: (): number => 0 };
    // Each meeting pair read as the audit reads it (`depths`): every
    // readable probe of the first segment in each convex hull of the second,
    // its depth the least of its distances inside the hull's face planes,
    // less its reference; the deepest is kept with the probe, the hull and
    // the face that bound it.
    const indexed: (segments: readonly HumanColliders.IPlaced[]) => Map<number, HumanColliders.IPlaced> = (segments: readonly HumanColliders.IPlaced[]): Map<number, HumanColliders.IPlaced> =>
      new Map(
        segments.map(
          (segment: HumanColliders.IPlaced): [number, HumanColliders.IPlaced] => [
            index.get(segment.bone)!,
            segment,
          ],
        ),
      );
    const segmentsOf: (leg: ILeg, requested?: ReadonlySet<AutoMovieHumanoidBone>) => Map<number, HumanColliders.IPlaced> = (leg: ILeg, requested?: ReadonlySet<AutoMovieHumanoidBone>): Map<number, HumanColliders.IPlaced> =>
      indexed(legPlacements(body, leg.side)(walkLegCapsules.bones(body, leg, requested)));
    const meetingBones: readonly Set<AutoMovieHumanoidBone>[] = [new Set<AutoMovieHumanoidBone>(), new Set<AutoMovieHumanoidBone>()];
    for (const [from, i, to, j] of meeting) {
      meetingBones[from]!.add(m.parts[i]!.bone);
      meetingBones[to]!.add(m.parts[j]!.bone);
    }
    const segments: Map<number, HumanColliders.IPlaced>[] = [
      segmentsOf(one, meetingBones[0]),
      segmentsOf(other, meetingBones[1]),
    ];
    const depths: Map<HumanColliders.IPlaced["shapes"][number], ReturnType<typeof walkLegBinding.prepareInside>> = new Map();
    let worst: number = 0;
    let binding: walkLegBinding.IBinding | undefined;
    for (const [from, i, to, j] of meeting) {
      const { probes, references } = walkLegCapsules.readable(m, body, i, j);
      const a: HumanColliders.IPlaced = segments[from]!.get(i)!;
      const b: HumanColliders.IPlaced = segments[to]!.get(j)!;
      const relative: ReturnType<typeof walkLegBinding.prepareRelative> = walkLegBinding.prepareRelative(a, b);
      // A probe outside the bounding sphere of the second segment's corners
      // lies outside every hull of it.
      const sphere: AutoMovieMotionHumanAuditTangleModel.IPart = m.parts[j]!;
      for (let k: number = 0; k < probes.length; k++) {
        const local: IAutoMovieVector3 = relative(probes[k]!);
        if (Vector3.length(Vector3.subtract(local, sphere.centre)) >= sphere.radius)
          continue;
        for (let s: number = 0; s < b.shapes.length; s++) {
          const shape: HumanColliders.IPlaced["shapes"][number] = b.shapes[s]!;
          let inside: ReturnType<typeof walkLegBinding.prepareInside> | undefined = depths.get(shape);
          if (inside === undefined) {
            inside = walkLegBinding.prepareInside(shape);
            depths.set(shape, inside);
          }
          const { depth, face }: ReturnType<typeof walkLegBinding.inside> = inside(local, Math.max(0, worst + references[k]!));
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
    const bound: walkLegBinding.IBinding | undefined = binding;
    const requested: readonly ReadonlySet<AutoMovieHumanoidBone>[] = bound === undefined
      ? []
      : bound.from === 0
        ? [new Set<AutoMovieHumanoidBone>([m.parts[bound.i]!.bone]), new Set<AutoMovieHumanoidBone>([m.parts[bound.j]!.bone])]
        : [new Set<AutoMovieHumanoidBone>([m.parts[bound.j]!.bone]), new Set<AutoMovieHumanoidBone>([m.parts[bound.i]!.bone])];
    const placements: ReturnType<typeof HumanColliders.preparePlaced>[] = requested.map(
      (demand: ReadonlySet<AutoMovieHumanoidBone>): ReturnType<typeof HumanColliders.preparePlaced> => HumanColliders.preparePlaced(body, demand),
    );
    let plane: ((local: IAutoMovieVector3) => number) | undefined;
    if (bound !== undefined) {
      const shape: HumanColliders.IPlaced["shapes"][number] = segments[bound.to]!.get(bound.j)!.shapes[bound.shape]!;
      if (bound.face === undefined) {
        const inside: ReturnType<typeof walkLegBinding.prepareInside> = depths.get(shape) ?? walkLegBinding.prepareInside(shape);
        plane = (local: IAutoMovieVector3): number => inside(local, -Infinity).depth;
      } else plane = walkLegBinding.preparePlanar(shape, bound.face);
    }
    return {
      excess: worst,
      at: (first: ILeg, second: ILeg): number => {
        if (bound === undefined) return 0;
        const moved: Map<number, HumanColliders.IPlaced>[] = [
          indexed(placements[0]!(walkLegCapsules.bones(body, first, requested[0]))),
          indexed(placements[1]!(walkLegCapsules.bones(body, second, requested[1]))),
        ];
        const b: HumanColliders.IPlaced = moved[bound.to]!.get(bound.j)!;
        const local: IAutoMovieVector3 = walkLegBinding.relative(
          bound.probe,
          moved[bound.from]!.get(bound.i)!,
          b,
        );
        return plane!(local) - bound.reference;
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
    const index: ReadonlyMap<AutoMovieHumanoidBone, number> = walkLegCapsules.indices(body);
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
}

/** Reuse only fixed neutral profile membership for the immutable body's four leg names. */
function legPlacements(body: IHumanBody, side: "left" | "right"): ReturnType<typeof HumanColliders.preparePlaced> {
  let sides: Partial<Record<"left" | "right", ReturnType<typeof HumanColliders.preparePlaced>>> | undefined = PLACEMENTS.get(body);
  if (sides === undefined) {
    sides = {};
    PLACEMENTS.set(body, sides);
  }
  let read: ReturnType<typeof HumanColliders.preparePlaced> | undefined = sides[side];
  if (read === undefined) {
    read = HumanColliders.preparePlaced(body, new Set<AutoMovieHumanoidBone>(Object.values(walkLegCapsules.NAMES[side])));
    sides[side] = read;
  }
  return read;
}

/** At most two neutral-only selection readers per weak unchanged body; never current frames or poses. */
const PLACEMENTS: WeakMap<IHumanBody, Partial<Record<"left" | "right", ReturnType<typeof HumanColliders.preparePlaced>>>> = new WeakMap();
