import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanBranch } from "../../junction/AutoMovieHumanBranch";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { sweepAutoMovieHumanDigit } from "../sweepAutoMovieHumanDigit";
import { AUTOMOVIE_HUMAN_HAND_FORM } from "./AUTOMOVIE_HUMAN_HAND_FORM";
import { AUTOMOVIE_HUMAN_HAND_SHAPE } from "./AUTOMOVIE_HUMAN_HAND_SHAPE";
import { measureAutoMovieHumanFingerRoots } from "./measureAutoMovieHumanFingerRoots";
import { readAutoMovieHumanHand } from "./readAutoMovieHumanHand";
import { sectionAutoMovieHumanFingerShaft } from "./sectionAutoMovieHumanFingerShaft";

/**
 * Sweep the hand's five digits along their joints with `sweepAutoMovieHumanDigit`, in the hand frame.
 *
 * Each finger starts on its axis a fitted distance beyond the higher of the crotches beside it, so its bridge spans the webs, and its sections are rounded boxes at its root, its proximal and distal interphalangeal joints, the middle of its middle phalanx and its pad, sized by the hand's breadth, their shaft sizes supplied by the shared external-section proxy and their dorsal shares conventional. Its loop starts at its palmar side. The palm and saddle bridge own the thenar mass through the thumb's metacarpophalangeal joint to its first-web plane; the free tube starts beyond that shared plane on the proximal phalanx, then passes the interphalangeal joint and pad; its loop starts toward the first corner of its opening in the palm, so the bridge from that opening meets the thumb without a twist.
 *
 * @param props The hand, its arm's measurements, the crotches' distal levels between neighbouring fingers and the first corner of the thumb's opening, hand frame, millimetres
 * @returns The digits' sweeps, thumb first and then index to little
 */
