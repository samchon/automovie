import { physicalShapeSegmentDistance } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangleModel } from "../audit/AutoMovieMotionHumanAuditTangleModel";
import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmShapes as S } from "./HumanArmShapes";
import type { HumanArmTrajectoryContext } from "./HumanArmTrajectoryContext";
import type { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";
import { HumanArmTrajectoryWaypoint as W } from "./HumanArmTrajectoryWaypoint";

/** The alternatives of `BuiltInsideOwn`'s site. */
type BuiltInsideOwn = "upperArm" | "lowerArm" | "hand";

/** The alternatives of `BuiltLyingOwn`'s site. */
type BuiltLyingOwn = "upperArm" | "lowerArm" | "hand";

/**
 * The pair readers of an arms' trajectory context
 * (`HumanArmTrajectoryModel.IContext`): each probe's and corner's allowance
 * against each shape, the declared rests and the grasp both hands share, read
 * from the context's problem, setups, audit model, waypoints, frames and sites.
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

  // A declared rest, on the hold: a segment of one arm lying on a bone. A
  // contact is one pair whichever way it is read, so a rest an arm
  // declares on the other arm's segment admits that segment's probes in
  // the first arm too, as the audit reads the deeper of the two.
  const declared: M.IContext["rested"] = (
    a: number,
    k: number,
    probe: number,
    bone: string,
  ): boolean => {
    if (sites[a]![k] === undefined) return false;
    const own: string = S.segment(frames[a]![k]!, probe);
    if (
      (problem.arms[a]!.rests ?? []).some(
        (r: M.IRest): boolean => r.part === own && r.on === bone,
      )
    )
      return true;
    const b: number = problem.arms.findIndex(
      (arm: HumanArmTrajectoryContext.IProblem["arms"][number]): boolean =>
        bone.startsWith(arm.side) && arm !== problem.arms[a],
    );
    if (b < 0) return false;
    const theirs: string = bone.endsWith("UpperArm")
      ? "upperArm"
      : bone.endsWith("LowerArm")
        ? "lowerArm"
        : "hand";
    const mine: string = `${problem.arms[a]!.side}${own === "upperArm" ? "UpperArm" : own === "lowerArm" ? "LowerArm" : "Hand"}`;
    return (problem.arms[b]!.rests ?? []).some(
      (r: M.IRest): boolean => r.part === theirs && r.on === mine,
    );
  };

  // A declared rest is a resting contact: no deeper than where the
  // segments meet (the audit's reference depth of the pair), and drawn to
  // it by the objective; any other pair may lie `DEPTH` deeper, the skin
  // the audit allows. The segments the goal lays the hand on (the frame's
  // resting parts) are read by the hand as any other pair, since the
  // audit reads them so, and by its forearm at contact depth, read both
  // ways: a hand closed on a partner's wrist or on a
  // weapon the partner holds lays its forearm over the gripped hand, as a
  // two-handed pistol grab's redirecting forearm lies over the gun hand.
  // An own collider's corner keeps the tangle audit's reference depth in
  // that segment; an external collider has no own-body reference. An axis
  // sphere keeps the depth the arm resting at the waypoint has
  // (`HumanArmTrajectoryWaypoint.IWaypoint.placed`).
  const give: (rested: boolean) => number = (rested: boolean): number =>
    rested ? 0 : T.DEPTH;
  const corner: (
    a: number,
    k: number,
    probe: number,
    part: number,
  ) => number = (a: number, k: number, probe: number, part: number): number =>
    AutoMovieMotionHumanAuditTangleModel.reference(
      model,
      frames[a]![k]!.segments[probe - G.SURFACE]!,
      part,
    )[frames[a]![k]!.corners[probe - G.SURFACE]!]!;

  // Each memo is the waypoint's own, one array per arm indexed by the pair's
  // two indices as one number, since the pair readings ask it for every
  // probe and shape at every iterate.
  const allowed: M.IContext["allowed"] = (
    a: number,
    k: number,
    probe: number,
    shape: number,
  ): number => {
    const point: W.IWaypoint = points[k]!;
    const memo: Float64Array = (point.allowed[a] ??= W.memo(
      point.frames[a]!,
      point.frames[a]!.shapes.length,
    ));
    const key: number = probe * point.frames[a]!.shapes.length + shape;
    let v: number = key < memo.length ? memo[key]! : NaN;
    if (Number.isNaN(v)) {
      const frame: IAutoMovieMotionHumanArmGeometry.IFrame = point.frames[a]!;
      const s: IAutoMovieMotionHumanArmGeometry.IShape = frame.shapes[shape]!;
      const lower: boolean =
        probe >= G.SURFACE
          ? frame.owners[probe - G.SURFACE] === "lower"
          : probe >= 2 && probe < 6;
      const rested: number = give(
        declared(a, k, probe, s.bone) || (lower && frame.resting.has(s.part)),
      );
      if (probe >= G.SURFACE)
        v =
          (s.part >= 0 && s.part < model.parts.length
            ? -corner(a, k, probe, s.part)
            : 0) - rested;
      else {
        const [p, r]: readonly [IAutoMovieVector3, number] =
          point.placed[a]!.probes[probe]!;
        v = Math.min(0, S.gap(frame, shape, p, p) - r) - rested;
      }
      if (key < memo.length) memo[key] = v;
    }
    return v;
  };

  // A probe of one arm against a collider of the other, both at rest.
  const between: M.IContext["between"] = (
    a: number,
    k: number,
    probe: number,
    shape: number,
    bone: string,
  ): number => {
    const point: W.IWaypoint = points[k]!;
    const memo: Float64Array = (point.between[a] ??= W.memo(
      point.frames[a]!,
      point.colliders[1 - a]!.length,
    ));
    const key: number = probe * point.colliders[1 - a]!.length + shape;
    let v: number = key < memo.length ? memo[key]! : NaN;
    if (Number.isNaN(v)) {
      const s: IAutoMovieMotionHumanArmGeometry.IShape =
        point.colliders[1 - a]![shape]!;
      const rested: number = give(declared(a, k, probe, bone));
      if (probe >= G.SURFACE) v = -corner(a, k, probe, s.part) - rested;
      else {
        const [p, r]: readonly [IAutoMovieVector3, number] =
          point.placed[a]!.probes[probe]!;
        v =
          Math.min(0, physicalShapeSegmentDistance(s.pose, s.shape, p, p) - r) -
          rested;
      }
      if (key < memo.length) memo[key] = v;
    }
    return v;
  };

  // A body corner inside one of the arm's own colliders: the audit reads
  // every pair both ways, so own-body corners keep their reference depth
  // in the arm's segments as the arm's keep theirs in the body. External
  // frame parts lie beyond the body's model and keep no reference depth.
  const lying: M.IContext["lying"] = (
    a: number,
    k: number,
    own: BuiltLyingOwn,
    bone: string,
  ): boolean =>
    sites[a]![k] !== undefined &&
    (problem.arms[a]!.rests ?? []).some(
      (r: M.IRest): boolean => r.part === own && r.on === bone,
    );
  const collider: (
    a: number,
    k: number,
    shape: number,
  ) => IAutoMovieMotionHumanArmGeometry.IFrame["colliders"][number] = (
    a: number,
    k: number,
    shape: number,
  ): IAutoMovieMotionHumanArmGeometry.IFrame["colliders"][number] => {
    const point: W.IWaypoint = points[k]!;
    let list: IAutoMovieMotionHumanArmGeometry.IFrame["colliders"] | undefined =
      point.flat[a];
    if (list === undefined) {
      list = point.frames[a]!.colliders.flatMap(
        (
          col: IAutoMovieMotionHumanArmGeometry.IFrame["colliders"][number],
        ): IAutoMovieMotionHumanArmGeometry.IFrame["colliders"] =>
          col.shapes.map(
            (): IAutoMovieMotionHumanArmGeometry.IFrame["colliders"][number] =>
              col,
          ),
      );
      point.flat[a] = list;
    }
    return list[shape]!;
  };
  const inside: M.IContext["inside"] = (
    a: number,
    k: number,
    corner: number,
    shape: number,
  ): number => {
    const point: W.IWaypoint = points[k]!;
    const key: number = shape * point.frames[a]!.body.length + corner;
    let v: number | undefined = point.inside[a]!.get(key);
    if (v === undefined) {
      const body: IAutoMovieMotionHumanArmGeometry.IFrame["body"][number] =
        point.frames[a]!.body[corner]!;
      const col: IAutoMovieMotionHumanArmGeometry.IFrame["colliders"][number] =
        collider(a, k, shape);
      const own: BuiltInsideOwn =
        col.owner === "upper"
          ? "upperArm"
          : col.owner === "lower"
            ? "lowerArm"
            : "hand";
      v =
        (body.part < model.parts.length
          ? -AutoMovieMotionHumanAuditTangleModel.reference(
              model,
              body.part,
              col.part,
            )[body.corner]!
          : 0) -
        give(
          lying(a, k, own, body.bone) ||
            (own === "lowerArm" && point.frames[a]!.resting.has(body.part)),
        );
      point.inside[a]!.set(key, v);
    }
    return v;
  };

  // A grasp both hands share (`HumanArmTrajectoryModel.IContext.grasped`):
  // the depth a grasping segment has in the other arm's shape with both
  // arms on the hold, the goal's own solution there (`guess`), read at a
  // waypoint's own base as the rest reference is, once per waypoint,
  // segment and shape; none without both guesses. The segment's deepest
  // probe bounds it, since the solved hold lies near, not on, the guess.
  const holding: readonly boolean[] = problem.times.map(
    (_: number, k: number): boolean =>
      problem.arms.every(
        (arm: HumanArmTrajectoryContext.IProblem["arms"][number]): boolean =>
          arm.sites[k] !== undefined,
      ),
  );
  const guessed: number[][] | undefined =
    problem.arms.length === 2 &&
    problem.arms.every(
      (arm: HumanArmTrajectoryContext.IProblem["arms"][number]): boolean =>
        arm.guess !== undefined,
    )
      ? problem.arms.map(
          (
            arm: HumanArmTrajectoryContext.IProblem["arms"][number],
            a: number,
          ): number[] => G.encode(setups[a]!, arm.guess!),
        )
      : undefined;
  const held: (IAutoMovieMotionHumanArmGeometry.IPlaced[] | undefined)[] = [];
  const heldShapes: (
    | IAutoMovieMotionHumanArmGeometry.IShape[][]
    | undefined
  )[] = [];
  const holdDepths: Map<string, number> = new Map();
  const holdDepth = (
    a: number,
    k: number,
    own: M.Segment,
    shape: number,
  ): number => {
    if (guessed === undefined) return 0;
    const key: string = `${a}|${k}|${own}|${shape}`;
    let v: number | undefined = holdDepths.get(key);
    if (v === undefined) {
      const placed: IAutoMovieMotionHumanArmGeometry.IPlaced[] = (held[k] ??=
        setups.map(
          (
            setup: IAutoMovieMotionHumanArmGeometry.ISetup,
            b: number,
          ): IAutoMovieMotionHumanArmGeometry.IPlaced =>
            G.placed(setup, frames[b]![k]!, guessed[b]!),
        ));
      const theirs: IAutoMovieMotionHumanArmGeometry.IShape = (heldShapes[k] ??=
        placed.map(
          (
            arm: IAutoMovieMotionHumanArmGeometry.IPlaced,
            b: number,
          ): IAutoMovieMotionHumanArmGeometry.IShape[] =>
            S.colliders(frames[b]![k]!, arm),
        ))[1 - a]![shape]!;
      let deepest: number = 0;
      placed[a]!.probes.forEach(
        ([p, r]: readonly [IAutoMovieVector3, number], probe: number): void => {
          if (probe < G.SURFACE || S.segment(frames[a]![k]!, probe) !== own)
            return;
          deepest = Math.max(
            deepest,
            r - physicalShapeSegmentDistance(theirs.pose, theirs.shape, p, p),
          );
        },
      );
      holdDepths.set(key, (v = deepest));
    }
    return v;
  };

  // A grasp both hands share: on the hold a pair of segments each arm
  // declares is the grasp's contact, not a collision; as the hands close
  // on the object and part from it the pair keeps its depth on the hold
  // by the share of the reach still made, down to the margin every pair
  // keeps at rest, so a parting hand leaves the other arm, never passes
  // through it.
  const grasped: M.IContext["grasped"] = (
    a: number,
    k: number,
    own: M.Segment,
    other: M.Segment,
    shape: number,
  ): number | undefined => {
    if (
      !(
        problem.arms.length === 2 &&
        (problem.arms[a]!.grasp ?? []).includes(own) &&
        (problem.arms[1 - a]!.grasp ?? []).includes(other)
      )
    )
      return undefined;
    if (holding[k]!) return Infinity;
    const share: number = Math.min(
      1,
      Math.max(0, problem.share?.(problem.times[k]!) ?? 0),
    );
    return share > 0 ? share * holdDepth(a, k, own, shape) : 0;
  };

  return { rested: declared, allowed, between, lying, inside, grasped };
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
    model: AutoMovieMotionHumanAuditTangleModel.IModel;

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