import { IAutoMovieVector3 } from "@automovie/interface";

import { AUTOMOVIE_HUMAN_WRIST_SECTION } from "../../junction/AUTOMOVIE_HUMAN_WRIST_SECTION";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { AUTOMOVIE_HUMAN_HAND_FORM } from "./AUTOMOVIE_HUMAN_HAND_FORM";
import { AUTOMOVIE_HUMAN_HAND_SHAPE } from "./AUTOMOVIE_HUMAN_HAND_SHAPE";
import { AutoMovieHumanHandSketch } from "./AutoMovieHumanHandSketch";
import { readAutoMovieHumanHand } from "./readAutoMovieHumanHand";

/**
 * Thickness of a superellipse of a given half breadth and exponent whose perimeter is a given length, by bisection on the perimeter of 256 chords.
 *
 * @param half Half breadth, millimetres
 * @param exponent Superellipse exponent, 2 for an ellipse
 * @param perimeter Perimeter to enclose, millimetres
 * @returns Full thickness, millimetres
 */
const enclose = (half: number, exponent: number, perimeter: number): number => {
  const length = (depth: number): number => {
    let sum: number = 0;
    let px: number = half;
    let py: number = 0;
    for (let i: number = 1; i <= 256; ++i) {
      const t: number = (2 * Math.PI * i) / 256;
      const c: number = Math.cos(t);
      const s: number = Math.sin(t);
      const x: number = half * Math.sign(c) * Math.pow(Math.abs(c), 2 / exponent);
      const y: number = depth * Math.sign(s) * Math.pow(Math.abs(s), 2 / exponent);
      sum += Math.hypot(x - px, y - py);
      px = x;
      py = y;
    }
    return sum;
  };
  let lo: number = 0;
  let hi: number = 2 * half;
  for (let k: number = 0; k < 50; ++k) {
    const mid: number = (lo + hi) / 2;
    if (length(mid) < perimeter) lo = mid;
    else hi = mid;
  }
  return lo + hi;
};

/**
 * Draw the palm and the back of the hand from the wrist ring to the finger sockets, with the thumb's socket in its radial side.
 *
 * Five loops run across the hand. The wrist ring has 8 vertices. Three loops of 14 follow at the carpometacarpal line, mid-metacarpal and the metacarpal heads, each with one dorsal vertex over every metacarpal, where the extensor tendons run, one palmar vertex on every finger's line, a vertex on each border and a palmar and dorsal one beside each. The knuckle loop has 26: the four finger sockets' dorsal and palmar thirds and the two borders. Each finger socket is closed by its flank vertices at the webs, and two quads span each web between them, meeting at the crotch.
 *
 * Counts change only through three-span sectors, whose irregular vertices land where the form turns anyway: at the wrist on the third metacarpal's styloid, the hypothenar border and the palmar index line, and at the heads between the knuckles, in the dorsal and palmar valleys beside each web. The thumb's socket is the eight-vertex hole left by removing the four quads around the radial border vertex of the mid-metacarpal loop, from the carpometacarpal line to the web, so the thenar eminence is the thumb's own base.
 *
 * The palm's section widens from the wrist ellipse to the measured hand breadth at the metacarpal heads, with metacarpale II and V on its borders, and thickens to the derived palm thickness, the dorsal arch a superellipse growing boxier toward the knuckles. Every finger's dorsal socket sits on its knuckle, its palmar socket on the crease at its base and its flanks at the webs, which lie between the creases at the measured heights, so the fingers rise from the palm further out on the palmar side than on the back.
 *
 * @param sketch The hand being drawn
 * @param props The hand, its measurements and the wrist ring's control points
 * @returns The finger sockets and the thumb's, each palmar vertex first
 */
