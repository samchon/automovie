import {
  Quaternion,
  Vector3,
  physicalShapeGjk,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type {
  import {
  Quaternion,
  Vector3,
  physicalShapeGjk,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangleModel } from "../audit/AutoMovieMotionHumanAuditTangleModel";
import { HumanArmShapeBox } from "./HumanArmShapeBox";
import { HumanArmShapes as S } from "./HumanArmShapes";
import { HumanArmTrajectoryClusters } from "./HumanArmTrajectoryClusters";
import { HumanArmTrajectoryLinks } from "./HumanArmTrajectoryLinks";
import type { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryShapeOwners } from "./HumanArmTrajectoryShapeOwners";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";
import { HumanAuditModel } from "./HumanAuditModel";

/** The alternatives of `EmbeddedVisitOwn`'s site. */
type EmbeddedVisitOwn = "upperArm" | "lowerArm" | "hand";

/** The alternatives of `EmbeddedOwner`'s site. */
type EmbeddedOwner = "upper" | "lower" | "hand";

/** The alternatives of `CrossingOwner`'s site. */
type CrossingOwner = "upper" | "lower" | "hand";

/**
 * Collision pairs against moving arm colliders: the two solved arms against
 * each other, and the body's and external segments' corners inside an arm.
 * HumanArmTrajectoryPairs exposes these readings alongside the forward pairs.
 */
export namespace HumanArmTrajectoryOverlap {
  /**
   * An arm's deepest probe in a collider shape of the other arm, read the same
   * way.
   */
  export interface ICrossing {
    /** The arm whose probe it is. */
    a: number;
    /** The arm's deepest probe. */
    probe: number;
    /** The other arm's shape, placed. */
    shape: IAutoMovieMotionHumanArmGeometry.IShape;
    /** The other arm's segment the shape rides on. */
    owner: CrossingOwner;
    /** The shape's bone. */
    bone: string;
    /** How far the probe lies below what it may, millimetres. */
    short: number;
    /** Whether the pair is a declared rest. */
    rested: boolean;
  }

  /**
   * A corner of the body or an external segment
   * (`HumanArmGeometry.IFrame.body`) inside a collider shape of the arm, read
   * the same way.
   */
  export interface IEmbedded {
    /** The corner's index in the frame's body corners. */
    corner: number;
    /** The arm's shape, placed. */
    shape: IAutoMovieMotionHumanArmGeometry.IShape;
    /**
     * The shape's index among the arm's colliders
     * (`HumanArmGeometry.colliders`).
     */
    index: number;
    /** The arm's segment the shape rides on. */
    owner: EmbeddedOwner;
    /** The corner's bone. */
    bone: string;
    /** How far the corner lies below what it may, millimetres. */
    short: number;
    /** Whether the pair is a declared rest. */
    rested: boolean;
  }

  /**
   * Each arm's deepest collider probe against each of the other arm's collider
   * shapes at a waypoint, by the probe's segment and the shape.
   *
   * Each audit part of an arm is read against a shape of the other first as one
   * link pair (`HumanAuditModel.certify`); a pair certified clear past the cut
   * is left unread with that bound, and the pairs left are read probe by probe,
   * each bounded first as `HumanArmTrajectoryPairs.deepest` bounds its probes.
   *
   * @param c The context.
   * @param k The waypoint.
   * @param first The first arm placed there.
   * @param second The second arm placed there.
   * @param cut How far short of its bound a pair may be left unread,
   *   millimetres (`HumanArmTrajectoryPairs.CUT` where the reading's users need
   *   no more); every pair in reach is read when absent.
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
    const floor: number = cut / 1000;
    const certifies: boolean = Number.isFinite(floor);
    for (let a: number = 0; a < 2; ++a) {
      const theirs: IAutoMovieMotionHumanArmGeometry.IShape[] = S.colliders(
        c.frames[1 - a]![k]!,
        placed[1 - a]!,
      );
      const owners: readonly Owner[] = HumanArmTrajectoryShapeOwners(
        c.frames[1 - a]![k]!.colliders,
      );
      const solids: (physicalShapeGjk.ISolid | undefined)[] = [];

      // Each segment's sphere is screened against each shape before its probes.
      const frame: IAutoMovieMotionHumanArmGeometry.IFrame = c.frames[a]![k]!;
      const own: IAutoMovieMotionHumanArmGeometry.IPlaced = placed[a]!;
      const centres: Record<Owner, IAutoMovieVector3> = {
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
      const near = (owner: Owner): boolean[] =>
        theirs.map(
          (shape: IAutoMovieMotionHumanArmGeometry.IShape): boolean =>
            Vector3.length(Vector3.subtract(centres[owner], shape.centre)) -
              shape.radius -
              frame.bounds[owner].radius <
            T.REACH,
        );
      const screened: Record<Owner, boolean[]> = {
        upper: near("upper"),
        lower: near("lower"),
        hand: near("hand"),
      };
      for (const link of HumanArmTrajectoryLinks(c, a, k, own)) {
        const mine: boolean[] = screened[link.owner];
        const segment: M.Segment = S.segment(frame, link.probes[0]!);
        theirs.forEach(
          (shape: IAutoMovieMotionHumanArmGeometry.IShape, i: number): void => {
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
            const key: string = `${a}|${segment}|${i}`;
            const rested: boolean = c.rested(a, k, link.probes[0]!, shape.bone);

            // The link pair's certificate: every allowance is no more than
            // zero, so a bound past the cut leaves every probe beyond it.
            if (certifies && !rested && link.solids.length !== 0) {
              const solid: physicalShapeGjk.ISolid = (solids[i] ??=
                physicalShapeGjk.solid(shape.pose, shape.shape));
              const least: number = HumanAuditModel.certify(
                link.solids,
                link.offset,
                solid,
                floor,
              );
              if (least > floor) {
                if (!out.has(key))
                  out.set(key, {
                    a,
                    probe: link.probes[0]!,
                    shape,
                    owner: owners[i]!,
                    bone: shape.bone,
                    short: -1000 * least,
                    rested: false,
                  });
                return;
              }
            }
            for (const probe of link.probes) {
              const [p, r]: readonly [IAutoMovieVector3, number] =
                own.probes[probe]!;
              const apart: number =
                Vector3.length(Vector3.subtract(p, shape.centre)) -
                shape.radius -
                r;
              if (apart >= T.REACH) continue;
              const known: ICrossing | undefined = out.get(key);
              const allowance: number =
                c.between(a, k, probe, i) - (grip ?? 0);

              // Bounded as `deepest`: the bounding sphere and the hull's box
              // bound the distance from below, and a probe they show no
              // deeper than the pair's deepest so far is not read exactly.
              const bound: number =
                1000 *
                (allowance - Math.max(apart, HumanArmShapeBox(shape, p) - r));
              if (known !== undefined && bound <= known.short) continue;
              if (bound < -cut && !rested) {
                if (known === undefined)
                  out.set(key, {
                    a,
                    probe,
                    shape,
                    owner: owners[i]!,
                    bone: shape.bone,
                    short: bound,
                    rested: false,
                  });
                continue;
              }
              const distance: number = physicalShapeSegmentDistance(
                shape.pose,
                shape.shape,
                p,
                p,
              );
              const short: number = 1000 * (allowance - (distance - r));
              if (known === undefined || short > known.short)
                out.set(key, {
                  a,
                  probe,
                  shape,
                  owner: owners[i]!,
                  bone: shape.bone,
                  short,
                  rested,
                });
            }
          },
        );
      }
    }
    return out;
  }

  /**
   * Each body or external part's deepest corner inside each of the arm's own
   * collider shapes at a waypoint, the reverse of the forward pair reading. The
   * tangle audit reads every pair both ways and takes the deeper; only own-body
   * parts sharing a joint are excluded.
   *
   * An own-body part is read against an arm shape first as one link pair
   * (`HumanAuditModel.certify`); a pair certified clear past the cut is left
   * unread with that bound, and only the pairs left read their corners, each
   * bounded first as `HumanArmTrajectoryPairs.deepest` bounds its probes.
   *
   * @param c The context.
   * @param a The arm.
   * @param k The waypoint.
   * @param placed The arm placed there.
   * @param cut How far short of its bound a pair may be left unread,
   *   millimetres (`HumanArmTrajectoryPairs.CUT` where the reading's users need
   *   no more; negative, how little past it, for a reader that refuses only
   *   past a slack); every pair in reach is read when absent.
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
    const owners: readonly Owner[] = HumanArmTrajectoryShapeOwners(frame.colliders);
    const model: import {
  Quaternion,
  Vector3,
  physicalShapeGjk,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangleModel } from "../audit/AutoMovieMotionHumanAuditTangleModel";
import { HumanArmShapeBox } from "./HumanArmShapeBox";
import { HumanArmShapes as S } from "./HumanArmShapes";
import { HumanArmTrajectoryClusters } from "./HumanArmTrajectoryClusters";
import { HumanArmTrajectoryLinks } from "./HumanArmTrajectoryLinks";
import type { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryShapeOwners } from "./HumanArmTrajectoryShapeOwners";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";
import { HumanAuditModel } from "./HumanAuditModel";

/** The alternatives of `EmbeddedVisitOwn`'s site. */
type EmbeddedVisitOwn = "upperArm" | "lowerArm" | "hand";

/** The alternatives of `EmbeddedOwner`'s site. */
type EmbeddedOwner = "upper" | "lower" | "hand";

/** The alternatives of `CrossingOwner`'s site. */
type CrossingOwner = "upper" | "lower" | "hand";

/**
 * Collision pairs against moving arm colliders: the two solved arms against
 * each other, and the body's and external segments' corners inside an arm.
 * HumanArmTrajectoryPairs exposes these readings alongside the forward pairs.
 */
export namespace HumanArmTrajectoryOverlap {
  /**
   * An arm's deepest probe in a collider shape of the other arm, read the same
   * way.
   */
  export interface ICrossing {
    /** The arm whose probe it is. */
    a: number;
    /** The arm's deepest probe. */
    probe: number;
    /** The other arm's shape, placed. */
    shape: IAutoMovieMotionHumanArmGeometry.IShape;
    /** The other arm's segment the shape rides on. */
    owner: CrossingOwner;
    /** The shape's bone. */
    bone: string;
    /** How far the probe lies below what it may, millimetres. */
    short: number;
    /** Whether the pair is a declared rest. */
    rested: boolean;
  }

  /**
   * A corner of the body or an external segment
   * (`HumanArmGeometry.IFrame.body`) inside a collider shape of the arm, read
   * the same way.
   */
  export interface IEmbedded {
    /** The corner's index in the frame's body corners. */
    corner: number;
    /** The arm's shape, placed. */
    shape: IAutoMovieMotionHumanArmGeometry.IShape;
    /**
     * The shape's index among the arm's colliders
     * (`HumanArmGeometry.colliders`).
     */
    index: number;
    /** The arm's segment the shape rides on. */
    owner: EmbeddedOwner;
    /** The corner's bone. */
    bone: string;
    /** How far the corner lies below what it may, millimetres. */
    short: number;
    /** Whether the pair is a declared rest. */
    rested: boolean;
  }

  /**
   * Each arm's deepest collider probe against each of the other arm's collider
   * shapes at a waypoint, by the probe's segment and the shape.
   *
   * Each audit part of an arm is read against a shape of the other first as one
   * link pair (`HumanAuditModel.certify`); a pair certified clear past the cut
   * is left unread with that bound, and the pairs left are read probe by probe,
   * each bounded first as `HumanArmTrajectoryPairs.deepest` bounds its probes.
   *
   * @param c The context.
   * @param k The waypoint.
   * @param first The first arm placed there.
   * @param second The second arm placed there.
   * @param cut How far short of its bound a pair may be left unread,
   *   millimetres (`HumanArmTrajectoryPairs.CUT` where the reading's users need
   *   no more); every pair in reach is read when absent.
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
    const floor: number = cut / 1000;
    const certifies: boolean = Number.isFinite(floor);
    for (let a: number = 0; a < 2; ++a) {
      const theirs: IAutoMovieMotionHumanArmGeometry.IShape[] = S.colliders(
        c.frames[1 - a]![k]!,
        placed[1 - a]!,
      );
      const owners: readonly Owner[] = HumanArmTrajectoryShapeOwners(
        c.frames[1 - a]![k]!.colliders,
      );
      const solids: (physicalShapeGjk.ISolid | undefined)[] = [];

      // Each segment's sphere is screened against each shape before its probes.
      const frame: IAutoMovieMotionHumanArmGeometry.IFrame = c.frames[a]![k]!;
      const own: IAutoMovieMotionHumanArmGeometry.IPlaced = placed[a]!;
      const centres: Record<Owner, IAutoMovieVector3> = {
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
      const near = (owner: Owner): boolean[] =>
        theirs.map(
          (shape: IAutoMovieMotionHumanArmGeometry.IShape): boolean =>
            Vector3.length(Vector3.subtract(centres[owner], shape.centre)) -
              shape.radius -
              frame.bounds[owner].radius <
            T.REACH,
        );
      const screened: Record<Owner, boolean[]> = {
        upper: near("upper"),
        lower: near("lower"),
        hand: near("hand"),
      };
      for (const link of HumanArmTrajectoryLinks(c, a, k, own)) {
        const mine: boolean[] = screened[link.owner];
        const segment: M.Segment = S.segment(frame, link.probes[0]!);
        theirs.forEach(
          (shape: IAutoMovieMotionHumanArmGeometry.IShape, i: number): void => {
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
            const key: string = `${a}|${segment}|${i}`;
            const rested: boolean = c.rested(a, k, link.probes[0]!, shape.bone);

            // The link pair's certificate: every allowance is no more than
            // zero, so a bound past the cut leaves every probe beyond it.
            if (certifies && !rested && link.solids.length !== 0) {
              const solid: physicalShapeGjk.ISolid = (solids[i] ??=
                physicalShapeGjk.solid(shape.pose, shape.shape));
              const least: number = HumanAuditModel.certify(
                link.solids,
                link.offset,
                solid,
                floor,
              );
              if (least > floor) {
                if (!out.has(key))
                  out.set(key, {
                    a,
                    probe: link.probes[0]!,
                    shape,
                    owner: owners[i]!,
                    bone: shape.bone,
                    short: -1000 * least,
                    rested: false,
                  });
                return;
              }
            }
            for (const probe of link.probes) {
              const [p, r]: readonly [IAutoMovieVector3, number] =
                own.probes[probe]!;
              const apart: number =
                Vector3.length(Vector3.subtract(p, shape.centre)) -
                shape.radius -
                r;
              if (apart >= T.REACH) continue;
              const known: ICrossing | undefined = out.get(key);
              const allowance: number =
                c.between(a, k, probe, i) - (grip ?? 0);

              // Bounded as `deepest`: the bounding sphere and the hull's box
              // bound the distance from below, and a probe they show no
              // deeper than the pair's deepest so far is not read exactly.
              const bound: number =
                1000 *
                (allowance - Math.max(apart, HumanArmShapeBox(shape, p) - r));
              if (known !== undefined && bound <= known.short) continue;
              if (bound < -cut && !rested) {
                if (known === undefined)
                  out.set(key, {
                    a,
                    probe,
                    shape,
                    owner: owners[i]!,
                    bone: shape.bone,
                    short: bound,
                    rested: false,
                  });
                continue;
              }
              const distance: number = physicalShapeSegmentDistance(
                shape.pose,
                shape.shape,
                p,
                p,
              );
              const short: number = 1000 * (allowance - (distance - r));
              if (known === undefined || short > known.short)
                out.set(key, {
                  a,
                  probe,
                  shape,
                  owner: owners[i]!,
                  bone: shape.bone,
                  short,
                  rested,
                });
            }
          },
        );
      }
    }
    return out;
  }

  /**
   * Each body or external part's deepest corner inside each of the arm's own
   * collider shapes at a waypoint, the reverse of the forward pair reading. The
   * tangle audit reads every pair both ways and takes the deeper; only own-body
   * parts sharing a joint are excluded.
   *
   * An own-body part is read against an arm shape first as one link pair
   * (`HumanAuditModel.certify`); a pair certified clear past the cut is left
   * unread with that bound, and only the pairs left read their corners, each
   * bounded first as `HumanArmTrajectoryPairs.deepest` bounds its probes.
   *
   * @param c The context.
   * @param a The arm.
   * @param k The waypoint.
   * @param placed The arm placed there.
   * @param cut How far short of its bound a pair may be left unread,
   *   millimetres (`HumanArmTrajectoryPairs.CUT` where the reading's users need
   *   no more; negative, how little past it, for a reader that refuses only
   *   past a slack); every pair in reach is read when absent.
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
    const owners: readonly Owner[] = HumanArmTrajectoryShapeOwners(frame.colliders);
    const model: AutoMovieMotionHumanAuditTangleModel.IModel =
      c.setups[a]!.body.tangle;
    const floor: number = cut / 1000;
    const certifies: boolean = Number.isFinite(floor);
    const solids: (physicalShapeGjk.ISolid | undefined)[] = [];
    // Each segment's sphere screens the corners before its shapes.
    const centres: Record<Owner, IAutoMovieVector3> = {
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
    // Each own-body part's certificate against each arm shape, read once
    // for the cluster of its corners: the bound, or none where it cannot
    // be read (a rest, or a part that is no segment of the body).
    let certified: Map<number, number> = new Map();
    let part: number = -1;
    // The current cluster's part's shapes as convex solids, made on their
    // first read for the cluster.
    let body: physicalShapeGjk.ISolid[] | undefined;
    const visit = (
      corner: IAutoMovieMotionHumanArmGeometry.IFrame["body"][number],
      i: number,
    ): void => {
      const close: Record<Owner, boolean> = {
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
          const key: number = corner.part * mine.length + j;
          const own: EmbeddedVisitOwn =
            owners[j] === "upper"
              ? "upperArm"
              : owners[j] === "lower"
                ? "lowerArm"
                : "hand";
          const rested: boolean = c.lying(a, k, own, corner.bone);

          // The link pair's certificate: every allowance is no more than
          // zero, so a bound past the cut leaves every corner beyond it.
          if (
            certifies &&
            !rested &&
            corner.part < model.parts.length &&
            !certified.has(j)
          ) {
            body ??= frame.shapes
              .filter(
                (s: IAutoMovieMotionHumanArmGeometry.IShape): boolean =>
                  s.part === corner.part,
              )
              .map(
                (
                  s: IAutoMovieMotionHumanArmGeometry.IShape,
                ): physicalShapeGjk.ISolid =>
                  physicalShapeGjk.solid(s.pose, s.shape),
              );
            certified.set(
              j,
              body.length === 0
                ? -Infinity
                : Math.min(
                    ...body.map((solid: physicalShapeGjk.ISolid): number =>
                      HumanAuditModel.certify(
                        [
                          (solids[j] ??= physicalShapeGjk.solid(
                            shape.pose,
                            shape.shape,
                          )),
                        ],
                        model.parts[corner.part]!.offset,
                        solid,
                        floor,
                      ),
                    ),
                  ),
            );
          }
          const least: number | undefined = rested
            ? undefined
            : certified.get(j);
          if (least !== undefined && least > floor) {
            if (!out.has(key))
              out.set(key, {
                corner: i,
                shape,
                index: j,
                owner: owners[j]!,
                bone: corner.bone,
                short: -1000 * least,
                rested: false,
              });
            return;
          }
          const known: IEmbedded | undefined = out.get(key);
          const allowance: number = c.inside(a, k, i, j);

          // Bounded as `deepest`: the bounding sphere and the hull's box
          // bound the distance from below, and a corner they show no deeper
          // than the pair's deepest so far is not read exactly.
          const bound: number =
            1000 *
            (allowance -
              Math.max(apart, HumanArmShapeBox(shape, corner.point)));
          if (known !== undefined && bound <= known.short) return;
          if (bound < -cut && !rested) {
            if (known === undefined)
              out.set(key, {
                corner: i,
                shape,
                index: j,
                owner: owners[j]!,
                bone: corner.bone,
                short: bound,
                rested: false,
              });
            return;
          }
          const distance: number = physicalShapeSegmentDistance(
            shape.pose,
            shape.shape,
            corner.point,
            corner.point,
          );
          const short: number = 1000 * (allowance - distance);
          if (known === undefined || short > known.short) {
            out.set(key, {
              corner: i,
              shape,
              index: j,
              owner: owners[j]!,
              bone: corner.bone,
              short,
              rested,
            });
          }
        },
      );
    };

    // A part's corners all lie within its cluster's sphere, so a cluster
    // whose sphere lies past the reach of every segment's sphere holds no
    // corner any segment's screen keeps (the triangle inequality), and its
    // corners are not read one by one: the bounding-volume hierarchy's
    // first level. The clusters run over the corners in their order, so the
    // corners read and the pairs found are those of a reading of each.
    for (const cluster of HumanArmTrajectoryClusters(frame.body)) {
      if (
        !HumanArmTrajectoryClusters.reaches(cluster, centres.upper, frame.bounds.upper.radius) &&
        !HumanArmTrajectoryClusters.reaches(cluster, centres.lower, frame.bounds.lower.radius) &&
        !HumanArmTrajectoryClusters.reaches(cluster, centres.hand, frame.bounds.hand.radius)
      )
        continue;
      for (let i: number = cluster.start; i < cluster.end; ++i) {
        if (frame.body[i]!.part !== part) {
          part = frame.body[i]!.part;
          certified = new Map();
          body = undefined;
        }
        visit(frame.body[i]!, i);
      }
    }
    return out;
  }
}

/** The segment of the arm a collider shape rides on. */
type Owner = HumanArmTrajectoryShapeOwners.Owner;
.IModel =
      c.setups[a]!.body.tangle;
    const floor: number = cut / 1000;
    const certifies: boolean = Number.isFinite(floor);
    const solids: (physicalShapeGjk.ISolid | undefined)[] = [];
    // Each segment's sphere screens the corners before its shapes.
    const centres: Record<Owner, IAutoMovieVector3> = {
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
    // Each own-body part's certificate against each arm shape, read once
    // for the cluster of its corners: the bound, or none where it cannot
    // be read (a rest, or a part that is no segment of the body).
    let certified: Map<number, number> = new Map();
    let part: number = -1;
    // The current cluster's part's shapes as convex solids, made on their
    // first read for the cluster.
    let body: physicalShapeGjk.ISolid[] | undefined;
    const visit = (
      corner: IAutoMovieMotionHumanArmGeometry.IFrame["body"][number],
      i: number,
    ): void => {
      const close: Record<Owner, boolean> = {
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
          const key: number = corner.part * mine.length + j;
          const own: EmbeddedVisitOwn =
            owners[j] === "upper"
              ? "upperArm"
              : owners[j] === "lower"
                ? "lowerArm"
                : "hand";
          const rested: boolean = c.lying(a, k, own, corner.bone);

          // The link pair's certificate: every allowance is no more than
          // zero, so a bound past the cut leaves every corner beyond it.
          if (
            certifies &&
            !rested &&
            corner.part < model.parts.length &&
            !certified.has(j)
          ) {
            body ??= frame.shapes
              .filter(
                (s: IAutoMovieMotionHumanArmGeometry.IShape): boolean =>
                  s.part === corner.part,
              )
              .map(
                (
                  s: IAutoMovieMotionHumanArmGeometry.IShape,
                ): physicalShapeGjk.ISolid =>
                  physicalShapeGjk.solid(s.pose, s.shape),
              );
            certified.set(
              j,
              body.length === 0
                ? -Infinity
                : Math.min(
                    ...body.map((solid: physicalShapeGjk.ISolid): number =>
                      HumanAuditModel.certify(
                        [
                          (solids[j] ??= physicalShapeGjk.solid(
                            shape.pose,
                            shape.shape,
                          )),
                        ],
                        model.parts[corner.part]!.offset,
                        solid,
                        floor,
                      ),
                    ),
                  ),
            );
          }
          const least: number | undefined = rested
            ? undefined
            : certified.get(j);
          if (least !== undefined && least > floor) {
            if (!out.has(key))
              out.set(key, {
                corner: i,
                shape,
                index: j,
                owner: owners[j]!,
                bone: corner.bone,
                short: -1000 * least,
                rested: false,
              });
            return;
          }
          const known: IEmbedded | undefined = out.get(key);
          const allowance: number = c.inside(a, k, i, j);

          // Bounded as `deepest`: the bounding sphere and the hull's box
          // bound the distance from below, and a corner they show no deeper
          // than the pair's deepest so far is not read exactly.
          const bound: number =
            1000 *
            (allowance -
              Math.max(apart, HumanArmShapeBox(shape, corner.point)));
          if (known !== undefined && bound <= known.short) return;
          if (bound < -cut && !rested) {
            if (known === undefined)
              out.set(key, {
                corner: i,
                shape,
                index: j,
                owner: owners[j]!,
                bone: corner.bone,
                short: bound,
                rested: false,
              });
            return;
          }
          const distance: number = physicalShapeSegmentDistance(
            shape.pose,
            shape.shape,
            corner.point,
            corner.point,
          );
          const short: number = 1000 * (allowance - distance);
          if (known === undefined || short > known.short) {
            out.set(key, {
              corner: i,
              shape,
              index: j,
              owner: owners[j]!,
              bone: corner.bone,
              short,
              rested,
            });
          }
        },
      );
    };

    // A part's corners all lie within its cluster's sphere, so a cluster
    // whose sphere lies past the reach of every segment's sphere holds no
    // corner any segment's screen keeps (the triangle inequality), and its
    // corners are not read one by one: the bounding-volume hierarchy's
    // first level. The clusters run over the corners in their order, so the
    // corners read and the pairs found are those of a reading of each.
    for (const cluster of HumanArmTrajectoryClusters(frame.body)) {
      if (
        !HumanArmTrajectoryClusters.reaches(cluster, centres.upper, frame.bounds.upper.radius) &&
        !HumanArmTrajectoryClusters.reaches(cluster, centres.lower, frame.bounds.lower.radius) &&
        !HumanArmTrajectoryClusters.reaches(cluster, centres.hand, frame.bounds.hand.radius)
      )
        continue;
      for (let i: number = cluster.start; i < cluster.end; ++i) {
        if (frame.body[i]!.part !== part) {
          part = frame.body[i]!.part;
          certified = new Map();
          body = undefined;
        }
        visit(frame.body[i]!, i);
      }
    }
    return out;
  }
}

/** The segment of the arm a collider shape rides on. */
type Owner = HumanArmTrajectoryShapeOwners.Owner;
,
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangleModel } from "../audit/AutoMovieMotionHumanAuditTangleModel";
import { HumanArmShapeBox } from "./HumanArmShapeBox";
import { HumanArmShapes as S } from "./HumanArmShapes";
import { HumanArmTrajectoryClusters } from "./HumanArmTrajectoryClusters";
import { HumanArmTrajectoryLinks } from "./HumanArmTrajectoryLinks";
import type { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryShapeOwners } from "./HumanArmTrajectoryShapeOwners";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";
import { HumanAuditModel } from "./HumanAuditModel";

/** The alternatives of `EmbeddedVisitOwn`'s site. */
type EmbeddedVisitOwn = "upperArm" | "lowerArm" | "hand";

/** The alternatives of `EmbeddedOwner`'s site. */
type EmbeddedOwner = "upper" | "lower" | "hand";

/** The alternatives of `CrossingOwner`'s site. */
type CrossingOwner = "upper" | "lower" | "hand";

/**
 * Collision pairs against moving arm colliders: the two solved arms against
 * each other, and the body's and external segments' corners inside an arm.
 * HumanArmTrajectoryPairs exposes these readings alongside the forward pairs.
 */
export namespace HumanArmTrajectoryOverlap {
  /**
   * An arm's deepest probe in a collider shape of the other arm, read the same
   * way.
   */
  export interface ICrossing {
    /** The arm whose probe it is. */
    a: number;
    /** The arm's deepest probe. */
    probe: number;
    /** The other arm's shape, placed. */
    shape: IAutoMovieMotionHumanArmGeometry.IShape;
    /** The other arm's segment the shape rides on. */
    owner: CrossingOwner;
    /** The shape's bone. */
    bone: string;
    /** How far the probe lies below what it may, millimetres. */
    short: number;
    /** Whether the pair is a declared rest. */
    rested: boolean;
  }

  /**
   * A corner of the body or an external segment
   * (`HumanArmGeometry.IFrame.body`) inside a collider shape of the arm, read
   * the same way.
   */
  export interface IEmbedded {
    /** The corner's index in the frame's body corners. */
    corner: number;
    /** The arm's shape, placed. */
    shape: IAutoMovieMotionHumanArmGeometry.IShape;
    /**
     * The shape's index among the arm's colliders
     * (`HumanArmGeometry.colliders`).
     */
    index: number;
    /** The arm's segment the shape rides on. */
    owner: EmbeddedOwner;
    /** The corner's bone. */
    bone: string;
    /** How far the corner lies below what it may, millimetres. */
    short: number;
    /** Whether the pair is a declared rest. */
    rested: boolean;
  }

  /**
   * Each arm's deepest collider probe against each of the other arm's collider
   * shapes at a waypoint, by the probe's segment and the shape.
   *
   * Each audit part of an arm is read against a shape of the other first as one
   * link pair (`HumanAuditModel.certify`); a pair certified clear past the cut
   * is left unread with that bound, and the pairs left are read probe by probe,
   * each bounded first as `HumanArmTrajectoryPairs.deepest` bounds its probes.
   *
   * @param c The context.
   * @param k The waypoint.
   * @param first The first arm placed there.
   * @param second The second arm placed there.
   * @param cut How far short of its bound a pair may be left unread,
   *   millimetres (`HumanArmTrajectoryPairs.CUT` where the reading's users need
   *   no more); every pair in reach is read when absent.
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
    const floor: number = cut / 1000;
    const certifies: boolean = Number.isFinite(floor);
    for (let a: number = 0; a < 2; ++a) {
      const theirs: IAutoMovieMotionHumanArmGeometry.IShape[] = S.colliders(
        c.frames[1 - a]![k]!,
        placed[1 - a]!,
      );
      const owners: readonly Owner[] = HumanArmTrajectoryShapeOwners(
        c.frames[1 - a]![k]!.colliders,
      );
      const solids: (physicalShapeGjk.ISolid | undefined)[] = [];

      // Each segment's sphere is screened against each shape before its probes.
      const frame: IAutoMovieMotionHumanArmGeometry.IFrame = c.frames[a]![k]!;
      const own: IAutoMovieMotionHumanArmGeometry.IPlaced = placed[a]!;
      const centres: Record<Owner, IAutoMovieVector3> = {
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
      const near = (owner: Owner): boolean[] =>
        theirs.map(
          (shape: IAutoMovieMotionHumanArmGeometry.IShape): boolean =>
            Vector3.length(Vector3.subtract(centres[owner], shape.centre)) -
              shape.radius -
              frame.bounds[owner].radius <
            T.REACH,
        );
      const screened: Record<Owner, boolean[]> = {
        upper: near("upper"),
        lower: near("lower"),
        hand: near("hand"),
      };
      for (const link of HumanArmTrajectoryLinks(c, a, k, own)) {
        const mine: boolean[] = screened[link.owner];
        const segment: M.Segment = S.segment(frame, link.probes[0]!);
        theirs.forEach(
          (shape: IAutoMovieMotionHumanArmGeometry.IShape, i: number): void => {
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
            const key: string = `${a}|${segment}|${i}`;
            const rested: boolean = c.rested(a, k, link.probes[0]!, shape.bone);

            // The link pair's certificate: every allowance is no more than
            // zero, so a bound past the cut leaves every probe beyond it.
            if (certifies && !rested && link.solids.length !== 0) {
              const solid: physicalShapeGjk.ISolid = (solids[i] ??=
                physicalShapeGjk.solid(shape.pose, shape.shape));
              const least: number = HumanAuditModel.certify(
                link.solids,
                link.offset,
                solid,
                floor,
              );
              if (least > floor) {
                if (!out.has(key))
                  out.set(key, {
                    a,
                    probe: link.probes[0]!,
                    shape,
                    owner: owners[i]!,
                    bone: shape.bone,
                    short: -1000 * least,
                    rested: false,
                  });
                return;
              }
            }
            for (const probe of link.probes) {
              const [p, r]: readonly [IAutoMovieVector3, number] =
                own.probes[probe]!;
              const apart: number =
                Vector3.length(Vector3.subtract(p, shape.centre)) -
                shape.radius -
                r;
              if (apart >= T.REACH) continue;
              const known: ICrossing | undefined = out.get(key);
              const allowance: number =
                c.between(a, k, probe, i) - (grip ?? 0);

              // Bounded as `deepest`: the bounding sphere and the hull's box
              // bound the distance from below, and a probe they show no
              // deeper than the pair's deepest so far is not read exactly.
              const bound: number =
                1000 *
                (allowance - Math.max(apart, HumanArmShapeBox(shape, p) - r));
              if (known !== undefined && bound <= known.short) continue;
              if (bound < -cut && !rested) {
                if (known === undefined)
                  out.set(key, {
                    a,
                    probe,
                    shape,
                    owner: owners[i]!,
                    bone: shape.bone,
                    short: bound,
                    rested: false,
                  });
                continue;
              }
              const distance: number = physicalShapeSegmentDistance(
                shape.pose,
                shape.shape,
                p,
                p,
              );
              const short: number = 1000 * (allowance - (distance - r));
              if (known === undefined || short > known.short)
                out.set(key, {
                  a,
                  probe,
                  shape,
                  owner: owners[i]!,
                  bone: shape.bone,
                  short,
                  rested,
                });
            }
          },
        );
      }
    }
    return out;
  }

  /**
   * Each body or external part's deepest corner inside each of the arm's own
   * collider shapes at a waypoint, the reverse of the forward pair reading. The
   * tangle audit reads every pair both ways and takes the deeper; only own-body
   * parts sharing a joint are excluded.
   *
   * An own-body part is read against an arm shape first as one link pair
   * (`HumanAuditModel.certify`); a pair certified clear past the cut is left
   * unread with that bound, and only the pairs left read their corners, each
   * bounded first as `HumanArmTrajectoryPairs.deepest` bounds its probes.
   *
   * @param c The context.
   * @param a The arm.
   * @param k The waypoint.
   * @param placed The arm placed there.
   * @param cut How far short of its bound a pair may be left unread,
   *   millimetres (`HumanArmTrajectoryPairs.CUT` where the reading's users need
   *   no more; negative, how little past it, for a reader that refuses only
   *   past a slack); every pair in reach is read when absent.
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
    const owners: readonly Owner[] = HumanArmTrajectoryShapeOwners(frame.colliders);
    const model: import {
  Quaternion,
  Vector3,
  physicalShapeGjk,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangleModel } from "../audit/AutoMovieMotionHumanAuditTangleModel";
import { HumanArmShapeBox } from "./HumanArmShapeBox";
import { HumanArmShapes as S } from "./HumanArmShapes";
import { HumanArmTrajectoryClusters } from "./HumanArmTrajectoryClusters";
import { HumanArmTrajectoryLinks } from "./HumanArmTrajectoryLinks";
import type { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryShapeOwners } from "./HumanArmTrajectoryShapeOwners";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";
import { HumanAuditModel } from "./HumanAuditModel";

/** The alternatives of `EmbeddedVisitOwn`'s site. */
type EmbeddedVisitOwn = "upperArm" | "lowerArm" | "hand";

/** The alternatives of `EmbeddedOwner`'s site. */
type EmbeddedOwner = "upper" | "lower" | "hand";

/** The alternatives of `CrossingOwner`'s site. */
type CrossingOwner = "upper" | "lower" | "hand";

/**
 * Collision pairs against moving arm colliders: the two solved arms against
 * each other, and the body's and external segments' corners inside an arm.
 * HumanArmTrajectoryPairs exposes these readings alongside the forward pairs.
 */
export namespace HumanArmTrajectoryOverlap {
  /**
   * An arm's deepest probe in a collider shape of the other arm, read the same
   * way.
   */
  export interface ICrossing {
    /** The arm whose probe it is. */
    a: number;
    /** The arm's deepest probe. */
    probe: number;
    /** The other arm's shape, placed. */
    shape: IAutoMovieMotionHumanArmGeometry.IShape;
    /** The other arm's segment the shape rides on. */
    owner: CrossingOwner;
    /** The shape's bone. */
    bone: string;
    /** How far the probe lies below what it may, millimetres. */
    short: number;
    /** Whether the pair is a declared rest. */
    rested: boolean;
  }

  /**
   * A corner of the body or an external segment
   * (`HumanArmGeometry.IFrame.body`) inside a collider shape of the arm, read
   * the same way.
   */
  export interface IEmbedded {
    /** The corner's index in the frame's body corners. */
    corner: number;
    /** The arm's shape, placed. */
    shape: IAutoMovieMotionHumanArmGeometry.IShape;
    /**
     * The shape's index among the arm's colliders
     * (`HumanArmGeometry.colliders`).
     */
    index: number;
    /** The arm's segment the shape rides on. */
    owner: EmbeddedOwner;
    /** The corner's bone. */
    bone: string;
    /** How far the corner lies below what it may, millimetres. */
    short: number;
    /** Whether the pair is a declared rest. */
    rested: boolean;
  }

  /**
   * Each arm's deepest collider probe against each of the other arm's collider
   * shapes at a waypoint, by the probe's segment and the shape.
   *
   * Each audit part of an arm is read against a shape of the other first as one
   * link pair (`HumanAuditModel.certify`); a pair certified clear past the cut
   * is left unread with that bound, and the pairs left are read probe by probe,
   * each bounded first as `HumanArmTrajectoryPairs.deepest` bounds its probes.
   *
   * @param c The context.
   * @param k The waypoint.
   * @param first The first arm placed there.
   * @param second The second arm placed there.
   * @param cut How far short of its bound a pair may be left unread,
   *   millimetres (`HumanArmTrajectoryPairs.CUT` where the reading's users need
   *   no more); every pair in reach is read when absent.
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
    const floor: number = cut / 1000;
    const certifies: boolean = Number.isFinite(floor);
    for (let a: number = 0; a < 2; ++a) {
      const theirs: IAutoMovieMotionHumanArmGeometry.IShape[] = S.colliders(
        c.frames[1 - a]![k]!,
        placed[1 - a]!,
      );
      const owners: readonly Owner[] = HumanArmTrajectoryShapeOwners(
        c.frames[1 - a]![k]!.colliders,
      );
      const solids: (physicalShapeGjk.ISolid | undefined)[] = [];

      // Each segment's sphere is screened against each shape before its probes.
      const frame: IAutoMovieMotionHumanArmGeometry.IFrame = c.frames[a]![k]!;
      const own: IAutoMovieMotionHumanArmGeometry.IPlaced = placed[a]!;
      const centres: Record<Owner, IAutoMovieVector3> = {
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
      const near = (owner: Owner): boolean[] =>
        theirs.map(
          (shape: IAutoMovieMotionHumanArmGeometry.IShape): boolean =>
            Vector3.length(Vector3.subtract(centres[owner], shape.centre)) -
              shape.radius -
              frame.bounds[owner].radius <
            T.REACH,
        );
      const screened: Record<Owner, boolean[]> = {
        upper: near("upper"),
        lower: near("lower"),
        hand: near("hand"),
      };
      for (const link of HumanArmTrajectoryLinks(c, a, k, own)) {
        const mine: boolean[] = screened[link.owner];
        const segment: M.Segment = S.segment(frame, link.probes[0]!);
        theirs.forEach(
          (shape: IAutoMovieMotionHumanArmGeometry.IShape, i: number): void => {
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
            const key: string = `${a}|${segment}|${i}`;
            const rested: boolean = c.rested(a, k, link.probes[0]!, shape.bone);

            // The link pair's certificate: every allowance is no more than
            // zero, so a bound past the cut leaves every probe beyond it.
            if (certifies && !rested && link.solids.length !== 0) {
              const solid: physicalShapeGjk.ISolid = (solids[i] ??=
                physicalShapeGjk.solid(shape.pose, shape.shape));
              const least: number = HumanAuditModel.certify(
                link.solids,
                link.offset,
                solid,
                floor,
              );
              if (least > floor) {
                if (!out.has(key))
                  out.set(key, {
                    a,
                    probe: link.probes[0]!,
                    shape,
                    owner: owners[i]!,
                    bone: shape.bone,
                    short: -1000 * least,
                    rested: false,
                  });
                return;
              }
            }
            for (const probe of link.probes) {
              const [p, r]: readonly [IAutoMovieVector3, number] =
                own.probes[probe]!;
              const apart: number =
                Vector3.length(Vector3.subtract(p, shape.centre)) -
                shape.radius -
                r;
              if (apart >= T.REACH) continue;
              const known: ICrossing | undefined = out.get(key);
              const allowance: number =
                c.between(a, k, probe, i) - (grip ?? 0);

              // Bounded as `deepest`: the bounding sphere and the hull's box
              // bound the distance from below, and a probe they show no
              // deeper than the pair's deepest so far is not read exactly.
              const bound: number =
                1000 *
                (allowance - Math.max(apart, HumanArmShapeBox(shape, p) - r));
              if (known !== undefined && bound <= known.short) continue;
              if (bound < -cut && !rested) {
                if (known === undefined)
                  out.set(key, {
                    a,
                    probe,
                    shape,
                    owner: owners[i]!,
                    bone: shape.bone,
                    short: bound,
                    rested: false,
                  });
                continue;
              }
              const distance: number = physicalShapeSegmentDistance(
                shape.pose,
                shape.shape,
                p,
                p,
              );
              const short: number = 1000 * (allowance - (distance - r));
              if (known === undefined || short > known.short)
                out.set(key, {
                  a,
                  probe,
                  shape,
                  owner: owners[i]!,
                  bone: shape.bone,
                  short,
                  rested,
                });
            }
          },
        );
      }
    }
    return out;
  }

  /**
   * Each body or external part's deepest corner inside each of the arm's own
   * collider shapes at a waypoint, the reverse of the forward pair reading. The
   * tangle audit reads every pair both ways and takes the deeper; only own-body
   * parts sharing a joint are excluded.
   *
   * An own-body part is read against an arm shape first as one link pair
   * (`HumanAuditModel.certify`); a pair certified clear past the cut is left
   * unread with that bound, and only the pairs left read their corners, each
   * bounded first as `HumanArmTrajectoryPairs.deepest` bounds its probes.
   *
   * @param c The context.
   * @param a The arm.
   * @param k The waypoint.
   * @param placed The arm placed there.
   * @param cut How far short of its bound a pair may be left unread,
   *   millimetres (`HumanArmTrajectoryPairs.CUT` where the reading's users need
   *   no more; negative, how little past it, for a reader that refuses only
   *   past a slack); every pair in reach is read when absent.
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
    const owners: readonly Owner[] = HumanArmTrajectoryShapeOwners(frame.colliders);
    const model: AutoMovieMotionHumanAuditTangleModel.IModel =
      c.setups[a]!.body.tangle;
    const floor: number = cut / 1000;
    const certifies: boolean = Number.isFinite(floor);
    const solids: (physicalShapeGjk.ISolid | undefined)[] = [];
    // Each segment's sphere screens the corners before its shapes.
    const centres: Record<Owner, IAutoMovieVector3> = {
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
    // Each own-body part's certificate against each arm shape, read once
    // for the cluster of its corners: the bound, or none where it cannot
    // be read (a rest, or a part that is no segment of the body).
    let certified: Map<number, number> = new Map();
    let part: number = -1;
    // The current cluster's part's shapes as convex solids, made on their
    // first read for the cluster.
    let body: physicalShapeGjk.ISolid[] | undefined;
    const visit = (
      corner: IAutoMovieMotionHumanArmGeometry.IFrame["body"][number],
      i: number,
    ): void => {
      const close: Record<Owner, boolean> = {
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
          const key: number = corner.part * mine.length + j;
          const own: EmbeddedVisitOwn =
            owners[j] === "upper"
              ? "upperArm"
              : owners[j] === "lower"
                ? "lowerArm"
                : "hand";
          const rested: boolean = c.lying(a, k, own, corner.bone);

          // The link pair's certificate: every allowance is no more than
          // zero, so a bound past the cut leaves every corner beyond it.
          if (
            certifies &&
            !rested &&
            corner.part < model.parts.length &&
            !certified.has(j)
          ) {
            body ??= frame.shapes
              .filter(
                (s: IAutoMovieMotionHumanArmGeometry.IShape): boolean =>
                  s.part === corner.part,
              )
              .map(
                (
                  s: IAutoMovieMotionHumanArmGeometry.IShape,
                ): physicalShapeGjk.ISolid =>
                  physicalShapeGjk.solid(s.pose, s.shape),
              );
            certified.set(
              j,
              body.length === 0
                ? -Infinity
                : Math.min(
                    ...body.map((solid: physicalShapeGjk.ISolid): number =>
                      HumanAuditModel.certify(
                        [
                          (solids[j] ??= physicalShapeGjk.solid(
                            shape.pose,
                            shape.shape,
                          )),
                        ],
                        model.parts[corner.part]!.offset,
                        solid,
                        floor,
                      ),
                    ),
                  ),
            );
          }
          const least: number | undefined = rested
            ? undefined
            : certified.get(j);
          if (least !== undefined && least > floor) {
            if (!out.has(key))
              out.set(key, {
                corner: i,
                shape,
                index: j,
                owner: owners[j]!,
                bone: corner.bone,
                short: -1000 * least,
                rested: false,
              });
            return;
          }
          const known: IEmbedded | undefined = out.get(key);
          const allowance: number = c.inside(a, k, i, j);

          // Bounded as `deepest`: the bounding sphere and the hull's box
          // bound the distance from below, and a corner they show no deeper
          // than the pair's deepest so far is not read exactly.
          const bound: number =
            1000 *
            (allowance -
              Math.max(apart, HumanArmShapeBox(shape, corner.point)));
          if (known !== undefined && bound <= known.short) return;
          if (bound < -cut && !rested) {
            if (known === undefined)
              out.set(key, {
                corner: i,
                shape,
                index: j,
                owner: owners[j]!,
                bone: corner.bone,
                short: bound,
                rested: false,
              });
            return;
          }
          const distance: number = physicalShapeSegmentDistance(
            shape.pose,
            shape.shape,
            corner.point,
            corner.point,
          );
          const short: number = 1000 * (allowance - distance);
          if (known === undefined || short > known.short) {
            out.set(key, {
              corner: i,
              shape,
              index: j,
              owner: owners[j]!,
              bone: corner.bone,
              short,
              rested,
            });
          }
        },
      );
    };

    // A part's corners all lie within its cluster's sphere, so a cluster
    // whose sphere lies past the reach of every segment's sphere holds no
    // corner any segment's screen keeps (the triangle inequality), and its
    // corners are not read one by one: the bounding-volume hierarchy's
    // first level. The clusters run over the corners in their order, so the
    // corners read and the pairs found are those of a reading of each.
    for (const cluster of HumanArmTrajectoryClusters(frame.body)) {
      if (
        !HumanArmTrajectoryClusters.reaches(cluster, centres.upper, frame.bounds.upper.radius) &&
        !HumanArmTrajectoryClusters.reaches(cluster, centres.lower, frame.bounds.lower.radius) &&
        !HumanArmTrajectoryClusters.reaches(cluster, centres.hand, frame.bounds.hand.radius)
      )
        continue;
      for (let i: number = cluster.start; i < cluster.end; ++i) {
        if (frame.body[i]!.part !== part) {
          part = frame.body[i]!.part;
          certified = new Map();
          body = undefined;
        }
        visit(frame.body[i]!, i);
      }
    }
    return out;
  }
}

/** The segment of the arm a collider shape rides on. */
type Owner = HumanArmTrajectoryShapeOwners.Owner;
.IModel =
      c.setups[a]!.body.tangle;
    const floor: number = cut / 1000;
    const certifies: boolean = Number.isFinite(floor);
    const solids: (physicalShapeGjk.ISolid | undefined)[] = [];
    // Each segment's sphere screens the corners before its shapes.
    const centres: Record<Owner, IAutoMovieVector3> = {
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
    // Each own-body part's certificate against each arm shape, read once
    // for the cluster of its corners: the bound, or none where it cannot
    // be read (a rest, or a part that is no segment of the body).
    let certified: Map<number, number> = new Map();
    let part: number = -1;
    // The current cluster's part's shapes as convex solids, made on their
    // first read for the cluster.
    let body: physicalShapeGjk.ISolid[] | undefined;
    const visit = (
      corner: IAutoMovieMotionHumanArmGeometry.IFrame["body"][number],
      i: number,
    ): void => {
      const close: Record<Owner, boolean> = {
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
          const key: number = corner.part * mine.length + j;
          const own: EmbeddedVisitOwn =
            owners[j] === "upper"
              ? "upperArm"
              : owners[j] === "lower"
                ? "lowerArm"
                : "hand";
          const rested: boolean = c.lying(a, k, own, corner.bone);

          // The link pair's certificate: every allowance is no more than
          // zero, so a bound past the cut leaves every corner beyond it.
          if (
            certifies &&
            !rested &&
            corner.part < model.parts.length &&
            !certified.has(j)
          ) {
            body ??= frame.shapes
              .filter(
                (s: IAutoMovieMotionHumanArmGeometry.IShape): boolean =>
                  s.part === corner.part,
              )
              .map(
                (
                  s: IAutoMovieMotionHumanArmGeometry.IShape,
                ): physicalShapeGjk.ISolid =>
                  physicalShapeGjk.solid(s.pose, s.shape),
              );
            certified.set(
              j,
              body.length === 0
                ? -Infinity
                : Math.min(
                    ...body.map((solid: physicalShapeGjk.ISolid): number =>
                      HumanAuditModel.certify(
                        [
                          (solids[j] ??= physicalShapeGjk.solid(
                            shape.pose,
                            shape.shape,
                          )),
                        ],
                        model.parts[corner.part]!.offset,
                        solid,
                        floor,
                      ),
                    ),
                  ),
            );
          }
          const least: number | undefined = rested
            ? undefined
            : certified.get(j);
          if (least !== undefined && least > floor) {
            if (!out.has(key))
              out.set(key, {
                corner: i,
                shape,
                index: j,
                owner: owners[j]!,
                bone: corner.bone,
                short: -1000 * least,
                rested: false,
              });
            return;
          }
          const known: IEmbedded | undefined = out.get(key);
          const allowance: number = c.inside(a, k, i, j);

          // Bounded as `deepest`: the bounding sphere and the hull's box
          // bound the distance from below, and a corner they show no deeper
          // than the pair's deepest so far is not read exactly.
          const bound: number =
            1000 *
            (allowance -
              Math.max(apart, HumanArmShapeBox(shape, corner.point)));
          if (known !== undefined && bound <= known.short) return;
          if (bound < -cut && !rested) {
            if (known === undefined)
              out.set(key, {
                corner: i,
                shape,
                index: j,
                owner: owners[j]!,
                bone: corner.bone,
                short: bound,
                rested: false,
              });
            return;
          }
          const distance: number = physicalShapeSegmentDistance(
            shape.pose,
            shape.shape,
            corner.point,
            corner.point,
          );
          const short: number = 1000 * (allowance - distance);
          if (known === undefined || short > known.short) {
            out.set(key, {
              corner: i,
              shape,
              index: j,
              owner: owners[j]!,
              bone: corner.bone,
              short,
              rested,
            });
          }
        },
      );
    };

    // A part's corners all lie within its cluster's sphere, so a cluster
    // whose sphere lies past the reach of every segment's sphere holds no
    // corner any segment's screen keeps (the triangle inequality), and its
    // corners are not read one by one: the bounding-volume hierarchy's
    // first level. The clusters run over the corners in their order, so the
    // corners read and the pairs found are those of a reading of each.
    for (const cluster of HumanArmTrajectoryClusters(frame.body)) {
      if (
        !HumanArmTrajectoryClusters.reaches(cluster, centres.upper, frame.bounds.upper.radius) &&
        !HumanArmTrajectoryClusters.reaches(cluster, centres.lower, frame.bounds.lower.radius) &&
        !HumanArmTrajectoryClusters.reaches(cluster, centres.hand, frame.bounds.hand.radius)
      )
        continue;
      for (let i: number = cluster.start; i < cluster.end; ++i) {
        if (frame.body[i]!.part !== part) {
          part = frame.body[i]!.part;
          certified = new Map();
          body = undefined;
        }
        visit(frame.body[i]!, i);
      }
    }
    return out;
  }
}

/** The segment of the arm a collider shape rides on. */
type Owner = HumanArmTrajectoryShapeOwners.Owner;
