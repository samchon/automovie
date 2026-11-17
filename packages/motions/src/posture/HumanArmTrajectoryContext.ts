import type { IAutoMovieMotionHumanArmClearance, IAutoMovieMotionHumanArmGeometry, IAutoMovieMotionHumanBody, IAutoMovieVector3 } from "@automovie/interface";

import { physicalShapeSegmentDistance } from "@automovie/engine";

import { AutoMovieMotionHumanAuditTangleModel } from "../audit/AutoMovieMotionHumanAuditTangleModel";
import { HumanArmFrame } from "./HumanArmFrame";
import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmShapes as S } from "./HumanArmShapes";
import type { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";
import { HumanArmTrajectoryWaypoint as W } from "./HumanArmTrajectoryWaypoint";

/**
 * What an arms' trajectory reads, built once per problem
 * (`HumanArmTrajectoryModel.IContext`): each arm's setup and frames, its
 * variables, its hard bounds, every probe's allowance against every shape,
 * and each site's touched collider and normal. What a waypoint holds is
 * built once per waypoint, so a refinement of the same arms reads only the
 * waypoints it adds.
 */
export namespace HumanArmTrajectoryContext {
  /** What the context is built from: the trajectory's problem, or a still configuration of it. */
  export interface IProblem {
    /** The body. */
    body: IAutoMovieMotionHumanBody;
    /** The waypoints' seconds. */
    times: readonly number[];
    /** What every arm is read against at each waypoint. */
    bases: readonly G.IBase[];
    /** The arms. */
    arms: readonly {
      /** The arm. */
      side: "left" | "right";
      /** The arm at the first waypoint, and the arm the allowances are read from at every waypoint but a fixed last one. */
      rest: IAutoMovieMotionHumanArmClearance.IArm;
      /** The arm at the last waypoint, which the allowances there are read from when the waypoint is fixed; `rest` when absent. */
      back?: IAutoMovieMotionHumanArmClearance.IArm;
      /** Its site at each waypoint, on the hold. */
      sites: readonly (M.ISite | undefined)[];
      /** Its segments' declared rests over the hold. */
      rests?: readonly M.IRest[];
      /** Its segments that grasp one object with the other arm over the action (`HumanArmTrajectoryModel.IContext.grasped`); none when absent. */
      grasp?: readonly M.Segment[];
      /** The arm a still configuration is drawn to, its distance from it the objective's (`HumanArmTrajectoryModel.IContext.anchor`); none when absent. */
      anchor?: IAutoMovieMotionHumanArmClearance.IArm;
    }[];
    /** Whether the problem is a still configuration (`HumanArmTrajectoryModel.IContext.still`). */
    still?: boolean;
  }

  /**
   * The context of a problem.
   *
   * @param problem The problem.
   * @param previous The context of the same arms on other waypoints, an earlier reading of the trajectory a refinement splits: a waypoint at a second it read, on the same base and with the same sites, keeps what was built there (its frames, the arm resting there placed, each probe's allowances, each site's touched collider and normal), so only the new waypoints are read.
   * @returns The context.
   */
  export function of(problem: IProblem, previous?: M.IContext): M.IContext {
    const n: number = problem.times.length;
    const alone: boolean = problem.arms.length === 1;
    const setups: IAutoMovieMotionHumanArmGeometry.ISetup[] = problem.arms.map(
      (arm: IProblem["arms"][number]): IAutoMovieMotionHumanArmGeometry.ISetup =>
        G.prepare(problem.body, arm.side),
    );
    const rest: number[][] = problem.arms.map(
      (arm: IProblem["arms"][number], a: number): number[] =>
        G.encode(setups[a]!, arm.rest),
    );
    const back: number[][] = problem.arms.map(
      (arm: IProblem["arms"][number], a: number): number[] =>
        G.encode(setups[a]!, arm.back ?? arm.rest),
    );
    const free: number[][] = setups.map((setup: IAutoMovieMotionHumanArmGeometry.ISetup): number[] => {
      const out: number[] = [];
      for (let d: number = 0; d < G.DIMENSIONS; ++d)
        if (setup.free[d]!) out.push(d);
      return out;
    });
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
        (arm: IProblem["arms"][number]): boolean =>
          arm.sites[n - 1] !== undefined,
      );

    // Each waypoint's record, kept from an earlier reading of the same arms
    // where its base and its sites are the same records, built otherwise. A
    // fixed last waypoint holds the arm the action leaves to, so the arm
    // resting there is that one.
    const store: Map<number, W.IWaypoint> =
      (previous === undefined ? undefined : STORES.get(previous)) ?? new Map();
    const points: W.IWaypoint[] = problem.times.map(
      (t: number, k: number): W.IWaypoint => {
        const frames: IAutoMovieMotionHumanArmGeometry.IFrame[] = setups.map(
          (setup: IAutoMovieMotionHumanArmGeometry.ISetup): IAutoMovieMotionHumanArmGeometry.IFrame =>
            HumanArmFrame.of(setup, problem.bases[k]!, alone),
        );
        const sites: (M.ISite | undefined)[] = problem.arms.map(
          (arm: IProblem["arms"][number]): M.ISite | undefined => arm.sites[k],
        );
        const known: W.IWaypoint | undefined = store.get(t);
        if (
          known !== undefined &&
          known.frames.every(
            (f: IAutoMovieMotionHumanArmGeometry.IFrame, a: number): boolean => f === frames[a],
          ) &&
          known.sites.every(
            (s: M.ISite | undefined, a: number): boolean => s === sites[a],
          )
        )
          return known;
        const made: W.IWaypoint = W.of(
          problem,
          setups,
          k === n - 1 && !open ? back : rest,
          frames,
          sites,
        );
        store.set(t, made);
        return made;
      },
    );
    const frames: IAutoMovieMotionHumanArmGeometry.IFrame[][] = setups.map(
      (_: IAutoMovieMotionHumanArmGeometry.ISetup, a: number): IAutoMovieMotionHumanArmGeometry.IFrame[] =>
        points.map((p: W.IWaypoint): IAutoMovieMotionHumanArmGeometry.IFrame => p.frames[a]!),
    );
    const sites: (M.ISite | undefined)[][] = setups.map(
      (_: IAutoMovieMotionHumanArmGeometry.ISetup, a: number): (M.ISite | undefined)[] =>
        points.map((p: W.IWaypoint): M.ISite | undefined => p.sites[a]),
    );

    // A declared rest, on the hold: a segment of one arm lying on a bone. A
    // contact is one pair whichever way it is read, so a rest an arm
    // declares on the other arm's segment admits that segment's probes in
    // the first arm too, as the audit reads the deeper of the two.
    const declared = (
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
        (arm: IProblem["arms"][number]): boolean =>
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
    // it by the objective; any other pair keeps `DEPTH` of margin. An
    // own collider's corner keeps the tangle audit's reference depth in
    // that segment; an external collider has no own-body reference. An axis
    // sphere keeps the depth the arm resting at the waypoint has
    // (`HumanArmTrajectoryWaypoint.IWaypoint.placed`).
    const give = (rested: boolean): number => (rested ? 0 : T.DEPTH);
    const corner = (
      a: number,
      k: number,
      probe: number,
      part: number,
    ): number =>
      AutoMovieMotionHumanAuditTangleModel.reference(
        model,
        frames[a]![k]!.segments[probe - G.SURFACE]!,
        part,
      )[frames[a]![k]!.corners[probe - G.SURFACE]!]!;

    // Each memo is the waypoint's own, one map per arm keyed by the pair's
    // two indices as one number, since the pair readings ask it for every
    // probe and shape at every iterate.
    const allowed = (
      a: number,
      k: number,
      probe: number,
      shape: number,
    ): number => {
      const point: W.IWaypoint = points[k]!;
      const key: number = probe * point.frames[a]!.shapes.length + shape;
      let v: number | undefined = point.allowed[a]!.get(key);
      if (v === undefined) {
        const frame: IAutoMovieMotionHumanArmGeometry.IFrame = point.frames[a]!;
        const s: IAutoMovieMotionHumanArmGeometry.IShape = frame.shapes[shape]!;
        const rested: number = give(declared(a, k, probe, s.bone));
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
        point.allowed[a]!.set(key, v);
      }
      return v;
    };

    // A probe of one arm against a collider of the other, both at rest.
    const between = (
      a: number,
      k: number,
      probe: number,
      shape: number,
      bone: string,
    ): number => {
      const point: W.IWaypoint = points[k]!;
      const key: number = probe * point.colliders[1 - a]!.length + shape;
      let v: number | undefined = point.between[a]!.get(key);
      if (v === undefined) {
        const s: IAutoMovieMotionHumanArmGeometry.IShape = point.colliders[1 - a]![shape]!;
        const rested: number = give(declared(a, k, probe, bone));
        if (probe >= G.SURFACE) v = -corner(a, k, probe, s.part) - rested;
        else {
          const [p, r]: readonly [IAutoMovieVector3, number] =
            point.placed[a]!.probes[probe]!;
          v =
            Math.min(
              0,
              physicalShapeSegmentDistance(s.pose, s.shape, p, p) - r,
            ) - rested;
        }
        point.between[a]!.set(key, v);
      }
      return v;
    };

    // A body corner inside one of the arm's own colliders: the audit reads
    // every pair both ways, so own-body corners keep their reference depth
    // in the arm's segments as the arm's keep theirs in the body. External
    // frame parts lie beyond the body's model and keep no reference depth.
    const lying = (
      a: number,
      k: number,
      own: "upperArm" | "lowerArm" | "hand",
      bone: string,
    ): boolean =>
      sites[a]![k] !== undefined &&
      (problem.arms[a]!.rests ?? []).some(
        (r: M.IRest): boolean => r.part === own && r.on === bone,
      );
    const collider = (
      a: number,
      k: number,
      shape: number,
    ): IAutoMovieMotionHumanArmGeometry.IFrame["colliders"][number] => {
      const point: W.IWaypoint = points[k]!;
      let list: IAutoMovieMotionHumanArmGeometry.IFrame["colliders"] | undefined = point.flat[a];
      if (list === undefined) {
        list = point.frames[a]!.colliders.flatMap(
          (col: IAutoMovieMotionHumanArmGeometry.IFrame["colliders"][number]): IAutoMovieMotionHumanArmGeometry.IFrame["colliders"] =>
            col.shapes.map((): IAutoMovieMotionHumanArmGeometry.IFrame["colliders"][number] => col),
        );
        point.flat[a] = list;
      }
      return list[shape]!;
    };
    const inside = (
      a: number,
      k: number,
      corner: number,
      shape: number,
    ): number => {
      const point: W.IWaypoint = points[k]!;
      const key: number = shape * point.frames[a]!.body.length + corner;
      let v: number | undefined = point.inside[a]!.get(key);
      if (v === undefined) {
        const body: IAutoMovieMotionHumanArmGeometry.IFrame["body"][number] = point.frames[a]!.body[corner]!;
        const col: IAutoMovieMotionHumanArmGeometry.IFrame["colliders"][number] = collider(a, k, shape);
        const own: "upperArm" | "lowerArm" | "hand" =
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
            : 0) - give(lying(a, k, own, body.bone));
        point.inside[a]!.set(key, v);
      }
      return v;
    };

    const context: M.IContext = {
      n,
      still: problem.still === true,
      open,
      ...(problem.arms.some((arm): boolean => arm.anchor !== undefined)
        ? {
            anchor: problem.arms.map((arm, a: number): number[] | undefined =>
              arm.anchor === undefined
                ? undefined
                : G.encode(setups[a]!, arm.anchor),
            ),
          }
        : {}),
      times: problem.times,
      setups,
      frames,
      sites,
      rest,
      back,
      free,
      offset,
      width,
      bounds: setups.map(
        (setup: IAutoMovieMotionHumanArmGeometry.ISetup, a: number): ([number, number] | null)[] =>
          boxes(setup, rest[a]!, back[a]!),
      ),
      allowed,
      between,
      // A grasp both hands share: over the action, as they close on the
      // object, hold it and part from it, a pair of segments each arm
      // declares is the grasp's contact, not a collision.
      grasped: (
        a: number,
        _k: number,
        own: M.Segment,
        other: M.Segment,
      ): boolean =>
        problem.arms.length === 2 &&
        (problem.arms[a]!.grasp ?? []).includes(own) &&
        (problem.arms[1 - a]!.grasp ?? []).includes(other),
      inside,
      lying,
      normals: setups.map(
        (_: IAutoMovieMotionHumanArmGeometry.ISetup, a: number): (IAutoMovieVector3 | undefined)[] =>
          points.map(
            (p: W.IWaypoint): IAutoMovieVector3 | undefined => p.normals[a],
          ),
      ),
      touched: setups.map((_: IAutoMovieMotionHumanArmGeometry.ISetup, a: number): number[] =>
        points.map((p: W.IWaypoint): number => p.touched[a]!),
      ),
      rested: declared,
    };
    STORES.set(context, store);
    return context;
  }
}

