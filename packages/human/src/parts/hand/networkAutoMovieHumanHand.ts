import {
  IAutoMovieSurfaceNetwork,
  IAutoMovieSweep,
  compileAutoMovieSweep,
} from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanBranch } from "../../junction/AutoMovieHumanBranch";
import { IAutoMovieHumanRingShape } from "../../junction/IAutoMovieHumanRingShape";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { gridAutoMovieHumanSweep } from "../gridAutoMovieHumanSweep";
import { patchAutoMovieHumanDigit } from "../patchAutoMovieHumanDigit";
import { splitAutoMovieHumanWebs } from "../splitAutoMovieHumanWebs";
import { AUTOMOVIE_HUMAN_HAND_FORM } from "./AUTOMOVIE_HUMAN_HAND_FORM";
import { AUTOMOVIE_HUMAN_HAND_SHAPE } from "./AUTOMOVIE_HUMAN_HAND_SHAPE";
import { readAutoMovieHumanHand } from "./readAutoMovieHumanHand";
import { sweepAutoMovieHumanHandDigits } from "./sweepAutoMovieHumanHandDigits";
import { sweepAutoMovieHumanPalm } from "./sweepAutoMovieHumanPalm";

/**
 * Lay out the hand as a surface network in its own frame: the palm swept along the hand from the wrist ring, the thumb leaving an opening in its radial border, and the four fingers leaving its distal end between three web curves, each digit joined to the palm by a bridge and closed at its tip by a cap.
 *
 * The palm is `sweepAutoMovieHumanPalm`'s sweep from the wrist ring through the carpus, mid-palm and the metacarpal heads to the fingers' roots. The ring and collar rows keep the ring's eight columns; transition bands of 2-to-1 reduction strips raise them to twelve over the carpus, split at the borders so the strips reduce on the palmar and dorsal middles where the palm is flat, and to eighteen and twenty-six over the metacarpals, each step with no more strips than straight columns between them, so no vertex sits between two strips at valence six. The thenar zone between keeps twelve columns, two of them open astride the radial palmar corner over two rows: the eight-segment hole the thumb's bridge leaves. Over the last row the even columns shear onto the fingers' roots: two over each finger's back, two under its palmar side and two over each outer border, divided at the webs.
 *
 * Each web is a narrow patch one face wide between two curves, one per finger beside it, from the palm's end at the web's palmar side through the crotch to its dorsal side; each web end is two vertices the web's breadth apart, one per finger, so every finger's bridge loop is its share of the palm's end plus its own web curves, the border taking a curve's place on the index and little finger, and the four corners of each web are valence five, where a single web curve would leave two vertices of valence six. Each finger's bridge leaves its web curve tangent to the plane across the hand.
 *
 * Each digit is swept by `sweepAutoMovieHumanHandDigits` from its root, past the webs, to its tip, and `patchAutoMovieHumanDigit` joins it: a bridge from its loop on the palm, its sweep in bands at its joints and dome, and a cap over its tip.
 *
 * Everything is in the hand frame of `readAutoMovieHumanHand`, `x` distal, `y` palmar, `z` radial, taken as a right-handed frame in metres; the generator places and, for the left hand, mirrors the sampled cage.
 *
 * @param props The hand, its arm's measurements and its wrist ring in the hand frame
 * @returns The network and the chart address of every patch point
 */
