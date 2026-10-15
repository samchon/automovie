import { IAutoMovieSurfaceNetwork, IAutoMovieSweep } from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { gridAutoMovieHumanSweep } from "../gridAutoMovieHumanSweep";
import { patchAutoMovieHumanDigit } from "../patchAutoMovieHumanDigit";
import { splitAutoMovieHumanWebs } from "../splitAutoMovieHumanWebs";
import { IAutoMovieHumanFootPlan } from "./IAutoMovieHumanFootPlan";
import { solidAutoMovieHumanFoot } from "./solidAutoMovieHumanFoot";
import { sweepAutoMovieHumanFoot } from "./sweepAutoMovieHumanFoot";
import { sweepAutoMovieHumanToe } from "./sweepAutoMovieHumanToe";

/**
 * Lay out the foot as a surface network in its local frame: one sweep along the foot's long axis from the ankle ring, down the column, round the heel and forward to the toes' roots, with the five toes leaving its end between four web curves.
 *
 * The sweep is `sweepAutoMovieHumanFoot`'s, from the ring down the column, round the heel and forward to the toes' roots. The ring and collar rows keep the ring's eight columns; four transition bands of 2-to-1 reduction strips raise them down the column to twelve, eighteen, twenty-six and thirty-two, each step with no more strips than straight columns between them, so no vertex sits between two strips at valence six. The body's thirty-two columns run evenly round the heel and shear over the forefoot onto the toes' roots: two over each toe's back, two under its sole and two over each border, divided at the webs.
 *
 * Each web is a narrow patch one face wide between two curves, one per toe beside it, from the end's dorsal side through the crotch to its plantar side; each web end is two vertices the web's breadth apart, one per toe, so each toe's bridge loop is its share of the end plus its own web curves, a border taking a curve's place on the hallux and the fifth toe, and the four corners of each web are valence five, where a single web curve would leave two vertices of valence six.
 *
 * Each toe is `sweepAutoMovieHumanToe` along its axis from beyond the webs to its tip, joined by `patchAutoMovieHumanDigit`: a bridge from its loop, its sweep in bands and a cap. Everything is in the foot's local frame, `x` lateral, `y` up, `z` forward, taken as right-handed, in metres; the generator mirrors the right foot.
 *
 * @param props The foot's plan and its ankle ring in the local frame
 * @returns The network, the chart address of every patch point and the toes' axes
 */
