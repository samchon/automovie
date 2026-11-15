import {
  Vector3,
  physicalShapeNormal,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangleModel } from "../audit/AutoMovieMotionHumanAuditTangleModel";
import type { IHumanBody } from "../body/IHumanBody";
import type { HumanArmClearance } from "./HumanArmClearance";
import { HumanArmFrame } from "./HumanArmFrame";
import { HumanArmGeometry as G } from "./HumanArmGeometry";
import type { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";

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
    body: IHumanBody;
    /** The waypoints' seconds. */
    times: readonly number[];
    /** What every arm is read against at each waypoint. */
    bases: readonly G.IBase[];
    /** The arms. */
    arms: readonly {
      /** The arm. */
      side: "left" | "right";
      /** The arm at the first waypoint, and the arm every allowance is read from. */
      rest: HumanArmClearance.IArm;
      /** The arm at the last waypoint; `rest` when absent. */
      back?: HumanArmClearance.IArm;
      /** Its site at each waypoint, on the hold. */
      sites: readonly (M.ISite | undefined)[];
      /** Its segments' declared rests over the hold. */
      rests?: readonly M.IRest[];
      /** Its segments that grasp one object with the other arm over the action (`HumanArmTrajectoryModel.IContext.grasped`); none when absent. */
      grasp?: readonly M.Segment[];
      /** The arm a still configuration is drawn to, its distance from it the objective's (`HumanArmTrajectoryModel.IContext.anchor`); none when absent. */
      anchor?: HumanArmClearance.IArm;
    }[];
    /** Whether the problem is a still configuration (`HumanArmTrajectoryModel.IContext.still`). */
    still?: boolean;
  }

  /**
   * The context of a problem.
   *
   * @param problem The problem.
   * @param previous The context of the same arms on other waypoints, an earlier reading of the trajectory a refinement splits: a waypoint at a second it read, on the same base and with the same sites, keeps what was built there (its frames, the rest arm placed there, each probe's allowances, each site's touched collider and normal), so only the new waypoints are read.
   * @returns The context.
   */
  export function of(problem: IProblem, previous?: M.IContext): M.IContext {
    const n: number = problem.times.length;
    const alone: boolean = problem.arms.length === 1;
    const setups: G.ISetup[] = problem.arms.map((arm: IProblem["arms"][number]): G.ISetup => G.prepare(problem.body, arm.side));
    const rest: number[][] = problem.arms.map((arm: IProblem["arms"][number], a: number): number[] => G.encode(setups[a]!, arm.rest));
    const back: number[][] = problem.arms.map((arm: IProblem["arms"][number], a: number): number[] => G.encode(setups[a]!, arm.back ?? arm.rest));
    const free: number[][] = setups.map((setup: G.ISetup): number[] => {
      const out: number[] = [];
      for (let d: number = 0; d < G.DIMENSIONS; ++d) if (setup.free[d]!) out.push(d);
      return out;
    });
    const offset: number[] = [];
    let width: number = 0;
    for (const f of free) {
      offset.push(width);
      width += f.length;
    }
    const model: AutoMovieMotionHumanAuditTangleModel.IModel = AutoMovieMotionHumanAuditTangleModel.model(problem.body);

    // Each waypoint's record, kept from an earlier reading of the same arms
    // where its base and its sites are the same records, built otherwise.
    const store: Map<number, IWaypoint> = (previous === undefined ? undefined : STORES.get(previous)) ?? new Map();
    const points: IWaypoint[] = problem.times.map((t: number, k: number): IWaypoint => {
      const frames: G.IFrame[] = setups.map((setup: G.ISetup): G.IFrame => HumanArmFrame.of(setup, problem.bases[k]!, alone));
      const sites: (M.ISite | undefined)[] = problem.arms.map((arm: IProblem["arms"][number]): M.ISite | undefined => arm.sites[k]);
      const known: IWaypoint | undefined = store.get(t);
      if (
        known !== undefined &&
        known.frames.every((f: G.IFrame, a: number): boolean => f === frames[a]) &&
        known.sites.every((s: M.ISite | undefined, a: number): boolean => s === sites[a])
      )
        return known;
      const made: IWaypoint = waypoint(problem, setups, rest, frames, sites);
      store.set(t, made);
      return made;
    });
    const frames: G.IFrame[][] = setups.map((_: G.ISetup, a: number): G.IFrame[] => points.map((p: IWaypoint): G.IFrame => p.frames[a]!));
    const sites: (M.ISite | undefined)[][] = setups.map((_: G.ISetup, a: number): (M.ISite | undefined)[] =>
      points.map((p: IWaypoint): M.ISite | undefined => p.sites[a]),
    );

    // A declared rest, on the hold: a segment of one arm lying on a bone. A
    // contact is one pair whichever way it is read, so a rest an arm
    // declares on the other arm's segment admits that segment's probes in
    // the first arm too, as the audit reads the deeper of the two.
    const declared = (a: number, k: number, probe: number, bone: string): boolean => {
      if (sites[a]![k] === undefined) return false;
      const own: string = G.segment(frames[a]![k]!, probe);
      if ((problem.arms[a]!.rests ?? []).some((r: M.IRest): boolean => r.part === own && r.on === bone)) return true;
      const b: number = problem.arms.findIndex((arm: IProblem["arms"][number]): boolean => bone.startsWith(arm.side) && arm !== problem.arms[a]);
      if (b < 0) return false;
      const theirs: string = bone.endsWith("UpperArm") ? "upperArm" : bone.endsWith("LowerArm") ? "lowerArm" : "hand";
      const mine: string = `${problem.arms[a]!.side}${own === "upperArm" ? "UpperArm" : own === "lowerArm" ? "LowerArm" : "Hand"}`;
      return (problem.arms[b]!.rests ?? []).some((r: M.IRest): boolean => r.part === theirs && r.on === mine);
    };

    // A declared rest is a resting contact: no deeper than where the
    // segments meet (the audit's reference depth of the pair), and drawn to
    // it by the objective; any other pair keeps `DEPTH` of margin. A
    // collider's corner keeps the tangle audit's own reference depth in
    // that segment; an axis sphere keeps the depth the rest arm has.
    const give = (rested: boolean): number => (rested ? 0 : T.DEPTH);
    const corner = (a: number, k: number, probe: number, part: number): number =>
      AutoMovieMotionHumanAuditTangleModel.reference(model, frames[a]![k]!.segments[probe - G.SURFACE]!, part)[
        frames[a]![k]!.corners[probe - G.SURFACE]!
      ]!;

    // Each memo is the waypoint's own, one map per arm keyed by the pair's
    // two indices as one number, since the pair readings ask it for every
    // probe and shape at every iterate.
    const allowed = (a: number, k: number, probe: number, shape: number): number => {
      const point: IWaypoint = points[k]!;
      const key: number = probe * point.frames[a]!.shapes.length + shape;
      let v: number | undefined = point.allowed[a]!.get(key);
      if (v === undefined) {
        const frame: G.IFrame = point.frames[a]!;
        const s: G.IShape = frame.shapes[shape]!;
        const rested: number = give(declared(a, k, probe, s.bone));
        if (probe >= G.SURFACE) v = (s.part >= 0 ? -corner(a, k, probe, s.part) : 0) - rested;
        else {
          const [p, r]: readonly [IAutoMovieVector3, number] = point.placed[a]!.probes[probe]!;
          v = Math.min(0, G.gap(frame, shape, p, p) - r) - rested;
        }
        point.allowed[a]!.set(key, v);
      }
      return v;
    };

    // A probe of one arm against a collider of the other, both at rest.
    const between = (a: number, k: number, probe: number, shape: number, bone: string): number => {
      const point: IWaypoint = points[k]!;
      const key: number = probe * point.colliders[1 - a]!.length + shape;
      let v: number | undefined = point.between[a]!.get(key);
      if (v === undefined) {
        const s: G.IShape = point.colliders[1 - a]![shape]!;
        const rested: number = give(declared(a, k, probe, bone));
        if (probe >= G.SURFACE) v = -corner(a, k, probe, s.part) - rested;
        else {
          const [p, r]: readonly [IAutoMovieVector3, number] = point.placed[a]!.probes[probe]!;
          v = Math.min(0, physicalShapeSegmentDistance(s.pose, s.shape, p, p) - r) - rested;
        }
        point.between[a]!.set(key, v);
      }
      return v;
    };

    // A body corner inside one of the arm's own colliders: the audit reads
    // every pair both ways, so the body's corners keep their reference
    // depth in the arm's segments as the arm's keep theirs in the body.
    const lying = (a: number, k: number, own: "upperArm" | "lowerArm" | "hand", bone: string): boolean =>
      sites[a]![k] !== undefined && (problem.arms[a]!.rests ?? []).some((r: M.IRest): boolean => r.part === own && r.on === bone);
    const collider = (a: number, k: number, shape: number): G.IFrame["colliders"][number] => {
      const point: IWaypoint = points[k]!;
      let list: G.IFrame["colliders"] | undefined = point.flat[a];
      if (list === undefined) {
        list = point.frames[a]!.colliders.flatMap((col: G.IFrame["colliders"][number]): G.IFrame["colliders"] => col.shapes.map((): G.IFrame["colliders"][number] => col));
        point.flat[a] = list;
      }
      return list[shape]!;
    };
    const inside = (a: number, k: number, corner: number, shape: number): number => {
      const point: IWaypoint = points[k]!;
      const key: number = shape * point.frames[a]!.body.length + corner;
      let v: number | undefined = point.inside[a]!.get(key);
      if (v === undefined) {
        const body: G.IFrame["body"][number] = point.frames[a]!.body[corner]!;
        const col: G.IFrame["colliders"][number] = collider(a, k, shape);
        const own: "upperArm" | "lowerArm" | "hand" = col.owner === "upper" ? "upperArm" : col.owner === "lower" ? "lowerArm" : "hand";
        v = -AutoMovieMotionHumanAuditTangleModel.reference(model, body.part, col.part)[body.corner]! - give(lying(a, k, own, body.bone));
        point.inside[a]!.set(key, v);
      }
      return v;
    };

    const context: M.IContext = {
      n,
      still: problem.still === true,
      // A hold that lasts to the end leaves the last waypoint to be solved;
      // a still configuration keeps both its ends.
      open: problem.still !== true && n > 1 && sites.every((arm: (M.ISite | undefined)[]): boolean => arm[n - 1] !== undefined),
      ...(problem.arms.some((arm): boolean => arm.anchor !== undefined)
        ? { anchor: problem.arms.map((arm, a: number): number[] | undefined => (arm.anchor === undefined ? undefined : G.encode(setups[a]!, arm.anchor))) }
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
      bounds: setups.map((setup: G.ISetup, a: number): ([number, number] | null)[] => boxes(setup, rest[a]!, back[a]!)),
      allowed,
      between,
      // A grasp both hands share: over the action, as they close on the
      // object, hold it and part from it, a pair of segments each arm
      // declares is the grasp's contact, not a collision.
      grasped: (a: number, _k: number, own: M.Segment, other: M.Segment): boolean =>
        problem.arms.length === 2 && (problem.arms[a]!.grasp ?? []).includes(own) && (problem.arms[1 - a]!.grasp ?? []).includes(other),
      inside,
      lying,
      normals: setups.map((_: G.ISetup, a: number): (IAutoMovieVector3 | undefined)[] => points.map((p: IWaypoint): IAutoMovieVector3 | undefined => p.normals[a])),
      touched: setups.map((_: G.ISetup, a: number): number[] => points.map((p: IWaypoint): number => p.touched[a]!)),
      rested: declared,
    };
    STORES.set(context, store);
    return context;
  }
}