export function networkAutoMovieHumanHand(props: {
  hand: readAutoMovieHumanHand.IHand;
  arm: IAutoMovieHumanIdentity.IArm;
  ring: IAutoMovieHumanRingShape;
  toLocal: (direction: IAutoMovieVector3) => IAutoMovieVector3;
}): networkAutoMovieHumanHand.IOutput {
  const V: typeof AutoMovieHumanVector = AutoMovieHumanVector;
  const F: typeof AUTOMOVIE_HUMAN_HAND_FORM = AUTOMOVIE_HUMAN_HAND_FORM;
  const hand: readAutoMovieHumanHand.IHand = props.hand;
  const arm: IAutoMovieHumanIdentity.IArm = props.arm;
  const L: number = arm.handLength;
  const SHAPE: typeof AUTOMOVIE_HUMAN_HAND_SHAPE.layout =
    AUTOMOVIE_HUMAN_HAND_SHAPE.layout;
  const laidPalm: sweepAutoMovieHumanPalm.IOutput =
    sweepAutoMovieHumanPalm(props);
  const { sweep: palm, at, end, tilt, ringNormal, collar, sense } = laidPalm;

  // the twenty columns of the fingers' roots, by the angle of their nodes on the last slice
  const fingers: readAutoMovieHumanHand.IDigit[] = FINGERS.map(
    (f) => hand.fingers[f],
  );
  const offsetOf = (z: number): number => (z - end.centre.z) / Math.cos(tilt);
  const angleOf = (p: IAutoMovieVector3): number => {
    const d: IAutoMovieVector3 = V.offset(p, [end.centre, -1]);
    return Math.atan2(V.dot(d, end.axis), d.y) / (2 * Math.PI);
  };
  const web = (i: number): number =>
    offsetOf((fingers[i]!.points[0]!.z + fingers[i + 1]!.points[0]!.z) / 2);
  const corner = {
    radial: SHAPE.corner * end.half.radial,
    ulnar: -SHAPE.corner * end.half.ulnar,
  };
  // node points on the roots' slice, at odd indices of the twenty: 1 index-middle palmar, 3 radial palmar corner, 5 radial dorsal corner, 7 index-middle dorsal, 9 middle-ring dorsal, 11 ring-little dorsal, 13 ulnar dorsal corner, 15 ulnar palmar corner, 17 ring-little palmar, 19 middle-ring palmar
  const nodePoints: IAutoMovieVector3[] = [
    end.palmar(web(0)),
    end.palmar(corner.radial),
    end.dorsal(corner.radial),
    end.dorsal(web(0)),
    end.dorsal(web(1)),
    end.dorsal(web(2)),
    end.dorsal(corner.ulnar),
    end.palmar(corner.ulnar),
    end.palmar(web(2)),
    end.palmar(web(1)),
  ];
  // the twenty-loop's vertex j runs counterclockwise from the middle finger's palmar middle (0); its nodes are the odd ones, the even ones halfway between
  const turn: number[] = new Array<number>(20);
  nodePoints.forEach((p: IAutoMovieVector3, k: number): void => {
    const v: number = angleOf(p);
    turn[2 * k + 1] = ((v % 1) + 1) % 1;
  });
  turn[0] = (turn[19]! - 1 + turn[1]!) / 2;
  for (let j: number = 2; j < 20; j += 2)
    turn[j] = (turn[j - 1]! + turn[j + 1]!) / 2;
  for (let j: number = 1; j < 20; ++j)
    if (!(turn[j]! > turn[j - 1]!) || !(turn[19]! < turn[0]! + 1))
      throw new Error(
        `hand root columns out of order at ${j}: ${turn.map((c: number): string => c.toFixed(3)).join(" ")}`,
      );
  // the webs, index-middle (0), middle-ring (1) and ring-little (2), each from its palmar end to its dorsal end through its crotch between the creases at the fingers' bases, the x curve on its ulnar side and the y curve on its radial side
  const crotch: number[] = [0, 1, 2].map(
    (i: number): number =>
      (fingers[i]!.crease + fingers[i + 1]!.crease) / 2 + F.webs[i]! * L,
  );
  const ring: splitAutoMovieHumanWebs.IOutput = splitAutoMovieHumanWebs({
    sweep: "palm",
    turns: turn,
    ends: WEB_ENDS,
    half: (j: number): number =>
      (SHAPE.web * L) /
      2 /
      (2 * Math.PI * V.distance(nodePoints[(j - 1) / 2]!, end.centre)),
    webs: WEBS.map(
      (
        { palmar: p, dorsal: d }: { palmar: number; dorsal: number },
        w: number,
      ): splitAutoMovieHumanWebs.IWeb => {
        const z: number =
          (fingers[w]!.points[0]!.z + fingers[w + 1]!.points[0]!.z) / 2;
        return {
          first: p,
          second: d,
          x: metres(V.of(crotch[w]!, 0, z - (SHAPE.web * L) / 2)),
          y: metres(V.of(crotch[w]!, 0, z + (SHAPE.web * L) / 2)),
          normal: { x: 1, y: 0, z: 0 },
        };
      },
    ),
  });
  const R: number = ring.count;
  const { at: rootAt, lo, hi } = ring;

  const uCarpus: number = at[2]!;
  const uMid: number = at[3]!;
  const uHeads: number = at[4]!;
  const patches: IAutoMovieSurfaceNetwork.IPatch[] = [];
  const addresses: networkAutoMovieHumanHand.IAddress[] = [];
  const reach: number = hand.fingers.Middle.points[3]!.x;
  const palmU = (u: number): number => (u * end.centre.x) / reach / 2;
  const main = (u: number, v: number): networkAutoMovieHumanHand.IPoint => ({
    branch: null,
    u: palmU(u),
    v: wrap(v),
  });
  const sweepPatch = (
    name: string,
    u: [number, number],
    v: [number, number],
    rows: number,
    columns: number,
  ): void => {
    patches.push({
      type: "sweep",
      name,
      sweep: "palm",
      u,
      v,
      rows: fixed(rows),
      columns: fixed(columns),
    });
    addresses.push((s: number, t: number) =>
      main(u[0] + (u[1] - u[0]) * t, v[0] + (v[1] - v[0]) * s),
    );
  };
  // ring to collar, eight columns
  sweepPatch("palm.ring", [0, at[1]!], [0, 1], 1, 8);
  // the ring's eight columns turn into twelve round the carpus, the thenar zone keeps twelve with the thumb's opening astride the radial palmar corner, and twelve turn into eighteen and then the roots' twenty-six before the heads, each change a transition band of 2-to-1 reduction strips
  const uCollar: number = at[1]!;
  const transition = (
    name: string,
    u: [number, number],
    from: number,
    to: number,
    rows: number,
    v: [number, number] = [0, 1],
  ): void => {
    patches.push({
      type: "transition",
      name,
      sweep: "palm",
      u,
      v,
      start: fixed(from),
      end: fixed(to),
      rows: fixed(rows),
    });
    addresses.push((s: number, t: number) =>
      main(u[0] + (u[1] - u[0]) * t, v[0] + (v[1] - v[0]) * s),
    );
  };
  const grid = (laid: gridAutoMovieHumanSweep.IOutput): void =>
    laid.patches.forEach(
      (patch: IAutoMovieSurfaceNetwork.ICoonsPatch, k: number): void => {
        patches.push(patch);
        addresses.push((s: number, t: number) => {
          const p: IAutoMovieSurfaceNetwork.IDomainPoint =
            gridAutoMovieHumanSweep.locate(laid.corners[k]!, s, t);
          return main(p.u, p.v);
        });
      },
    );
  // the carpus widens fastest at the borders, so its band is split there and each half reduces in its middle, palmar and dorsal, where the surface is gently curved
  transition(
    "palm.carpus.palmar",
    [uCollar, uCarpus],
    4,
    THENAR / 2,
    2,
    [-0.25, 0.25],
  );
  transition(
    "palm.carpus.dorsal",
    [uCollar, uCarpus],
    4,
    THENAR / 2,
    2,
    [0.25, 0.75],
  );
  const uThenar: number = (uCarpus + uMid) / 2;
  grid(
    gridAutoMovieHumanSweep({
      sweep: "palm",
      name: "palm.thenar",
      rows: [uCarpus, uThenar, uMid],
      columns: THENAR,
      v: (_: number, i: number): number => i / THENAR,
      skip: (_: number, i: number): boolean => i === THUMB - 1 || i === THUMB,
    }),
  );
  // two gentle steps, each with no more reduction blocks than straight columns between them, so no coarse vertex sits between two blocks
  const uStep: number = (uMid + uHeads) / 2;
  transition("palm.metacarpals", [uMid, uStep], THENAR, STEP, 1);
  transition("palm.heads", [uStep, uHeads], STEP, R, 1);
  // over the last row the even columns shear onto the roots' nodes
  grid(
    gridAutoMovieHumanSweep({
      sweep: "palm",
      name: "palm.roots",
      rows: [uHeads, 1],
      columns: R,
      v: (r: number, i: number): number =>
        r === 0 ? i / R : rootAt(i + SHIFT),
    }),
  );

  // the digits
  const sweeps: Record<string, IAutoMovieSweep> = { palm };
  const curves: Record<string, IAutoMovieSurfaceNetwork.ICurve> = {};
  const nodesRecord: Record<string, IAutoMovieSurfaceNetwork.INode> = {};
  Object.assign(nodesRecord, ring.nodes);
  Object.assign(curves, ring.curves);
  ring.patches.forEach(
    (patch: IAutoMovieSurfaceNetwork.ICoonsPatch, w: number): void => {
      patches.push(patch);
      const d: number = rootAt(lo(WEBS[w]!.dorsal));
      const p: number = rootAt(hi(WEBS[w]!.palmar));
      addresses.push((_: number, t: number) => main(1, d + (p - d) * t));
    },
  );
  const rootPath = ring.path;
  const webEdge = ring.web;
  // each finger's loop from its palmar middle, counterclockwise about the distal axis: index 2, middle 0 (20), ring 18, little 16
  const loops: IAutoMovieSurfaceNetwork.IEdge[][] = [
    [...rootPath(lo(2), lo(7)), webEdge(0, "y"), ...rootPath(hi(1), lo(2))],
    [
      ...rootPath(lo(0), lo(1)),
      webEdge(0, "x"),
      ...rootPath(hi(7), lo(9)),
      webEdge(1, "y"),
      ...rootPath(hi(19), lo(20)),
    ],
    [
      ...rootPath(lo(18), lo(19)),
      webEdge(1, "x"),
      ...rootPath(hi(9), lo(11)),
      webEdge(2, "y"),
      ...rootPath(hi(17), lo(18)),
    ],
    [...rootPath(lo(16), lo(17)), webEdge(2, "x"), ...rootPath(hi(11), lo(16))],
  ];
  // the thumb's opening astride the radial palmar corner, its loop from the opening's first corner, proximal and palmar
  const opening = (i: number): number => i / THENAR;
  const opened = (
    u: number,
    i: number,
  ): IAutoMovieSurfaceNetwork.IDomainPoint => ({ u, v: opening(i) });
  const digits: sweepAutoMovieHumanHandDigits.IDigit[] =
    sweepAutoMovieHumanHandDigits({
      hand,
      arm,
      crotch,
      thumbCorner: millimetres(
        compileAutoMovieSweep(palm).point(uCarpus, opening(THUMB - 1)),
      ),
    });
  const thumbLoop: IAutoMovieSurfaceNetwork.IEdge[] = [
    [opened(uCarpus, THUMB - 1), opened(uCarpus, THUMB)],
    [opened(uCarpus, THUMB), opened(uCarpus, THUMB + 1)],
    [opened(uCarpus, THUMB + 1), opened(uThenar, THUMB + 1)],
    [opened(uThenar, THUMB + 1), opened(uMid, THUMB + 1)],
    [opened(uMid, THUMB + 1), opened(uMid, THUMB)],
    [opened(uMid, THUMB), opened(uMid, THUMB - 1)],
    [opened(uMid, THUMB - 1), opened(uThenar, THUMB - 1)],
    [opened(uThenar, THUMB - 1), opened(uCarpus, THUMB - 1)],
  ].map(([a, c]) => line("palm", a!, c!, 1));

  // every digit's bridge, its sweep in bands at its joints and its dome, and its cap
  digits.forEach(
    ({ name, out }: sweepAutoMovieHumanHandDigits.IDigit, k: number): void => {
      sweeps[name] = out.sweep;
      const laid: patchAutoMovieHumanDigit.IOutput = patchAutoMovieHumanDigit({
        name,
        digit: out,
        loop: k === 0 ? thumbLoop : loops[k - 1]!,
        marks: [0, out.at[1]!, out.at[3]!, out.tip[0], out.tip[1], 1],
        rows: [3, 3, 3, 2, 1],
        tension: k === 0 ? SHAPE.thumbTension : SHAPE.tension,
        share: BRIDGE,
      });
      patches.push(...laid.patches);
      laid.places.forEach((place: patchAutoMovieHumanDigit.IPlace): void => {
        addresses.push((s: number, t: number) => ({
          branch: name,
          ...place(s, t),
        }));
      });
    },
  );

  // the wrist ring and its collar
  const ringEdges = (u: number): IAutoMovieSurfaceNetwork.IEdge[] => [
    line("palm", { u, v: 0 }, { u, v: sense }, 8),
  ];
  return {
    network: {
      sweeps,
      nodes: nodesRecord,
      curves,
      patches,
      rings: [
        {
          name: "wrist",
          edges: ringEdges(0),
          positions: props.ring.positions.map((p) =>
            metres(props.toLocal(V.offset(p, [props.ring.frame.origin, -1]))),
          ),
        },
        {
          name: "wrist.collar",
          edges: ringEdges(at[1]!),
          positions: props.ring.positions.map((p) =>
            metres(
              V.offset(
                props.toLocal(V.offset(p, [props.ring.frame.origin, -1])),
                [ringNormal, collar],
              ),
            ),
          ),
        },
      ],
    },
    addresses,
  };
}
/** Output and address types of {@link networkAutoMovieHumanHand}. */
export namespace networkAutoMovieHumanHand {
  /**
   * A point's place on the hand's charts: the main chart of the palm or a digit's branch chart.
   *
   * @author Samchon
   */
  export interface IPoint {
    /** The digit, or null on the palm. */
    branch: AutoMovieHumanBranch<"hand"> | null;