export function networkAutoMovieHumanFoot(props: {
  plan: IAutoMovieHumanFootPlan;
  ring: networkAutoMovieHumanFoot.IRing;
}): networkAutoMovieHumanFoot.IOutput {
  const V: typeof AutoMovieHumanVector = AutoMovieHumanVector;
  const plan: IAutoMovieHumanFootPlan = props.plan;
  const L: number = plan.length;
  const ring: networkAutoMovieHumanFoot.IRing = props.ring;

  const base: solidAutoMovieHumanFoot.ISolid = solidAutoMovieHumanFoot({
    plan,
    ring: { origin: ring.origin, girth: ring.girth, aspect: ring.aspect },
  });
  const solid = (p: IAutoMovieVector3): number => base.field(p);

  const toes: IAutoMovieHumanFootPlan.IToe[] = plan.toes;
  const rootOf = (
    toe: IAutoMovieHumanFootPlan.IToe,
    along: number,
  ): IAutoMovieVector3 =>
    V.offset(toe.joint, [toe.direction, along * toe.length]);
  const laid: sweepAutoMovieHumanFoot.IOutput = sweepAutoMovieHumanFoot({
    plan,
    solid: base,
    ring,
  });
  const { sweep: foot, path, collar, end, line, endMiddle, endCentre } = laid;

  // the twenty-four columns of the toes' roots, by the angle of their nodes on the end section
  const angleOf = (p: IAutoMovieVector3): number => {
    const d: IAutoMovieVector3 = V.offset(p, [end.origin, -1]);
    return Math.atan2(V.dot(d, end.y), V.dot(d, end.x)) / (2 * Math.PI);
  };
  // points of the end section's dorsum and sole at a lateral offset along the roots' line
  const dorsum = (s: number): IAutoMovieVector3 => {
    const p: IAutoMovieVector3 = V.offset(endMiddle, [line, s]);
    return V.of(p.x, base.top(p.x, p.z), p.z);
  };
  const sole = (s: number): IAutoMovieVector3 => {
    const p: IAutoMovieVector3 = V.offset(endMiddle, [line, s]);
    return V.of(p.x, base.bottom(p.x, p.z), p.z);
  };
  const offsetOf = (p: IAutoMovieVector3): number =>
    V.dot(V.offset(p, [endMiddle, -1]), line);
  const webs: number[] = [0, 1, 2, 3].map((w: number): number => {
    const a: IAutoMovieVector3 = laid.root(toes[w]!);
    const b: IAutoMovieVector3 = laid.root(toes[w + 1]!);
    return offsetOf(V.of((a.x + b.x) / 2, 0, (a.z + b.z) / 2));
  });
  const halfBreadth = (sign: 1 | -1): number => {
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
  const R: number = split.count;
  const { at: rootAt, lo, hi } = split;

  const patches: IAutoMovieSurfaceNetwork.IPatch[] = [];
  const addresses: networkAutoMovieHumanFoot.IAddress[] = [];
  const main = (u: number, v: number): networkAutoMovieHumanFoot.IPoint => ({
    u: BODY * u,
    v: wrap(v),
  });
  patches.push({
    type: "sweep",
    name: "foot.ring",
    sweep: "foot",
    u: [0, collar],
    v: [0, 1],
    rows: fixed(1),
    columns: fixed(8),
  });
  addresses.push((s: number, t: number) => main(collar * t, s));
  // the ring's eight columns turn into the toes' roots' thirty-two down the column in four gentle steps, each with no more reduction blocks than straight columns between them
  STEPS.forEach(([from, to]: [number, number], k: number): void => {
    const u: [number, number] = [
      collar + ((GRID - collar) * k) / STEPS.length,
      collar + ((GRID - collar) * (k + 1)) / STEPS.length,
    ];
    patches.push({
      type: "transition",
      name: `foot.step.${k}`,
      sweep: "foot",
      u,
      v: [0, 1],
      start: fixed(from),
      end: fixed(to),
      rows: fixed(1),
    });
    addresses.push((s: number, t: number) => main(u[0] + (u[1] - u[0]) * t, s));
  });
  // the body: rows of thirty-two columns, evenly spaced round the heel, shearing over the forefoot onto the toes' roots' nodes; every vertex is a sample of the sweep
  const rowsU: number[] = [];
  for (const [u0, u1, n] of [
    [GRID, BAND, ROWS.heel],
    [BAND, 1, ROWS.fore],
  ] as const)
    for (let r: number = 0; r < n; ++r) rowsU.push(u0 + ((u1 - u0) * r) / n);
  rowsU.push(1);
  const body: gridAutoMovieHumanSweep.IOutput = gridAutoMovieHumanSweep({
    sweep: "foot",
    name: "foot.body",
    rows: rowsU,
    columns: R,
    v: (r: number, i: number): number => {
      const k: number = Math.min(
        1,
        Math.max(0, (rowsU[r]! - SHEAR) / (1 - SHEAR)),
      );
      const w: number = k * k * (3 - 2 * k);
      return w === 1
        ? rootAt(i + SHIFT)
        : i / R + (rootAt(i + SHIFT) - i / R) * w;
    },
  });
  body.patches.forEach(
    (patch: IAutoMovieSurfaceNetwork.ICoonsPatch, k: number): void => {
      patches.push(patch);
      addresses.push((s: number, t: number) => {
        const q: IAutoMovieSurfaceNetwork.IDomainPoint =
          gridAutoMovieHumanSweep.locate(body.corners[k]!, s, t);
        return main(q.u, q.v);
      });
    },
  );

  // the toes: their webs, each from its dorsal node to its plantar node through its crotch
  const sweeps: Record<string, IAutoMovieSweep> = { foot };
  const nodes: Record<string, IAutoMovieSurfaceNetwork.INode> = {};
  const curves: Record<string, IAutoMovieSurfaceNetwork.ICurve> = {};
  Object.assign(nodes, split.nodes);
  Object.assign(curves, split.curves);
  split.patches.forEach(
    (patch: IAutoMovieSurfaceNetwork.ICoonsPatch, w: number): void => {
      patches.push(patch);
      const d: number = rootAt(lo(WEBS[w]!.dorsal));
      const p: number = rootAt(hi(WEBS[w]!.plantar));
      addresses.push((_: number, t: number) => main(1, d + (p - d) * t));
    },
  );
  const rootPath = split.path;
  const web = split.web;
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
  const axes: networkAutoMovieHumanFoot.IAxis[] = [];
  toes.forEach((toe: IAutoMovieHumanFootPlan.IToe, t: number): void => {
    const name: string = `toe${t}`;
    const { out, fractions, centres } = sweepAutoMovieHumanToe({ plan, toe });
    sweeps[name] = out.sweep;
    axes.push({ fractions, centres });
    const toeV: number = wrap(rootAt(lo([4, 2, 0, 22, 20][t]!)));
    const toePatches: patchAutoMovieHumanDigit.IOutput =
      patchAutoMovieHumanDigit({
        name,
        digit: out,
        loop: loops[t]!,
        marks: [0, out.at[2]!, out.tip[1], 1],
        rows: TOE_ROWS,
        tension: TENSION,
        share: 0.1,
      });
    patches.push(...toePatches.patches);
    toePatches.places.forEach(
      (place: patchAutoMovieHumanDigit.IPlace, k: number): void => {
        addresses.push(
          k === toePatches.places.length - 1
            ? () => ({ u: 1, v: toeV })
            : (s: number, t2: number) => ({
                u: BODY + (1 - BODY) * place(s, t2).u,
                v: wrap(toeV + SPREAD * (s - 0.5)),
              }),
        );
      },
    );
  });

  // the ankle ring and its collar
  const ringEdges = (u: number): IAutoMovieSurfaceNetwork.IEdge[] => [
    edgeOf("foot", { u, v: 0 }, { u, v: ring.sense }, 8),
  ];
  return {
    network: {
      sweeps,
      nodes,
      curves,
      patches,
      rings: [
        {
          name: "ankle",
          edges: ringEdges(0),
          positions: ring.positions.map(metres),
        },
        {
          name: "ankle.collar",
          edges: ringEdges(collar),
          positions: ring.positions.map((p: IAutoMovieVector3) =>
            metres(V.offset(p, [V.of(0, -1, 0), collar * path.length])),
          ),
        },
      ],
    },
    addresses,
    axes,
  };
}
/** Ring, output, address and axis types of {@link networkAutoMovieHumanFoot}. */
export namespace networkAutoMovieHumanFoot {
  /**
   * The ankle ring in the local frame.
   *
   * @author Samchon
   */
  export interface IRing {
    /** Centre. */
    origin: IAutoMovieVector3;

    /** Girth of its limit curve, millimetres. */
    girth: number;

    /** Control radii toward the front, the medial side, the back and the lateral side. */
    radii: {
      anterior: number;
      medial: number;
      posterior: number;
      lateral: number;
    };

    /** Each side's limit radius over the mean radius `girth / 2π`. */
    aspect: {
      anterior: number;
      medial: number;
      posterior: number;
      lateral: number;
    };

    /** Control points in the shared shape's order. */
    positions: IAutoMovieVector3[];

    /** Whether the shared shape's order runs with the sweep's turn (1) or against it (-1). */
    sense: 1 | -1;
  }

  /**
   * A point's place on the foot's chart.
   *
   * @author Samchon
   */
  export interface IPoint {
    /** From the ankle ring (0) to the toe tips (1). */
    u: number;

    /** Counterclockwise about the distal axis in the local frame from the anterior mark. */
    v: number;
  }

  /** The chart address of a patch point by its patch coordinates. */
  export type IAddress = (s: number, t: number) => IPoint;

  /**
   * A toe's axis: centres at fractions of its length from its metatarsophalangeal joint.
   *
   * @author Samchon
   */
  export interface IAxis {
    /** Fractions, increasing, the last 1 at the tip. */
    fractions: number[];

    /** Centre at each fraction, local frame, millimetres. */
    centres: IAutoMovieVector3[];
  }

  /**
   * The laid-out foot.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** The network, local frame, metres. */
    network: IAutoMovieSurfaceNetwork;

    /** Each patch's address map, in patch order. */
    addresses: IAddress[];

    /** Each toe's axis, hallux first. */
    axes: IAxis[];
  }
}

