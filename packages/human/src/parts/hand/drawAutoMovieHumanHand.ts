import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanBranch } from "../../junction/AutoMovieHumanBranch";
import { IAutoMovieHumanRingShape } from "../../junction/IAutoMovieHumanRingShape";
import { shapeAutoMovieHumanRing } from "../../junction/shapeAutoMovieHumanRing";
import { AutoMovieHumanSide } from "../../junction/AutoMovieHumanSide";
import { IAutoMovieHumanMeasurements } from "../../measure/IAutoMovieHumanMeasurements";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "../../skeleton/IAutoMovieHumanSkeleton";
import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { AUTOMOVIE_HUMAN_HAND_FORM } from "./AUTOMOVIE_HUMAN_HAND_FORM";
import { AUTOMOVIE_HUMAN_HAND_SHAPE } from "./AUTOMOVIE_HUMAN_HAND_SHAPE";
import { AutoMovieHumanHandSketch } from "./AutoMovieHumanHandSketch";
import { calibrateAutoMovieHumanHand } from "./calibrateAutoMovieHumanHand";
import { readAutoMovieHumanHand } from "./readAutoMovieHumanHand";
import { shapeAutoMovieHumanDigit } from "./shapeAutoMovieHumanDigit";
import { shapeAutoMovieHumanPalm } from "./shapeAutoMovieHumanPalm";

/**
 * Draw one hand's cage and solve it, in the hand's own frame.
 *
 * The drawing (`shapeAutoMovieHumanPalm`, `shapeAutoMovieHumanDigit`) gives every cage vertex a point of the skin it must reach, from the skeleton's joints and the measured breadths, lengths and webs; `calibrateAutoMovieHumanHand` then solves the cage so its Catmull-Clark limit surface follows those points and measures the identity's hand length and breadth. The wrist ring's points are the shared `shapeAutoMovieHumanRing`'s, which the arm opens too, and the fit holds them, so the junction welds the two rings exactly.
 *
 * @param props Measurements, skeleton and side
 * @returns The hand, its ring, the skin points and the solved control points, with vertices no quad uses dropped
 */
