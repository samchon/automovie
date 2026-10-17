import {
  IAutoMovieSurfaceNetwork,
  IAutoMovieSweep,
  IAutoMovieSweepSection,
} from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { gridAutoMovieHumanSweep } from "../gridAutoMovieHumanSweep";
import { patchAutoMovieHumanDigit } from "../patchAutoMovieHumanDigit";
import { splitAutoMovieHumanWebs } from "../splitAutoMovieHumanWebs";
import { IAutoMovieHumanFootPlan } from "./IAutoMovieHumanFootPlan";
import { solidAutoMovieHumanFoot } from "./solidAutoMovieHumanFoot";
import { splitAutoMovieHumanFootWebs } from "./splitAutoMovieHumanFootWebs";
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
  const ring: networkAutoMovieHumanFoot.IRing = props.ring;

  // The sweep and its source solid read the same shared B-spline, not a four-axis ellipse reconstructed from it.
  const points: IAutoMovieSweepSection.IPoint[] = ring.positions.map(
    (p: IAutoMovieVector3): IAutoMovieSweepSection.IPoint => ({
      x: (p.z - ring.origin.z) / 1000,
      y: -(p.x - ring.origin.x) / 1000,
    }),
  );
  const section: IAutoMovieSweepSection.IBSpline = {
    type: "bspline",
    points:
      ring.sense === 1 ? points : [points[0]!, ...points.slice(1).reverse()],
  };
  const base: solidAutoMovieHumanFoot.ISolid = solidAutoMovieHumanFoot({
    plan,
    ring: { origin: ring.origin, section },
  });

  const toes: IAutoMovieHumanFootPlan.IToe[] = plan.toes;
  const laid: sweepAutoMovieHumanFoot.IOutput = sweepAutoMovieHumanFoot({
    plan,
    solid: base,
    ring: { ...ring, section },
  });
  const { sweep: foot, path, collar }: sweepAutoMovieHumanFoot.IOutput = laid;

  const digits: sweepAutoMovieHumanToe.IOutput[] = toes.map(
    (toe: IAutoMovieHumanFootPlan.IToe): sweepAutoMovieHumanToe.IOutput =>
      sweepAutoMovieHumanToe({ plan, toe }),
  );
  const webLayout: splitAutoMovieHumanFootWebs.IOutput =
    splitAutoMovieHumanFootWebs({
      plan,
      base,
      laid,
      starts: digits.map(
        (digit: sweepAutoMovieHumanToe.IOutput): IAutoMovieVector3 =>
          digit.centres[0]!,
      ),
    });
  const { split, loops }: splitAutoMovieHumanFootWebs.IOutput = webLayout;
  const R: number = split.count;
  const { at: rootAt, lo }: splitAutoMovieHumanWebs.IOutput = split;

  const patches: IAutoMovieSurfaceNetwork.IPatch[] = [];
  const addresses: networkAutoMovieHumanFoot.IAddress[] = [];
  const main: (u: number, v: number) => networkAutoMovieHumanFoot.IPoint = (
    u: number,
    v: number,
  ): networkAutoMovieHumanFoot.IPoint => ({
    u: BODY * u,
    v: wrap(v),
    // The ankle/heel turn has no measured glabrous transition. The authored
    // foot-body half-section and toes below retain their actual pad direction.
    padSide: u < GRID ? null : -Math.cos(2 * Math.PI * v),
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
  addresses.push(
    (s: number, t: number): networkAutoMovieHumanFoot.IPoint =>
      main(collar * t, s),
  );
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
    addresses.push(
      (s: number, t: number): networkAutoMovieHumanFoot.IPoint =>
        main(u[0] + (u[1] - u[0]) * t, s),
    );
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
      addresses.push(
        (s: number, t: number): networkAutoMovieHumanFoot.IPoint => {
          const q: IAutoMovieSurfaceNetwork.IDomainPoint =
            gridAutoMovieHumanSweep.locate(body.corners[k]!, s, t);
          return main(q.u, q.v);
        },
      );
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
      const d: number = webLayout.webTurns[w]!.dorsal;
      const p: number = webLayout.webTurns[w]!.plantar;
      addresses.push(
        (_: number, t: number): networkAutoMovieHumanFoot.IPoint =>
          main(1, d + (p - d) * t),
      );
    },
  );
  const axes: networkAutoMovieHumanFoot.IAxis[] = [];
  digits.forEach((digit: sweepAutoMovieHumanToe.IOutput, t: number): void => {
    const name: string = `toe${t}`;
    const { out, fractions, centres }: sweepAutoMovieHumanToe.IOutput = digit;
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
            ? (s: number, t2: number): networkAutoMovieHumanFoot.IPoint => ({
                u: 1,
                v: toeV,
                padSide: Math.cos(2 * Math.PI * (place(s, t2).v - out.padTurn)),
              })
            : (s: number, t2: number): networkAutoMovieHumanFoot.IPoint => ({
                u: BODY + (1 - BODY) * place(s, t2).u,
                v: wrap(toeV + SPREAD * (s - 0.5)),
                padSide: Math.cos(2 * Math.PI * (place(s, t2).v - out.padTurn)),
              }),
        );
      },
    );
  });

  // the ankle ring and its collar
  const ringEdges: (u: number) => IAutoMovieSurfaceNetwork.IEdge[] = (
    u: number,
  ): IAutoMovieSurfaceNetwork.IEdge[] => [
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
          positions: ring.positions.map(
            (p: IAutoMovieVector3): IAutoMovieVector3 =>
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
    /** Actual plantar pad-facing cosine before toe phase compression; null means unclassified ankle transition, while NaN is a true cap apex without a turn. */
    padSide: number | null;

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

/** The root ring's vertex the even ring's vertex 0 shears onto, as an offset: the pairing of least total shear on the gate identities. */
const SHIFT: number = 1;

/** `u` from which the body's columns turn from even spacing onto the toes' roots' nodes. Conventional. */
const SHEAR: number = 0.5;

/** `u` dividing the heel's band from the forefoot's. */
const BAND: number = 0.5;

/** Rows of the two bands. */
const ROWS: { readonly heel: 10; readonly fore: 4 } = {
  heel: 10,
  fore: 4,
} as const;

/** Rows of a toe's two bands. */
const TOE_ROWS: number[] = [2, 3, 1];

/** Share of the bridge's tangent over its chord. */
const TENSION: number = 0.7;

/** Share of the foot's chart the body takes before the toes. */
const BODY: number = 0.85;

/** Spread of a toe's chart round its column. */
const SPREAD: number = 0.04;

const fixed: (n: number) => IAutoMovieSurfaceNetwork.ICounts = (
  n: number,
): IAutoMovieSurfaceNetwork.ICounts => ({
  lowest: n,
  low: n,
  medium: n,
  high: n,
});

const wrap: (v: number) => number = (v: number): number => ((v % 1) + 1) % 1;

const metres: (p: IAutoMovieVector3) => IAutoMovieVector3 = (
  p: IAutoMovieVector3,
): IAutoMovieVector3 => ({
  x: p.x / 1000,
  y: p.y / 1000,
  z: p.z / 1000,
});

const edgeOf: (
  sweep: string,
  from: IAutoMovieSurfaceNetwork.IDomainPoint,
  to: IAutoMovieSurfaceNetwork.IDomainPoint,
  segments: number,
) => IAutoMovieSurfaceNetwork.ISweepEdge = (
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
