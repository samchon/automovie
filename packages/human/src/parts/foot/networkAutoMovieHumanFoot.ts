import {
  IAutoMovieSurfaceNetwork,
  IAutoMovieSweep,
  IAutoMovieSweepFrame,
  IAutoMovieSweepPath,
  IAutoMovieSweepSection,
  frameAutoMovieSweepSpine,
} from "@automovie/engine";
import { quaternionFromAutoMovieBasis } from "@automovie/engine/math/quaternionFromAutoMovieBasis";
import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanFootPlan } from "./IAutoMovieHumanFootPlan";
import { solidAutoMovieHumanFoot } from "./solidAutoMovieHumanFoot";
import { sweepAutoMovieHumanToe } from "./sweepAutoMovieHumanToe";

/**
 * Lay out the foot as a surface network in its local frame: one sweep along the foot's long axis from the ankle ring, down the column, round the heel and forward to the toes' roots, with the five toes leaving its end between four web curves.
 *
 * The sweep's spine drops from the ring's centre down the leg's axis and turns forward through the middle of the foot to the toes' roots, so its sections turn from the ankle's level sections to the forefoot's upright ones: the outside of the turn is the back of the heel, the inside the instep. Each section is the solid's (`solidAutoMovieHumanFoot`) cut by its plane, read by ray from the spine at even angles, so the sweep is one section family from the ring to the toes. The ring and its collar rows keep the ring's eight columns; one band of quads turns each of their spans into three, the twenty-four the rest of the foot keeps, laid out by the toes' roots: two over each toe's back, two under its sole and two over each border, divided at the web nodes where the four web curves leave the sweep's end, so each toe's bridge loop is its share of the end plus the webs beside it, a border taking a web's place on the hallux and the fifth toe. Each web passes through the crotch between its toes, and both toes' bridges leave it tangent to the plane across the foot, a saddle.
 *
 * Each toe is `sweepAutoMovieHumanDigit` along its axis from beyond the webs to its tip, its loop starting at its back, closed by a cap. Everything is in the foot's local frame, `x` lateral, `y` up, `z` forward, taken as right-handed, in metres; the generator mirrors the right foot.
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
  const origin: IAutoMovieVector3 = ring.origin;

  const base: solidAutoMovieHumanFoot.ISolid = solidAutoMovieHumanFoot({
    plan,
    ring: { origin: ring.origin, girth: ring.girth, aspect: ring.aspect },
  });
  const solid = (p: IAutoMovieVector3): number => base.field(p);
  const ray = (from: IAutoMovieVector3, direction: IAutoMovieVector3): number => base.ray(from, direction);

  // the toes' roots: the plane through the hallux's and fifth toe's roots, upright
  const toes: IAutoMovieHumanFootPlan.IToe[] = plan.toes;
  const rootOf = (toe: IAutoMovieHumanFootPlan.IToe, along: number): IAutoMovieVector3 =>
    V.offset(toe.joint, [toe.direction, along * toe.length]);
  const hallux: IAutoMovieVector3 = rootOf(toes[0]!, ROOTS);
  const fifth: IAutoMovieVector3 = rootOf(toes[4]!, ROOTS);
  const line: IAutoMovieVector3 = V.normalize(V.of(fifth.x - hallux.x, 0, fifth.z - hallux.z));
  const endNormal: IAutoMovieVector3 = V.of(-line.z, 0, line.x);
  const endMiddle: IAutoMovieVector3 = V.of((hallux.x + fifth.x) / 2, 0, (hallux.z + fifth.z) / 2);
  const endCentre: IAutoMovieVector3 = V.of(
    endMiddle.x,
    (base.top(endMiddle.x, endMiddle.z) + base.bottom(endMiddle.x, endMiddle.z)) / 2,
    endMiddle.z,
  );
  const middleOf = (f: number): IAutoMovieVector3 => {
    const z: number = plan.heel + f * L;
    const { centre } = base.across(z);
    return V.of(centre, (base.top(centre, z) + base.bottom(centre, z)) / 2, z);
  };
  // the spine: down the leg's axis, round the heel, through the foot's middle to the roots
  // the turn is a quarter circle wider than the instep is deep, so the section planes fanning round it never cross inside the foot
  const forefoot: IAutoMovieVector3 = middleOf(SPINE.mid);
  const radius: number = SPINE.radius * L;
  const top: number = forefoot.y + radius;
  const arc = (angle: number): IAutoMovieVector3 =>
    V.of(
      origin.x + (forefoot.x - origin.x) * (1 - Math.cos(angle)),
      top - radius * Math.sin(angle),
      origin.z + radius * (1 - Math.cos(angle)),
    );
  const spinePoints: IAutoMovieVector3[] = [
    origin,
    ...[0, Math.PI / 6, Math.PI / 3, Math.PI / 2].map(arc),
    forefoot,
    endCentre,
  ];
  const path: IAutoMovieSweepPath = frameAutoMovieSweepSpine({ points: spinePoints, normal: V.of(0, 0, 1) });
  const collar: number = COLLAR * L / path.length;
  const ringFrame: IAutoMovieSweepFrame = {
    origin,
    x: V.of(0, 0, 1),
    y: V.cross(V.of(0, -1, 0), V.of(0, 0, 1)),
    normal: V.of(0, -1, 0),
  };
  // the sections: the ring's at the ring and its collar, then cuts of the solid at even spine parameters, the last two turned to the roots' plane
  const sectionOf = (frame: IAutoMovieSweepFrame): IAutoMovieSweepSection.IRadial => ({
    type: "radial",
    radii: Array.from({ length: RAYS }, (_: unknown, k: number): number => {
      const a: number = (2 * Math.PI * k) / RAYS;
      const d: IAutoMovieVector3 = V.offset(V.of(0, 0, 0), [frame.x, Math.cos(a)], [frame.y, Math.sin(a)]);
      return ray(frame.origin, d) / 1000;
    }),
  });
  const ringSection: IAutoMovieSweepSection = {
    type: "superellipse",
    right: ring.radii.anterior / 1000,
    up: ring.radii.medial / 1000,
    left: ring.radii.posterior / 1000,
    down: ring.radii.lateral / 1000,
    exponents: [2, 2, 2, 2],
  };
  const ringRotation: IAutoMovieQuaternion = quaternionFromAutoMovieBasis(ringFrame.x, ringFrame.y, ringFrame.normal);
  const endFrame = (u: number, turn: number): { frame: IAutoMovieSweepFrame; rotation: IAutoMovieQuaternion } => {
    const carried: IAutoMovieSweepFrame = path.frame(u);
    const n: IAutoMovieVector3 = V.normalize(V.offset(carried.normal, [V.offset(endNormal, [carried.normal, -1]), turn]));
    const up: IAutoMovieVector3 = V.normalize(V.offset(carried.x, [n, -V.dot(carried.x, n)]));
    const side: IAutoMovieVector3 = V.cross(n, up);
    return { frame: { origin: carried.origin, x: up, y: side, normal: n }, rotation: quaternionFromAutoMovieBasis(up, side, n) };
  };
  const ats: number[] = Array.from({ length: CUTS }, (_: unknown, k: number): number => (k === CUTS - 1 ? 1 : FIRST_CUT + ((1 - FIRST_CUT) * k) / (CUTS - 1)));
  const stations: IAutoMovieSweep.IStation[] = [
    { at: 0, section: ringSection, rotation: ringRotation },
    { at: collar, section: ringSection, rotation: ringRotation },
    ...ats.map((u: number, k: number): IAutoMovieSweep.IStation => {
      const turn: number = Math.max(0, (k - (CUTS - 3)) / 2);
      if (turn === 0) return { at: u, section: sectionOf(path.frame(u)) };
      const e = endFrame(u, turn);
      return { at: u, section: sectionOf(e.frame), rotation: e.rotation };
    }),
  ];
  const foot: IAutoMovieSweep = {
    spine: { points: spinePoints.map(metres), normal: V.of(0, 0, 1) },
    stations,
  };

  // the twenty-four columns of the toes' roots, by the angle of their nodes on the end section
  const end: IAutoMovieSweepFrame = endFrame(1, 1).frame;
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
  const offsetOf = (p: IAutoMovieVector3): number => V.dot(V.offset(p, [endMiddle, -1]), line);
  const webs: number[] = [0, 1, 2, 3].map((w: number): number => {
    const a: IAutoMovieVector3 = rootOf(toes[w]!, ROOTS);
    const b: IAutoMovieVector3 = rootOf(toes[w + 1]!, ROOTS);
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
  // node turns at the odd indices of the twenty-four, counterclockwise from the third toe's back (0): 1 web 2-3 dorsal, 3 web 1-2 dorsal, 5 medial dorsal corner, 7 medial plantar corner, 9 web 1-2 plantar, 11 web 2-3 plantar, 13 web 3-4 plantar, 15 web 4-5 plantar, 17 lateral plantar corner, 19 lateral dorsal corner, 21 web 4-5 dorsal, 23 web 3-4 dorsal
  const raw: number[] = [
    angleOf(dorsum(webs[1]!)),
    angleOf(dorsum(webs[0]!)),
    angleOf(dorsum(cornerMedial)),
    angleOf(sole(cornerMedial)),
    angleOf(sole(webs[0]!)),
    angleOf(sole(webs[1]!)),
    angleOf(sole(webs[2]!)),
    angleOf(sole(webs[3]!)),
    angleOf(sole(cornerLateral)),
    angleOf(dorsum(cornerLateral)),
    angleOf(dorsum(webs[3]!)),
    angleOf(dorsum(webs[2]!)),
  ];
  const turnOf: number[] = new Array<number>(24);
  raw.forEach((v: number, k: number): void => {
    turnOf[2 * k + 1] = ((v % 1) + 1) % 1;
  });
  turnOf[0] = (turnOf[23]! - 1 + turnOf[1]!) / 2;
  for (let j: number = 2; j < 24; j += 2) turnOf[j] = (turnOf[j - 1]! + turnOf[j + 1]!) / 2;
  for (let j: number = 1; j < 24; ++j)
    if (!(turnOf[j]! > turnOf[j - 1]!) || !(turnOf[23]! < turnOf[0]! + 1))
      throw new Error(`foot root columns out of order at ${j}: ${turnOf.map((c: number): string => c.toFixed(3)).join(" ")}`);
  const at24 = (i: number): number => turnOf[((i % 24) + 24) % 24]! + Math.floor(i / 24);

  const patches: IAutoMovieSurfaceNetwork.IPatch[] = [];
  const addresses: networkAutoMovieHumanFoot.IAddress[] = [];
  const main = (u: number, v: number): networkAutoMovieHumanFoot.IPoint => ({ u: BODY * u, v: wrap(v) });
  patches.push({ type: "sweep", name: "foot.ring", sweep: "foot", u: [0, collar], v: [0, 1], rows: fixed(1), columns: fixed(8) });
  addresses.push((s: number, t: number) => main(collar * t, s));
  const uFan: number = ats[0]!;
  // one quad of the sweep's domain as a one-face Coons patch
  const quad = (name: string, q: IAutoMovieSurfaceNetwork.IDomainPoint[]): void => {
    patches.push({
      type: "coons",
      name,
      sides: [0, 1, 2, 3].map((i: number) => edgeOf("foot", q[i]!, q[(i + 1) % 4]!, 1)) as [
        IAutoMovieSurfaceNetwork.IEdge,
        IAutoMovieSurfaceNetwork.IEdge,
        IAutoMovieSurfaceNetwork.IEdge,
        IAutoMovieSurfaceNetwork.IEdge,
      ],
    });
    addresses.push((s: number, t: number) => {
      const lower = lerpDomain(q[0]!, q[1]!, s);
      const upper = lerpDomain(q[3]!, q[2]!, s);
      const p = lerpDomain(lower, upper, t);
      return main(p.u, p.v);
    });
  };
  // the body: rows of twenty-four columns, evenly spaced round the heel and the column, turning over the forefoot onto the toes' roots' nodes, each quad a one-face Coons patch of four sweep points, so every vertex lies on the sweep
  const rowsU: number[] = [];
  const BANDS: Array<[number, number, number]> = [
    [uFan, BAND, ROWS.heel],
    [BAND, 1, ROWS.fore],
  ];
  for (const [u0, u1, n] of BANDS) for (let r: number = 0; r < n; ++r) rowsU.push(u0 + ((u1 - u0) * r) / n);
  rowsU.push(1);
  const vAt = (u: number, i: number): number => {
    const k: number = Math.min(1, Math.max(0, (u - SHEAR) / (1 - SHEAR)));
    const w: number = k * k * (3 - 2 * k);
    return i / 24 + (at24(i) - i / 24) * w;
  };
  for (let r: number = 0; r + 1 < rowsU.length; ++r)
    for (let j: number = 0; j < 24; ++j) {
      const q: IAutoMovieSurfaceNetwork.IDomainPoint[] = [
        { u: rowsU[r]!, v: vAt(rowsU[r]!, j - 1) },
        { u: rowsU[r]!, v: vAt(rowsU[r]!, j) },
        { u: rowsU[r + 1]!, v: vAt(rowsU[r + 1]!, j) },
        { u: rowsU[r + 1]!, v: vAt(rowsU[r + 1]!, j - 1) },
      ];
      quad(`foot.${r}.${j}`, q);
    }
  // the collar's eight spans each turn into three twenty-four spans round one fan
  for (let j: number = 0; j < 8; ++j) {
    const a: IAutoMovieSurfaceNetwork.IDomainPoint = { u: collar, v: j / 8 };
    const b: IAutoMovieSurfaceNetwork.IDomainPoint = { u: collar, v: (j + 1) / 8 };
    const top = (i: number): IAutoMovieSurfaceNetwork.IDomainPoint => ({ u: uFan, v: vAt(uFan, 3 * j + i) });
    quad(`foot.fan.${j}.0`, [a, b, top(3), top(2)]);
    quad(`foot.fan.${j}.1`, [a, top(2), top(1), top(0)]);
  }

  // the toes: their webs, each from its dorsal node to its plantar node through its crotch
  const sweeps: Record<string, IAutoMovieSweep> = { foot };
  const nodes: Record<string, IAutoMovieSurfaceNetwork.INode> = {};
  const curves: Record<string, IAutoMovieSurfaceNetwork.ICurve> = {};
  const webNodes: Array<[number, number]> = [
    [3, 9],
    [1, 11],
    [23, 13],
    [21, 15],
  ];
  webNodes.forEach(([d, p]: [number, number], w: number): void => {
    nodes[`web${w}.dorsal`] = { type: "sweep", sweep: "foot", u: 1, v: wrap(at24(d)) };
    nodes[`web${w}.plantar`] = { type: "sweep", sweep: "foot", u: 1, v: wrap(at24(p)) };
    const a: IAutoMovieHumanFootPlan.IToe = toes[w]!;
    const b: IAutoMovieHumanFootPlan.IToe = toes[w + 1]!;
    const crotch: IAutoMovieVector3 = V.of(
      (rootOf(a, CROTCH).x + rootOf(b, CROTCH).x) / 2,
      CROTCH_HEIGHT * (a.height + b.height) / 2,
      (rootOf(a, CROTCH).z + rootOf(b, CROTCH).z) / 2,
    );
    curves[`web${w}`] = {
      from: `web${w}.dorsal`,
      to: `web${w}.plantar`,
      through: [metres(crotch)],
      segments: fixed(2),
      normal: V.normalize(V.of((a.direction.x + b.direction.x) / 2, 0, (a.direction.z + b.direction.z) / 2)),
    };
  });
  const endEdge = (from: number, to: number, segments: number): IAutoMovieSurfaceNetwork.IEdge =>
    edgeOf("foot", { u: 1, v: at24(from) }, { u: 1, v: at24(to) }, segments);
  const web = (w: number, reverse: boolean): IAutoMovieSurfaceNetwork.IEdge => ({ type: "curve", curve: `web${w}`, reverse });
  const loops: IAutoMovieSurfaceNetwork.IEdge[][] = [
    [endEdge(4, 5, 1), endEdge(5, 7, 2), endEdge(7, 9, 2), web(0, true), endEdge(3, 4, 1)],
    [endEdge(2, 3, 1), web(0, false), endEdge(9, 11, 2), web(1, true), endEdge(1, 2, 1)],
    [endEdge(0, 1, 1), web(1, false), endEdge(11, 13, 2), web(2, true), endEdge(23, 24, 1)],
    [endEdge(22, 23, 1), web(2, false), endEdge(13, 15, 2), web(3, true), endEdge(21, 22, 1)],
    [endEdge(20, 21, 1), web(3, false), endEdge(15, 17, 2), endEdge(17, 19, 2), endEdge(19, 20, 1)],
  ];
  const axes: networkAutoMovieHumanFoot.IAxis[] = [];
  toes.forEach((toe: IAutoMovieHumanFootPlan.IToe, t: number): void => {
    const name: string = `toe${t}`;
    const { out, fractions, centres } = sweepAutoMovieHumanToe({ plan, toe });
    sweeps[name] = out.sweep;
    axes.push({ fractions, centres });
    const toeV: number = wrap(at24([4, 2, 0, 22, 20][t]!));
    patches.push({
      type: "bridge",
      name: `${name}.bridge`,
      from: { edges: loops[t]!, tangent: "across" },
      to: { edges: [edgeOf(name, { u: 0, v: 0 }, { u: 0, v: 1 }, 8)], tangent: "forward" },
      rows: fixed(1),
      tension: TENSION,
    });
    addresses.push((s: number, t2: number) => ({ u: BODY + (1 - BODY) * 0.1 * t2, v: wrap(toeV + SPREAD * (s - 0.5)) }));
    const marks: number[] = [0, out.at[2]!, out.tip[1], 1];
    for (let i: number = 0; i < TOE_ROWS.length; ++i) {
      const u: [number, number] = [marks[i]!, marks[i + 1]!];
      patches.push({ type: "sweep", name: `${name}.${i}`, sweep: name, u, v: [0, 1], rows: fixed(TOE_ROWS[i]!), columns: fixed(8) });
      addresses.push((s: number, t2: number) => ({
        u: BODY + (1 - BODY) * (0.1 + 0.9 * (u[0] + (u[1] - u[0]) * t2)),
        v: wrap(toeV + SPREAD * (s - 0.5)),
      }));
    }
    patches.push({
      type: "coons",
      name: `${name}.cap`,
      sides: [0, 1, 2, 3].map((q: number) => edgeOf(name, { u: 1, v: q / 4 }, { u: 1, v: (q + 1) / 4 }, 2)) as [
        IAutoMovieSurfaceNetwork.IEdge,
        IAutoMovieSurfaceNetwork.IEdge,
        IAutoMovieSurfaceNetwork.IEdge,
        IAutoMovieSurfaceNetwork.IEdge,
      ],
    });
    addresses.push(() => ({ u: 1, v: toeV }));
  });

  // the ankle ring and its collar
  const ringEdges = (u: number): IAutoMovieSurfaceNetwork.IEdge[] => [edgeOf("foot", { u, v: 0 }, { u, v: ring.sense }, 8)];
  return {
    network: {
      sweeps,
      nodes,
      curves,
      patches,
      rings: [
        { name: "ankle", edges: ringEdges(0), positions: ring.positions.map(metres) },
        {
          name: "ankle.collar",
          edges: ringEdges(collar),
          positions: ring.positions.map((p: IAutoMovieVector3) => metres(V.offset(p, [V.of(0, -1, 0), collar * path.length]))),
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
    radii: { anterior: number; medial: number; posterior: number; lateral: number };

    /** Each side's limit radius over the mean radius `girth / 2π`. */
    aspect: { anterior: number; medial: number; posterior: number; lateral: number };

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

