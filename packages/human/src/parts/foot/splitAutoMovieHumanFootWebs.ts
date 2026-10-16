import { IAutoMovieSurfaceNetwork } from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { splitAutoMovieHumanWebs } from "../splitAutoMovieHumanWebs";
import { IAutoMovieHumanFootPlan } from "./IAutoMovieHumanFootPlan";
import { solidAutoMovieHumanFoot } from "./solidAutoMovieHumanFoot";
import { sweepAutoMovieHumanFoot } from "./sweepAutoMovieHumanFoot";

/**
 * Plan the foot's forefoot-to-toe boundary and its four interdigital webs.
 *
 * The boundary samples the source solid in the end frame of the foot's sweep.
 * Each toe receives its own ordered loop, sharing the split network's curves
 * rather than reconstructing the neighboring toe's boundary.
 *
 * @param props The local foot plan, source solid and generated sweep layout
 * @returns The shared web network, toe loops and address turns of each web
 */
export function splitAutoMovieHumanFootWebs(props: {
  plan: IAutoMovieHumanFootPlan;
  base: solidAutoMovieHumanFoot.ISolid;
  laid: sweepAutoMovieHumanFoot.IOutput;
}): splitAutoMovieHumanFootWebs.IOutput {
  const { plan, base, laid }: typeof props = props;
  const V: typeof AutoMovieHumanVector = AutoMovieHumanVector;
  const L: number = plan.length;
  const toes: IAutoMovieHumanFootPlan.IToe[] = plan.toes;
  const { end, line, endMiddle, endCentre }: sweepAutoMovieHumanFoot.IOutput = laid;
  const solid: (p: IAutoMovieVector3) => number = (p: IAutoMovieVector3): number => base.field(p);
  const rootOf: (toe: IAutoMovieHumanFootPlan.IToe, along: number) => IAutoMovieVector3 =
    (toe: IAutoMovieHumanFootPlan.IToe, along: number): IAutoMovieVector3 =>
      V.offset(toe.joint, [toe.direction, along * toe.length]);
  // the twenty-four columns of the toes' roots, by the angle of their nodes on the end section
  const angleOf: (p: IAutoMovieVector3) => number = (p: IAutoMovieVector3): number => {
    const d: IAutoMovieVector3 = V.offset(p, [end.origin, -1]);
    return Math.atan2(V.dot(d, end.y), V.dot(d, end.x)) / (2 * Math.PI);
  };
  // points of the end section's dorsum and sole at a lateral offset along the roots' line
  const dorsum: (s: number) => IAutoMovieVector3 = (s: number): IAutoMovieVector3 => {
    const p: IAutoMovieVector3 = V.offset(endMiddle, [line, s]);
    return V.of(p.x, base.top(p.x, p.z), p.z);
  };
  const sole: (s: number) => IAutoMovieVector3 = (s: number): IAutoMovieVector3 => {
    const p: IAutoMovieVector3 = V.offset(endMiddle, [line, s]);
    return V.of(p.x, base.bottom(p.x, p.z), p.z);
  };
  const offsetOf: (p: IAutoMovieVector3) => number = (p: IAutoMovieVector3): number =>
    V.dot(V.offset(p, [endMiddle, -1]), line);
  const webs: number[] = [0, 1, 2, 3].map((w: number): number => {
    const a: IAutoMovieVector3 = laid.root(toes[w]!);
    const b: IAutoMovieVector3 = laid.root(toes[w + 1]!);
    return offsetOf(V.of((a.x + b.x) / 2, 0, (a.z + b.z) / 2));
  });
  const halfBreadth: (sign: 1 | -1) => number = (sign: 1 | -1): number => {
    let lo: number = 0;
    let hi: number = L;
    for (let k: number = 0; k < 40; ++k) {
      const mid: number = (lo + hi) / 2;
      const p: IAutoMovieVector3 = V.offset(endCentre, [line, sign * mid]);
      if (solid(p) < 0) lo = mid;
      else hi = mid;
    }
    return lo;
  };
  const cornerMedial: number = -CORNER * halfBreadth(-1);
  const cornerLateral: number = CORNER * halfBreadth(1);
  // node points at the odd indices of the twenty-four, counterclockwise from the third toe's back (0): 1 web 2-3 dorsal, 3 web 1-2 dorsal, 5 medial dorsal corner, 7 medial plantar corner, 9 web 1-2 plantar, 11 web 2-3 plantar, 13 web 3-4 plantar, 15 web 4-5 plantar, 17 lateral plantar corner, 19 lateral dorsal corner, 21 web 4-5 dorsal, 23 web 3-4 dorsal
  const nodePoints: IAutoMovieVector3[] = [
    dorsum(webs[1]!),
    dorsum(webs[0]!),
    dorsum(cornerMedial),
    sole(cornerMedial),
    sole(webs[0]!),
    sole(webs[1]!),
    sole(webs[2]!),
    sole(webs[3]!),
    sole(cornerLateral),
    dorsum(cornerLateral),
    dorsum(webs[3]!),
    dorsum(webs[2]!),
  ];
  const turnOf: number[] = new Array<number>(24);
  nodePoints.forEach((q: IAutoMovieVector3, k: number): void => {
    const v: number = angleOf(q);
    turnOf[2 * k + 1] = ((v % 1) + 1) % 1;
  });
  turnOf[0] = (turnOf[23]! - 1 + turnOf[1]!) / 2;
  for (let j: number = 2; j < 24; j += 2)
    turnOf[j] = (turnOf[j - 1]! + turnOf[j + 1]!) / 2;
  for (let j: number = 1; j < 24; ++j)
    if (!(turnOf[j]! > turnOf[j - 1]!) || !(turnOf[23]! < turnOf[0]! + 1))
      throw new Error(
        `foot root columns out of order at ${j}: ${turnOf.map((c: number): string => c.toFixed(3)).join(" ")}`,
      );
  // the webs, hallux-second (0) to fourth-fifth (3), each from its plantar end to its dorsal end through the crotch between its toes, the x curve on its medial side and the y curve on its lateral side
  const split: splitAutoMovieHumanWebs.IOutput = splitAutoMovieHumanWebs({
    sweep: "foot",
    turns: turnOf,
    ends: WEB_ENDS,
    half: (j: number): number =>
      (WEB * L) /
      2 /
      (2 * Math.PI * V.distance(nodePoints[(j - 1) / 2]!, end.origin)),
    webs: WEBS.map(
      (
        { dorsal: d, plantar: p }: { dorsal: number; plantar: number },
        w: number,
      ): splitAutoMovieHumanWebs.IWeb => {
        const a: IAutoMovieHumanFootPlan.IToe = toes[w]!;
        const b: IAutoMovieHumanFootPlan.IToe = toes[w + 1]!;
        const crotch: IAutoMovieVector3 = V.of(
          (rootOf(a, CROTCH).x + rootOf(b, CROTCH).x) / 2,
          (CROTCH_HEIGHT * (a.height + b.height)) / 2,
          (rootOf(a, CROTCH).z + rootOf(b, CROTCH).z) / 2,
        );
        const normal: IAutoMovieVector3 = V.normalize(
          V.of(
            (a.direction.x + b.direction.x) / 2,
            0,
            (a.direction.z + b.direction.z) / 2,
          ),
        );
        const across: IAutoMovieVector3 = V.of(normal.z, 0, -normal.x);
        return {
          first: p,
          second: d,
          x: metres(V.offset(crotch, [across, (-WEB * L) / 2])),
          y: metres(V.offset(crotch, [across, (WEB * L) / 2])),
          normal,
        };
      },
    ),
  });
  const { at: rootAt, lo, hi }: splitAutoMovieHumanWebs.IOutput = split;
  const rootPath: (a: number, b: number) => IAutoMovieSurfaceNetwork.IEdge[] = split.path;
  const web: (w: number, side: "x" | "y") => IAutoMovieSurfaceNetwork.IEdge = split.web;
  // each toe's loop from its back, counterclockwise about the distal axis: hallux 4, second 2, third 0 (24), fourth 22, fifth 20
  const loops: IAutoMovieSurfaceNetwork.IEdge[][] = [
    [...rootPath(lo(4), lo(9)), web(0, "x"), ...rootPath(hi(3), lo(4))],
    [
      ...rootPath(lo(2), lo(3)),
      web(0, "y"),
      ...rootPath(hi(9), lo(11)),
      web(1, "x"),
      ...rootPath(hi(1), lo(2)),
    ],
    [
      ...rootPath(lo(0), lo(1)),
      web(1, "y"),
      ...rootPath(hi(11), lo(13)),
      web(2, "x"),
      ...rootPath(hi(23), lo(24)),
    ],
    [
      ...rootPath(lo(22), lo(23)),
      web(2, "y"),
      ...rootPath(hi(13), lo(15)),
      web(3, "x"),
      ...rootPath(hi(21), lo(22)),
    ],
    [...rootPath(lo(20), lo(21)), web(3, "y"), ...rootPath(hi(15), lo(20))],
  ];
  return {
    split,
    loops,
    webTurns: WEBS.map((ends: { dorsal: number; plantar: number }): { dorsal: number; plantar: number } => ({
      dorsal: rootAt(lo(ends.dorsal)),
      plantar: rootAt(hi(ends.plantar)),
    })),
  };
}

