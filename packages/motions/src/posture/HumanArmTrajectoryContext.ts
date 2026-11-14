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
 * and each site's touched collider and normal.
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
    }[];
    /** Whether the problem is a still configuration (`HumanArmTrajectoryModel.IContext.still`). */
    still?: boolean;
  }

  /**
   * The context of a problem.
   *
   * @param problem The problem.
   * @returns The context.
   */
  export function of(problem: IProblem): M.IContext {
    const n: number = problem.times.length;
    const alone: boolean = problem.arms.length === 1;
    const setups: G.ISetup[] = problem.arms.map((arm: IProblem["arms"][number]): G.ISetup => G.prepare(problem.body, arm.side));
    const frames: G.IFrame[][] = setups.map((setup: G.ISetup): G.IFrame[] =>
      problem.bases.map((base: G.IBase): G.IFrame => HumanArmFrame.of(setup, base, alone)),
    );
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
    const restPlaced: G.IPlaced[][] = setups.map((setup: G.ISetup, a: number): G.IPlaced[] =>
      frames[a]!.map((frame: G.IFrame): G.IPlaced => G.placed(setup, frame, rest[a]!)),
    );
    const sites: (M.ISite | undefined)[][] = problem.arms.map((arm: IProblem["arms"][number]): (M.ISite | undefined)[] => [...arm.sites]);
    const model: AutoMovieMotionHumanAuditTangleModel.IModel = AutoMovieMotionHumanAuditTangleModel.model(problem.body);

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
    const memo: Map<string, number> = new Map();
    const allowed = (a: number, k: number, probe: number, shape: number): number => {
      const key: string = `${a}|${k}|${probe}|${shape}`;
      let v: number | undefined = memo.get(key);
      if (v === undefined) {
        const frame: G.IFrame = frames[a]![k]!;
        const s: G.IShape = frame.shapes[shape]!;
        const rested: number = give(declared(a, k, probe, s.bone));
        if (probe >= G.SURFACE) v = (s.part >= 0 ? -corner(a, k, probe, s.part) : 0) - rested;
        else {
          const [p, r]: readonly [IAutoMovieVector3, number] = restPlaced[a]![k]!.probes[probe]!;
          v = Math.min(0, G.gap(frame, shape, p, p) - r) - rested;
        }
        memo.set(key, v);
      }
      return v;
    };

    // A probe of one arm against a collider of the other, both at rest.
    const restColliders: G.IShape[][][] = setups.map((_: G.ISetup, a: number): G.IShape[][] =>
      frames[a]!.map((frame: G.IFrame, k: number): G.IShape[] => G.colliders(frame, restPlaced[a]![k]!)),
    );
    const memoBetween: Map<string, number> = new Map();
    const between = (a: number, k: number, probe: number, shape: number, bone: string): number => {
      const key: string = `${a}|${k}|${probe}|${shape}`;
      let v: number | undefined = memoBetween.get(key);
      if (v === undefined) {
        const s: G.IShape = restColliders[1 - a]![k]![shape]!;
        const rested: number = give(declared(a, k, probe, bone));
        if (probe >= G.SURFACE) v = -corner(a, k, probe, s.part) - rested;
        else {
          const [p, r]: readonly [IAutoMovieVector3, number] = restPlaced[a]![k]!.probes[probe]!;
          v = Math.min(0, physicalShapeSegmentDistance(s.pose, s.shape, p, p) - r) - rested;
        }
        memoBetween.set(key, v);
      }
      return v;
    };

    // A body corner inside one of the arm's own colliders: the audit reads
    // every pair both ways, so the body's corners keep their reference
    // depth in the arm's segments as the arm's keep theirs in the body.
    const lying = (a: number, k: number, own: "upperArm" | "lowerArm" | "hand", bone: string): boolean =>
      sites[a]![k] !== undefined && (problem.arms[a]!.rests ?? []).some((r: M.IRest): boolean => r.part === own && r.on === bone);
    const flat: Map<string, G.IFrame["colliders"]> = new Map();
    const collider = (a: number, k: number, shape: number): G.IFrame["colliders"][number] => {
      const key: string = `${a}|${k}`;
      let list: G.IFrame["colliders"] | undefined = flat.get(key);
      if (list === undefined) {
        list = frames[a]![k]!.colliders.flatMap((col: G.IFrame["colliders"][number]): G.IFrame["colliders"] => col.shapes.map((): G.IFrame["colliders"][number] => col));
        flat.set(key, list);
      }
      return list[shape]!;
    };
    const memoInside: Map<string, number> = new Map();
    const inside = (a: number, k: number, corner: number, shape: number): number => {
      const key: string = `${a}|${k}|${corner}|${shape}`;
      let v: number | undefined = memoInside.get(key);
      if (v === undefined) {
        const body: G.IFrame["body"][number] = frames[a]![k]!.body[corner]!;
        const col: G.IFrame["colliders"][number] = collider(a, k, shape);
        const own: "upperArm" | "lowerArm" | "hand" = col.owner === "upper" ? "upperArm" : col.owner === "lower" ? "lowerArm" : "hand";
        v = -AutoMovieMotionHumanAuditTangleModel.reference(model, body.part, col.part)[body.corner]! - give(lying(a, k, own, body.bone));
        memoInside.set(key, v);
      }
      return v;
    };

    // Each site's touched collider and outward normal: the collider nearest
    // the site's point, among the riding arm's own segment's for a site that
    // rides an arm.
    const touched: number[][] = sites.map((arm: (M.ISite | undefined)[]): number[] => arm.map((): number => -1));
    const normals: (IAutoMovieVector3 | undefined)[][] = sites.map((arm: (M.ISite | undefined)[], a: number): (IAutoMovieVector3 | undefined)[] =>
      arm.map((site: M.ISite | undefined, k: number): IAutoMovieVector3 | undefined => {
        if (site === undefined) return undefined;
        const on: M.ISite["on"] = site.on;
        const candidates: G.IShape[] = on === undefined ? frames[a]![k]!.shapes : G.colliders(frames[on.arm]![k]!, restPlaced[on.arm]![k]!);
        const owners: ("upper" | "lower" | "hand")[] =
          on === undefined
            ? []
            : frames[on.arm]![k]!.colliders.flatMap((col: G.IFrame["colliders"][number]): ("upper" | "lower" | "hand")[] =>
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
        touched[a]![k] = best;
        if (best < 0) return undefined;
        const s: G.IShape = candidates[best]!;
        return physicalShapeNormal(s.pose, s.shape, site.point, Vector3.normalize(Vector3.subtract(site.point, s.centre)));
      }),
    );
    return {
      n,
      still: problem.still === true,
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
      inside,
      lying,
      normals,
      touched,
      rested: declared,
    };
  }
}

/** Each coordinate's hard bounds: the twist interval and the elbow's and wrist's ranges, widened to the rest and the back arm's own values; none for the chart's two, which the chart's disc bounds. */
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
      if (r !== null && r !== undefined) out[o + i] = [Math.min(r.min, rest[o + i]!, back[o + i]!), Math.max(r.max, rest[o + i]!, back[o + i]!)];
    }
  });
  return out;
}