/**
 * What a context holds at one waypoint for every arm, built once and kept
 * by every later reading of the same arms that has the waypoint
 * (`HumanArmTrajectoryContext.of`): its frames and sites, which identify
 * it, the rest arm placed and its colliders, each site's touched collider
 * and normal, and the memos of the allowances read there.
 */
interface IWaypoint {
  /** Each arm's frame. */
  frames: G.IFrame[];
  /** Each arm's site, on the hold. */
  sites: (M.ISite | undefined)[];
  /** Each arm at rest, placed. */
  placed: G.IPlaced[];
  /** Each arm's colliders at rest, which the other arm's probes are read against. */
  colliders: G.IShape[][];
  /** Each arm's site's touched collider; -1 where none. */
  touched: number[];
  /** Each arm's site's outward normal. */
  normals: (IAutoMovieVector3 | undefined)[];
  /** Each arm's probes' allowances against the frame's shapes (`allowed`), by pair. */
  allowed: Map<number, number>[];
  /** Each arm's probes' allowances against the other arm's colliders (`between`), by pair. */
  between: Map<number, number>[];
  /** The body's corners' allowances inside each arm's colliders (`inside`), by pair. */
  inside: Map<number, number>[];
  /** Each arm's colliders, one entry per shape, once read. */
  flat: (G.IFrame["colliders"] | undefined)[];
}

