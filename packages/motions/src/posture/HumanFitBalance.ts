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
 * (`HumanJacobian.velocity`).
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
  }

  /**
   * The balance of a posed body.
   *
   * @param body The body.
   * @param bones Its resolved bones.
   * @param points The points that bear, world metres, whose convex hull on the floor is the base; the feet's bearing outline (`HumanFoot.base`) when absent.
   * @param com Optional already computed centre for this unchanged body and bones, borrowed without mutation; computed here when absent.
   * @returns The reading.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Reads the segmental mass centre and constructs Andrew's monotone-chain convex hull of the actual bearing points, then measures each half-plane that bounds it: a polygon's edges, a segment's sides and end caps, or a point's four axis half-planes.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One optional current centre and one hull feed the ordered edge distances; their mass and geometry owners remain separate.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No half-plane is dropped or zeroed for a degenerate base, so a point or segment support still holds the centre; a supplied centre must be the actual value for the same unchanged body and bones.
   * @evidence contracts/development/implementation.md#efficient-algorithms For P bearing points and H hull edges, hull construction takes O(P log P) and mean/normal/distance preparation O(H), plus delegated mass-model construction and placement when no centre is supplied.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Accepts the same-reading positional mass centre and computes the unchanged corner mean once; each resulting inward normal serves its distance, slope and fixed-model callbacks.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh outline, inward-direction and distance arrays and borrows the supplied/computed centre without mutation; no reading, points or derivative columns are cached globally.
   * @evidence contracts/development/common.md#meaningful-documentation States bearing defaults, same-reading centre premise, hull method, units, costs and ownership.
   */
  export function of(
    body: IAutoMovieMotionHumanBody,
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    points: readonly IAutoMovieVector3[] = HumanFoot.base(body, bones),
    com: IAutoMovieVector3 = centre(body, bones),
  ): IReading {
    const planes: { anchors: { x: number; z: number }[]; normals: { x: number; z: number }[] } =
      halfPlanes(
        hull(
          points.map((p: IAutoMovieVector3): { x: number; z: number } => ({
            x: p.x,
            z: p.z,
          })),
        ),
      );
    return {
      com,
      anchors: planes.anchors,
      normals: planes.normals,
      inside: planes.anchors.map((_: { x: number; z: number }, k: number): number =>
        distance(planes.anchors, k, com, planes.normals[k]!),
      ),
    };
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
   * @evidence contracts/development/implementation.md#principled-implementation Projects the actual segmental-centre velocity columns onto each current outline edge's inward normal, preserving the fixed-outline linearisation used by this model.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One optional equivalent centre Jacobian feeds all ordered edge rows; the same velocity owner serves positional centre goals.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps every variable, edge and original dot-product expression; supplied columns must match this unchanged body, bones and ordered motion list.
   * @evidence contracts/development/implementation.md#efficient-algorithms For n variables and H edges, projection costs O(H*n) time and result storage, plus velocities' cost only when columns are absent.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the reading's unchanged prepared normals and completed current centre columns supplied by the same model's goal rows; absent columns it computes the original velocities here.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Borrows columns without mutation and returns fresh scalar rows; no current pose or Jacobian survives in module state.
   * @evidence contracts/development/common.md#meaningful-documentation States frame, units, variable/edge ordering, current-input premise, optional computation and output ownership.
   */
  export function slopes(
    body: IAutoMovieMotionHumanBody,
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    motions: readonly IAutoMovieMotionHumanJacobian.IMotion[],
    reading: IReading,
    columns: readonly IAutoMovieVector3[] = velocities(body, bones, motions),
  ): number[][] {
    return reading.anchors.map(
      (_: { x: number; z: number }, k: number): number[] => {
        const n: { x: number; z: number } = reading.normals[k]!;
        return columns.map(
          (v: IAutoMovieVector3): number => n.x * v.x + n.z * v.z,
        );
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

  /**
   * The half-planes whose intersection is a convex hull of floor points: a
   * polygon's edges, each with its inward normal; a segment's two sides,
   * whose intersection is its line, and an inward cap at each end; a point's
   * four axis half-planes, which meet only at it. No hull has none but an
   * empty one, which bears nothing.
   */
  function halfPlanes(corners: readonly { x: number; z: number }[]): {
    anchors: { x: number; z: number }[];
    normals: { x: number; z: number }[];
  } {
    if (corners.length === 0) return { anchors: [], normals: [] };
    const a: { x: number; z: number } = corners[0]!;
    const b: { x: number; z: number } = corners[corners.length - 1]!;
    const span: number = Math.hypot(b.x - a.x, b.z - a.z);
    if (corners.length === 1 || (corners.length === 2 && span === 0))
      return {
        anchors: [a, a, a, a],
        normals: [{ x: 1, z: 0 }, { x: -1, z: 0 }, { x: 0, z: 1 }, { x: 0, z: -1 }],
      };
    if (corners.length === 2) {
      const d: { x: number; z: number } = { x: (b.x - a.x) / span, z: (b.z - a.z) / span };
      return {
        anchors: [a, a, a, b],
        normals: [{ x: -d.z, z: d.x }, { x: d.z, z: -d.x }, d, { x: -d.x, z: -d.z }],
      };
    }
    const middle: { x: number; z: number } = mean(corners);
    return {
      anchors: [...corners],
      normals: corners.map((_: { x: number; z: number }, k: number): { x: number; z: number } =>
        inward(corners, k, middle)),
    };
  }

  /** The unit inward normal of a convex polygon's edge from corner `k` to the next; the monotone chain leaves no edge of zero length. */
  function inward(
    outline: readonly { x: number; z: number }[],
    k: number,
    middle: { x: number; z: number },
  ): { x: number; z: number } {
    const a: { x: number; z: number } = outline[k]!;
    const b: { x: number; z: number } = outline[(k + 1) % outline.length]!;
    const dx: number = b.x - a.x;
    const dz: number = b.z - a.z;
    const length: number = Math.hypot(dx, dz);
    const n: { x: number; z: number } = { x: -dz / length, z: dx / length };

    // The normal that points toward the outline's centroid, which a convex
    // outline holds inside, whichever way the corners run.
    return n.x * (middle.x - a.x) + n.z * (middle.z - a.z) >= 0 ? n : { x: -n.x, z: -n.z };
  }

  /** The same ordered arithmetic mean of corners previously read independently for every edge. */
  function mean(outline: readonly { x: number; z: number }[]): { x: number; z: number } {
    let x: number = 0;
    let z: number = 0;
    for (const p of outline) {
      x += p.x / outline.length;
      z += p.z / outline.length;
    }
    return { x, z };
  }

  /** Andrew's monotone chain on the caller's owned planar projection, sorted in place and traversed in both directions without a reversed copy. */
  function hull(
    points: { x: number; z: number }[],
  ): { x: number; z: number }[] {
    const sorted: { x: number; z: number }[] = points.sort(
      (a: { x: number; z: number }, b: { x: number; z: number }): number =>
        a.x - b.x || a.z - b.z,
    );
    if (sorted.length < 3) return sorted;
    const turn: (
      o: { x: number; z: number },
      a: { x: number; z: number },
      b: { x: number; z: number },
    ) => number = (
      o: { x: number; z: number },
      a: { x: number; z: number },
      b: { x: number; z: number },
    ): number => (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
    const chain: (
      first: number,
      end: number,
      stride: 1 | -1,
    ) => { x: number; z: number }[] = (
      first: number,
      end: number,
      stride: 1 | -1,
    ): { x: number; z: number }[] => {
      const out: { x: number; z: number }[] = [];
      for (let i: number = first; i !== end; i += stride) {
        const p: { x: number; z: number } = sorted[i]!;
        while (
          out.length >= 2 &&
          turn(out[out.length - 2]!, out[out.length - 1]!, p) <= 0
        )
          out.pop();
        out.push(p);
      }
      out.pop();
      return out;
    };
    const lower: { x: number; z: number }[] = chain(0, sorted.length, 1);
    const upper: { x: number; z: number }[] = chain(sorted.length - 1, -1, -1);
    for (const p of upper) lower.push(p);
    return lower;
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