export function sweepAutoMovieHumanHandDigits(props: {
  hand: readAutoMovieHumanHand.IHand;
  arm: IAutoMovieHumanIdentity.IArm;
  crotch: number[];
  thumbCorner: IAutoMovieVector3;
}): sweepAutoMovieHumanHandDigits.IDigit[] {
  const V: typeof AutoMovieHumanVector = AutoMovieHumanVector;
  const F: typeof AUTOMOVIE_HUMAN_HAND_FORM = AUTOMOVIE_HUMAN_HAND_FORM;
  const SHAPE: typeof AUTOMOVIE_HUMAN_HAND_SHAPE.layout =
    AUTOMOVIE_HUMAN_HAND_SHAPE.layout;
  const S: typeof AUTOMOVIE_HUMAN_HAND_SHAPE.finger =
    AUTOMOVIE_HUMAN_HAND_SHAPE.finger;
  const T: typeof AUTOMOVIE_HUMAN_HAND_SHAPE.thumb =
    AUTOMOVIE_HUMAN_HAND_SHAPE.thumb;
  const L: number = props.arm.handLength;
  const b: number = props.arm.handBreadth;
  // the thumb, its loop starting toward the opening's first corner
  const thumb: readAutoMovieHumanHand.IHand["thumb"] = props.hand.thumb;
  // The palm owns the thenar mass. The free tube leaves beyond the first-web
  // plane, measured from the same stylion datum as hand length. Greiner's
  // crease baseline is approximated here by its radial stylion landmark;
  // this is a population-derived proxy, not an individual clinical claim.
  const cut: number = props.hand.stylion.x + (F.thumbWeb + SHAPE.root) * L;
  if (!(cut > thumb.points[1]!.x && cut < thumb.points[2]!.x))
    throw new Error("The thumb web must leave the proximal phalanx");
  const free: IAutoMovieVector3 = along(thumb.points, cut);
  const start: IAutoMovieVector3 = thumb.points[1]!;
  const axis: IAutoMovieVector3 = V.normalize(
    V.offset(thumb.points[1]!, [thumb.points[0]!, -1]),
  );
  const toCorner: IAutoMovieVector3 = V.offset(props.thumbCorner, [start, -1]);
  const first: IAutoMovieVector3 = V.normalize(
    V.offset(toCorner, [axis, -V.dot(toCorner, axis)]),
  );
  const second: IAutoMovieVector3 = V.cross(axis, first);
  const tw: number = F.thumb.ip * b;
  const td: number = F.depth.thumb * tw;
  const phalanx: number = V.distance(start, thumb.points[2]!);
  const thumbBody: sweepAutoMovieHumanDigit.IOutput = sweepAutoMovieHumanDigit({
    points: [start, ...thumb.points.slice(2)],
    first,
    pad: Math.atan2(V.dot(thumb.pad, second), V.dot(thumb.pad, first)),
    stations: [
      {
        at: 0,
        breadth: tw * T.knuckle,
        dorsal: td * T.knuckleDorsal,
        palmar: td * T.knucklePalmar,
        square: 2.6,
      },
      {
        at: 0.5 * phalanx,
        breadth: tw * T.phalanx,
        dorsal: td * 0.48,
        palmar: td * 0.56,
        square: 2.6,
      },
      {
        at: phalanx,
        breadth: tw,
        dorsal: td * 0.5,
        palmar: td * 0.5,
        square: 2.6,
      },
      {
        at: phalanx + 0.4 * V.distance(thumb.points[2]!, thumb.points[3]!),
        breadth: tw * 0.98,
        dorsal: td * 0.4,
        palmar: td * 0.58,
        square: 2.6,
      },
    ],
  });
  const digits: sweepAutoMovieHumanHandDigits.IDigit[] = [
    {
      name: "thumb",
      out: thumbBody,
      root: V.distance(start, free) / thumbBody.length,
    },
  ];
  const roots: number[] = measureAutoMovieHumanFingerRoots(props.crotch, L);
  // the fingers, each from beyond its webs, its loop starting at its palmar side
  FINGERS.forEach((finger: readAutoMovieHumanHand.IFinger, i: number): void => {
    const digit: readAutoMovieHumanHand.IDigit = props.hand.fingers[finger];
    const root: IAutoMovieVector3 = along(digit.points, roots[i]!);
    const shaft: sectionAutoMovieHumanFingerShaft.ISection =
      sectionAutoMovieHumanFingerShaft(finger, b);
    const wp: number = F.fingers[finger].pip * b;
    const wd: number = F.fingers[finger].dip * b;
    const dp: number = F.depth.pip * wp;
    const dd: number = F.depth.dip * wd;
    const base: number = V.distance(root, digit.points[1]!);
    const l1: number = V.distance(digit.points[1]!, digit.points[2]!);
    const l2: number = V.distance(digit.points[2]!, digit.points[3]!);
    const box: (
      at: number,
      w: number,
      d: number,
      dorsal: number,
    ) => sweepAutoMovieHumanDigit.IStation = (
      at: number,
      w: number,
      d: number,
      dorsal: number,
    ): sweepAutoMovieHumanDigit.IStation => ({
      at,
      breadth: w,
      dorsal: d * dorsal,
      palmar: d * (1 - dorsal),
      square: shaft.square,
    });
    digits.push({
      name: finger.toLowerCase() as AutoMovieHumanBranch<"hand">,
      root: 0,
      out: sweepAutoMovieHumanDigit({
        points: [root, ...digit.points.slice(1)],
        first: V.of(0, 1, 0),
        pad: 0,
        stations: [
          {
            at: 0,
            breadth: shaft.breadth,
            dorsal: shaft.dorsal,
            palmar: shaft.palmar,
            square: shaft.square,
          },
          box(base, wp, dp, S.joint),
          box(
            base + 0.5 * l1,
            wp + (wd - wp) * 0.48,
            dp + (dd - dp) * 0.48,
            S.shaft,
          ),
          box(base + l1, wd, dd, S.joint),
          box(base + l1 + 0.4 * l2, wd * S.padBreadth, dd * S.padDepth, S.pad),
        ],
      }),
    });
  });
  return digits;
}
/** Digit type of {@link sweepAutoMovieHumanHandDigits}. */
export namespace sweepAutoMovieHumanHandDigits {
  /**
   * One digit's sweep.
   *
   * @author Samchon
   */
  export interface IDigit {
    /** The digit's branch, also its sweep's name. */
    name: AutoMovieHumanBranch<"hand">;
    /** Its sweep and stations. */
    out: sweepAutoMovieHumanDigit.IOutput;
    /** First free-tube section on the same anatomical sweep; zero for fingers. */
    root: number;
  }
}
const FINGERS: readAutoMovieHumanHand.IFinger[] = [
  "Index",
  "Middle",
  "Ring",
  "Little",
];
/** The point of a joint chain at a level `x`. */
const along: (points: IAutoMovieVector3[], x: number) => IAutoMovieVector3 = (
  points: IAutoMovieVector3[],
  x: number,
): IAutoMovieVector3 => {
  for (let i: number = 0; i + 1 < points.length; ++i) {
    const a: IAutoMovieVector3 = points[i]!;
    const c: IAutoMovieVector3 = points[i + 1]!;
    if (x <= c.x || i + 2 === points.length) {
      const t: number = (x - a.x) / (c.x - a.x);
      return AutoMovieHumanVector.of(
        a.x + (c.x - a.x) * t,
        a.y + (c.y - a.y) * t,
        a.z + (c.z - a.z) * t,
      );
    }
  }
  return points[points.length - 1]!;
};
