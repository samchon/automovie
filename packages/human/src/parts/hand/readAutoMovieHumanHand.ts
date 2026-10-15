import { AutoMovieHumanoidBone, IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanSide } from "../../junction/AutoMovieHumanSide";
import { IAutoMovieHumanRingLayout } from "../../junction/IAutoMovieHumanRingLayout";
import { IAutoMovieHumanLandmarks } from "../../measure/IAutoMovieHumanLandmarks";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "../../skeleton/IAutoMovieHumanSkeleton";

/**
 * Read one hand of the skeleton into the hand's own frame, the frame its cage is drawn in.
 *
 * The frame's origin is the wrist ring's centre, on the forearm axis level with stylion. `x` runs distally along the hand bone from the wrist joint to the middle knuckle, `y` toward the palm along the wrist ring's palmar reference, and `z` toward the thumb, from the little knuckle to the index knuckle. Both hands get the same three directions in anatomical terms, so one drawing serves both; the right hand's frame is the mirror image of the left's, which `mirrored` reports.
 *
 * Each finger's palmar crease at its base is placed as the middle finger's is: the skeleton puts every crease at the same share of its finger's length from the tip, and the middle finger's crease is a landmark.
 *
 * @param skeleton The person's skeleton at rest
 * @param side Which hand
 * @param wrist The hand's ring layout at the wrist
 * @returns The hand in its frame, millimetres
 */
export function readAutoMovieHumanHand(
  skeleton: IAutoMovieHumanSkeleton,
  side: AutoMovieHumanSide,
  wrist: IAutoMovieHumanRingLayout,
): readAutoMovieHumanHand.IHand {
  const V: typeof AutoMovieHumanVector = AutoMovieHumanVector;
  const joint = (name: string): IAutoMovieHumanSkeleton.IJoint => {
    const bone: AutoMovieHumanoidBone = `${side}${name}` as AutoMovieHumanoidBone;
    const found: IAutoMovieHumanSkeleton.IJoint | undefined = skeleton.joints.find(
      (j: IAutoMovieHumanSkeleton.IJoint): boolean => j.bone === bone,
    );
    if (found === undefined) throw new Error(`skeleton lacks bone ${bone}`);
    return found;
  };
  const landmarks: IAutoMovieHumanLandmarks.ISide =
    side === "left" ? skeleton.landmarks.left : skeleton.landmarks.right;
  const origin: IAutoMovieVector3 = wrist.frame.origin;
  const hand: IAutoMovieHumanSkeleton.IJoint = joint("Hand");
  const distal: IAutoMovieVector3 = V.normalize(V.offset(hand.tail, [hand.position, -1]));
  const palmar: IAutoMovieVector3 = V.normalize(
    V.offset(wrist.frame.reference, [distal, -V.dot(wrist.frame.reference, distal)]),
  );
  const across: IAutoMovieVector3 = V.offset(
    joint("IndexProximal").position,
    [joint("LittleProximal").position, -1],
  );
  const radial: IAutoMovieVector3 = V.normalize(
    V.offset(across, [distal, -V.dot(across, distal)], [palmar, -V.dot(across, palmar)]),
  );
  const local = (p: IAutoMovieVector3): IAutoMovieVector3 => {
    const d: IAutoMovieVector3 = V.offset(p, [origin, -1]);
    return V.of(V.dot(d, distal), V.dot(d, palmar), V.dot(d, radial));
  };
  const direction = (p: IAutoMovieVector3): IAutoMovieVector3 =>
    V.of(V.dot(p, distal), V.dot(p, palmar), V.dot(p, radial));

  const middleTip: IAutoMovieVector3 = local(joint("MiddleDistal").tail);
  const middleKnuckle: IAutoMovieVector3 = local(joint("MiddleProximal").position);
  const crease: number =
    (middleTip.x - local(landmarks.middleFingerCrease.position).x) /
    V.distance(middleTip, middleKnuckle);
  const finger = (name: readAutoMovieHumanHand.IFinger): readAutoMovieHumanHand.IDigit => {
    const points: IAutoMovieVector3[] = [
      local(joint(`${name}Proximal`).position),
      local(joint(`${name}Intermediate`).position),
      local(joint(`${name}Distal`).position),
      local(joint(`${name}Distal`).tail),
    ];
    const length: number = V.distance(points[0]!, points[3]!);
    return { points, length, crease: points[3]!.x - crease * length };
  };
  const thumbPoints: IAutoMovieVector3[] = [
    local(joint("ThumbMetacarpal").position),
    local(joint("ThumbProximal").position),
    local(joint("ThumbDistal").position),
    local(joint("ThumbDistal").tail),
  ];
  const metacarpal: IAutoMovieHumanSkeleton.IJoint = joint("ThumbProximal");
  const along: IAutoMovieVector3 = direction(metacarpal.axes.twist);
  const pad: IAutoMovieVector3 = direction(
    V.normalize(V.cross(metacarpal.axes.flexion, metacarpal.axes.twist)),
  );
  const toIndex: IAutoMovieVector3 = V.offset(local(joint("IndexProximal").position), [
    thumbPoints[1]!,
    -1,
  ]);
  const web: IAutoMovieVector3 = V.normalize(
    V.offset(toIndex, [along, -V.dot(toIndex, along)], [pad, -V.dot(toIndex, pad)]),
  );
  return {
    origin,
    distal,
    palmar,
    radial,
    mirrored: V.dot(distal, V.cross(palmar, radial)) > 0,
    wrist: local(hand.position),
    stylion: local(landmarks.stylion.position),
    metacarpaleII: local(landmarks.metacarpaleII.position),
    metacarpaleV: local(landmarks.metacarpaleV.position),
    fingers: {
      Index: finger("Index"),
      Middle: finger("Middle"),
      Ring: finger("Ring"),
      Little: finger("Little"),
    },
    thumb: {
      points: thumbPoints,
      length: V.distance(thumbPoints[1]!, thumbPoints[3]!),
      crease: thumbPoints[1]!.x,
      pad,
      web,
    },
  };
}
export namespace readAutoMovieHumanHand {
  /** The four fingers by their bone name stem. */
  export type IFinger = "Index" | "Middle" | "Ring" | "Little";

