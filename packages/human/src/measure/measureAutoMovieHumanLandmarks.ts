import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanLandmarks } from "./IAutoMovieHumanLandmarks";
import { IAutoMovieHumanSkeletalMeasurements } from "./IAutoMovieHumanSkeletalMeasurements";

/**
 * Measure landmarks the way an anthropometrist measures a standing person.
 *
 * The landmarks must be in the anthropometric posture: standing erect, arms hanging with the palms toward the thighs, head in the Frankfort plane, so a generated skeleton is first returned from its T-pose rest to that posture. Each measurement follows its survey definition: heights are the landmark's height above the standing surface, segment lengths are straight distances between their two landmarks (acromion to radiale, radiale to stylion, stylion to dactylion and to the middle finger's base crease, the thumb's base crease to its tip), leg lengths are differences of landmark heights (trochanterion, tibiale, lateral malleolus) as ANSUR II derives them, breadths are straight distances between the paired landmarks, head length runs glabella to opisthocranion along the sagittal axis, and foot length heel to toe tip along it. Acromial height is taken on the right side, as ANSUR II measures it. Sitting height is the vertex above the ischial seat level.
 *
 * @param landmarks Landmarks in the anthropometric posture, millimetres
 * @returns The skeletal measurements those landmarks give, all but span, which needs the arms outstretched
 */
export function measureAutoMovieHumanLandmarks(
  landmarks: IAutoMovieHumanLandmarks,
): IAutoMovieHumanSkeletalMeasurements.IHanging {
  const at: (
    landmark: IAutoMovieHumanLandmarks.ILandmark,
  ) => IAutoMovieVector3 = (
    landmark: IAutoMovieHumanLandmarks.ILandmark,
  ): IAutoMovieVector3 => landmark.position;
  const arm: (
    side: IAutoMovieHumanLandmarks.ISide,
  ) => IAutoMovieHumanSkeletalMeasurements.IArm = (
    side: IAutoMovieHumanLandmarks.ISide,
  ): IAutoMovieHumanSkeletalMeasurements.IArm => ({
    upperArmLength: distance(at(side.acromion), at(side.radiale)),
    forearmLength: distance(at(side.radiale), at(side.stylion)),
    handLength: distance(at(side.stylion), at(side.dactylion)),
    handBreadth: distance(at(side.metacarpaleII), at(side.metacarpaleV)),
    palmLength: distance(at(side.stylion), at(side.middleFingerCrease)),
    thumbLength: distance(at(side.thumbCrease), at(side.thumbTip)),
  });
  const leg: (
    side: IAutoMovieHumanLandmarks.ISide,
  ) => IAutoMovieHumanSkeletalMeasurements.ILeg = (
    side: IAutoMovieHumanLandmarks.ISide,
  ): IAutoMovieHumanSkeletalMeasurements.ILeg => ({
    thighLength: at(side.trochanterion).y - at(side.tibiale).y,
    shankLength: at(side.tibiale).y - at(side.lateralMalleolus).y,
    ankleHeight: at(side.lateralMalleolus).y,
    footLength: at(side.acropodion).z - at(side.pternion).z,
    footBreadth: distance(at(side.metatarsaleI), at(side.metatarsaleV)),
  });
  const headLength: number =
    at(landmarks.glabella).z - at(landmarks.opisthocranion).z;
  const headBreadth: number = distance(
    at(landmarks.left.eurion),
    at(landmarks.right.eurion),
  );
  return {
    body: {
      stature: at(landmarks.vertex).y,
      sittingHeight: at(landmarks.vertex).y - at(landmarks.ischialSeat).y,
      cervicaleHeight: at(landmarks.cervicale).y,
      suprasternaleHeight: at(landmarks.suprasternale).y,
      acromialHeight: at(landmarks.right.acromion).y,
      biacromialBreadth: distance(
        at(landmarks.left.acromion),
        at(landmarks.right.acromion),
      ),
      bicristalBreadth: distance(
        at(landmarks.left.iliocristale),
        at(landmarks.right.iliocristale),
      ),
      leftArm: arm(landmarks.left),
      rightArm: arm(landmarks.right),
      leftLeg: leg(landmarks.left),
      rightLeg: leg(landmarks.right),
    },
    head: {
      headLength,
      cephalicIndex: (100 * headBreadth) / headLength,
      headHeight: at(landmarks.vertex).y - at(landmarks.menton).y,
      faceHeight: at(landmarks.nasion).y - at(landmarks.menton).y,
      faceWidth: distance(
        at(landmarks.left.zygion),
        at(landmarks.right.zygion),
      ),
      mandibularWidth: distance(
        at(landmarks.left.gonion),
        at(landmarks.right.gonion),
      ),
      minimumFrontalWidth: distance(
        at(landmarks.left.frontotemporale),
        at(landmarks.right.frontotemporale),
      ),
    },
  };
}

/**
 * Straight distance between two points.
 *
 * @param a First point
 * @param b Second point
 * @returns Distance in their unit
 */
function distance(a: IAutoMovieVector3, b: IAutoMovieVector3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}
