import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanWalkLegClearance,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangleModel } from "../audit/AutoMovieMotionHumanAuditTangleModel";
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
    body: IAutoMovieMotionHumanBody,
    leg: IAutoMovieMotionHumanWalkLegClearance.ILeg,
  ): IAutoMovieMotionHumanColliders.IPlaced[] {
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
   * @evidence contracts/development/implementation.md#efficient-algorithms Sixteen segment distances; only meeting segments are placed and only their readable probes are tested. Per-pair relative and per-shape fixed frames prepare once rather than per probe. Only an actual first at call prepares its selected bone-entry readers and plane, then each binding derivative places its two actual segments; scalar-only bow and merit reads omit all derivative setup. Body geometry/reference preparation remains once per body.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the audit model/references, one unchanged relative frame per meeting pair and one fixed-frame depth reader per visited shape. The binding keeps its original immutable profile shape/face; its first actual derivative prepares the same fixed probe/hull bone membership once and shares that preparation across later moved-leg reads.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Pair frames and nonbinding shape readers release after reading. The returned binding retains only its selected immutable shape/face and optional selected depth reader before derivative demand, then owns its two fixed bone-entry selections and plane until released; no moved leg or query history is retained.
   */
  export function reading(
    body: IAutoMovieMotionHumanBody,
    one: IAutoMovieMotionHumanWalkLegClearance.ILeg,
    other: IAutoMovieMotionHumanWalkLegClearance.ILeg,
  ): IAutoMovieMotionHumanWalkLegClearance.IReading {
    return readingAt(body, one, other);
  }

  /**
   * Prepare scalar clearance against one unchanged standing leg in a bow search.
   *
   * @param body The search's unchanged body/profile/reference geometry.
   * @param other The exact standing leg held unchanged throughout this synchronous search.
   * @returns The original excess for each actual moving leg, without retaining any moving leg or scalar answer.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines fixed body/standing geometry, actual moving leg, scalar metre excess and synchronous search ownership; ordinary reading/excess remain unprepared.
   * @evidence contracts/development/implementation.md#principled-implementation readingAt retains every original capsule distance, ordered meeting pair, readable probe, shape/face/reference and strict worst update. Fixed standing axes/placements and immutable profile-local shape transforms are shared; each actual relative bone frame and probe depth remains current.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One private operation record binds the standing side; the same readingAt numerical owner serves ordinary and prepared scalar calls, with standing geometry prepared lazily in its original first-observation order.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Accepts the actual fixed leg, never caller-derived capsules/placements or a clearance verdict. Every changed moving leg performs all original dependent tests; no pair, probe, reference, bound or candidate is skipped or rounded.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed standing axes prepare once, and each meeting standing bone's original placement prepares at most once across candidates. Each visited immutable profile shape also prepares its inverse/hull reader once in this operation. Moving geometry and all original scalar tests remain; unused derivative setup stays lazy.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The bow fixes a private standing leg and body/profile/reference data. Standing world geometry and profile-local shape transforms stay unchanged even when moving bone frames change, so only those prerequisites are shared; every actual relative frame, probe and worst result is computed anew.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One synchronous reader retains four standing axes, at most four indexed standing placements and one metadata reader per actually visited leg-profile shape until bow return/throw. No moving pose, scalar result, query time/history, global context or external handle is retained.
   */
  export function prepareAgainst(body: IAutoMovieMotionHumanBody, other: IAutoMovieMotionHumanWalkLegClearance.ILeg): (one: IAutoMovieMotionHumanWalkLegClearance.ILeg) => number {
    const against: IAgainst = {
      placed: new Set<AutoMovieHumanoidBone>(), segments: new Map<number, IAutoMovieMotionHumanColliders.IPlaced>(),
      depths: new Map<IAutoMovieMotionHumanColliders.IPlaced["shapes"][number], ReturnType<typeof walkLegBinding.prepareInside>>(),
    };
    return (one: IAutoMovieMotionHumanWalkLegClearance.ILeg): number => readingAt(body, one, other, against).excess;
  }

  /** Preserve one ordered clearance calculation, optionally borrowing only fixed standing geometry. */
  function readingAt(body: IAutoMovieMotionHumanBody, one: IAutoMovieMotionHumanWalkLegClearance.ILeg, other: IAutoMovieMotionHumanWalkLegClearance.ILeg, against?: IAgainst): IAutoMovieMotionHumanWalkLegClearance.IReading {
    const m: AutoMovieMotionHumanAuditTangleModel.IModel =
      AutoMovieMotionHumanAuditTangleModel.model(body);
    const fits: ReadonlyMap<AutoMovieHumanoidBone, walkLegCapsules.ICapsule> = walkLegCapsules.capsules(body);
    const index: ReadonlyMap<AutoMovieHumanoidBone, number> = walkLegCapsules.indices(body);
    const legs: { leg: IAutoMovieMotionHumanWalkLegClearance.ILeg; axes: [AutoMovieHumanoidBone, IAutoMovieVector3, IAutoMovieVector3][] }[] = [one, other].map((leg: IAutoMovieMotionHumanWalkLegClearance.ILeg, which: number): { leg: IAutoMovieMotionHumanWalkLegClearance.ILeg; axes: [AutoMovieHumanoidBone, IAutoMovieVector3, IAutoMovieVector3][] } => {
      if (which === 1 && against?.axes !== undefined) return { leg, axes: against.axes };
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
      const axes: [AutoMovieHumanoidBone, IAutoMovieVector3, IAutoMovieVector3][] = [
        lined(names.UpperLeg!, leg.hip, k),
        lined(names.LowerLeg!, k, leg.ankle),
        rigid(names.Foot!, leg.ankle),
        rigid(names.Toes!, toes),
      ];
      if (which === 1 && against !== undefined) against.axes = axes;
      return { leg, axes };
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
    const indexed: (segments: readonly IAutoMovieMotionHumanColliders.IPlaced[]) => Map<number, IAutoMovieMotionHumanColliders.IPlaced> = (segments: readonly IAutoMovieMotionHumanColliders.IPlaced[]): Map<number, IAutoMovieMotionHumanColliders.IPlaced> =>
      new Map(
        segments.map(
          (segment: IAutoMovieMotionHumanColliders.IPlaced): [number, IAutoMovieMotionHumanColliders.IPlaced] => [
            index.get(segment.bone)!,
            segment,
          ],
        ),
      );
    const segmentsOf: (leg: IAutoMovieMotionHumanWalkLegClearance.ILeg, requested?: ReadonlySet<AutoMovieHumanoidBone>) => Map<number, IAutoMovieMotionHumanColliders.IPlaced> = (leg: IAutoMovieMotionHumanWalkLegClearance.ILeg, requested?: ReadonlySet<AutoMovieHumanoidBone>): Map<number, IAutoMovieMotionHumanColliders.IPlaced> =>
      indexed(legPlacements(body, leg.side)(walkLegCapsules.bones(body, leg, requested)));
    const meetingBones: readonly Set<AutoMovieHumanoidBone>[] = [new Set<AutoMovieHumanoidBone>(), new Set<AutoMovieHumanoidBone>()];
    for (const [from, i, to, j] of meeting) {
      meetingBones[from]!.add(m.parts[i]!.bone);
      meetingBones[to]!.add(m.parts[j]!.bone);
    }
    const first: Map<number, IAutoMovieMotionHumanColliders.IPlaced> = segmentsOf(one, meetingBones[0]);
    let second: Map<number, IAutoMovieMotionHumanColliders.IPlaced>;
    if (against === undefined) second = segmentsOf(other, meetingBones[1]);
    else {
      const missing: Set<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>();
      for (const bone of meetingBones[1]!) if (!against.placed.has(bone)) missing.add(bone);
      if (missing.size > 0) {
        for (const [i, segment] of segmentsOf(other, missing)) against.segments.set(i, segment);
        for (const bone of missing) against.placed.add(bone);
      }
      second = against.segments;
    }
    const segments: Map<number, IAutoMovieMotionHumanColliders.IPlaced>[] = [first, second];
    const depths: Map<IAutoMovieMotionHumanColliders.IPlaced["shapes"][number], ReturnType<typeof walkLegBinding.prepareInside>> = against?.depths ?? new Map();
    let worst: number = 0;
    let binding: walkLegBinding.IBinding | undefined;
    for (const [from, i, to, j] of meeting) {
      const { probes, references } = walkLegCapsules.readable(m, body, i, j);
      const a: IAutoMovieMotionHumanColliders.IPlaced = segments[from]!.get(i)!;
      const b: IAutoMovieMotionHumanColliders.IPlaced = segments[to]!.get(j)!;
      const relative: ReturnType<typeof walkLegBinding.prepareRelative> = walkLegBinding.prepareRelative(a, b);
      // A probe outside the bounding sphere of the second segment's corners
      // lies outside every hull of it.
      const sphere: AutoMovieMotionHumanAuditTangleModel.IPart = m.parts[j]!;
      for (let k: number = 0; k < probes.length; k++) {
        const local: IAutoMovieVector3 = relative(probes[k]!);
        if (Vector3.length(Vector3.subtract(local, sphere.centre)) >= sphere.radius)
          continue;
        for (let s: number = 0; s < b.shapes.length; s++) {
          const shape: IAutoMovieMotionHumanColliders.IPlaced["shapes"][number] = b.shapes[s]!;
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
    if (bound === undefined) return { excess: worst, at: (): number => 0 };
    const shape: IAutoMovieMotionHumanColliders.IPlaced["shapes"][number] = segments[bound.to]!.get(bound.j)!.shapes[bound.shape]!;
    const selectedDepth: ReturnType<typeof walkLegBinding.prepareInside> | undefined = bound.face === undefined ? depths.get(shape) : undefined;
    let derivative: IAutoMovieMotionHumanWalkLegClearance.IReading["at"] | undefined;
    return {
      excess: worst,
      at: (first: IAutoMovieMotionHumanWalkLegClearance.ILeg, second: IAutoMovieMotionHumanWalkLegClearance.ILeg): number => {
        if (derivative === undefined) {
          const requested: readonly ReadonlySet<AutoMovieHumanoidBone>[] = bound.from === 0
            ? [new Set<AutoMovieHumanoidBone>([m.parts[bound.i]!.bone]), new Set<AutoMovieHumanoidBone>([m.parts[bound.j]!.bone])]
            : [new Set<AutoMovieHumanoidBone>([m.parts[bound.j]!.bone]), new Set<AutoMovieHumanoidBone>([m.parts[bound.i]!.bone])];
          const placements: ReturnType<typeof HumanColliders.preparePlaced>[] = requested.map(
            (demand: ReadonlySet<AutoMovieHumanoidBone>): ReturnType<typeof HumanColliders.preparePlaced> => HumanColliders.preparePlaced(body, demand),
          );
          const inside: ReturnType<typeof walkLegBinding.prepareInside> | undefined = bound.face === undefined
            ? selectedDepth ?? walkLegBinding.prepareInside(shape) : undefined;
          const plane: (local: IAutoMovieVector3) => number = bound.face === undefined
            ? (local: IAutoMovieVector3): number => inside!(local, -Infinity).depth
            : walkLegBinding.preparePlanar(shape, bound.face);
          derivative = (a: IAutoMovieMotionHumanWalkLegClearance.ILeg, b: IAutoMovieMotionHumanWalkLegClearance.ILeg): number => {
            const moved: Map<number, IAutoMovieMotionHumanColliders.IPlaced>[] = [
              indexed(placements[0]!(walkLegCapsules.bones(body, a, requested[0]))),
              indexed(placements[1]!(walkLegCapsules.bones(body, b, requested[1]))),
            ];
            const hull: IAutoMovieMotionHumanColliders.IPlaced = moved[bound.to]!.get(bound.j)!;
            const local: IAutoMovieVector3 = walkLegBinding.relative(bound.probe, moved[bound.from]!.get(bound.i)!, hull);
            return plane(local) - bound.reference;
          };
        }
        return derivative(first, second);
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
  export function excess(body: IAutoMovieMotionHumanBody, one: IAutoMovieMotionHumanWalkLegClearance.ILeg, other: IAutoMovieMotionHumanWalkLegClearance.ILeg): number {
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
  export function moved(body: IAutoMovieMotionHumanBody, one: IAutoMovieMotionHumanWalkLegClearance.ILeg, other: IAutoMovieMotionHumanWalkLegClearance.ILeg): number {
    const m: AutoMovieMotionHumanAuditTangleModel.IModel =
      AutoMovieMotionHumanAuditTangleModel.model(body);
    const index: ReadonlyMap<AutoMovieHumanoidBone, number> = walkLegCapsules.indices(body);
    const a: IAutoMovieMotionHumanColliders.IPlaced[] = placed(body, one);
    const b: IAutoMovieMotionHumanColliders.IPlaced[] = placed(body, other);
    let out: number = 0;
    a.forEach((segment: IAutoMovieMotionHumanColliders.IPlaced, s: number): void => {
      const twin: IAutoMovieMotionHumanColliders.IPlaced = b[s]!;
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

/** Fixed standing geometry owned only by one synchronous bow candidate search. */
interface IAgainst {
  /** Four original world capsule axes; built only on the first actual read. */
  axes?: [AutoMovieHumanoidBone, IAutoMovieVector3, IAutoMovieVector3][];
  /** Canonical names whose actual fixed profile placement has been observed. */
  placed: Set<AutoMovieHumanoidBone>;
  /** Original last-indexed profile entries for observed standing bones. */
  segments: Map<number, IAutoMovieMotionHumanColliders.IPlaced>;
  /** Fixed profile-local shape metadata only, independent of current segment poses. */
  depths: Map<IAutoMovieMotionHumanColliders.IPlaced["shapes"][number], ReturnType<typeof walkLegBinding.prepareInside>>;
}

/** Reuse only fixed neutral profile membership for the immutable body's four leg names. */
function legPlacements(body: IAutoMovieMotionHumanBody, side: "left" | "right"): ReturnType<typeof HumanColliders.preparePlaced> {
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
const PLACEMENTS: WeakMap<IAutoMovieMotionHumanBody, Partial<Record<"left" | "right", ReturnType<typeof HumanColliders.preparePlaced>>>> = new WeakMap();