  /**
   * One hand in its own frame.
   *
   * @author Samchon
   */
  export interface IHand {
    /** The frame's origin in the model frame. */
    origin: IAutoMovieVector3;

    /** Model direction of `x`, distal. */
    distal: IAutoMovieVector3;

    /** Model direction of `y`, palmar. */
    palmar: IAutoMovieVector3;

    /** Model direction of `z`, radial. */
    radial: IAutoMovieVector3;

    /** Whether the frame is left-handed in the model, as the right hand's is. */
    mirrored: boolean;

    /** Wrist joint centre. */
    wrist: IAutoMovieVector3;

    /** Radial styloid tip. */
    stylion: IAutoMovieVector3;

    /** Radial edge of the hand breadth. */
    metacarpaleII: IAutoMovieVector3;

    /** Ulnar edge of the hand breadth. */
    metacarpaleV: IAutoMovieVector3;

    /** The four fingers. */
    fingers: Record<IFinger, IDigit>;

    /** The thumb, its points from the carpometacarpal joint. */
    thumb: IDigit & {
      /** Unit direction its pad faces at rest. */
      pad: IAutoMovieVector3;

      /** Unit direction across it toward the index finger, perpendicular to the pad. */
      web: IAutoMovieVector3;
    };
  }

  /**
   * One digit's joints in the hand frame.
   *
   * @author Samchon
   */
  export interface IDigit {
    /** Joint centres from the root of the digit, then its tip. */
    points: IAutoMovieVector3[];

    /** Length from the metacarpophalangeal joint to the tip, millimetres. */
    length: number;

    /** `x` of the palmar crease at the digit's base. */
    crease: number;
  }
}
