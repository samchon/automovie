import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanRingLayout } from "../../junction/IAutoMovieHumanRingLayout";
import { layoutAutoMovieHumanRing } from "../../junction/layoutAutoMovieHumanRing";
import { AutoMovieHumanSide } from "../../junction/AutoMovieHumanSide";
import { IAutoMovieHumanMeasurements } from "../../measure/IAutoMovieHumanMeasurements";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "../../skeleton/IAutoMovieHumanSkeleton";
import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { AUTOMOVIE_HUMAN_HAND_FORM } from "./AUTOMOVIE_HUMAN_HAND_FORM";
import { AutoMovieHumanHandSketch } from "./AutoMovieHumanHandSketch";
import { calibrateAutoMovieHumanHand } from "./calibrateAutoMovieHumanHand";
import { readAutoMovieHumanHand } from "./readAutoMovieHumanHand";
import { shapeAutoMovieHumanDigit } from "./shapeAutoMovieHumanDigit";
import { shapeAutoMovieHumanPalm } from "./shapeAutoMovieHumanPalm";

/**
 * Draw one hand's cage and solve it, in the hand's own frame.
 *
 * The drawing (`shapeAutoMovieHumanPalm`, `shapeAutoMovieHumanDigit`) gives every cage vertex a point of the skin it must reach, from the skeleton's joints and the measured breadths, lengths and webs; `calibrateAutoMovieHumanHand` then solves the cage so its Catmull-Clark limit surface follows those points and measures the identity's hand length and breadth. The wrist ring is the measured wrist ellipse, its vertex `k` of the drawing on the layout direction a `k`-th eighth turn from the palm.
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
  const F: typeof AUTOMOVIE_HUMAN_HAND_FORM = AUTOMOVIE_HUMAN_HAND_FORM;
  const arm: IAutoMovieHumanIdentity.IArm =
    props.side === "left"
      ? props.measurements.identity.body.leftArm
      : props.measurements.identity.body.rightArm;
  const layout: IAutoMovieHumanRingLayout = layoutAutoMovieHumanRing({
    skeleton: props.skeleton,
    site: "wrist",
    side: props.side,
    part: "hand",
  });
  const hand: readAutoMovieHumanHand.IHand = readAutoMovieHumanHand(props.skeleton, props.side, layout);
  const toLocal = (d: IAutoMovieVector3): IAutoMovieVector3 =>
    V.of(V.dot(d, hand.distal), V.dot(d, hand.palmar), V.dot(d, hand.radial));

  // the wrist ring: the measured ellipse, vertex k of the drawing on the layout direction a k-th eighth turn from the palm
  const aw: number = (F.wrist.breadth * arm.wristCircumference) / 2;
  const cw: number = aw * F.wrist.depth;
  const order: number[] = new Array<number>(layout.count);
  const wrist: IAutoMovieVector3[] = new Array<IAutoMovieVector3>(layout.count);
  layout.directions.forEach((direction: IAutoMovieVector3, j: number): void => {
    const d: IAutoMovieVector3 = toLocal(direction);
    const angle: number = Math.atan2(-d.z, d.y);
    const k: number = (Math.round(angle / (Math.PI / 4)) + 8) % 8;
    const radius: number = (aw * cw) / Math.hypot(aw * d.y, cw * d.z);
    order[j] = k;
    wrist[k] = V.of(d.x * radius, d.y * radius, d.z * radius);
  });

  const sketch: AutoMovieHumanHandSketch = new AutoMovieHumanHandSketch();
  const palm: shapeAutoMovieHumanPalm.IOutput = shapeAutoMovieHumanPalm(sketch, {
    hand,
    breadth: arm.handBreadth,
    length: arm.handLength,
    wristCircumference: arm.wristCircumference,
    wrist,
  });
  const fingers: Array<{ vertices: number[]; digit: readAutoMovieHumanHand.IDigit }> = (
    ["Index", "Middle", "Ring", "Little"] as const
  ).map((finger: readAutoMovieHumanHand.IFinger) => {
    const out: shapeAutoMovieHumanDigit.IOutput = shapeAutoMovieHumanDigit(
      sketch,
      fingerForm(hand, finger, palm.sockets[finger], arm),
    );
    return { vertices: [...out.loops.slice(1).flat(), out.apex], digit: hand.fingers[finger] };
  });
  const thumb: shapeAutoMovieHumanDigit.IOutput = shapeAutoMovieHumanDigit(sketch, thumbForm(hand, palm.thumb, arm));

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
  });
  return {
    hand,
    arm,
    layout,
    ring: order.map((k: number): number => index[palm.wrist[k]!]!),
    targets,
    positions,
    quads,
  };
}
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

    /** Its ring layout at the wrist. */
    layout: IAutoMovieHumanRingLayout;

    /** The wrist ring's vertices in layout order. */
    ring: number[];

    /** Skin point of each vertex, hand frame. */
    targets: IAutoMovieVector3[];

    /** Control point of each vertex, hand frame. */
    positions: IAutoMovieVector3[];

    /** Quads, counterclockwise seen from outside the left hand. */
    quads: Array<[number, number, number, number]>;
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
  const dp: number = F.depth.pip * wp;
  const dd: number = F.depth.dip * wd;
  const root: number = (digit.crease - digit.points[0]!.x) / L + 0.06;
  const section = (
  at: number,
  breadth: number,
  depth: number,
  dorsal: number,
  square: number,
  ): shapeAutoMovieHumanDigit.ISection => ({
  at: at * L,
  breadth,
  dorsal: depth * dorsal,
  palmar: depth * (1 - dorsal),
  side: 0.04,
  square,
  });
  return {
  socket,
  points: digit.points,
  palmar: { x: 0, y: 1, z: 0 },
  ulnar: { x: 0, y: 0, z: -1 },
  sections: [
    section(root, wp * 1.02, dp * 1.01, 0.45, 0.74),
    section(0.4, wp * 0.99, dp * 0.99, 0.45, 0.74),
    section(0.5, wp, dp, 0.46, 0.74),
    section(0.62, wp + (wd - wp) * 0.48, dp + (dd - dp) * 0.48, 0.45, 0.74),
    section(0.75, wd, dd, 0.45, 0.74),
    section(0.85, wd * 0.95, dd * 0.92, 0.41, 0.74),
    section(0.94, wd * 0.78, dd * 0.74, 0.41, 0.74),
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
    // the knuckle inside the thenar's distal slope; its web side runs out along the web's edge
    section(metacarpal, w * 1.3, d * 0.55, d * 0.85, 0.76, [0, 0.12 * L, 0.2 * L, 0.12 * L, 0, 0, 0, 0]),
    section(metacarpal + 0.28 * L, w * 1.06, d * 0.48, d * 0.56, 0.74),
    section(metacarpal + 0.5 * L, w, d * 0.5, d * 0.5, 0.74),
    section(metacarpal + 0.7 * L, w * 0.98, d * 0.4, d * 0.58, 0.74),
    section(metacarpal + 0.9 * L, w * 0.8, d * 0.34, d * 0.46, 0.74),
  ],
  apex: AutoMovieHumanVector.offset(thumb.points[3]!, [thumb.pad, 0.1 * d]),
  };
};