export function drawAutoMovieHumanHand(props: {
  measurements: IAutoMovieHumanMeasurements;
  skeleton: IAutoMovieHumanSkeleton;
  side: AutoMovieHumanSide;
}): drawAutoMovieHumanHand.IOutput {
  const V: typeof AutoMovieHumanVector = AutoMovieHumanVector;
  const arm: IAutoMovieHumanIdentity.IArm =
    props.side === "left"
      ? props.measurements.identity.body.leftArm
      : props.measurements.identity.body.rightArm;
  const layout: IAutoMovieHumanRingShape = shapeAutoMovieHumanRing({
    skeleton: props.skeleton,
    measurements: props.measurements,
    site: "wrist",
    side: props.side,
    part: "hand",
  });
  const hand: readAutoMovieHumanHand.IHand = readAutoMovieHumanHand(props.skeleton, props.side, layout);
  const toLocal = (d: IAutoMovieVector3): IAutoMovieVector3 =>
    V.of(V.dot(d, hand.distal), V.dot(d, hand.palmar), V.dot(d, hand.radial));

  // the wrist ring: the shared ring shape's points, vertex k of the drawing on the layout direction a k-th eighth turn from the palm
  const order: number[] = new Array<number>(layout.count);
  const wrist: IAutoMovieVector3[] = new Array<IAutoMovieVector3>(layout.count);
  layout.directions.forEach((direction: IAutoMovieVector3, j: number): void => {
    const d: IAutoMovieVector3 = toLocal(direction);
    const k: number = (Math.round(Math.atan2(-d.z, d.y) / (Math.PI / 4)) + 8) % 8;
    order[j] = k;
    wrist[k] = toLocal(V.offset(layout.positions[j]!, [hand.origin, -1]));
  });

  const sketch: AutoMovieHumanHandSketch = new AutoMovieHumanHandSketch();
  const palm: shapeAutoMovieHumanPalm.IOutput = shapeAutoMovieHumanPalm(sketch, {
    hand,
    breadth: arm.handBreadth,
    length: arm.handLength,
    wristCircumference: arm.wristCircumference,
    dorsalFat: arm.dorsalHandFat,
    wrist,
  });
  // each digit's faces and the place of each of its vertices on its own chart: u by arc length from the socket (0) to the tip (1), v by the loop's eighth turn from the pad
  const branches: Array<{ branch: AutoMovieHumanBranch<"hand">; start: number; end: number; chart: Map<number, { u: number; v: number }> }> = [];
  const draw = (branch: AutoMovieHumanBranch<"hand">, form: shapeAutoMovieHumanDigit.IProps): shapeAutoMovieHumanDigit.IOutput => {
    const start: number = sketch.faces().length;
    const out: shapeAutoMovieHumanDigit.IOutput = shapeAutoMovieHumanDigit(sketch, form);
    const reach: number = form.points
      .slice(1)
      .reduce((sum: number, p: IAutoMovieVector3, i: number): number => sum + V.distance(form.points[i]!, p), 0);
    const chart: Map<number, { u: number; v: number }> = new Map();
    out.loops.forEach((loop: number[], r: number): void =>
      loop.forEach((v: number, k: number): void => {
        chart.set(v, { u: r === 0 ? 0 : form.sections[r - 1]!.at / reach, v: k / loop.length });
      }),
    );
    chart.set(out.apex, { u: 1, v: Number.NaN });
    branches.push({ branch, start, end: sketch.faces().length, chart });
    return out;
  };
  const fingers: Array<{ vertices: number[]; digit: readAutoMovieHumanHand.IDigit }> = (
    ["Index", "Middle", "Ring", "Little"] as const
  ).map((finger: readAutoMovieHumanHand.IFinger) => {
    const out: shapeAutoMovieHumanDigit.IOutput = draw(
      finger.toLowerCase() as AutoMovieHumanBranch<"hand">,
      fingerForm(hand, finger, palm.sockets[finger], arm),
    );
    return { vertices: [...out.loops.slice(1).flat(), out.apex], digit: hand.fingers[finger] };
  });
  const thumb: shapeAutoMovieHumanDigit.IOutput = draw("thumb", thumbForm(hand, palm.thumb, arm));

  // vertices no quad uses, the thumb hole's centre, are dropped and the rest renumbered in order
  const index: number[] = new Array<number>(sketch.targets().length).fill(-1);
  for (const quad of sketch.faces()) for (const v of quad) index[v] = 0;
  const kept: number[] = [];
  index.forEach((used: number, v: number): void => {
    if (used === -1) return;
    index[v] = kept.length;
    kept.push(v);
  });
  const renumber = (vs: number[]): number[] => vs.map((v: number): number => index[v]!);
  const quads: Array<[number, number, number, number]> = sketch
    .faces()
    .map((q: readonly [number, number, number, number]): [number, number, number, number] => [
      index[q[0]]!,
      index[q[1]]!,
      index[q[2]]!,
      index[q[3]]!,
    ]);
  const targets: IAutoMovieVector3[] = kept.map((v: number): IAutoMovieVector3 => sketch.target(v));
  const positions: IAutoMovieVector3[] = calibrateAutoMovieHumanHand({
    targets,
    faces: quads,
    hand,
    length: arm.handLength,
    fingers: fingers.map((f) => ({ vertices: renumber(f.vertices), digit: f.digit })),
    thumb: renumber([...thumb.loops.slice(1).flat(), thumb.apex]),
    held: renumber(palm.beside),
  });
  return {
    hand,
    arm,
    layout,
    ring: order.map((k: number): number => index[palm.wrist[k]!]!),
    targets,
    positions,
    quads,
    branches: branches.map((b) => ({
      branch: b.branch,
      start: b.start,
      end: b.end,
      chart: new Map([...b.chart].map(([v, c]: [number, { u: number; v: number }]): [number, { u: number; v: number }] => [index[v]!, c])),
    })),
  };
}
/** Output type of {@link drawAutoMovieHumanHand}. */
export namespace drawAutoMovieHumanHand {
  /**
   * One solved hand.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** The hand in its frame. */
    hand: readAutoMovieHumanHand.IHand;

    /** Its arm's measurements. */
    arm: IAutoMovieHumanIdentity.IArm;

    /** Its ring at the wrist, as the shared ring shape gives it. */
    layout: IAutoMovieHumanRingShape;

    /** The wrist ring's vertices in layout order. */
    ring: number[];

    /** Skin point of each vertex, hand frame. */
    targets: IAutoMovieVector3[];

    /** Control point of each vertex, hand frame. */
    positions: IAutoMovieVector3[];

    /** Quads, counterclockwise seen from outside the left hand. */
    quads: Array<[number, number, number, number]>;

    /** Each digit's quads, `start` to `end` exclusive, and its vertices' places on its own chart: `u` from the socket to the tip, `v` from the pad counterclockwise about the digit on the left hand, NaN at the apex. */
    branches: Array<{ branch: AutoMovieHumanBranch<"hand">; start: number; end: number; chart: Map<number, { u: number; v: number }> }>;
  }
}