/**
 * A waypoint's record, built: the rest arm placed there and its colliders,
 * and each site's touched collider and outward normal, the collider nearest
 * the site's point, among the riding arm's own segment's for a site that
 * rides an arm.
 */
function waypoint(
  problem: HumanArmTrajectoryContext.IProblem,
  setups: readonly G.ISetup[],
  rest: readonly (readonly number[])[],
  frames: G.IFrame[],
  sites: (M.ISite | undefined)[],
): IWaypoint {
  const placed: G.IPlaced[] = setups.map((setup: G.ISetup, a: number): G.IPlaced => G.placed(setup, frames[a]!, rest[a]!));
  const colliders: G.IShape[][] = frames.map((frame: G.IFrame, a: number): G.IShape[] => G.colliders(frame, placed[a]!));
  const touched: number[] = sites.map((): number => -1);
  const normals: (IAutoMovieVector3 | undefined)[] = sites.map((site: M.ISite | undefined, a: number): IAutoMovieVector3 | undefined => {
    // A grip on a held object touches no surface of the body: it is held to
    // its point on every axis, so it has no touched collider.
    if (site === undefined || problem.arms[a]!.grasp !== undefined) return undefined;
    const on: M.ISite["on"] = site.on;
    const candidates: G.IShape[] = on === undefined ? frames[a]!.shapes : colliders[on.arm]!;
    const owners: ("upper" | "lower" | "hand")[] =
      on === undefined
        ? []
        : frames[on.arm]!.colliders.flatMap((col: G.IFrame["colliders"][number]): ("upper" | "lower" | "hand")[] =>
            col.shapes.map((): "upper" | "lower" | "hand" => col.owner),
          );
    let best: number = -1;
    let least: number = Infinity;
    candidates.forEach((shape: G.IShape, i: number): void => {
      if (on !== undefined && owners[i] !== on.owner) return;
      const d: number = physicalShapeSegmentDistance(shape.pose, shape.shape, site.point, site.point);
      if (d < least) {
        least = d;
        best = i;
      }
    });
    touched[a] = best;
    if (best < 0) return undefined;
    const s: G.IShape = candidates[best]!;
    return physicalShapeNormal(s.pose, s.shape, site.point, Vector3.normalize(Vector3.subtract(site.point, s.centre)));
  });
  return {
    frames,
    sites,
    placed,
    colliders,
    touched,
    normals,
    allowed: sites.map((): Map<number, number> => new Map()),
    between: sites.map((): Map<number, number> => new Map()),
    inside: sites.map((): Map<number, number> => new Map()),
    flat: sites.map((): undefined => undefined),
  };
}

