import {
  Quaternion,
  Vector3,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanJacobian,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFitBalanceBase } from "./HumanFitBalanceBase";
import { HumanFoot } from "./HumanFoot";
import { HumanJacobian } from "./HumanJacobian";

/**
 * A posed body's static balance as rows of a whole-body fit
 * (`HumanBodyFit`): its centre of mass over the floor kept inside the
 * outline of the feet where they bear (`HumanFoot.base`), the base of
 * support (Winter, Biomechanics and Motor Control of Human Movement, ch. 4).
 *
 * The base is the convex hull of the bearing points on the floor, and each
 * of the half-planes whose intersection it is makes a row: the centre's
 * signed distance inside that half-plane, at or above nought. A hull of
 * three or more corners is the half-planes of its edges; two corners bound a
 * segment, the two sides of its line and a cap at each end; one corner is a
 * point, four half-planes along the floor's axes that meet only there. So the
 * centre is held over the base however few points bear, never over a line
 * past the segment's ends or nowhere at all. The centre of mass is the
 * engine's mass model's (`resolveAutoMovieCenterOfMass`) and its Jacobian
 * the mass-weighted sum of its segments' centres' point columns
 * (`HumanJacobian.velocity`). Where the bearing points' bones are given, the
 * base's corners ride them: a row's slope is the exact derivative of its
 * half-plane's signed distance, the centre's motion less the motion of the
 * line through the corners, and a trial is measured through its own
 * corners, so a fit's model moves the base as its merit's reading of the
 * next posture does (Nocedal and Wright 2006, section 18.5: an l1 merit and
 * the model it is predicted by must price the same function).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the balance kept, its base with its source, the rows and the centre's Jacobian.
 * @evidence contracts/development/design.md#principled-representation The base of support as a convex polygon's half-planes, the linear form a quadratic program bounds a point by.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One reading and its rows' slopes, read by the whole-body fit.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The base is the feet's own bearing outline and the mass model the engine's.
 */
export namespace HumanFitBalance {
  /**
   * A posed body's balance.
   *
   * @evidence contracts/development/design.md#principled-representation Stores the actual segmental centre and the support region as half-planes in world metres, each an anchor, a unit inward normal and the centre's signed distance.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The merit reads inside and com; actual half-plane rows reuse anchors and normals, all produced from this same immutable reading.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the physical mass model and supplied/default bearing points without substituting a bone or changing a contact tolerance.
   * @evidence contracts/development/common.md#meaningful-documentation Defines world units, half-plane ordering, signed distances and borrowed centre ownership.
   */
  export interface IReading {
    /** The centre of mass, world metres; may share the same reading's positional goal value and is not mutated by balance consumers. */
    com: IAutoMovieVector3;

    /** A point on the floor each half-plane of the base of support passes through: a hull's corners in order round it, a segment's first end thrice and its second, or a point four times. */
    anchors: { x: number; z: number }[];

    /** Each half-plane's unit inward direction, in the anchors' order. */
    normals: { x: number; z: number }[];

    /** Each half-plane's signed distance of the centre inside it, metres, in the anchors' order. */
    inside: number[];

    /** The base's corners as points riding the bones they bear through, in hull order, where the bearing points' bones were given (`of`'s `owners`); absent, the base is read as fixed in the world. */
    riders?: IRider[];

    /** Each half-plane's corners among `riders`, in the anchors' order, present with `riders`. */
    through?: IThrough[];
  }