/** Each context's waypoint records by second, shared with every later context built from it, kept while a context that reads them is held. */
const STORES: WeakMap<M.IContext, Map<number, W.IWaypoint>> = new WeakMap();

/**
 * Each coordinate's hard bounds, every QP's box constraints as in TrajOpt:
 * the twist interval and the elbow's and wrist's ranges of the skeleton,
 * not widened, so no iterate leaves the range forward kinematics clamps to;
 * the rest and the back arm enter clamped (`HumanArmGeometry.encode`). The
 * shoulder's twist stays widened to the rest and the back arm's chart
 * reading, which a clamped clinical triple meets only to its rounding. None
 * for the chart's two, which the chart's disc bounds.
 */
function boxes(
  setup: IAutoMovieMotionHumanArmGeometry.ISetup,
  rest: readonly number[],
  back: readonly number[],
): ([number, number] | null)[] {
  const out: ([number, number] | null)[] = new Array(G.DIMENSIONS).fill(null);
  const twist: { min: number; max: number } =
    setup.constraint.upper.swingTwist!.twist;
  out[2] = [
    Math.min(twist.min, rest[2]!, back[2]!),
    Math.max(twist.max, rest[2]!, back[2]!),
  ];
  (["flexion", "abduction", "twist"] as const).forEach(
    (key: "flexion" | "abduction" | "twist", i: number): void => {
      for (const [constraint, o] of [
        [setup.constraint.lower, 3],
        [setup.constraint.hand, 6],
      ] as const) {
        const r: { min: number; max: number } | null | undefined =
          constraint?.[key];
        if (r !== null && r !== undefined) out[o + i] = [r.min, r.max];
      }
    },
  );
  return out;
}
