import { IAutoMovieSurfaceNetwork, IAutoMovieSweep, IAutoMovieSweepSection, compileAutoMovieSweep } from "@automovie/engine";
import { quaternionFromAutoMovieBasis } from "@automovie/engine/math/quaternionFromAutoMovieBasis";
import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanBranch } from "../../junction/AutoMovieHumanBranch";
import { IAutoMovieHumanRingShape } from "../../junction/IAutoMovieHumanRingShape";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { AUTOMOVIE_HUMAN_HAND_FORM } from "./AUTOMOVIE_HUMAN_HAND_FORM";
import { AUTOMOVIE_HUMAN_HAND_SHAPE } from "./AUTOMOVIE_HUMAN_HAND_SHAPE";
import { readAutoMovieHumanHand } from "./readAutoMovieHumanHand";
import { sliceAutoMovieHumanPalm } from "./sliceAutoMovieHumanPalm";
import { sweepAutoMovieHumanDigit } from "../sweepAutoMovieHumanDigit";

/**
 * Lay out the hand as a surface network in its own frame: the palm swept along the hand from the wrist ring, the thumb leaving an opening in its radial border, and the four fingers leaving its distal end between three web curves, each digit joined to the palm by a bridge and closed at its tip by a cap.
 *
 * The palm sweep's sections are slices of `sliceAutoMovieHumanPalm`: the wrist ring's own section at the ring and at its collar, the carpus, mid-palm, the metacarpal heads and the fingers' roots, the last two in planes turned to the oblique knuckle line. Its ring and collar rows have the ring's eight columns; one band of quads turns them into twenty, which the rest of the palm keeps. Those twenty columns are fixed by the fingers' roots: two over each finger's back, two under its palmar side and two over each outer border, divided at the web nodes where the three web curves leave the palm's end, so every finger's bridge loop is its share of the palm's end plus the two webs beside it, the border taking a web's place on the index and little finger. Each web curve passes through its crotch between the creases at the fingers' bases, and both fingers' bridges leave it tangent to the plane across the hand, so a web is a saddle. The radial border's two columns are left open over two rows from the carpus to mid-palm, the eight-segment hole the thumb's bridge leaves.
 *
 * Each digit is `sweepAutoMovieHumanDigit` along its joints from its root, past the webs, to its tip, its loop of eight starting at its pad, so loop point `k` of the bridge meets the digit at `k` eighths of a turn; the tip's last loop is closed by one Coons patch of four quads.
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
  const b: number = arm.handBreadth;
  const SHAPE: typeof AUTOMOVIE_HUMAN_HAND_SHAPE.layout = AUTOMOVIE_HUMAN_HAND_SHAPE.layout;
  const field: sliceAutoMovieHumanPalm.IField = sliceAutoMovieHumanPalm({
    hand,
    breadth: b,
    length: L,
    wristCircumference: arm.wristCircumference,
    dorsalFat: arm.dorsalHandFat,
  });

  // the wrist ring in the hand frame: its plane, its first direction and its control radii by quarter turn
  const ringNormal: IAutoMovieVector3 = V.normalize(
    props.toLocal(V.of(-props.ring.frame.normal.x, -props.ring.frame.normal.y, -props.ring.frame.normal.z)),
  );
  const ringFirst: IAutoMovieVector3 = V.normalize(props.toLocal(props.ring.directions[0]!));
  const ringSecond: IAutoMovieVector3 = V.cross(ringNormal, ringFirst);
  const turns: number[] = props.ring.directions.map((d: IAutoMovieVector3): number => {
    const l: IAutoMovieVector3 = props.toLocal(d);
    return Math.round((Math.atan2(V.dot(l, ringSecond), V.dot(l, ringFirst)) / (2 * Math.PI)) * props.ring.count);
  });
  const sense: number = turns[1] === 1 ? 1 : -1;
  const radiusAt = (quarter: number): number =>
    props.ring.radii[((((sense * quarter * props.ring.count) / 4) % props.ring.count) + props.ring.count) % props.ring.count]!;
  const ringSection: IAutoMovieSweepSection = {
    type: "superellipse",
    right: radiusAt(0) / 1000,
    up: radiusAt(1) / 1000,
    left: radiusAt(2) / 1000,
    down: radiusAt(3) / 1000,
    exponents: [2, 2, 2, 2],
  };
  const ringRotation: IAutoMovieQuaternion = quaternionFromAutoMovieBasis(ringFirst, ringSecond, ringNormal);
  const collar: number = F.besideWrist * L;

  // the palm's stations: ring, collar, carpus, mid-palm, heads, the fingers' roots
  const tilt: number = field.tilt;
  const axisKnuckle: number = field.knuckle(0);
  const slices: sliceAutoMovieHumanPalm.ISlice[] = [
    field.slice({ origin: SHAPE.carpus * L, tilt: 0 }),
    field.slice({ origin: SHAPE.midPalm * L, tilt: 0 }),
    field.slice({ origin: axisKnuckle - SHAPE.heads * L, tilt }),
    field.slice({ origin: axisKnuckle + SHAPE.roots * L, tilt }),
  ];
  const palmar: IAutoMovieVector3 = V.of(0, 1, 0);
  const planeRotation = (s: sliceAutoMovieHumanPalm.ISlice): IAutoMovieQuaternion =>
    quaternionFromAutoMovieBasis(palmar, s.axis, V.cross(palmar, s.axis));
  const centres: IAutoMovieVector3[] = [
    V.of(0, 0, 0),
    V.offset(V.of(0, 0, 0), [ringNormal, collar]),
    ...slices.map((s: sliceAutoMovieHumanPalm.ISlice): IAutoMovieVector3 => s.centre),
  ];
  const at: number[] = chordShares(centres);
  const palm: IAutoMovieSweep = {
    spine: { points: centres.map(metres), normal: ringFirst },
    stations: [
      { at: at[0]!, section: ringSection, rotation: ringRotation },
      { at: at[1]!, section: ringSection, rotation: ringRotation },
      ...slices.map((s: sliceAutoMovieHumanPalm.ISlice, k: number): IAutoMovieSweep.IStation => ({
        at: at[k + 2]!,
        section: polygonMetres(s.section),
        rotation: planeRotation(s),
      })),
    ],
  };

  // the twenty columns of the fingers' roots, by the angle of their nodes on the last slice
  const end: sliceAutoMovieHumanPalm.ISlice = slices[3]!;
  const fingers: readAutoMovieHumanHand.IDigit[] = FINGERS.map((f) => hand.fingers[f]);
  const offsetOf = (z: number): number => (z - end.centre.z) / Math.cos(tilt);
  const angleOf = (p: IAutoMovieVector3): number => {
    const d: IAutoMovieVector3 = V.offset(p, [end.centre, -1]);
    return Math.atan2(V.dot(d, end.axis), d.y) / (2 * Math.PI);
  };
  const web = (i: number): number => offsetOf((fingers[i]!.points[0]!.z + fingers[i + 1]!.points[0]!.z) / 2);
  const corner = {
    radial: SHAPE.corner * end.half.radial,
    ulnar: -SHAPE.corner * end.half.ulnar,
  };
  // node turns at odd indices of the twenty: 1 index-middle palmar, 3 radial palmar corner, 5 radial dorsal corner, 7 index-middle dorsal, 9 middle-ring dorsal, 11 ring-little dorsal, 13 ulnar dorsal corner, 15 ulnar palmar corner, 17 ring-little palmar, 19 middle-ring palmar
  const raw: number[] = [
    angleOf(end.palmar(web(0))),
    angleOf(end.palmar(corner.radial)),
    angleOf(end.dorsal(corner.radial)),
    angleOf(end.dorsal(web(0))),
    angleOf(end.dorsal(web(1))),
    angleOf(end.dorsal(web(2))),
    angleOf(end.dorsal(corner.ulnar)),
    angleOf(end.palmar(corner.ulnar)),
    angleOf(end.palmar(web(2))),
    angleOf(end.palmar(web(1))),
  ];
  // the twenty-loop's vertex j runs counterclockwise from the middle finger's palmar middle (0); its nodes are the odd ones, the even ones halfway between
  const turn: number[] = new Array<number>(20);
  raw.forEach((v: number, k: number): void => {
    turn[2 * k + 1] = ((v % 1) + 1) % 1;
  });
  turn[0] = (turn[19]! - 1 + turn[1]!) / 2;
  for (let j: number = 2; j < 20; j += 2) turn[j] = (turn[j - 1]! + turn[j + 1]!) / 2;
  for (let j: number = 1; j < 20; ++j)
    if (!(turn[j]! > turn[j - 1]!) || !(turn[19]! < turn[0]! + 1))
      throw new Error(`hand root columns out of order at ${j}: ${turn.map((c: number): string => c.toFixed(3)).join(" ")}`);
  /** The turn of the twenty-loop's vertex `i`, counted on past 19 into the next turn. */
  const twentyAt = (i: number): number => turn[((i % 20) + 20) % 20]! + Math.floor(i / 20);

  const uCarpus: number = at[2]!;
  const uMid: number = at[3]!;
  const uHeads: number = at[4]!;
  const patches: IAutoMovieSurfaceNetwork.IPatch[] = [];
  const addresses: networkAutoMovieHumanHand.IAddress[] = [];
  const reach: number = hand.fingers.Middle.points[3]!.x;
  const palmU = (u: number): number => (u * centres[centres.length - 1]!.x) / reach / 2;
  const main = (u: number, v: number): networkAutoMovieHumanHand.IPoint => ({ branch: null, u: palmU(u), v: wrap(v) });
  const sweepPatch = (name: string, u: [number, number], v: [number, number], rows: number, columns: number): void => {
    patches.push({ type: "sweep", name, sweep: "palm", u, v, rows: fixed(rows), columns: fixed(columns) });
    addresses.push((s: number, t: number) => main(u[0] + (u[1] - u[0]) * t, v[0] + (v[1] - v[0]) * s));
  };
  // ring to collar, eight columns
  sweepPatch("palm.ring", [0, at[1]!], [0, 1], 1, 8);
  // the twenty columns, each its own patch from the middle-ring palmar node round; the two either side of the radial palmar corner are open for the thumb
  const columns: Array<[number, number]> = Array.from(
    { length: 20 },
    (_: unknown, k: number): [number, number] => [twentyAt(k - 1), twentyAt(k)],
  );
  const bands: Array<{ u: [number, number]; rows: number; open: boolean }> = [
    { u: [uCarpus, uMid], rows: 2, open: true },
    { u: [uMid, uHeads], rows: 1, open: false },
    { u: [uHeads, 1], rows: 1, open: false },
  ];
  bands.forEach((band, i: number): void =>
    columns.forEach((v: [number, number], k: number): void => {
      if (band.open && OPENING.includes(k)) return;
      sweepPatch(`palm.${i}.${k}`, band.u, v, band.rows, 1);
    }),
  );
  // the band from the collar's eight columns to the twenty: one quad per collar span facing one twenty-span, two quads round a fan where it faces three
  const uCollar: number = at[1]!;
  let m: number = SECTORS.start;
  SECTORS.spans.forEach((span: number, j: number): void => {
    const a: IAutoMovieSurfaceNetwork.IDomainPoint = { u: uCollar, v: j / 8 };
    const bPoint: IAutoMovieSurfaceNetwork.IDomainPoint = { u: uCollar, v: (j + 1) / 8 };
    const top = (i: number): IAutoMovieSurfaceNetwork.IDomainPoint => ({ u: uCarpus, v: twentyAt(m + i) });
    const quads: IAutoMovieSurfaceNetwork.IDomainPoint[][] =
      span === 1
        ? [[a, bPoint, top(1), top(0)]]
        : [
            [a, bPoint, top(3), top(2)],
            [a, top(2), top(1), top(0)],
          ];
    quads.forEach((q: IAutoMovieSurfaceNetwork.IDomainPoint[], k: number): void => {
      patches.push({
        type: "coons",
        name: `palm.fan.${j}.${k}`,
        sides: [0, 1, 2, 3].map((i: number) => line("palm", q[i]!, q[(i + 1) % 4]!, 1)) as [
          IAutoMovieSurfaceNetwork.IEdge,
          IAutoMovieSurfaceNetwork.IEdge,
          IAutoMovieSurfaceNetwork.IEdge,
          IAutoMovieSurfaceNetwork.IEdge,
        ],
      });
      addresses.push((s: number, t: number) => {
        const bottom = lerpDomain(q[0]!, q[1]!, s);
        const upper = lerpDomain(q[3]!, q[2]!, s);
        const p = lerpDomain(bottom, upper, t);
        return main(p.u, p.v);
      });
    });
    m += span;
  });

  // the digits
  const sweeps: Record<string, IAutoMovieSweep> = { palm };
  const curves: Record<string, IAutoMovieSurfaceNetwork.ICurve> = {};
  const nodesRecord: Record<string, IAutoMovieSurfaceNetwork.INode> = {};
  const S: typeof AUTOMOVIE_HUMAN_HAND_SHAPE.finger = AUTOMOVIE_HUMAN_HAND_SHAPE.finger;
  const crotch: number[] = [0, 1, 2].map(
    (i: number): number => (fingers[i]!.crease + fingers[i + 1]!.crease) / 2 + F.webs[i]! * L,
  );
  // webs: index-middle (0), middle-ring (1), ring-little (2), each from its palmar node to its dorsal node through its crotch
  const webNodes: Array<[number, number]> = [
    [1, 7],
    [19, 9],
    [17, 11],
  ];
  webNodes.forEach(([p, d]: [number, number], i: number): void => {
    nodesRecord[`web${i}.palmar`] = { type: "sweep", sweep: "palm", u: 1, v: wrap(twentyAt(p)) };
    nodesRecord[`web${i}.dorsal`] = { type: "sweep", sweep: "palm", u: 1, v: wrap(twentyAt(d)) };
    const z: number = (fingers[i]!.points[0]!.z + fingers[i + 1]!.points[0]!.z) / 2;
    curves[`web${i}`] = {
      from: `web${i}.palmar`,
      to: `web${i}.dorsal`,
      through: [metres(V.of(crotch[i]!, 0, z))],
      segments: fixed(2),
      normal: { x: 1, y: 0, z: 0 },
    };
  });
  const palmEdge = (from: number, to: number, segments: number): IAutoMovieSurfaceNetwork.IEdge =>
    line("palm", { u: 1, v: twentyAt(from) }, { u: 1, v: twentyAt(to) }, segments);
  const webEdge = (i: number, reverse: boolean): IAutoMovieSurfaceNetwork.IEdge => ({ type: "curve", curve: `web${i}`, reverse });
  // each finger's loop from its palmar middle, counterclockwise about the distal axis: index 2, middle 0 (20), ring 18, little 16
  const loops: IAutoMovieSurfaceNetwork.IEdge[][] = [
    [palmEdge(2, 3, 1), palmEdge(3, 5, 2), palmEdge(5, 7, 2), webEdge(0, true), palmEdge(1, 2, 1)],
    [palmEdge(0, 1, 1), webEdge(0, false), palmEdge(7, 9, 2), webEdge(1, true), palmEdge(19, 20, 1)],
    [palmEdge(18, 19, 1), webEdge(1, false), palmEdge(9, 11, 2), webEdge(2, true), palmEdge(17, 18, 1)],
    [palmEdge(16, 17, 1), webEdge(2, false), palmEdge(11, 13, 2), palmEdge(13, 15, 2), palmEdge(15, 16, 1)],
  ];
  const digits: Array<{ name: AutoMovieHumanBranch<"hand">; out: sweepAutoMovieHumanDigit.IOutput }> = [];
  fingers.forEach((digit: readAutoMovieHumanHand.IDigit, i: number): void => {
    const finger: readAutoMovieHumanHand.IFinger = FINGERS[i]!;
    const neighbours: number[] = [i - 1, i].filter((w: number): boolean => w >= 0 && w < 3).map((w: number): number => crotch[w]!);
    const rootX: number = Math.max(...neighbours) + SHAPE.root * L;
    const start: IAutoMovieVector3 = along(digit.points, rootX);
    const wp: number = F.fingers[finger].pip * b;
    const wd: number = F.fingers[finger].dip * b;
    const dp: number = F.depth.pip * wp;
    const dd: number = F.depth.dip * wd;
    const points: IAutoMovieVector3[] = [start, ...digit.points.slice(1)];
    const base: number = V.distance(start, digit.points[1]!);
    const l1: number = V.distance(digit.points[1]!, digit.points[2]!);
    const l2: number = V.distance(digit.points[2]!, digit.points[3]!);
    const box = (atMm: number, w: number, d: number, dorsal: number): sweepAutoMovieHumanDigit.IStation => ({
      at: atMm,
      breadth: w,
      dorsal: d * dorsal,
      palmar: d * (1 - dorsal),
      square: SQUARE,
    });
    const out: sweepAutoMovieHumanDigit.IOutput = sweepAutoMovieHumanDigit({
      points,
      first: palmar,
      pad: 0,
      stations: [
        box(0, wp * 1.04, dp * 1.03, S.shaft),
        box(base, wp, dp, S.joint),
        box(base + 0.5 * l1, wp + (wd - wp) * 0.48, dp + (dd - dp) * 0.48, S.shaft),
        box(base + l1, wd, dd, S.joint),
        box(base + l1 + 0.4 * l2, wd * S.padBreadth, dd * S.padDepth, S.pad),
      ],
    });
    const name: AutoMovieHumanBranch<"hand"> = finger.toLowerCase() as AutoMovieHumanBranch<"hand">;
    sweeps[name] = out.sweep;
    digits.push({ name, out });
    patches.push({
      type: "bridge",
      name: `${name}.bridge`,
      from: { edges: loops[i]!, tangent: "across" },
      to: { edges: [line(name, { u: 0, v: 0 }, { u: 0, v: 1 }, 8)], tangent: "forward" },
      rows: fixed(2),
      tension: SHAPE.tension,
    });
    addresses.push((s: number, t: number) => ({ branch: name, u: BRIDGE * t, v: wrap(s) }));
  });

  // the thumb from the radial border's opening
  const T: typeof AUTOMOVIE_HUMAN_HAND_SHAPE.thumb = AUTOMOVIE_HUMAN_HAND_SHAPE.thumb;
  const thumb: readAutoMovieHumanHand.IHand["thumb"] = hand.thumb;
  const metacarpal: number = V.distance(thumb.points[0]!, thumb.points[1]!);
  const thumbStart: IAutoMovieVector3 = V.offset(thumb.points[0]!, [V.offset(thumb.points[1]!, [thumb.points[0]!, -1]), SHAPE.thumbStart]);
  const opening: [number, number] = [columns[OPENING[0]!]![0], columns[OPENING[1]!]![1]];
  const thumbCorner: number = columns[OPENING[0]!]![1];
  const thumbAxis: IAutoMovieVector3 = V.normalize(V.offset(thumb.points[1]!, [thumb.points[0]!, -1]));
  // the opening's first corner, proximal and palmar, sets the thumb loop's first direction
  const firstCorner: IAutoMovieVector3 = millimetres(compileAutoMovieSweep(palm).point(uCarpus, opening[0]));
  const toCorner: IAutoMovieVector3 = V.offset(firstCorner, [thumbStart, -1]);
  const first: IAutoMovieVector3 = V.normalize(V.offset(toCorner, [thumbAxis, -V.dot(toCorner, thumbAxis)]));
  const second: IAutoMovieVector3 = V.cross(thumbAxis, first);
  const pad: number = Math.atan2(V.dot(thumb.pad, second), V.dot(thumb.pad, first));
  const tw: number = F.thumb.ip * b;
  const td: number = F.depth.thumb * tw;
  const thumbOut: sweepAutoMovieHumanDigit.IOutput = sweepAutoMovieHumanDigit({
    points: [thumbStart, ...thumb.points.slice(1)],
    first,
    pad,
    stations: [
      { at: 0, breadth: tw * T.mass, dorsal: td * 0.5, palmar: T.thenar * tw, square: 2.4 },
      { at: (1 - SHAPE.thumbStart) * metacarpal, breadth: tw * T.knuckle, dorsal: td * T.knuckleDorsal, palmar: td * T.knucklePalmar, square: 2.6 },
      { at: (1 - SHAPE.thumbStart) * metacarpal + 0.5 * V.distance(thumb.points[1]!, thumb.points[2]!), breadth: tw * T.phalanx, dorsal: td * 0.48, palmar: td * 0.56, square: 2.6 },
      { at: (1 - SHAPE.thumbStart) * metacarpal + V.distance(thumb.points[1]!, thumb.points[2]!), breadth: tw, dorsal: td * 0.5, palmar: td * 0.5, square: 2.6 },
      { at: (1 - SHAPE.thumbStart) * metacarpal + V.distance(thumb.points[1]!, thumb.points[2]!) + 0.4 * V.distance(thumb.points[2]!, thumb.points[3]!), breadth: tw * 0.98, dorsal: td * 0.4, palmar: td * 0.58, square: 2.6 },
    ],
  });
  sweeps.thumb = thumbOut.sweep;
  digits.unshift({ name: "thumb", out: thumbOut });
  patches.push({
    type: "bridge",
    name: "thumb.bridge",
    from: {
      edges: [
        line("palm", { u: uCarpus, v: opening[0] }, { u: uCarpus, v: thumbCorner }, 1),
        line("palm", { u: uCarpus, v: thumbCorner }, { u: uCarpus, v: opening[1] }, 1),
        line("palm", { u: uCarpus, v: opening[1] }, { u: uMid, v: opening[1] }, 2),
        line("palm", { u: uMid, v: opening[1] }, { u: uMid, v: thumbCorner }, 1),
        line("palm", { u: uMid, v: thumbCorner }, { u: uMid, v: opening[0] }, 1),
        line("palm", { u: uMid, v: opening[0] }, { u: uCarpus, v: opening[0] }, 2),
      ],
      tangent: "across",
    },
    to: { edges: [line("thumb", { u: 0, v: 0 }, { u: 0, v: 1 }, 8)], tangent: "forward" },
    rows: fixed(2),
    tension: SHAPE.thumbTension,
  });
  addresses.push((s: number, t: number) => ({ branch: "thumb", u: BRIDGE * t, v: wrap(s) }));

  // every digit's sweep in bands at its joints and its dome, then its cap
  for (const { name, out } of digits) {
    const marks: number[] = [0, out.at[1]!, out.at[3]!, out.tip[0], out.tip[1], 1];
    const rows: number[] = [3, 3, 3, 2, 1];
    for (let i: number = 0; i < rows.length; ++i) {
      const u: [number, number] = [marks[i]!, marks[i + 1]!];
      patches.push({ type: "sweep", name: `${name}.${i}`, sweep: name, u, v: [0, 1], rows: fixed(rows[i]!), columns: fixed(8) });
      addresses.push((s: number, t: number) => ({ branch: name, u: BRIDGE + (1 - BRIDGE) * (u[0] + (u[1] - u[0]) * t), v: s }));
    }
    patches.push({
      type: "coons",
      name: `${name}.cap`,
      sides: [0, 1, 2, 3].map((q: number) => line(name, { u: 1, v: q / 4 }, { u: 1, v: (q + 1) / 4 }, 2)) as [
        IAutoMovieSurfaceNetwork.IEdge,
        IAutoMovieSurfaceNetwork.IEdge,
        IAutoMovieSurfaceNetwork.IEdge,
        IAutoMovieSurfaceNetwork.IEdge,
      ],
    });
    addresses.push((s: number, t: number) => ({
      branch: name,
      u: 1,
      v: s === 0.5 && t === 0.5 ? Number.NaN : wrap((Math.atan2(t - 0.5, s - 0.5) + (3 * Math.PI) / 4) / (2 * Math.PI)),
    }));
  }

  // the wrist ring and its collar
  const ringEdges = (u: number): IAutoMovieSurfaceNetwork.IEdge[] => [line("palm", { u, v: 0 }, { u, v: sense }, 8)];
  return {
    network: {
      sweeps,
      nodes: nodesRecord,
      curves,
      patches,
      rings: [
        { name: "wrist", edges: ringEdges(0), positions: props.ring.positions.map((p) => metres(props.toLocal(V.offset(p, [props.ring.frame.origin, -1])))) },
        {
          name: "wrist.collar",
          edges: ringEdges(at[1]!),
          positions: props.ring.positions.map((p) =>
            metres(V.offset(props.toLocal(V.offset(p, [props.ring.frame.origin, -1])), [ringNormal, collar])),
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

/** Superellipse exponent of a finger's section whose diagonal reaches the fitted share `square` of the way to the box corner: (1/√2)^(2/n) = square. */
const SQUARE: number = (2 * Math.log(Math.SQRT1_2)) / Math.log(AUTOMOVIE_HUMAN_HAND_SHAPE.finger.square);

/** The thumb's opening: the two palm columns either side of the radial palmar corner, the twenty-loop's vertex 3. */
const OPENING: number[] = [3, 4];

/** Share of a digit's chart its bridge takes. */
const BRIDGE: number = 0.1;

/** How the collar's eight spans meet the twenty: the twenty-loop index the collar's vertex 0 meets, then the spans each collar span faces. */
const SECTORS = { start: 0, spans: [3, 1, 3, 1, 3, 3, 3, 3] } as const;

const FINGERS: readAutoMovieHumanHand.IFinger[] = ["Index", "Middle", "Ring", "Little"];

const fixed = (n: number): IAutoMovieSurfaceNetwork.ICounts => ({ lowest: n, low: n, medium: n, high: n });

const wrap = (v: number): number => ((v % 1) + 1) % 1;

const metres = (p: IAutoMovieVector3): IAutoMovieVector3 => ({ x: p.x / 1000, y: p.y / 1000, z: p.z / 1000 });

const polygonMetres = (s: IAutoMovieSweepSection.IPolygon): IAutoMovieSweepSection.IPolygon => ({
  type: "polygon",
  points: s.points.map((p: IAutoMovieSweepSection.IPoint) => ({ x: p.x / 1000, y: p.y / 1000 })),
});

const line = (
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

/** The point of a joint chain at a level `x`. */
const along = (points: IAutoMovieVector3[], x: number): IAutoMovieVector3 => {
  for (let i: number = 0; i + 1 < points.length; ++i) {
    const a: IAutoMovieVector3 = points[i]!;
    const c: IAutoMovieVector3 = points[i + 1]!;
    if (x <= c.x || i + 2 === points.length) {
      const t: number = (x - a.x) / (c.x - a.x);
      return AutoMovieHumanVector.of(a.x + (c.x - a.x) * t, a.y + (c.y - a.y) * t, a.z + (c.z - a.z) * t);
    }
  }
  return points[points.length - 1]!;
};

const millimetres = (p: IAutoMovieVector3): IAutoMovieVector3 => ({ x: p.x * 1000, y: p.y * 1000, z: p.z * 1000 });

const chordShares = (points: IAutoMovieVector3[]): number[] => {
  const lengths: number[] = [0];
  for (let k: number = 1; k < points.length; ++k)
    lengths.push(lengths[k - 1]! + AutoMovieHumanVector.distance(points[k - 1]!, points[k]!));
  const total: number = lengths[lengths.length - 1]!;
  return lengths.map((l: number): number => l / total);
};
