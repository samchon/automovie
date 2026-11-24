import {
  Quaternion,
  Vector3,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmShapes as S } from "./HumanArmShapes";
import type { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";

/**
 * Collision pairs against moving arm colliders: the two solved arms against
 * each other, and the body's and external segments' corners inside an arm.
 * HumanArmTrajectoryPairs exposes these readings alongside the forward pairs.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two directed readings, their shared geometry and their consumer.
 * @evidence contracts/development/implementation.md#principled-implementation Keeps the existing signed-distance readings, broad-phase bounds and contact allowances; external parts have distinct frame indices beyond the own-body relation table, so no own-body joint exclusion applies to them.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop for two moving arms and one for fixed corners against a placed arm's colliders, each keeping the deepest probe of every part and shape.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The exact shape query decides depth; bounding spheres only spare queries that cannot change the result, and declared rests use the context's allowance.
 * @evidence contracts/development/implementation.md#efficient-algorithms Screens each arm segment by its sphere before its probes, and each body part's run of corners by its sphere before its corners, a two-level bounding-volume hierarchy; branch and bound keeps one deepest reading per part and shape.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses HumanArmShapes.colliders and the context's memoized reference depths and contact allowances; a frame's corner clusters and shape owners, fixed with its corner and collider lists, are built once per list.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh pair maps; the corner clusters and shape owners are kept in weak maps keyed by the frame's own lists, released with them.
 */
export namespace HumanArmTrajectoryOverlap {
  /** An arm's deepest probe in a collider shape of the other arm, read the same way. */
  export interface ICrossing {
    /** The arm whose probe it is. */
    a: number;
    /** The arm's deepest probe. */
    probe: number;
    /** The other arm's shape, placed. */
    shape: IAutoMovieMotionHumanArmGeometry.IShape;
    /** The other arm's segment the shape rides on. */
    owner: "upper" | "lower" | "hand";
    /** The shape's bone. */
    bone: string;
    /** How far the probe lies below what it may, millimetres. */
    short: number;
    /** Whether the pair is a declared rest. */
    rested: boolean;
  }

  /** A corner of the body or an external segment (`HumanArmGeometry.IFrame.body`) inside a collider shape of the arm, read the same way. */
  export interface IEmbedded {
    /** The corner's index in the frame's body corners. */
    corner: number;
    /** The arm's shape, placed. */
    shape: IAutoMovieMotionHumanArmGeometry.IShape;
    /** The shape's index among the arm's colliders (`HumanArmGeometry.colliders`). */
    index: number;
    /** The arm's segment the shape rides on. */
    owner: "upper" | "lower" | "hand";
    /** The corner's bone. */
    bone: string;
    /** How far the corner lies below what it may, millimetres. */
    short: number;
    /** Whether the pair is a declared rest. */
    rested: boolean;
  }

  /**
   * Each arm's deepest collider probe against each of the other arm's
   * collider shapes at a waypoint, by the probe's segment and the shape.
   *
   * @param c The context.
   * @param k The waypoint.
   * @param first The first arm placed there.
   * @param second The second arm placed there.
   * @param cut How far short of its bound a pair may be left unread, millimetres (`HumanArmTrajectoryPairs.CUT` where the reading's users need no more); every pair in reach is read when absent.
   * @returns The pairs by arm, segment and shape.
   */
  export function crossing(
    c: M.IContext,
    k: number,
    first: IAutoMovieMotionHumanArmGeometry.IPlaced,
    second: IAutoMovieMotionHumanArmGeometry.IPlaced,
    cut: number = Infinity,
  ): Map<string, ICrossing> {
    const out: Map<string, ICrossing> = new Map();
    const placed: IAutoMovieMotionHumanArmGeometry.IPlaced[] = [first, second];
    for (let a: number = 0; a < 2; ++a) {
      const theirs: IAutoMovieMotionHumanArmGeometry.IShape[] = S.colliders(
        c.frames[1 - a]![k]!,
        placed[1 - a]!,
      );
      const owners: readonly Owner[] = shapeOwners(
        c.frames[1 - a]![k]!.colliders,
      );

      // Each segment's sphere is screened against each shape before its probes.
      const frame: IAutoMovieMotionHumanArmGeometry.IFrame = c.frames[a]![k]!;
      const own: IAutoMovieMotionHumanArmGeometry.IPlaced = placed[a]!;
      const centres: Record<"upper" | "lower" | "hand", IAutoMovieVector3> = {
        upper: Vector3.add(
          own.shoulder,
          Quaternion.rotateVector(own.upper, frame.bounds.upper.centre),
        ),
        lower: Vector3.add(
          own.elbow,
          Quaternion.rotateVector(own.lower, frame.bounds.lower.centre),
        ),
        hand: Vector3.add(
          own.wrist,
          Quaternion.rotateVector(own.hand, frame.bounds.hand.centre),
        ),
      };
      const near = (owner: "upper" | "lower" | "hand"): boolean[] =>
        theirs.map(
          (shape: IAutoMovieMotionHumanArmGeometry.IShape): boolean =>
            Vector3.length(Vector3.subtract(centres[owner], shape.centre)) -
              shape.radius -
              frame.bounds[owner].radius <
            T.REACH,
        );
      const screened: Record<"upper" | "lower" | "hand", boolean[]> = {
        upper: near("upper"),
        lower: near("lower"),
        hand: near("hand"),
      };
      own.probes.forEach(
        ([p, r]: readonly [IAutoMovieVector3, number], probe: number): void => {
          if (probe < G.SURFACE) return;
          const segment: M.Segment = S.segment(frame, probe);
          const mine: boolean[] = screened[frame.owners[probe - G.SURFACE]!];
          theirs.forEach(
            (
              shape: IAutoMovieMotionHumanArmGeometry.IShape,
              i: number,
            ): void => {
              if (!mine[i]) return;
              // The two arms' segments on one grasped object meet by design
              // on the hold, and keep that depth only by the reach's share as
              // the hands close on it and part from it.
              const grip: number | undefined = c.grasped(
                a,
                k,
                segment,
                owners[i] === "upper"
                  ? "upperArm"
                  : owners[i] === "lower"
                    ? "lowerArm"
                    : "hand",
                i,
              );
              if (grip === Infinity) return;
              const apart: number =
                Vector3.length(Vector3.subtract(p, shape.centre)) -
                shape.radius -
                r;
              if (apart >= T.REACH) return;
              const key: string = `${a}|${segment}|${i}`;
              const known: ICrossing | undefined = out.get(key);
              const allowance: number =
                c.between(a, k, probe, i, shape.bone) - (grip ?? 0);

              // Bounded as `deepest`: a probe the bounding sphere shows no
              // deeper than the pair's deepest so far is not read exactly.
              if (
                known !== undefined &&
                1000 * (allowance - apart) <= known.short
              )
                return;
              if (
                1000 * (allowance - apart) < -cut &&
                !c.rested(a, k, probe, shape.bone)
              ) {
                if (known === undefined)
                  out.set(key, {
                    a,
                    probe,
                    shape,
                    owner: owners[i]!,
                    bone: shape.bone,
                    short: 1000 * (allowance - apart),
                    rested: false,
                  });
                return;
              }
              const short: number =
                1000 *
                (allowance -
                  (physicalShapeSegmentDistance(shape.pose, shape.shape, p, p) -
                    r));
              if (known === undefined || short > known.short)
                out.set(key, {
                  a,
                  probe,
                  shape,
                  owner: owners[i]!,
                  bone: shape.bone,
                  short,
                  rested: c.rested(a, k, probe, shape.bone),
                });
            },
          );
        },
      );
    }
    return out;
  }

  /**
   * Each body or external part's deepest corner inside each of the arm's own
   * collider shapes at a waypoint, the reverse of the forward pair reading.
   * The tangle audit reads every pair both ways and takes the deeper; only
   * own-body parts sharing a joint are excluded.
   *
   * @param c The context.
   * @param a The arm.
   * @param k The waypoint.
   * @param placed The arm placed there.
   * @param cut How far short of its bound a pair may be left unread, millimetres (`HumanArmTrajectoryPairs.CUT` where the reading's users need no more; negative, how little past it, for a reader that refuses only past a slack); every pair in reach is read when absent.
   * @param stopWhen Optional predicate that accepts a single exact depth as a complete refusal witness.
   * @returns The pairs by body part and arm shape, through the first exact refusal if requested.
   */
  export function embedded(
    c: M.IContext,
    a: number,
    k: number,
    placed: IAutoMovieMotionHumanArmGeometry.IPlaced,
    cut: number = Infinity,
    stopWhen?: (short: number) => boolean,
  ): Map<number, IEmbedded> {
    const frame: IAutoMovieMotionHumanArmGeometry.IFrame = c.frames[a]![k]!;
    const out: Map<number, IEmbedded> = new Map();
    const mine: IAutoMovieMotionHumanArmGeometry.IShape[] = S.colliders(
      frame,
      placed,
    );
    const owners: readonly Owner[] = shapeOwners(frame.colliders);
    // Each segment's sphere screens the corners before its shapes.
    const centres: Record<"upper" | "lower" | "hand", IAutoMovieVector3> = {
      upper: Vector3.add(
        placed.shoulder,
        Quaternion.rotateVector(placed.upper, frame.bounds.upper.centre),
      ),
      lower: Vector3.add(
        placed.elbow,
        Quaternion.rotateVector(placed.lower, frame.bounds.lower.centre),
      ),
      hand: Vector3.add(
        placed.wrist,
        Quaternion.rotateVector(placed.hand, frame.bounds.hand.centre),
      ),
    };
    const visit = (
      corner: IAutoMovieMotionHumanArmGeometry.IFrame["body"][number],
      i: number,
    ): boolean => {
        const close: Record<"upper" | "lower" | "hand", boolean> = {
          upper:
            Vector3.length(Vector3.subtract(corner.point, centres.upper)) -
              frame.bounds.upper.radius <
            T.REACH,
          lower:
            Vector3.length(Vector3.subtract(corner.point, centres.lower)) -
              frame.bounds.lower.radius <
            T.REACH,
          hand:
            Vector3.length(Vector3.subtract(corner.point, centres.hand)) -
              frame.bounds.hand.radius <
            T.REACH,
        };
        if (!close.upper && !close.lower && !close.hand) return false;
        return mine.some(
          (shape: IAutoMovieMotionHumanArmGeometry.IShape, j: number): boolean => {
            if (!close[owners[j]!]) return false;
            const apart: number =
              Vector3.length(Vector3.subtract(corner.point, shape.centre)) -
              shape.radius;
            if (apart >= T.REACH) return false;
            if (frame.related[corner.part]?.[shape.part] === true) return false;
            // What the hand rests on lies on the hand: the goal's contact.
            if (owners[j] === "hand" && frame.resting.has(corner.part)) return false;
            const key: number = corner.part * mine.length + j;
            const known: IEmbedded | undefined = out.get(key);
            const allowance: number = c.inside(a, k, i, j);

            // Bounded as `deepest`: a corner the bounding sphere shows no
            // deeper than the pair's deepest so far is not read exactly.
            if (
              known !== undefined &&
              1000 * (allowance - apart) <= known.short
            )
              return false;
            const own: "upperArm" | "lowerArm" | "hand" =
              owners[j] === "upper"
                ? "upperArm"
                : owners[j] === "lower"
                  ? "lowerArm"
                  : "hand";
            if (
              1000 * (allowance - apart) < -cut &&
              !c.lying(a, k, own, corner.bone)
            ) {
              if (known === undefined)
                out.set(key, {
                  corner: i,
                  shape,
                  index: j,
                  owner: owners[j]!,
                  bone: corner.bone,
                  short: 1000 * (allowance - apart),
                  rested: false,
                });
              return false;
            }
            const short: number =
              1000 *
              (allowance -
                physicalShapeSegmentDistance(
                  shape.pose,
                  shape.shape,
                  corner.point,
                  corner.point,
                ));
            if (known === undefined || short > known.short) {
              out.set(key, {
                corner: i,
                shape,
                index: j,
                owner: owners[j]!,
                bone: corner.bone,
                short,
                rested: c.lying(a, k, own, corner.bone),
              });
              if (stopWhen?.(short)) return true;
            }
            return false;
          },
        );
    };

    // A part's corners all lie within its cluster's sphere, so a cluster
    // whose sphere lies past the reach of every segment's sphere holds no
    // corner any segment's screen keeps (the triangle inequality), and its
    // corners are not read one by one: the bounding-volume hierarchy's
    // first level. The clusters run over the corners in their order, so the
    // corners read and the pairs found are those of a reading of each.
    for (const cluster of clusters(frame.body)) {
      if (
        !reaches(cluster, centres.upper, frame.bounds.upper.radius) &&
        !reaches(cluster, centres.lower, frame.bounds.lower.radius) &&
        !reaches(cluster, centres.hand, frame.bounds.hand.radius)
      )
        continue;
      for (let i: number = cluster.start; i < cluster.end; ++i)
        if (visit(frame.body[i]!, i)) return out;
    }
    return out;
  }
}

/** The segment of the arm a collider shape rides on. */
type Owner = IAutoMovieMotionHumanArmGeometry.IFrame["colliders"][number]["owner"];

/** A run of consecutive body corners of one part (`HumanArmGeometry.IFrame.body`) and the sphere about them. */
interface ICluster {
  /** The run's first corner's index. */
  start: number;

  /** One past the run's last corner's index. */
  end: number;

  /** The corners' mean, world metres. */
  centre: IAutoMovieVector3;

  /** The farthest corner's distance from the centre, metres. */
  radius: number;
}

/**
 * The runs of a frame's body corners that share a part, each with the
 * sphere about its corners: fixed with the frame, built once per corner
 * list and kept while the list is held.
 */
function clusters(
  body: IAutoMovieMotionHumanArmGeometry.IFrame["body"],
): readonly ICluster[] {
  const known: readonly ICluster[] | undefined = CLUSTERS.get(body);
  if (known !== undefined) return known;
  const out: ICluster[] = [];
  for (let start: number = 0; start < body.length; ) {
    let end: number = start + 1;
    while (end < body.length && body[end]!.part === body[start]!.part) ++end;
    const scale: number = 1 / (end - start);
    let x: number = 0;
    let y: number = 0;
    let z: number = 0;
    for (let i: number = start; i < end; ++i) {
      x += body[i]!.point.x * scale;
      y += body[i]!.point.y * scale;
      z += body[i]!.point.z * scale;
    }
    const centre: IAutoMovieVector3 = { x, y, z };
    let radius: number = 0;
    for (let i: number = start; i < end; ++i)
      radius = Math.max(radius, Vector3.distance(body[i]!.point, centre));
    out.push({ start, end, centre, radius });
    start = end;
  }
  CLUSTERS.set(body, out);
  return out;
}

/** Whether any corner of a cluster can lie within the reach of a segment's sphere (`embedded`'s per-corner screen), with a slack far above the rounding of the distances. */
function reaches(
  cluster: ICluster,
  centre: IAutoMovieVector3,
  radius: number,
): boolean {
  return (
    Vector3.distance(cluster.centre, centre) - cluster.radius - radius <
    T.REACH + MARGIN
  );
}

/** Each collider shape's segment, in the order `HumanArmShapes.colliders` places the shapes: fixed with the frame, built once per collider list. */
function shapeOwners(
  colliders: IAutoMovieMotionHumanArmGeometry.IFrame["colliders"],
): readonly Owner[] {
  let known: Owner[] | undefined = OWNERS.get(colliders);
  if (known === undefined) {
    known = [];
    for (const col of colliders)
      for (let s: number = 0; s < col.shapes.length; ++s) known.push(col.owner);
    OWNERS.set(colliders, known);
  }
  return known;
}

/** The clusters of each frame's body corners, kept while the corner list is held. */
const CLUSTERS: WeakMap<
  IAutoMovieMotionHumanArmGeometry.IFrame["body"],
  readonly ICluster[]
> = new WeakMap();

/** The shapes' segments of each frame's collider list, kept while the list is held. */
const OWNERS: WeakMap<
  IAutoMovieMotionHumanArmGeometry.IFrame["colliders"],
  Owner[]
> = new WeakMap();

/** The slack of a cluster's screen over its corners', metres: far below the pairs' reach, far above the rounding of a distance in metres. */
const MARGIN: number = 1e-9;
