import { physicalShapeSegmentDistance } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieMotionHumanAuditTangleModel,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangleModel } from "../audit/AutoMovieMotionHumanAuditTangleModel";
import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmShapes as S } from "./HumanArmShapes";
import type { HumanArmTrajectoryContext } from "./HumanArmTrajectoryContext";
import type { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";
import type { HumanArmTrajectoryWaypoint as W } from "./HumanArmTrajectoryWaypoint";

/** One arm of the problem. */
type Arm = HumanArmTrajectoryContext.IProblem["arms"][number];

/** One collider of an arm's frame. */
type Collider = IAutoMovieMotionHumanArmGeometry.IFrame["colliders"][number];

/** The arm's three segments, in the order the tables index them. */
const SEGMENTS: readonly M.Segment[] = ["upperArm", "lowerArm", "hand"];

/** Each segment's index in `SEGMENTS`. */
const SEGMENT: Readonly<Record<M.Segment, number>> = {
  upperArm: 0,
  lowerArm: 1,
  hand: 2,
};

/**
 * The pair readers of an arms' trajectory context
 * (`HumanArmTrajectoryModel.IContext`): each probe's and corner's allowance
 * against each shape, the declared rests and the grasp both hands share, read
 * from the context's problem, setups, audit model, waypoints, frames and
 * sites.
 *
 * Every allowance is computed here, once, for every pair the readers can be
 * asked at each waypoint (each probe of the arm against each shape of its frame
 * and each collider of the other arm, each body corner of the frame against
 * each of the arm's own colliders, and each grasping segment's depth where a
 * shared grasp closes or parts), and held in flat arrays indexed by the pair; a
 * reader only indexes them.
 *
 * @param scope What the context built the readers from.
 * @returns The readers.
 */
export function HumanArmTrajectoryAllowances(
  scope: HumanArmTrajectoryAllowances.IScope,
): HumanArmTrajectoryAllowances.IReaders {
  const {
    problem,
    setups,
    model,
    points,
    frames,
    sites,
  }: HumanArmTrajectoryAllowances.IScope = scope;

  // An arm's own declared rest of a segment on a bone (`IRest`).
  const rests = (a: number, own: M.Segment, bone: string): boolean =>
    (problem.arms[a]!.rests ?? []).some(
      (r: M.IRest): boolean => r.part === own && r.on === bone,
    );

  // A declared rest, on the hold: a segment of one arm lying on a bone. A
  // contact is one pair whichever way it is read, so a rest an arm
  // declares on the other arm's segment admits that segment's probes in
  // the first arm too, as the audit reads the deeper of the two.
  const declared = (
    a: number,
    k: number,
    own: M.Segment,
    bone: string,
  ): boolean => {
    if (sites[a]![k] === undefined) return false;
    if (rests(a, own, bone)) return true;
    const b: number = problem.arms.findIndex(
      (arm: Arm): boolean =>
        bone.startsWith(arm.side) && arm !== problem.arms[a],
    );
    if (b < 0) return false;
    const theirs: M.Segment = bone.endsWith("UpperArm")
      ? "upperArm"
      : bone.endsWith("LowerArm")
        ? "lowerArm"
        : "hand";
    const mine: string = `${problem.arms[a]!.side}${own === "upperArm" ? "UpperArm" : own === "lowerArm" ? "LowerArm" : "Hand"}`;
    return rests(b, theirs, mine);
  };
  const rested: M.IContext["rested"] = (
    a: number,
    k: number,
    probe: number,
    bone: string,
  ): boolean => declared(a, k, S.segment(frames[a]![k]!, probe), bone);

  // A body corner inside one of the arm's own colliders: the audit reads
  // every pair both ways, so own-body corners keep their reference depth
  // in the arm's segments as the arm's keep theirs in the body. External
  // frame parts lie beyond the body's model and keep no reference depth.
  const lying: M.IContext["lying"] = (
    a: number,
    k: number,
    own: M.Segment,
    bone: string,
  ): boolean => sites[a]![k] !== undefined && rests(a, own, bone);

  // A declared rest is a resting contact: no deeper than where the
  // segments meet (the audit's reference depth of the pair), and drawn to
  // it by the objective; any other pair may lie `DEPTH` deeper, the skin
  // the audit allows. The segments the goal lays the hand on (the frame's
  // resting parts) are read by the hand as any other pair, since the
  // audit reads them so, and by its forearm at contact depth, read both
  // ways: a hand closed on a partner's wrist or on a weapon the partner
  // holds lays its forearm over the gripped hand, as a two-handed pistol
  // grab's redirecting forearm lies over the gun hand. An own collider's
  // corner keeps the tangle audit's reference depth in that segment; an
  // external collider has no own-body reference. An axis sphere keeps the
  // depth the arm resting at the waypoint has
  // (`HumanArmTrajectoryWaypoint.IWaypoint.placed`).
  const give = (still: boolean): number => (still ? 0 : T.DEPTH);
  const corner = (
    frame: IAutoMovieMotionHumanArmGeometry.IFrame,
    probe: number,
    part: number,
  ): number =>
    AutoMovieMotionHumanAuditTangleModel.reference(
      model,
      frame.segments[probe - G.SURFACE]!,
      part,
    )[frame.corners[probe - G.SURFACE]!]!;

  // Each probe against each shape of its frame, by `probe * shapes +
  // shape`. An axis sphere's depth is read from the arm resting there; a
  // shape outside the arm's reachable set (`HumanArmShapes.reachable`, taken
  // from that same resting arm) stands at least the pairs' reach beyond
  // every probe's sphere, so its exact distance exceeds the probe's radius
  // and its depth is zero without a distance query.
  const allowedTable: Float64Array[][] = points.map(
    (point: W.IWaypoint, k: number): Float64Array[] =>
      point.frames.map(
        (
          frame: IAutoMovieMotionHumanArmGeometry.IFrame,
          a: number,
        ): Float64Array => {
          const shapes: number = frame.shapes.length;
          const probes: number = G.SURFACE + frame.segments.length;
          const out: Float64Array = new Float64Array(probes * shapes);
          const reachable: boolean[] = frame.shapes.map((): boolean => false);
          for (const i of point.reachable[a]!) reachable[i] = true;
          frame.shapes.forEach(
            (
              s: IAutoMovieMotionHumanArmGeometry.IShape,
              shape: number,
            ): void => {
              const kept: number[] = SEGMENTS.map((own: M.Segment): number =>
                give(
                  declared(a, k, own, s.bone) ||
                    (own === "lowerArm" && frame.resting.has(s.part)),
                ),
              );
              const body: boolean = s.part >= 0 && s.part < model.parts.length;
              for (let probe: number = 0; probe < probes; ++probe) {
                const slack: number = kept[SEGMENT[S.segment(frame, probe)]]!;
                let v: number;
                if (probe >= G.SURFACE)
                  v = (body ? -corner(frame, probe, s.part) : 0) - slack;
                else if (reachable[shape]!) {
                  const [p, r]: readonly [IAutoMovieVector3, number] =
                    point.placed[a]!.probes[probe]!;
                  v = Math.min(0, S.gap(frame, shape, p, p) - r) - slack;
                } else v = -slack;
                out[probe * shapes + shape] = v;
              }
            },
          );
          return out;
        },
      ),
  );
  const allowed: M.IContext["allowed"] = (
    a: number,
    k: number,
    probe: number,
    shape: number,
  ): number =>
    allowedTable[k]![a]![probe * frames[a]![k]!.shapes.length + shape]!;

  // Each probe of one arm against each collider of the other, both at
  // rest, by `probe * colliders + collider`.
  const betweenTable: Float64Array[][] = points.map(
    (point: W.IWaypoint, k: number): Float64Array[] =>
      point.frames.map(
        (
          frame: IAutoMovieMotionHumanArmGeometry.IFrame,
          a: number,
        ): Float64Array => {
          const theirs: IAutoMovieMotionHumanArmGeometry.IShape[] =
            point.colliders[1 - a] ?? [];
          const probes: number = G.SURFACE + frame.segments.length;
          const out: Float64Array = new Float64Array(probes * theirs.length);
          theirs.forEach(
            (
              s: IAutoMovieMotionHumanArmGeometry.IShape,
              shape: number,
            ): void => {
              const kept: number[] = SEGMENTS.map((own: M.Segment): number =>
                give(declared(a, k, own, s.bone)),
              );
              for (let probe: number = 0; probe < probes; ++probe) {
                const slack: number = kept[SEGMENT[S.segment(frame, probe)]]!;
                let v: number;
                if (probe >= G.SURFACE)
                  v = -corner(frame, probe, s.part) - slack;
                else {
                  const [p, r]: readonly [IAutoMovieVector3, number] =
                    point.placed[a]!.probes[probe]!;
                  v =
                    Math.min(
                      0,
                      physicalShapeSegmentDistance(s.pose, s.shape, p, p) - r,
                    ) - slack;
                }
                out[probe * theirs.length + shape] = v;
              }
            },
          );
          return out;
        },
      ),
  );
  const between: M.IContext["between"] = (
    a: number,
    k: number,
    probe: number,
    shape: number,
  ): number =>
    betweenTable[k]![a]![probe * points[k]!.colliders[1 - a]!.length + shape]!;

  // Each body corner of the frame inside each of the arm's own collider
  // shapes, one entry per shape of each collider, by `shape * corners +
  // corner`.
  const insideTable: Float64Array[][] = points.map(
    (point: W.IWaypoint, k: number): Float64Array[] =>
      point.frames.map(
        (
          frame: IAutoMovieMotionHumanArmGeometry.IFrame,
          a: number,
        ): Float64Array => {
          const flat: Collider[] = frame.colliders.flatMap(
            (col: Collider): Collider[] => col.shapes.map((): Collider => col),
          );
          const corners: number = frame.body.length;
          const out: Float64Array = new Float64Array(flat.length * corners);
          flat.forEach((col: Collider, shape: number): void => {
            const own: M.Segment =
              col.owner === "upper"
                ? "upperArm"
                : col.owner === "lower"
                  ? "lowerArm"
                  : "hand";
            frame.body.forEach(
              (
                body: IAutoMovieMotionHumanArmGeometry.IFrame["body"][number],
                i: number,
              ): void => {
                out[shape * corners + i] =
                  (body.part < model.parts.length
                    ? -AutoMovieMotionHumanAuditTangleModel.reference(
                        model,
                        body.part,
                        col.part,
                      )[body.corner]!
                    : 0) -
                  give(
                    lying(a, k, own, body.bone) ||
                      (own === "lowerArm" && frame.resting.has(body.part)),
                  );
              },
            );
          });
          return out;
        },
      ),
  );
  const inside: M.IContext["inside"] = (
    a: number,
    k: number,
    at: number,
    shape: number,
  ): number => insideTable[k]![a]![shape * frames[a]![k]!.body.length + at]!;

  // A grasp both hands share: on the hold a pair of segments each arm
  // declares is the grasp's contact, not a collision; as the hands close
  // on the object and part from it the pair keeps its depth on the hold
  // by the share of the reach still made, down to the margin every pair
  // keeps at rest, so a parting hand leaves the other arm, never passes
  // through it. That depth is the grasping segment's deepest probe in the
  // other arm's shape with both arms at the goal's own solution (`guess`),
  // read at the waypoint's own base as the rest reference is; the solved
  // hold lies near, not on, the guess. It is read only at the waypoints a
  // grasp closes or parts at, for each segment an arm grasps with.
  const grasping: boolean =
    problem.arms.length === 2 &&
    problem.arms.every((arm: Arm): boolean => (arm.grasp ?? []).length !== 0);
  const holding: readonly boolean[] = problem.times.map(
    (_: number, k: number): boolean =>
      problem.arms.every((arm: Arm): boolean => arm.sites[k] !== undefined),
  );
  const shares: readonly number[] = problem.times.map(
    (seconds: number, k: number): number =>
      grasping && !holding[k]!
        ? Math.min(1, Math.max(0, problem.share?.(seconds) ?? 0))
        : 0,
  );
  const guessed: number[][] | undefined =
    grasping &&
    problem.arms.every((arm: Arm): boolean => arm.guess !== undefined)
      ? problem.arms.map((arm: Arm, a: number): number[] =>
          G.encode(setups[a]!, arm.guess!),
        )
      : undefined;
  const depths: (Float64Array | undefined)[][][] = problem.times.map(
    (_: number, k: number): (Float64Array | undefined)[][] => {
      if (guessed === undefined || !(shares[k]! > 0)) return [];
      const held: IAutoMovieMotionHumanArmGeometry.IPlaced[] = setups.map(
        (
          setup: IAutoMovieMotionHumanArmGeometry.ISetup,
          b: number,
        ): IAutoMovieMotionHumanArmGeometry.IPlaced =>
          G.placed(setup, frames[b]![k]!, guessed[b]!),
      );
      return problem.arms.map(
        (arm: Arm, a: number): (Float64Array | undefined)[] => {
          const theirs: IAutoMovieMotionHumanArmGeometry.IShape[] = S.colliders(
            frames[1 - a]![k]!,
            held[1 - a]!,
          );
          return SEGMENTS.map((own: M.Segment): Float64Array | undefined =>
            (arm.grasp ?? []).includes(own)
              ? Float64Array.from(
                  theirs,
                  (s: IAutoMovieMotionHumanArmGeometry.IShape): number => {
                    let deepest: number = 0;
                    held[a]!.probes.forEach(
                      (
                        [p, r]: readonly [IAutoMovieVector3, number],
                        probe: number,
                      ): void => {
                        if (
                          probe >= G.SURFACE &&
                          S.segment(frames[a]![k]!, probe) === own
                        )
                          deepest = Math.max(
                            deepest,
                            r -
                              physicalShapeSegmentDistance(
                                s.pose,
                                s.shape,
                                p,
                                p,
                              ),
                          );
                      },
                    );
                    return deepest;
                  },
                )
              : undefined,
          );
        },
      );
    },
  );
  const grasped: M.IContext["grasped"] = (
    a: number,
    k: number,
    own: M.Segment,
    other: M.Segment,
    shape: number,
  ): number | undefined => {
    if (
      !(
        grasping &&
        problem.arms[a]!.grasp!.includes(own) &&
        problem.arms[1 - a]!.grasp!.includes(other)
      )
    )
      return undefined;
    if (holding[k]!) return Infinity;
    const share: number = shares[k]!;
    if (!(share > 0)) return 0;
    const depth: Float64Array | undefined = depths[k]![a]?.[SEGMENT[own]];
    return depth === undefined ? 0 : share * depth[shape]!;
  };

  return { rested, allowed, between, lying, inside, grasped };
}

/** What the pair readers read and what they are. */
export namespace HumanArmTrajectoryAllowances {
  /** What an arms' trajectory context builds its pair readers from. */
  export interface IScope {
    /** The problem. */
    problem: HumanArmTrajectoryContext.IProblem;

    /** Each arm's setup. */
    setups: IAutoMovieMotionHumanArmGeometry.ISetup[];

    /** The body's tangle audit model. */
    model: IAutoMovieMotionHumanAuditTangleModel.IModel;

    /** Each waypoint's record. */
    points: W.IWaypoint[];

    /** Each arm's frame at each waypoint. */
    frames: IAutoMovieMotionHumanArmGeometry.IFrame[][];

    /** Each arm's site at each waypoint. */
    sites: (M.ISite | undefined)[][];
  }

  /** The context members the pair readers are. */
  export type Reader =
    | "rested"
    | "allowed"
    | "between"
    | "lying"
    | "inside"
    | "grasped";

  /** The pair readers. */
  export type IReaders = Pick<M.IContext, Reader>;
}
