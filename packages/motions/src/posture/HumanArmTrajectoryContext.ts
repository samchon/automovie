import {
  physicalShapeSegmentDistance,
  preparePoseResolution,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangleModel } from "../audit/AutoMovieMotionHumanAuditTangleModel";
import { HumanArmFrame } from "./HumanArmFrame";
import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmShapes as S } from "./HumanArmShapes";
import type { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";
import { HumanArmTrajectoryWaypoint as W } from "./HumanArmTrajectoryWaypoint";

/** The alternatives of `BuiltInsideOwn`'s site. */
type BuiltInsideOwn = "upperArm" | "lowerArm" | "hand";

/** The alternatives of `BuiltLyingOwn`'s site. */
type BuiltLyingOwn = "upperArm" | "lowerArm" | "hand";

/** The record of `IProblemArmsItem`'s site. */
type IProblemArmsItem = {
  /** The arm. */
  side: AutoMovieHumanSide;

  /**
   * The arm at the first waypoint, and the arm the allowances are read from at
   * every waypoint but a fixed last one.
   */
  rest: IAutoMovieMotionHumanArmClearance.IArm;

  /**
   * The arm at the last waypoint, which the allowances there are read from when
   * the waypoint is fixed; `rest` when absent.
   */
  back?: IAutoMovieMotionHumanArmClearance.IArm;

  /** Its site at each waypoint, on the hold. */
  sites: readonly (M.ISite | undefined)[];

  /** Its segments' declared rests over the hold. */
  rests?: readonly M.IRest[];

  /**
   * Its segments that grasp one object with the other arm over the action
   * (`HumanArmTrajectoryModel.IContext.grasped`); none when absent.
   */
  grasp?: readonly M.Segment[];

  /**
   * The arm the goal's own solution gives at the hold's start, whose grasping
   * pairs' depth the closing and the parting keep
   * (`HumanArmTrajectoryModel.IContext.grasped`); none when absent.
   */
  guess?: IAutoMovieMotionHumanArmClearance.IArm;

  /**
   * The arm a still configuration is drawn to, its distance from it the
   * objective's (`HumanArmTrajectoryModel.IContext.anchor`); none when absent.
   */
  anchor?: IAutoMovieMotionHumanArmClearance.IArm;
};

/**
 * Share only explicitly fixed native setups; all current waypoint geometry
 * remains actual.
 */
function built(
  problem: HumanArmTrajectoryContext.IProblem,
  previous?: M.IContext,
  prepared?: IAutoMovieMotionHumanArmGeometry.ISetup[],
): M.IContext {
  const n: number = problem.times.length;
  const alone: boolean = problem.arms.length === 1;
  const setups: IAutoMovieMotionHumanArmGeometry.ISetup[] =
    prepared ??
    problem.arms.map(
      (
        arm: HumanArmTrajectoryContext.IProblem["arms"][number],
      ): IAutoMovieMotionHumanArmGeometry.ISetup =>
        G.prepare(problem.body, arm.side),
    );
  const rest: number[][] = problem.arms.map(
    (
      arm: HumanArmTrajectoryContext.IProblem["arms"][number],
      a: number,
    ): number[] => G.encode(setups[a]!, arm.rest),
  );
  const back: number[][] = problem.arms.map(
    (
      arm: HumanArmTrajectoryContext.IProblem["arms"][number],
      a: number,
    ): number[] => G.encode(setups[a]!, arm.back ?? arm.rest),
  );
  const free: number[][] = setups.map(
    (setup: IAutoMovieMotionHumanArmGeometry.ISetup): number[] => {
      const out: number[] = [];
      for (let d: number = 0; d < G.DIMENSIONS; ++d)
        if (setup.free[d]!) out.push(d);
      return out;
    },
  );
  const offset: number[] = [];
  let width: number = 0;
  for (const f of free) {
    offset.push(width);
    width += f.length;
  }
  const model: AutoMovieMotionHumanAuditTangleModel.IModel =
    AutoMovieMotionHumanAuditTangleModel.model(problem.body);

  // A hold that lasts to the end leaves the last waypoint to be solved;
  // a still configuration keeps both its ends.
  const open: boolean =
    problem.still !== true &&
    n > 1 &&
    problem.arms.every(
      (arm: HumanArmTrajectoryContext.IProblem["arms"][number]): boolean =>
        arm.sites[n - 1] !== undefined,
    );

  // Each waypoint's record. A fixed last waypoint holds the arm the action
  // leaves to, so the arm resting there is that one.
  const points: W.IWaypoint[] = problem.times.map(
    (_: number, k: number): W.IWaypoint => {
      const prepared: ReturnType<typeof preparePoseResolution> | undefined =
        setups.length > 1 ? preparePoseResolution() : undefined;
      // Each arm reads its own view of the base where it has one
      // (`IBase.arms`): its own rests, never the other hand's.
      const base: HumanArmTrajectoryContext.IProblem["bases"][number] =
        problem.bases[k]!;
      const frames: IAutoMovieMotionHumanArmGeometry.IFrame[] = setups.map(
        (
          setup: IAutoMovieMotionHumanArmGeometry.ISetup,
          a: number,
        ): IAutoMovieMotionHumanArmGeometry.IFrame =>
          HumanArmFrame(setup, base.arms?.[a] ?? base, alone, prepared),
      );
      const sites: (M.ISite | undefined)[] = problem.arms.map(
        (
          arm: HumanArmTrajectoryContext.IProblem["arms"][number],
        ): M.ISite | undefined => arm.sites[k],
      );
      return W(
        problem,
        setups,
        k === n - 1 && !open ? back : rest,
        frames,
        sites,
      );
    },
  );
  const frames: IAutoMovieMotionHumanArmGeometry.IFrame[][] = setups.map(
    (
      _: IAutoMovieMotionHumanArmGeometry.ISetup,
      a: number,
    ): IAutoMovieMotionHumanArmGeometry.IFrame[] =>
      points.map(
        (p: W.IWaypoint): IAutoMovieMotionHumanArmGeometry.IFrame =>
          p.frames[a]!,
      ),
  );
  const sites: (M.ISite | undefined)[][] = setups.map(
    (
      _: IAutoMovieMotionHumanArmGeometry.ISetup,
      a: number,
    ): (M.ISite | undefined)[] =>
      points.map((p: W.IWaypoint): M.ISite | undefined => p.sites[a]),
  );

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

  const context: M.IContext = {
    ...(problem.material === undefined
      ? {}
      : {
          material: {
            parts: problem.material.bones.map((bone) =>
              model.parts.findIndex((part) => part.bone === bone),
            ),
            frame: (
              a: number,
              seconds: number,
            ): IAutoMovieMotionHumanArmGeometry.IFrame => {
              const base: HumanArmTrajectoryContext.IProblem["bases"][number] =
                problem.material!.at(seconds);
              return HumanArmFrame(setups[a]!, base.arms?.[a] ?? base, alone);
            },
          },
        }),
    n,
    still: problem.still === true,
    open,
    ...(problem.arms.some(
      (arm: HumanArmTrajectoryContext.IProblem["arms"][number]): boolean =>
        arm.anchor !== undefined,
    )
      ? {
          anchor: problem.arms.map(
            (
              arm: HumanArmTrajectoryContext.IProblem["arms"][number],
              a: number,
            ): number[] | undefined =>
              arm.anchor === undefined
                ? undefined
                : G.encode(setups[a]!, arm.anchor),
          ),
        }
      : {}),
    times: problem.times,
    // The law's pace the laid course sets (`HumanArmTrajectoryLaid`), kept
    // by a refinement of the same arms; none read yet bounds nothing.
    speed: previous?.speed ?? ((): number => Infinity),
    // A stretch's course beyond its ends, kept by the contexts of the same
    // stretch.
    ...(previous?.beyond === undefined ? {} : { beyond: previous.beyond }),
    setups,
    frames,
    sites,
    rest,
    back,
    free,
    offset,
    width,
    bounds: setups.map(
      (
        setup: IAutoMovieMotionHumanArmGeometry.ISetup,
        a: number,
      ): ([number, number] | null)[] => boxes(setup, rest[a]!, back[a]!),
    ),
    allowed,
    between,
    // A grasp both hands share: on the hold a pair of segments each arm
    // declares is the grasp's contact, not a collision; as the hands close
    // on the object and part from it the pair keeps its depth on the hold
    // by the share of the reach still made, down to the margin every pair
    // keeps at rest, so a parting hand leaves the other arm, never passes
    // through it.
    grasped: (
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
    },
    inside,
    lying,
    normals: setups.map(
      (
        _: IAutoMovieMotionHumanArmGeometry.ISetup,
        a: number,
      ): (IAutoMovieVector3 | undefined)[] =>
        points.map(
          (p: W.IWaypoint): IAutoMovieVector3 | undefined => p.normals[a],
        ),
    ),
    touched: setups.map(
      (_: IAutoMovieMotionHumanArmGeometry.ISetup, a: number): number[] =>
        points.map((p: W.IWaypoint): number => p.touched[a]!),
    ),
    reachable: setups.map(
      (_: IAutoMovieMotionHumanArmGeometry.ISetup, a: number): number[][] =>
        points.map((p: W.IWaypoint): number[] => p.reachable[a]!),
    ),
    rested: declared,
  };
  return context;
}

/**
 * The context of a problem.
 *
 * @param problem The problem.
 * @param previous The context of the same arms on other waypoints, an earlier
 *   reading of the trajectory a refinement splits, whose speed bound and
 *   beyond reading the new context keeps.
 * @returns The context.
 */
export function HumanArmTrajectoryContext(
  problem: HumanArmTrajectoryContext.IProblem,
  previous?: M.IContext,
): M.IContext {
  return built(problem, previous);
}

/**
 * What an arms' trajectory reads, built once per problem
 * (`HumanArmTrajectoryModel.IContext`): each arm's setup and frames, its
 * variables, its hard bounds, every probe's allowance against every shape, and
 * each site's touched collider and normal.
 */
export namespace HumanArmTrajectoryContext {
  /**
   * What the context is built from: the trajectory's problem, or a still
   * configuration of it.
   */
  export interface IProblem {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The waypoints' seconds. */
    times: readonly number[];

    /** What every arm is read against at each waypoint. */
    bases: readonly G.IBase[];
    /** Native body geometry for the authored hand support, when present. */
    material?: M.IMaterialSource;

    /** The arms. */
    arms: readonly IProblemArmsItem[];

    /**
     * Whether the problem is a still configuration
     * (`HumanArmTrajectoryModel.IContext.still`).
     */
    still?: boolean;

    /**
     * The share of the reach made at a second, 0 at rest and 1 on the hold
     * (`HumanArmTrajectory.IProblem.share`); a grasp's closing and parting keep
     * its depth on the hold by it. Nothing is kept when absent.
     *
     * @param seconds Seconds of the problem.
     * @returns The share, 0 to 1.
     */
    share?: (seconds: number) => number;
  }

  /**
   * Bind genuine arm setup metadata for one unchanged-body trajectory
   * operation.
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
    sides: readonly AutoMovieHumanSide[],
  ): (problem: IProblem, previous?: M.IContext) => M.IContext {
    const names: readonly AutoMovieHumanSide[] = [...sides];
    const setups: IAutoMovieMotionHumanArmGeometry.ISetup[] = names.map(
      (side: AutoMovieHumanSide): IAutoMovieMotionHumanArmGeometry.ISetup =>
        G.prepare(body, side),
    );
    return (problem: IProblem, previous?: M.IContext): M.IContext =>
      built(
        problem,
        previous,
        problem.body === body &&
          problem.arms.length === names.length &&
          names.every(
            (side: AutoMovieHumanSide, index: number): boolean =>
              problem.arms[index]!.side === side,
          )
          ? setups
          : undefined,
      );
  }
}

/** The record of `IBoxesR`'s site. */
type IBoxesR = { min: number; max: number };

/** The alternatives of `BoxesKey`'s site. */
type BoxesKey = "flexion" | "abduction" | "twist";

/** The record of `IBoxesTwist`'s site. */
type IBoxesTwist = { min: number; max: number };

/**
 * Each coordinate's hard bounds, every QP's box constraints as in TrajOpt: the
 * twist interval and the elbow's and wrist's ranges of the skeleton, not
 * widened, so no iterate leaves the range forward kinematics clamps to; the
 * rest and the back arm enter clamped (`HumanArmGeometry.encode`). The
 * shoulder's twist stays widened to the rest and the back arm's chart reading,
 * which a clamped clinical triple meets only to its rounding. None for the
 * chart's two, which the chart's disc bounds.
 */
function boxes(
  setup: IAutoMovieMotionHumanArmGeometry.ISetup,
  rest: readonly number[],
  back: readonly number[],
): ([number, number] | null)[] {
  const out: ([number, number] | null)[] = new Array(G.DIMENSIONS).fill(null);
  const twist: IBoxesTwist = setup.constraint.upper.swingTwist!.twist;
  out[2] = [
    Math.min(twist.min, rest[2]!, back[2]!),
    Math.max(twist.max, rest[2]!, back[2]!),
  ];
  (["flexion", "abduction", "twist"] as const).forEach(
    (key: BoxesKey, i: number): void => {
      for (const [constraint, o] of [
        [setup.constraint.lower, 3],
        [setup.constraint.hand, 6],
      ] as const) {
        const r: IBoxesR | null | undefined = constraint?.[key];
        if (r !== null && r !== undefined) out[o + i] = [r.min, r.max];
      }
    },
  );
  return out;
}
