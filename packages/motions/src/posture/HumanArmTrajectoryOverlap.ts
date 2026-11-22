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
 * @evidence contracts/development/implementation.md#efficient-algorithms Screens each arm segment by its sphere before its probes; branch and bound keeps one deepest reading per part and shape.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses HumanArmShapes.colliders and the context's memoized reference depths and contact allowances.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh pair maps and retains no state.
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
      const owners: ("upper" | "lower" | "hand")[] = c.frames[1 - a]![
        k
      ]!.colliders.flatMap(
        (col: IAutoMovieMotionHumanArmGeometry.IFrame["colliders"][number]) =>
          col.shapes.map((): "upper" | "lower" | "hand" => col.owner),
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
              // The two arms' segments on one grasped object meet by design.
              if (
                c.grasped(
                  a,
                  k,
                  segment,
                  owners[i] === "upper"
                    ? "upperArm"
                    : owners[i] === "lower"
                      ? "lowerArm"
                      : "hand",
                )
              )
                return;
              const apart: number =
                Vector3.length(Vector3.subtract(p, shape.centre)) -
                shape.radius -
                r;
              if (apart >= T.REACH) return;
              const key: string = `${a}|${segment}|${i}`;
              const known: ICrossing | undefined = out.get(key);
              const allowance: number = c.between(a, k, probe, i, shape.bone);

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
   * @param cut How far short of its bound a pair may be left unread, millimetres (`HumanArmTrajectoryPairs.CUT` where the reading's users need no more); every pair in reach is read when absent.
   * @returns The pairs by body part and arm shape.
   */
  export function embedded(
    c: M.IContext,
    a: number,
    k: number,
    placed: IAutoMovieMotionHumanArmGeometry.IPlaced,
    cut: number = Infinity,
  ): Map<number, IEmbedded> {
    const frame: IAutoMovieMotionHumanArmGeometry.IFrame = c.frames[a]![k]!;
    const out: Map<number, IEmbedded> = new Map();
    const mine: IAutoMovieMotionHumanArmGeometry.IShape[] = S.colliders(
      frame,
      placed,
    );
    const owners: ("upper" | "lower" | "hand")[] = frame.colliders.flatMap(
      (col: IAutoMovieMotionHumanArmGeometry.IFrame["colliders"][number]) =>
        col.shapes.map((): "upper" | "lower" | "hand" => col.owner),
    );
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
    frame.body.forEach(
      (
        corner: IAutoMovieMotionHumanArmGeometry.IFrame["body"][number],
        i: number,
      ): void => {
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
        if (!close.upper && !close.lower && !close.hand) return;
        mine.forEach(
          (shape: IAutoMovieMotionHumanArmGeometry.IShape, j: number): void => {
            if (!close[owners[j]!]) return;
            const apart: number =
              Vector3.length(Vector3.subtract(corner.point, shape.centre)) -
              shape.radius;
            if (apart >= T.REACH) return;
            if (frame.related[corner.part]?.[shape.part] === true) return;
            // What the hand rests on lies on the hand: the goal's contact.
            if (owners[j] === "hand" && frame.resting.has(corner.part)) return;
            const key: number = corner.part * mine.length + j;
            const known: IEmbedded | undefined = out.get(key);
            const allowance: number = c.inside(a, k, i, j);

            // Bounded as `deepest`: a corner the bounding sphere shows no
            // deeper than the pair's deepest so far is not read exactly.
            if (
              known !== undefined &&
              1000 * (allowance - apart) <= known.short
            )
              return;
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
              return;
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
            }
          },
        );
      },
    );
    return out;
  }
}
