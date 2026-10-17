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
import { patchAutoMovieHumanDigit } from "../patchAutoMovieHumanDigit";
import { splitAutoMovieHumanWebs } from "../splitAutoMovieHumanWebs";
import { AUTOMOVIE_HUMAN_HAND_SHAPE } from "./AUTOMOVIE_HUMAN_HAND_SHAPE";
import { AUTOMOVIE_HUMAN_HAND_TOPOLOGY } from "./AUTOMOVIE_HUMAN_HAND_TOPOLOGY";
import { AutoMovieHumanHandChart } from "./AutoMovieHumanHandChart";
import { curveAutoMovieHumanThenar } from "./curveAutoMovieHumanThenar";
import { layoutAutoMovieHumanPalm } from "./layoutAutoMovieHumanPalm";
import { readAutoMovieHumanHand } from "./readAutoMovieHumanHand";
import { shapeAutoMovieHumanFingerWebs } from "./shapeAutoMovieHumanFingerWebs";
import { sweepAutoMovieHumanHandDigits } from "./sweepAutoMovieHumanHandDigits";
import { sweepAutoMovieHumanPalm } from "./sweepAutoMovieHumanPalm";

/**
 * Lay out the hand as a surface network in its own frame: the palm swept along the hand from the wrist ring, the thumb leaving an opening in its radial border, and the four fingers leaving its distal end between three web curves, each digit joined to the palm by a bridge and closed at its tip by a cap.
 *
 * The palm is `sweepAutoMovieHumanPalm`'s sweep from the wrist ring through the carpus, mid-palm and the metacarpal heads to the fingers' roots. The ring and collar rows keep the ring's eight columns; transition bands of 2-to-1 reduction strips raise them to twelve over the carpus, split at the borders so the strips reduce on the palmar and dorsal middles where the palm is flat, and to eighteen and twenty-six over the metacarpals, each step with no more strips than straight columns between them, so no vertex sits between two strips at valence six. The thenar zone between keeps twelve columns, two of them open astride the radial palmar corner over two rows: the eight-segment hole the thumb's bridge leaves. Across both metacarpal bands a shared monotone fan steers the columns onto the fingers' roots: two over each finger's back, two under its palmar side and two over each outer border, divided at the webs.
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
  const C: typeof AutoMovieHumanHandChart = AutoMovieHumanHandChart;
  const hand: readAutoMovieHumanHand.IHand = props.hand;
  const arm: IAutoMovieHumanIdentity.IArm = props.arm;
  const L: number = arm.handLength;
  const SHAPE: typeof AUTOMOVIE_HUMAN_HAND_SHAPE.layout =
    AUTOMOVIE_HUMAN_HAND_SHAPE.layout;
  const laidPalm: sweepAutoMovieHumanPalm.IOutput =
    sweepAutoMovieHumanPalm(props);
  const {
    sweep: palm,
    at,
    end,
    tilt,
    ringNormal,
    collar,
    sense,
  }: typeof laidPalm = laidPalm;
  // the twenty columns of the fingers' roots, by the angle of their nodes on the last slice
  const fingers: readAutoMovieHumanHand.IDigit[] = FINGERS.map(
    (f: readAutoMovieHumanHand.IFinger): readAutoMovieHumanHand.IDigit =>
      hand.fingers[f],
  );
  const offsetOf: (z: number) => number = (z: number): number =>
    (z - end.centre.z) / Math.cos(tilt);
  const angleOf: (p: IAutoMovieVector3) => number = (
    p: IAutoMovieVector3,
  ): number => {
    const d: IAutoMovieVector3 = V.offset(p, [end.centre, -1]);
    return Math.atan2(V.dot(d, end.axis), d.y) / (2 * Math.PI);
  };
  const web: (i: number) => number = (i: number): number =>
    offsetOf((fingers[i]!.points[0]!.z + fingers[i + 1]!.points[0]!.z) / 2);
  const corner: {
    radial: number;
    ulnar: number;
  } = {
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
  const floors: shapeAutoMovieHumanFingerWebs.IWeb[] =
    shapeAutoMovieHumanFingerWebs({
      hand,
      breadth: arm.handBreadth,
      length: L,
    });
  const crotch: number[] = floors.map(
    (floor: shapeAutoMovieHumanFingerWebs.IWeb): number => floor.distal,
  );
  const ring: splitAutoMovieHumanWebs.IOutput = splitAutoMovieHumanWebs({
    sweep: "palm",
    turns: turn,
    ends: WEB_ENDS,
    half: (j: number): number => {
      const floor: shapeAutoMovieHumanFingerWebs.IWeb =
        floors[
          WEBS.findIndex(
            (web: { palmar: number; dorsal: number }): boolean =>
              web.palmar === j || web.dorsal === j,
          )
        ]!;
      return (
        (floor.radial - floor.ulnar) /
        2 /
        (2 * Math.PI * V.distance(nodePoints[(j - 1) / 2]!, end.centre))
      );
    },
    webs: WEBS.map(
      (
        {
          palmar: p,
          dorsal: d,
        }: {
          palmar: number;
          dorsal: number;
        },
        w: number,
      ): splitAutoMovieHumanWebs.IWeb => {
        const floor: shapeAutoMovieHumanFingerWebs.IWeb = floors[w]!;
        return {
          first: p,
          second: d,
          x: metres(V.of(crotch[w]!, floor.palmar, floor.ulnar)),
          y: metres(V.of(crotch[w]!, floor.palmar, floor.radial)),
          normal: { x: 1, y: 0, z: 0 },
        };
      },
    ),
  });
  const { at: rootAt, lo, hi }: typeof ring = ring;
  const uCarpus: number = at.carpus;
  const uMid: number = at.midPalm;
  const {
    patches,
    addresses,
    atlasAddresses,
    main,
    thenar: uThenar,
  }: ReturnType<typeof layoutAutoMovieHumanPalm> = layoutAutoMovieHumanPalm({
    at,
    end,
    reach: hand.fingers.Middle.points[3]!.x,
    roots: ring,
  });
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
      addresses.push(
        (_: number, t: number): networkAutoMovieHumanHand.IPoint =>
          main(1, d + (p - d) * t),
      );
      atlasAddresses.push(C.web(w, WEBS.length));
    },
  );
  const rootPath: (a: number, b: number) => IAutoMovieSurfaceNetwork.IEdge[] =
    ring.path;
  const webEdge: (
    w: number,
    side: "x" | "y",
  ) => IAutoMovieSurfaceNetwork.IEdge = ring.web;
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
  const opening: (i: number) => number = (i: number): number => i / THENAR;
  const opened: (
    u: number,
    i: number,
  ) => IAutoMovieSurfaceNetwork.IDomainPoint = (
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
  const thumbLoop: IAutoMovieSurfaceNetwork.ISweepEdge[] = [
    [opened(uCarpus, THUMB - 1), opened(uCarpus, THUMB)],
    [opened(uCarpus, THUMB), opened(uCarpus, THUMB + 1)],
    [opened(uCarpus, THUMB + 1), opened(uThenar, THUMB + 1)],
    [opened(uThenar, THUMB + 1), opened(uMid, THUMB + 1)],
    [opened(uMid, THUMB + 1), opened(uMid, THUMB)],
    [opened(uMid, THUMB), opened(uMid, THUMB - 1)],
    [opened(uMid, THUMB - 1), opened(uThenar, THUMB - 1)],
    [opened(uThenar, THUMB - 1), opened(uCarpus, THUMB - 1)],
  ].map(
    ([
      a,
      c,
    ]: IAutoMovieSurfaceNetwork.IDomainPoint[]): IAutoMovieSurfaceNetwork.ISweepEdge =>
      line("palm", a!, c!, 1),
  );
  // every digit's bridge, its sweep in bands at its joints and its dome, and its cap
  digits.forEach(
    (
      { name, out, root }: sweepAutoMovieHumanHandDigits.IDigit,
      k: number,
    ): void => {
      sweeps[name] = out.sweep;
      const laid: patchAutoMovieHumanDigit.IOutput = patchAutoMovieHumanDigit({
        name,
        digit: out,
        loop: k === 0 ? thumbLoop : loops[k - 1]!,
        marks: [
          root,
          k === 0 ? (root + out.at[2]!) / 2 : out.at[1]!,
          out.at[k === 0 ? 2 : 3]!,
          out.tip[0],
          out.tip[1],
          1,
        ],
        rows: [3, 3, 3, 2, 1],
        tension: k === 0 ? SHAPE.thumbTension : SHAPE.tension,
        share: BRIDGE,
      });
      if (k === 0) {
        const bridge: ReturnType<typeof curveAutoMovieHumanThenar> =
          curveAutoMovieHumanThenar({
            loop: thumbLoop,
            palm: compileAutoMovieSweep(palm),
            thumb: compileAutoMovieSweep(out.sweep),
            hand,
            breadth: arm.handBreadth,
            share: BRIDGE,
            root,
          });
        Object.assign(nodesRecord, bridge.nodes);
        Object.assign(curves, bridge.curves);
        laid.patches.splice(0, 1, ...bridge.patches);
        laid.places.splice(0, 1, ...bridge.places);
      }
      patches.push(...laid.patches);
      laid.places.forEach(
        (place: patchAutoMovieHumanDigit.IPlace, band: number): void => {
          addresses.push(
            (s: number, t: number): networkAutoMovieHumanHand.IPoint => {
              const source: ReturnType<typeof place> = place(s, t);
              return {
                branch: name,
                ...source,
                padSide: Math.cos(2 * Math.PI * (source.v - out.padTurn)),
              };
            },
          );
          const bridges: number = k === 0 ? 2 * thumbLoop.length : 1;
          const logical: number = band < bridges ? 0 : band - bridges + 1;
          const address: AutoMovieHumanHandChart.IAddress = C.digit(
            name,
            logical,
            laid.places.length - bridges,
            BRIDGE,
          );
          atlasAddresses.push(
            (s: number, t: number): AutoMovieHumanHandChart.IPoint => {
              if (band >= bridges) return address(s, t);
              const physical: ReturnType<typeof place> = place(s, t);
              return { branch: name, u: physical.u, v: physical.v };
            },
          );
        },
      );
    },
  );
  // the wrist ring and its collar
  const ringEdges: (u: number) => IAutoMovieSurfaceNetwork.IEdge[] = (
    u: number,
  ): IAutoMovieSurfaceNetwork.IEdge[] => [
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
          positions: props.ring.positions.map(
            (p: IAutoMovieVector3): IAutoMovieVector3 =>
              metres(props.toLocal(V.offset(p, [props.ring.frame.origin, -1]))),
          ),
        },
        {
          name: "wrist.collar",
          edges: ringEdges(at.collar),
          positions: props.ring.positions.map(
            (p: IAutoMovieVector3): IAutoMovieVector3 =>
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
    atlasAddresses,
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
    /** Source-pad cosine before mirroring/atlas packing; absent on the main palm, whose named palmar turn is zero. */
    padSide?: number;

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
    /** Identity-independent chart addresses: named palm bands and columns, digit joint bands, and three web rectangles. Evaluation addresses above remain unchanged. */
    atlasAddresses: AutoMovieHumanHandChart.IAddress[];
  }
}
const fixed: (n: number) => IAutoMovieSurfaceNetwork.ICounts = (
  n: number,
): IAutoMovieSurfaceNetwork.ICounts => ({
  lowest: n,
  low: n,
  medium: n,
  high: n,
});
const metres: (p: IAutoMovieVector3) => IAutoMovieVector3 = (
  p: IAutoMovieVector3,
): IAutoMovieVector3 => ({
  x: p.x / 1000,
  y: p.y / 1000,
  z: p.z / 1000,
});
const line: (
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
const millimetres: (p: IAutoMovieVector3) => IAutoMovieVector3 = (
  p: IAutoMovieVector3,
): IAutoMovieVector3 => ({
  x: p.x * 1000,
  y: p.y * 1000,
  z: p.z * 1000,
});
const {
  thenar: THENAR,
  thumb: THUMB,
  webEnds: WEB_ENDS,
  webs: WEBS,
  bridge: BRIDGE,
  fingers: FINGERS,
}: typeof AUTOMOVIE_HUMAN_HAND_TOPOLOGY = AUTOMOVIE_HUMAN_HAND_TOPOLOGY;