export function shapeAutoMovieHumanPalm(
  sketch: AutoMovieHumanHandSketch,
  props: shapeAutoMovieHumanPalm.IProps,
): shapeAutoMovieHumanPalm.IOutput {
  const V: typeof AutoMovieHumanVector = AutoMovieHumanVector;
  const F: typeof AUTOMOVIE_HUMAN_HAND_FORM = AUTOMOVIE_HUMAN_HAND_FORM;
  const P: typeof AUTOMOVIE_HUMAN_HAND_SHAPE.palm = AUTOMOVIE_HUMAN_HAND_SHAPE.palm;
  // palmar relief over each finger line by the share of the way from the carpometacarpal line to the heads: the thenar slope over the index, the hollow over the middle and ring, the hypothenar over the little finger
  const relief: Array<(t: number) => number> = [
    (t: number): number => P.thenar * (1 - t),
    (t: number): number => -P.hollow * Math.sin(t * Math.PI),
    (t: number): number => -P.hollow * Math.sin(t * Math.PI),
    (t: number): number => P.hypothenar * Math.sin(t * Math.PI),
  ];
  const hand: readAutoMovieHumanHand.IHand = props.hand;
  const b: number = props.breadth;
  const L: number = props.length;
  const fingers: readAutoMovieHumanHand.IDigit[] = (["Index", "Middle", "Ring", "Little"] as const).map(
    (f: readAutoMovieHumanHand.IFinger): readAutoMovieHumanHand.IDigit => hand.fingers[f],
  );
  const widths: number[] = (["Index", "Middle", "Ring", "Little"] as const).map(
    (f: readAutoMovieHumanHand.IFinger): number => F.fingers[f].pip * b,
  );

  // section of the palm at a level, from the wrist ellipse to the metacarpal heads
  const heads: number = hand.metacarpaleII.x;
  const aw: number = (AUTOMOVIE_HUMAN_WRIST_SECTION.breadth * props.wristCircumference) / 2;
  const cw: number = aw * AUTOMOVIE_HUMAN_WRIST_SECTION.depth;
  // thickness at the heads: the section's own superellipse, of the hand breadth and the heads' exponent, enclosing the measured hand circumference
  const thickness: number = enclose(b / 2, 2 + P.arch, F.circumference * b);
  const level = (x: number): number => Math.min(1, Math.max(0, x / heads));
  const radialEdge = (x: number): number =>
    aw + (hand.metacarpaleII.z - aw) * (1 - Math.pow(1 - level(x), P.widen));
  const ulnarEdge = (x: number): number =>
    -aw + (hand.metacarpaleV.z + aw) * (1 - Math.pow(1 - level(x), P.widen));
  const across = (x: number, zeta: number): number =>
    (radialEdge(x) + ulnarEdge(x)) / 2 + (zeta * (radialEdge(x) - ulnarEdge(x))) / 2;
  const arch = (x: number, zeta: number): number => {
    const n: number = 2 + P.arch * level(x);
    return Math.pow(Math.max(0, 1 - Math.pow(Math.abs(zeta), n)), 1 / n);
  };
  const dorsalHeight = (x: number): number => cw + (thickness * P.dorsal - cw) * level(x);
  const palmarDepth = (x: number): number => cw + (thickness * (1 - P.dorsal) - cw) * level(x);
  /** Dorsal surface point at a level and a share of the half breadth from the centre. */
  // fat lost from the back of the hand against the young adult the dorsal form is drawn for, nothing at the wrist ring, all of it over the metacarpals
  const loss: number = Math.max(0, F.dorsalFat - props.dorsalFat);
  const dorsal = (x: number, zeta: number, rise: number = 0): IAutoMovieVector3 =>
    V.of(x, -dorsalHeight(x) * (arch(x, zeta) + rise) + loss * level(x), across(x, zeta));
  /** Palmar surface point, `pad` the share it bulges beyond the plain section. */
  const palmar = (x: number, zeta: number, pad: number = 0): IAutoMovieVector3 =>
    V.of(x, palmarDepth(x) * arch(x, zeta) * (1 + pad), across(x, zeta));
  /** Border point, `toward` palmar as a share of the palmar depth. */
  const border = (x: number, zeta: 1 | -1, toward: number): IAutoMovieVector3 =>
    V.of(x, toward * palmarDepth(x), across(x, zeta));

  // finger lines across the heads
  const zetas: number[] = fingers.map(
    (f: readAutoMovieHumanHand.IDigit): number =>
      (2 * f.points[0]!.z - hand.metacarpaleII.z - hand.metacarpaleV.z) /
      (hand.metacarpaleII.z - hand.metacarpaleV.z),
  );
  const base: number = hand.thumb.points[0]!.x;
  const shaft = (i: number, t: number): number => base + t * (fingers[i]!.points[0]!.x - base);

  // the three metacarpal loops, palmar side: pr, p_i, p_m, p_r, p_l, pu, u; dorsal side at the carpometacarpal line: du, d_l, d_r, d_m, d_i, dr, r;
  // further out every extensor tendon line has a flank on each side toward its neighbour, the valleys between the tendons:
  // du, d_l, lr, ru, d_r, rr, mu, d_m, mr, iu, d_i, dr, r. Over a tendon only the superficial lamina's share of the lost fat goes, between them all of it.
  const tendonLoss: number = loss * F.dorsalFatSuperficialShare;
  const metacarpal = (t: number, spread: number, flanked: boolean): IAutoMovieVector3[] => {
    const x: number = base + t * (heads - base);
    const tendon = (i: number): IAutoMovieVector3 =>
      V.offset(dorsal(shaft(i, t), zetas[i]! * spread, P.tendon), [V.of(0, 1, 0), -(loss - tendonLoss) * level(shaft(i, t))]);
    const between = (i: number, j: number, share: number): IAutoMovieVector3 =>
      dorsal(shaft(i, t) + (shaft(j, t) - shaft(i, t)) * share, (zetas[i]! + (zetas[j]! - zetas[i]!) * share) * spread);
    const back: IAutoMovieVector3[] = flanked
      ? [
          tendon(3),
          between(3, 2, 1 / 3),
          between(3, 2, 2 / 3),
          tendon(2),
          between(2, 1, 1 / 3),
          between(2, 1, 2 / 3),
          tendon(1),
          between(1, 0, 1 / 3),
          between(1, 0, 2 / 3),
          tendon(0),
        ]
      : [3, 2, 1, 0].map(tendon);
    return [
      palmar(x, 0.72),
      ...[0, 1, 2, 3].map((i: number): IAutoMovieVector3 =>
        palmar(shaft(i, t), zetas[i]! * spread, relief[i]!(t)),
      ),
      palmar(shaft(3, t), -0.88, P.border * Math.sin(t * Math.PI)),
      border(shaft(3, t), -1, 0.2),
      dorsal(shaft(3, t), -0.88),
      ...back,
      dorsal(x, 0.78),
      border(x, 1, 0.1),
    ];
  };
  const rows: IAutoMovieVector3[][] = [metacarpal(0, 0.8, false), metacarpal(0.5, 0.92, true), metacarpal(0.82, 1, true)];
  // the thumb's socket rides its metacarpal: the thenar toward the pad, the first dorsal interosseous toward the index, the border outward, and the web's crotch halfway from the index's radial flank to the thumb's at its knuckle
  const thumb: readAutoMovieHumanHand.IHand["thumb"] = hand.thumb;
  const tw: number = F.thumb.ip * b;
  const along = (t: number): IAutoMovieVector3 =>
    V.offset(thumb.points[0]!, [V.offset(thumb.points[1]!, [thumb.points[0]!, -1]), t]);
  const nail: IAutoMovieVector3 = V.of(-thumb.pad.x, -thumb.pad.y, -thumb.pad.z);
  const flank: IAutoMovieVector3 = V.of(
    (fingers[0]!.points[0]!.x + fingers[0]!.crease) / 2 + 0.02 * L,
    0.1 * thickness,
    fingers[0]!.points[0]!.z + widths[0]! * 0.55,
  );
  const crotch: IAutoMovieVector3 = V.offset(
    V.of(0, 0, 0),
    [flank, 0.5],
    [V.offset(thumb.points[1]!, [thumb.web, 0.55 * tw]), 0.5],
    [thumb.pad, 0.1 * tw],
  );
  const cmc: IAutoMovieVector3 = thumb.points[0]!;
  // carpometacarpal line: the border over the trapezium, the thenar's proximal edge and the snuffbox behind it
  rows[0]![13] = V.of(base - 0.02 * L, 0.25 * palmarDepth(base), cmc.z + 0.45 * tw);
  rows[0]![0] = V.of(base + 0.02 * L, 1.05 * palmarDepth(base), cmc.z - 0.3 * tw);
  rows[0]![12] = V.of(base, -0.6 * dorsalHeight(base), cmc.z + 0.15 * tw);
  // mid-metacarpal: the thenar crease, a groove at the foot of the eminence where the palm meets it, and the first dorsal interosseous between the two metacarpals
  rows[1]![0] = palmar(rows[1]![1]!.x, zetas[0]! * 0.92 + 0.06, -P.crease);
  rows[1]![18] = V.offset(V.of(0, 0, 0), [dorsal(rows[1]![17]!.x, zetas[0]! * 0.92 + 0.25), 0.5], [V.offset(along(0.6), [nail, 0.5 * tw]), 0.5]);
  // the web: its crotch, and its palmar and dorsal sides halfway to the index's base
  rows[2]![19] = crotch;
  rows[2]![0] = V.offset(V.of(0, 0, 0), [crotch, 0.5], [palmar(fingers[0]!.points[0]!.x - 0.06 * L, 0.82, 0.05), 0.5], [thumb.pad, 0.25 * tw]);
  rows[2]![18] = V.offset(V.of(0, 0, 0), [crotch, 0.5], [dorsal(fingers[0]!.points[0]!.x - 0.06 * L, 0.86), 0.5], [nail, 0.2 * tw]);
  const s1: number[] = sketch.loop(rows[0]!);
  const s2: number[] = sketch.loop(rows[1]!);
  const s3: number[] = sketch.loop(rows[2]!);
  const wrist: number[] = sketch.loop(props.wrist);
  // beside the ring, a loop at the ring's own radii, so the joined surface keeps the ring's girth: the ring's limit is the B-spline of its loop and its two neighbours, and the arm's loop beside it lies at the same radii
  const beside: number[] = sketch.loop(
    props.wrist.map((p: IAutoMovieVector3): IAutoMovieVector3 => V.offset(p, [V.of(1, 0, 0), F.besideWrist * L])),
  );
  sketch.bridge(wrist, beside);

  // wrist to carpometacarpal line, three sectors; W starts at p_r of the 14-loop
  const rotated: number[] = [...s1.slice(3), ...s1.slice(0, 3)];
  sketch.taper(beside, rotated, [1, 1, 3, 1, 3, 1, 1, 3]);
  // carpometacarpal line to mid-metacarpal: a three-span sector over each valley between tendons; the thumb's hole leaves the radial border open
  sketch.taper(s1, s2, [1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 3, 1, 1, 1], new Set([12, 13]));
  sketch.bridge(s2, s3, new Set([18, 19]));

  // the knuckle loop and the sockets
  const sockets: number[][] = fingers.map((f: readAutoMovieHumanHand.IDigit, i: number): number[] => {
    const knuckle: IAutoMovieVector3 = f.points[0]!;
    const w: number = widths[i]! * 1.06;
    const rise: number = thickness * P.dorsal * P.knuckle * (i === 1 ? P.middleKnuckle : 1);
    const pad: number = thickness * (1 - P.dorsal) * P.pad;
    // the flanks, 2 and 6, are the webs' and borders' vertices, added below
    return [
      V.of(f.crease, pad, knuckle.z),
      V.of(f.crease, pad * 0.8, knuckle.z - w * 0.38),
      null,
      V.of(knuckle.x, -rise * P.knuckleFlank + loss, knuckle.z - w * 0.4),
      V.of(knuckle.x - 0.01 * L, -rise, knuckle.z),
      V.of(knuckle.x, -rise * P.knuckleFlank + loss, knuckle.z + w * 0.4),
      null,
      V.of(f.crease, pad * 0.8, knuckle.z + w * 0.38),
    ].map((t: IAutoMovieVector3 | null): number => (t === null ? -1 : sketch.vertex(t)));
  });
  // webs between neighbours: U of the radial finger and R of the ulnar one, at the crotch
  for (let i: number = 0; i < 3; ++i) {
    const f: readAutoMovieHumanHand.IDigit = fingers[i]!;
    const g: readAutoMovieHumanHand.IDigit = fingers[i + 1]!;
    const crotch: number = (f.crease + g.crease) / 2 + F.webs[i]! * L;
    const middle: number = (f.points[0]!.z + g.points[0]!.z) / 2;
    const gap: number = 0.08 * (f.points[0]!.z - g.points[0]!.z);
    const y: number = 0;
    sockets[i]![2] = sketch.vertex(V.of(crotch, y, middle + gap));
    sockets[i + 1]![6] = sketch.vertex(V.of(crotch, y, middle - gap));
  }
  // the borders: index radial and little ulnar flanks
  const little: readAutoMovieHumanHand.IDigit = fingers[3]!;
  sockets[0]![6] = sketch.vertex(flank);
  sockets[3]![2] = sketch.vertex(
    V.of((little.points[0]!.x + little.crease) / 2, 0.12 * thickness, little.points[0]!.z - widths[3]! * 0.56),
  );
  const [I, M, R, Lt] = sockets as [number[], number[], number[], number[]];
  const knuckles: number[] = [
    I[7]!, I[0]!, I[1]!, M[7]!, M[0]!, M[1]!, R[7]!, R[0]!, R[1]!, Lt[7]!, Lt[0]!, Lt[1]!,
    Lt[2]!, Lt[3]!, Lt[4]!, Lt[5]!, R[3]!, R[4]!, R[5]!, M[3]!, M[4]!, M[5]!, I[3]!, I[4]!, I[5]!, I[6]!,
  ];
  sketch.taper(s3, knuckles, [1, 3, 3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
  for (let i: number = 0; i < 3; ++i) {
    const f: number[] = sockets[i]!;
    const g: number[] = sockets[i + 1]!;
    sketch.quad([f[3]!, f[2]!, g[6]!, g[5]!]);
    sketch.quad([f[2]!, f[1]!, g[7]!, g[6]!]);
  }
  return {
    wrist,
    beside,
    sockets: { Index: I, Middle: M, Ring: R, Little: Lt },
    thumb: [s2[0]!, s3[0]!, s3[19]!, s3[18]!, s2[18]!, s1[12]!, s1[13]!, s1[0]!],
  };
}
/** Props and output types of {@link shapeAutoMovieHumanPalm}. */
export namespace shapeAutoMovieHumanPalm {
  /**
   * What the palm is drawn from.
   *
   * @author Samchon
   */
  export interface IProps {
    /** The hand in its frame. */
    hand: readAutoMovieHumanHand.IHand;

    /** Hand breadth, millimetres. */
    breadth: number;

    /** Hand length, millimetres. */
    length: number;

    /** Wrist circumference, millimetres. */
    wristCircumference: number;

    /** Fat over the back of the hand, millimetres. */
    dorsalFat: number;

    /** The wrist ring's control points in the hand frame, palmar first, counterclockwise about the hand on the left. */
    wrist: IAutoMovieVector3[];
  }

  /**
   * Where the digits leave the palm.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** The wrist ring's vertices, in the order of `IProps.wrist`. */
    wrist: number[];

    /** The loop beside the wrist ring at its radii, to be held there. */
    beside: number[];

    /** Each finger's socket: palmar, ulnar, dorsal, radial and the vertices between. */
    sockets: Record<readAutoMovieHumanHand.IFinger, number[]>;

    /** The thumb's socket: toward its pad, the index, its nail and its outer border, and the vertices between. */
    thumb: number[];
  }
}