/** A finger's loops from its socket: the joints with a loop each side, the pad and the tip. */
const fingerForm = (
  hand: readAutoMovieHumanHand.IHand,
  finger: readAutoMovieHumanHand.IFinger,
  socket: number[],
  arm: IAutoMovieHumanIdentity.IArm,
): shapeAutoMovieHumanDigit.IProps => {
  const F: typeof AUTOMOVIE_HUMAN_HAND_FORM = AUTOMOVIE_HUMAN_HAND_FORM;
  const digit: readAutoMovieHumanHand.IDigit = hand.fingers[finger];
  const L: number = digit.length;
  const wp: number = F.fingers[finger].pip * arm.handBreadth;
  const wd: number = F.fingers[finger].dip * arm.handBreadth;
  const S: typeof AUTOMOVIE_HUMAN_HAND_SHAPE.finger = AUTOMOVIE_HUMAN_HAND_SHAPE.finger;
  const dp: number = F.depth.pip * wp;
  const dd: number = F.depth.dip * wd;
  const root: number = (digit.crease - digit.points[0]!.x) / L + 0.06;
  const section = (
    at: number,
    breadth: number,
    depth: number,
    dorsal: number,
    square: number,
    swell?: number[],
  ): shapeAutoMovieHumanDigit.ISection => ({
    at: at * L,
    breadth,
    dorsal: depth * dorsal,
    palmar: depth * (1 - dorsal),
    side: 0.04,
    square,
    swell,
  });
  // a joint loop: the knuckle's crest on the back, the flexion crease across the palmar side
  const joint: number[] = [1 - S.crease, 1 - S.crease / 2, 1, 1, 1 + S.crest, 1, 1, 1 - S.crease / 2];
  // the distal pad: the pulp bulging under the tip
  const pulp: number[] = [1 + S.pulp, 1 + S.pulp / 2, 1, 1, 1, 1, 1, 1 + S.pulp / 2];
  return {
  socket,
  points: digit.points,
  palmar: { x: 0, y: 1, z: 0 },
  ulnar: { x: 0, y: 0, z: -1 },
  sections: [
    section(root, wp * 1.02, dp * 1.01, S.shaft, S.square),
    section(0.4, wp * 0.99, dp * 0.99, S.shaft, S.square),
    section(0.5, wp, dp, S.joint, S.square, joint),
    section(0.62, wp + (wd - wp) * 0.48, dp + (dd - dp) * 0.48, S.shaft, S.square),
    section(0.75, wd, dd, S.joint, S.square, joint),
    section(0.85, wd * S.padBreadth, dd * S.padDepth, S.pad, S.square, pulp),
    section(0.94, wd * S.tipBreadth, dd * S.tipDepth, S.pad, S.square),
  ],
  apex: AutoMovieHumanVector.offset(digit.points[3]!, [{ x: 0, y: 1, z: 0 }, 0.1 * dd]),
  };
};

/** The thumb's loops from its socket around the thenar eminence. */
const thumbForm = (
  hand: readAutoMovieHumanHand.IHand,
  socket: number[],
  arm: IAutoMovieHumanIdentity.IArm,
): shapeAutoMovieHumanDigit.IProps => {
  const F: typeof AUTOMOVIE_HUMAN_HAND_FORM = AUTOMOVIE_HUMAN_HAND_FORM;
  const thumb: readAutoMovieHumanHand.IHand["thumb"] = hand.thumb;
  const metacarpal: number = AutoMovieHumanVector.distance(thumb.points[0]!, thumb.points[1]!);
  const L: number = thumb.length;
  const T: typeof AUTOMOVIE_HUMAN_HAND_SHAPE.thumb = AUTOMOVIE_HUMAN_HAND_SHAPE.thumb;
  const w: number = F.thumb.ip * arm.handBreadth;
  const d: number = F.depth.thumb * w;
  const section = (
  at: number,
  breadth: number,
  dorsal: number,
  palmar: number,
  square: number,
  advance?: number[],
  ): shapeAutoMovieHumanDigit.ISection => ({ at, breadth, dorsal, palmar, side: 0.04, square, advance });
  return {
  socket,
  points: thumb.points,
  palmar: thumb.pad,
  ulnar: thumb.web,
  sections: [
    // the thenar eminence over the metacarpal's middle, a rounded mass toward the pad; its web side runs out along the web's edge
    section(metacarpal * 0.55, w * T.mass, d * 0.5, T.thenar * w, 0.78, [0, 0.2 * L, 0.35 * L, 0.2 * L, 0, 0, 0, 0]),
    // the knuckle inside the thenar's distal slope; its web side runs out along the web's edge
    section(metacarpal, w * T.knuckle, d * T.knuckleDorsal, d * T.knucklePalmar, 0.76, [0, 0.12 * L, 0.2 * L, 0.12 * L, 0, 0, 0, 0]),
    section(metacarpal + 0.28 * L, w * T.phalanx, d * 0.48, d * 0.56, 0.74),
    section(metacarpal + 0.5 * L, w, d * 0.5, d * 0.5, 0.74),
    section(metacarpal + 0.7 * L, w * 0.98, d * 0.4, d * 0.58, 0.74),
    section(metacarpal + 0.9 * L, w * 0.8, d * 0.34, d * 0.46, 0.74),
  ],
  apex: AutoMovieHumanVector.offset(thumb.points[3]!, [thumb.pad, 0.1 * d]),
  };
};