    /** Along the chart. */
    u: number;

    /** Around it, counterclockwise about the distal axis in the hand frame; NaN at a tip's apex. */
    v: number;
  }

  /** The chart address of a patch point by its patch coordinates. */
  export type IAddress = (s: number, t: number) => IPoint;

  /**
   * The laid-out hand.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** The network, hand frame, metres. */
    network: IAutoMovieSurfaceNetwork;

    /** Each patch's address map, in patch order. */
    addresses: IAddress[];
  }
}

/** Columns of the thenar zone, between the carpus's transition band and the metacarpals'. */
const THENAR: number = 12;

/** Columns between the metacarpals' two transition bands. */
const STEP: number = 18;

/** The thenar zone's vertex the thumb's opening is centred on, the radial palmar corner of the palm (turn 0.22 on the gate identities against 3 / 12 = 0.25). */
const THUMB: number = 3;

/** The twenty-loop's web ends, palmar and dorsal, which split. */
const WEB_ENDS: number[] = [1, 7, 9, 11, 17, 19];

/** Each web's palmar and dorsal end on the twenty-loop, index-middle, middle-ring and ring-little. */
const WEBS: Array<{ palmar: number; dorsal: number }> = [
  { palmar: 1, dorsal: 7 },
  { palmar: 19, dorsal: 9 },
  { palmar: 17, dorsal: 11 },
];

/** The root ring's vertex that the even ring's vertex 0 shears onto, as an offset: the pairing of least total shear on the gate identities. */
const SHIFT: number = -2;

/** Share of a digit's chart its bridge takes. */
const BRIDGE: number = 0.1;

const FINGERS: readAutoMovieHumanHand.IFinger[] = [
  "Index",
  "Middle",
  "Ring",
  "Little",
];

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

const line = (
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

const millimetres = (p: IAutoMovieVector3): IAutoMovieVector3 => ({
  x: p.x * 1000,
  y: p.y * 1000,
  z: p.z * 1000,
});