  /**
   * A corner of the base: a bearing point riding its bone, which moves with
   * the posture as the centre does.
   *
   * @evidence contracts/development/design.md#principled-representation The bone, the point in the bone's frame and its world place at the reading, the data a point's Jacobian column and its place at another posture are read from.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Made by `of` from the bearing points' bones; read by `slopes` and `at`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The point is the bearing candidate's own, never a bone origin standing in for it.
   * @evidence contracts/development/common.md#meaningful-documentation States each member's frame and unit.
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
   * The balance of a posed body.
   *
   * @param body The body.
   * @param bones Its resolved bones.
   * @param points The points that bear, world metres, whose convex hull on the floor is the base; the feet's bearing outline (`HumanFoot.base`) when absent.
   * @param com Optional already computed centre for this unchanged body and bones, borrowed without mutation; computed here when absent.
   * @param owners The bone each of `points` rides, in their order: the base's corners then move with the posture (`IReading.riders`); absent, the base is read as fixed in the world.
   * @returns The reading.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Reads the segmental mass centre and the half-planes of the actual bearing points' convex hull (`HumanFitBalanceBase.of`: a polygon's edges, a segment's sides and end caps, or a point's four axis half-planes), then measures each; with the points' bones, each corner is kept as the point riding its bone in that bone's frame.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One optional current centre and one hull feed the ordered edge distances; their mass and geometry owners remain separate.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No half-plane is dropped or zeroed for a degenerate base, so a point or segment support still holds the centre; a supplied centre must be the actual value for the same unchanged body and bones.
   * @evidence contracts/development/implementation.md#efficient-algorithms For P bearing points and H hull edges, hull construction takes O(P log P) and mean/normal/distance preparation O(H), plus delegated mass-model construction and placement when no centre is supplied.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Accepts the same-reading positional mass centre and computes the unchanged corner mean once; each resulting inward normal serves its distance, slope and fixed-model callbacks.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh outline, inward-direction, distance and corner arrays, borrowing the supplied/computed centre and the bearing points as the corners' world places without mutation; no reading, points or derivative columns are cached globally.
   * @evidence contracts/development/common.md#meaningful-documentation States bearing defaults, same-reading centre premise, hull method, units, costs and ownership.
   */
  export function of(
    body: IAutoMovieMotionHumanBody,
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    points: readonly IAutoMovieVector3[] = HumanFoot.base(body, bones),
    com: IAutoMovieVector3 = centre(body, bones),
    owners?: readonly AutoMovieHumanoidBone[],
  ): IReading {
    // Each corner of the hull keeps the index of the bearing point it
    // projects, so it is known as the point that rides its bone.
    const planes: ReturnType<typeof HumanFitBalanceBase.of> = HumanFitBalanceBase.of(points);
    const corners: HumanFitBalanceBase.ICorner[] = planes.corners;
    return {
      com,
      anchors: planes.anchors,
      normals: planes.normals,
      inside: planes.anchors.map((_: { x: number; z: number }, k: number): number =>
        distance(planes.anchors, k, com, planes.normals[k]!),
      ),
      ...(owners === undefined
        ? {}
        : {
            riders: corners.map((c: HumanFitBalanceBase.ICorner): IRider => {
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
            }),
            through: planes.through,
          }),
    };
  }

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
   *
   * @evidence contracts/development/implementation.md#principled-implementation The function `slopes` differentiates, evaluated: the half-plane through its corners where they are now, each side's inward orientation kept from the reading, so a second-order correction measures what the linear row models.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One placement of the corners the half-plane names and one dot product.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No corner is left where the reading had it while its bone moves.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(1): two corner placements.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the reading's riders and orientations; places only the half-plane's own corners.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one scalar and retains nothing.
   * @evidence contracts/development/common.md#meaningful-documentation States the three kinds, the fixed fallback, units and sign.
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
    const placed: (r: IRider) => IAutoMovieVector3 = (r: IRider): IAutoMovieVector3 => {
      const b: IAutoMovieResolvedBone = bones.get(r.bone)!;
      return Vector3.add(b.worldPosition, Quaternion.rotateVector(b.worldRotation, r.local));
    };
    const p: IAutoMovieVector3 = placed(reading.riders[through.p]!);
    const n: { x: number; z: number } = reading.normals[k]!;
    if (through.kind === "point") return n.x * (com.x - p.x) + n.z * (com.z - p.z);
    const q: IAutoMovieVector3 = placed(reading.riders[through.q]!);
    const length: number = Math.hypot(q.x - p.x, q.z - p.z);
    const t: { x: number; z: number } = { x: (q.x - p.x) / length, z: (q.z - p.z) / length };
    if (through.kind === "cap") return t.x * (com.x - p.x) + t.z * (com.z - p.z);