/** `u` where the transition bands end and the body's grid begins. */
const GRID: number = 0.2;

/** The column counts the transition bands step through from the ring to the toes' roots: at most a third as many reduction blocks as coarse columns, so every block has straight columns either side. */
const STEPS: Array<[number, number]> = [
  [8, 12],
  [12, 18],
  [18, 26],
  [26, 32],
];

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

/** The root ring's vertex the even ring's vertex 0 shears onto, as an offset: the pairing of least total shear on the gate identities. */
const SHIFT: number = 1;

/** `u` from which the body's columns turn from even spacing onto the toes' roots' nodes. Conventional. */
const SHEAR: number = 0.5;

/** `u` dividing the heel's band from the forefoot's. */
const BAND: number = 0.5;

/** Rows of the two bands. */
const ROWS = { heel: 10, fore: 4 } as const;

/** Where each web's crotch lies, of the toes' length from their joints, and its height of their heights. Conventional. */
const CROTCH: number = 0.42;
const CROTCH_HEIGHT: number = 0.55;

/** Rows of a toe's two bands. */
const TOE_ROWS: number[] = [2, 3, 1];

/** Share of the bridge's tangent over its chord. */
const TENSION: number = 0.7;

/** Share of the foot's chart the body takes before the toes. */
const BODY: number = 0.85;

/** Spread of a toe's chart round its column. */
const SPREAD: number = 0.04;

/** Share of the half breadth where the borders' corners lie. */
const CORNER: number = 0.85;

const fixed = (n: number): IAutoMovieSurfaceNetwork.ICounts => ({
  lowest: n,
  low: n,
  medium: n,
  high: n,
});

const wrap = (v: number): number => ((v % 1) + 1) % 1;

const metres = (p: IAutoMovieVector3): IAutoMovieVector3 => ({
  x: p.x / 1000,
  y: p.y / 1000,
  z: p.z / 1000,
});

const edgeOf = (
  sweep: string,
  from: IAutoMovieSurfaceNetwork.IDomainPoint,
  to: IAutoMovieSurfaceNetwork.IDomainPoint,
  segments: number,
): IAutoMovieSurfaceNetwork.ISweepEdge => ({
  type: "sweep",
  sweep,
  from,
  to,
  segments: fixed(segments),
});