/** Rays per section. */
const RAYS: number = 96;

/** Cuts of the solid along the spine after the collar, the first where the twenty-four columns begin. */
const CUTS: number = 14;

/** `u` of the first cut, where the fan band ends. */
const FIRST_CUT: number = 0.1;

/** `u` from which the body's columns turn from even spacing onto the toes' roots' nodes. Conventional. */
const SHEAR: number = 0.5;

/** `u` dividing the heel's band from the forefoot's. */
const BAND: number = 0.5;

/** Rows of the two bands. */
const ROWS = { heel: 10, fore: 4 } as const;

/** Distance of the collar below the ring, of foot length. Conventional, as the hand's collar. */
const COLLAR: number = 0.025;

/** The spine: the radius of its turn from the leg's axis into the foot, of foot length, and where along the foot it reaches the foot's middle line. Conventional. */
const SPINE = { radius: 0.27, mid: 0.6 } as const;

/** Where the toes' roots lie, of each toe's length from its joint: the old cage's dorsal root. */
const ROOTS: number = 0.3;

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


const fixed = (n: number): IAutoMovieSurfaceNetwork.ICounts => ({ lowest: n, low: n, medium: n, high: n });

const wrap = (v: number): number => ((v % 1) + 1) % 1;

const metres = (p: IAutoMovieVector3): IAutoMovieVector3 => ({ x: p.x / 1000, y: p.y / 1000, z: p.z / 1000 });

const edgeOf = (
  sweep: string,
  from: IAutoMovieSurfaceNetwork.IDomainPoint,
  to: IAutoMovieSurfaceNetwork.IDomainPoint,
  segments: number,
): IAutoMovieSurfaceNetwork.ISweepEdge => ({ type: "sweep", sweep, from, to, segments: fixed(segments) });

const lerpDomain = (
  a: IAutoMovieSurfaceNetwork.IDomainPoint,
  b: IAutoMovieSurfaceNetwork.IDomainPoint,
  t: number,
): IAutoMovieSurfaceNetwork.IDomainPoint => ({ u: a.u + (b.u - a.u) * t, v: a.v + (b.v - a.v) * t });