    // A side keeps the reading's inward orientation of its line.
    const was: { x: number; z: number } = side(reading, through);
    const sign: number = n.x * -was.z + n.z * was.x >= 0 ? 1 : -1;
    return sign * (-t.z * (com.x - p.x) + t.x * (com.z - p.z));
  }

  /**
   * A point's signed distance inside one half-plane of a reading's base.
   *
   * @param anchors The reading's half-plane anchors (`IReading.anchors`).
   * @param k The half-plane.
   * @param point The point, world metres; its height is not read.
   * @param normal The half-plane's unit inward direction (`IReading.normals[k]`).
   * @returns Metres, positive inside.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Projects point-minus-anchor onto the half-plane's unit inward direction, the signed distance from its boundary line.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One planar dot product; the reading owns every half-plane's construction.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Takes the reading's own normal, so a degenerate base's caps and sides are measured as constructed, never re-derived.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(1) time and storage.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The reading and its fixed-model row callbacks share each half-plane's prepared normal.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one scalar and retains no anchor or point.
   * @evidence contracts/development/common.md#meaningful-documentation States the half-plane convention, world units, signed result and height exclusion.
   */
  export function distance(
    anchors: readonly { x: number; z: number }[],
    k: number,
    point: IAutoMovieVector3,
    normal: { x: number; z: number },
  ): number {
    const a: { x: number; z: number } = anchors[k]!;
    return normal.x * (point.x - a.x) + normal.z * (point.z - a.z);
  }

  /**
   * Each edge's row slope: how fast each variable moves the centre inside
   * that edge, metres per the variable's unit.
   *
   * @param body The body.
   * @param bones The resolved bones the motions were read on.
   * @param motions The variables' motions.
   * @param reading The balance read on those bones.
   * @param columns Optional current centre velocities for these same body, bones and ordered motions; computed here when absent.
   * @returns One slope row per edge, one entry per variable.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The exact first derivative of each half-plane's signed distance (`at`): the centre's velocity columns on the inward normal, less the motion of the line itself. A side through corners P and Q moves at P's and Q's velocities blended at the share s along PQ where the centre projects, d' = n.(c' - (1 - s) P' - s Q'); a cap at P across PQ turns with the segment, d' = t.(c' - P') + (n.(c - P)) n.(Q' - P') / |PQ|; a point's axis moves with its corner, d' = n.(c' - P'). Without riders the base is fixed and only the centre moves.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One optional equivalent centre Jacobian and one velocity column per corner feed all ordered half-plane rows; the same velocity owner serves positional centre goals.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps every variable and half-plane; supplied columns must match this unchanged body, bones and ordered motion list. No corner's motion is dropped, so the model moves the base as the merit's own reading of the next posture does.
   * @evidence contracts/development/implementation.md#efficient-algorithms For n variables, H half-planes and C corners, O((H + C)*n) time and result storage, plus velocities' cost only when columns are absent.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the reading's unchanged prepared normals, the completed current centre columns supplied by the same model's goal rows, and each corner's columns once for every half-plane through it.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Borrows columns without mutation and returns fresh scalar rows; corner columns live for this call; no current pose or Jacobian survives in module state.
   * @evidence contracts/development/common.md#meaningful-documentation States frame, units, variable/edge ordering, the moving base, current-input premise, optional computation and output ownership.
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
        motions.map((m: IAutoMovieMotionHumanJacobian.IMotion): IAutoMovieVector3 =>
          HumanJacobian.velocity(m, r.bone, r.world)),
    );
    const c: IAutoMovieVector3 = reading.com;
    return reading.anchors.map(
      (_: { x: number; z: number }, k: number): number[] => {
        const n: { x: number; z: number } = reading.normals[k]!;
        const through: IThrough | undefined = reading.through?.[k];
        if (corners === undefined || through === undefined)
          return columns.map(
            (v: IAutoMovieVector3): number => n.x * v.x + n.z * v.z,
          );
        const p: IAutoMovieVector3 = riders![through.p]!.world;
        const vp: IAutoMovieVector3[] = corners[through.p]!;
        if (through.kind === "point")
          return columns.map((v: IAutoMovieVector3, j: number): number =>
            n.x * (v.x - vp[j]!.x) + n.z * (v.z - vp[j]!.z));
        const q: IAutoMovieVector3 = riders![through.q]!.world;
        const vq: IAutoMovieVector3[] = corners[through.q]!;
        const length: number = Math.hypot(q.x - p.x, q.z - p.z);
        const t: { x: number; z: number } = { x: (q.x - p.x) / length, z: (q.z - p.z) / length };
        if (through.kind === "cap") {
          // The cap turns with the segment: the centre's offset across it
          // times the segment's own turn.
          const across: number = -t.z * (c.x - p.x) + t.x * (c.z - p.z);
          return columns.map((v: IAutoMovieVector3, j: number): number =>
            t.x * (v.x - vp[j]!.x) + t.z * (v.z - vp[j]!.z) +
            (across * (-t.z * (vq[j]!.x - vp[j]!.x) + t.x * (vq[j]!.z - vp[j]!.z))) / length);
        }

        // A side moves at its corners' velocities blended where the
        // centre projects on it.
        const s: number = (t.x * (c.x - p.x) + t.z * (c.z - p.z)) / length;
        return columns.map((v: IAutoMovieVector3, j: number): number =>
          n.x * (v.x - (1 - s) * vp[j]!.x - s * vq[j]!.x) +
          n.z * (v.z - (1 - s) * vp[j]!.z - s * vq[j]!.z));
      },
    );
  }

  /**
   * The body's segmental centre in world metres.
   *
   * @param body The body and its physical profile.
   * @param bones The resolved bones.
   * @returns World metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the physical inputs, frame and unit.
   * @evidence contracts/development/implementation.md#principled-implementation The engine's segmental mass-weighted centre, shared with the support reading.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call on the existing mass model.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No bone stands in for the mass centre.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in mass segments, with no forward kinematics.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the existing weak per-body mass model, which assumes the body's skeleton and physical profile stay unchanged; actual placement always reads the supplied current bones.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The existing WeakMap holds one numeric mass model per live body identity and permits collection with that body; placement returns a current centre and retains no posed bones.
   */
  export function centre(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): IAutoMovieVector3 {
    return resolveAutoMovieCenterOfMass.place(model(body), bones);
  }

  /**
   * The mass centre's velocity under each posture variable.
   *
   * @param body The body and its mass model.
   * @param bones The bones on which the motions were derived.
   * @param motions The geometric Jacobian's variable motions.
   * @returns World metres per variable unit, in motion order.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the units and variable ordering.
   * @evidence contracts/development/implementation.md#principled-implementation Differentiating the segmental centre gives the mass-weighted sum of each segment centre's rigid-point velocity, divided by total mass.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One segment sum per variable.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The same segment masses and local centres as the actual centre reading.
   * @evidence contracts/development/implementation.md#efficient-algorithms Performs n*S velocity queries for n variables and S segments, but each segment world point and bone lookup is produced once; scalar sums avoid per-segment scale/add result vectors, with O(S+n) call-local storage and no perturbed poses or new FK.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares current segment world points and missing-bone decisions across variables, initialized lazily in the first variable's unchanged segment order; goal and balance rows may share these completed columns only for identical body/bones/motions.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources World-point scratch lives only for this call and returns independent derivative vectors; the existing separate weak mass-model cache retains no current points, motions or pose.
   */
  export function velocities(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    motions: readonly IAutoMovieMotionHumanJacobian.IMotion[],
  ): IAutoMovieVector3[] {
    const m: IAutoMovieResolveCenterOfMass.IModel = model(body);
    if (motions.length === 0) return [];

    // Laziness preserves the first variable's original prepare/velocity
    // order; later variables reuse only this unchanged reading's points.
    const points: (IAutoMovieVector3 | null | undefined)[] = new Array(
      m.segments.length,
    );
    return motions.map((motion: IAutoMovieMotionHumanJacobian.IMotion): IAutoMovieVector3 => {
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
        const velocity: IAutoMovieVector3 = HumanJacobian.velocity(motion, s.bone, at);
        x = x + velocity.x * s.mass;
        y = y + velocity.y * s.mass;
        z = z + velocity.z * s.mass;
      }
      const inverseMass: number = 1 / m.mass;
      return { x: x * inverseMass, y: y * inverseMass, z: z * inverseMass };
    });
  }

  /** A side's unit direction from its first corner to its second at the reading. */
  function side(reading: IReading, through: IThrough): { x: number; z: number } {
    const p: IAutoMovieVector3 = reading.riders![through.p]!.world;
    const q: IAutoMovieVector3 = reading.riders![through.q]!.world;
    const length: number = Math.hypot(q.x - p.x, q.z - p.z);
    return { x: (q.x - p.x) / length, z: (q.z - p.z) / length };
  }

  /** The mass models made, by body. */
  const MODELS: WeakMap<IAutoMovieMotionHumanBody, IAutoMovieResolveCenterOfMass.IModel> =
    new WeakMap();

  /** A body's mass model, made once. */
  function model(body: IAutoMovieMotionHumanBody): IAutoMovieResolveCenterOfMass.IModel {
    let out: IAutoMovieResolveCenterOfMass.IModel | undefined = MODELS.get(body);
    if (out === undefined) {
      out = resolveAutoMovieCenterOfMass(body.skeleton, body.profile);
      MODELS.set(body, out);
    }
    return out;
  }
}