/** The shared boundaries and chart turns produced by the web planner. */
export namespace splitAutoMovieHumanFootWebs {
  export interface IOutput {
    /** Nodes, curves and patches shared by the forefoot and its toes. */
    split: splitAutoMovieHumanWebs.IOutput;

    /** Ordered boundary edges, hallux first. */
    loops: IAutoMovieSurfaceNetwork.IEdge[][];

    /** Dorsal and plantar turns for the web's source chart. */
    webTurns: Array<{ dorsal: number; plantar: number }>;
  }
}

/** The twenty-four-loop's web ends, dorsal and plantar, which split. */
const WEB_ENDS: number[] = [1, 3, 9, 11, 13, 15, 21, 23];

/** Each web's dorsal and plantar end on the twenty-four-loop: hallux-second, second-third, third-fourth, fourth-fifth. */
const WEBS: Array<{ dorsal: number; plantar: number }> = [
  { dorsal: 3, plantar: 9 },
  { dorsal: 1, plantar: 11 },
  { dorsal: 23, plantar: 13 },
  { dorsal: 21, plantar: 15 },
];

/** Breadth of each web between two toes, of foot length: about 3 mm, so the web is one narrow face wide and its four corners are valence-five vertices instead of two of valence six. Conventional. */
const WEB: number = 0.012;

/** Where each web's crotch lies, of the toes' length from their joints, and its height of their heights. Conventional. */
const CROTCH: number = 0.42;
const CROTCH_HEIGHT: number = 0.55;

/** Share of the half breadth where the borders' corners lie. */
const CORNER: number = 0.85;


const metres: (p: IAutoMovieVector3) => IAutoMovieVector3 =
  (p: IAutoMovieVector3): IAutoMovieVector3 => ({ x: p.x / 1000, y: p.y / 1000, z: p.z / 1000 });