/** Each context's waypoint records by second, shared with every later context built from it, kept while a context that reads them is held. */
const STORES: WeakMap<M.IContext, Map<number, IWaypoint>> = new WeakMap();

/**
 * Each coordinate's hard bounds, every QP's box constraints as in TrajOpt:
 * the twist interval and the elbow's and wrist's ranges of the skeleton,
 * not widened, so no iterate leaves the range forward kinematics clamps to;
 * the rest and the back arm enter clamped (`HumanArmGeometry.encode`). The
 * shoulder's twist stays widened to the rest and the back arm's chart
 * reading, which a clamped clinical triple meets only to its rounding. None
 * for the chart's two, which the chart's disc bounds.
 */
function boxes(setup: G.ISetup, rest: readonly number[], back: readonly number[]): ([number, number] | null)[] {
  const out: ([number, number] | null)[] = new Array(G.DIMENSIONS).fill(null);
  const twist: { min: number; max: number } = setup.constraint.upper.swingTwist!.twist;
  out[2] = [Math.min(twist.min, rest[2]!, back[2]!), Math.max(twist.max, rest[2]!, back[2]!)];
  (["flexion", "abduction", "twist"] as const).forEach((key: "flexion" | "abduction" | "twist", i: number): void => {
    for (const [constraint, o] of [
      [setup.constraint.lower, 3],
      [setup.constraint.hand, 6],
    ] as const) {
      const r: { min: number; max: number } | null | undefined = constraint?.[key];
      if (r !== null && r !== undefined) out[o + i] = [r.min, r.max];
    }
  });
  return out;
}
