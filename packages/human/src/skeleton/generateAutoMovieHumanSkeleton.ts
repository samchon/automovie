import { IAutoMovieHumanLandmarks } from "../measure/IAutoMovieHumanLandmarks";
import { IAutoMovieHumanMeasurements } from "../measure/IAutoMovieHumanMeasurements";
import { IAutoMovieHumanIdentity } from "../structures/IAutoMovieHumanIdentity";
import { AutoMovieHumanVector } from "./AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "./IAutoMovieHumanSkeleton";
import { abductAutoMovieHumanArms } from "./abductAutoMovieHumanArms";
import { constrainAutoMovieHumanJoint } from "./constrainAutoMovieHumanJoint";
import { placeAutoMovieHumanArm } from "./placeAutoMovieHumanArm";
import { placeAutoMovieHumanHead } from "./placeAutoMovieHumanHead";
import { placeAutoMovieHumanLeg } from "./placeAutoMovieHumanLeg";
import { placeAutoMovieHumanTrunk } from "./placeAutoMovieHumanTrunk";

/**
 * Generate the skeleton of one person from resolved measurements: all 55 `AutoMovieHumanoidBone`s with joint centres, declared axes, ranges of motion and landmarks.
 *
 * Generation runs in the anthropometric posture the measurements were taken in, then converts once:
 *
 * 1. Legs: ankle, knee and hip centres from the stacked leg lengths and de Leva's landmark offsets, the hip centres spread by Hara's CT regression on leg length, the foot and toes from foot length and breadth.
 * 2. Trunk: the root midway between the hip centres, the spine bones at ANSUR II trunk levels as fractions of the hip-to-cervicale span, on the vertebral column curved in the side view by the identity's posture (pelvic tilt, sacral slope, thoracic kyphosis, the neck's balance over the sacrum and the lordosis that balance solves).
 * 3. Head: carried forward of the neck by the craniovertebral angle, the head joint at the hard-palate level, eyes, jaw at its measured centre of rotation, and the craniofacial landmarks from the head measurements; the neck runs from cervicale on the column to the head joint.
 * 4. Arms: at the trunk's shoulder depth, clavicles from the jugular notch, the arm hanging below the acromion so its landmarks reproduce acromion-radiale, radiale-stylion and hand length, joint centres at de Leva's offsets, fingers and thumb from hand length and breadth.
 * 5. Constraints for every joint from the person's mobility and girths.
 * 6. The arms raised into the canonical T-pose ({@link abductAutoMovieHumanArms}): each shoulder girdle elevates, retracts and rotates upward as a measured 90-degree abduction does, the arm turns horizontal about the moved shoulder centre, and it slides toward the midline by what the girdle's motion leaves of the identity's span. An outstretched arm reaches less far from the trunk than it hangs, because the acromion comes closer to the radiale; the girdle explains only part of it.
 *
 * A child's skeleton comes from the child's own measurements, which the converter takes from growth data, never from a scaled adult; nothing here depends on age or sex except through the identity. Measuring the result in the anthropometric posture returns the identity's lengths (see `measureAutoMovieHumanSkeleton`).
 *
 * @param measurements Resolved measurements of an admitted identity
 * @returns Skeleton with parents before children, in the T-pose
 */
export function generateAutoMovieHumanSkeleton(
  measurements: IAutoMovieHumanMeasurements,
): IAutoMovieHumanSkeleton {
  const identity: IAutoMovieHumanIdentity = measurements.identity;
  const body: IAutoMovieHumanIdentity.IBody = identity.body;
  const leftLeg: placeAutoMovieHumanLeg.IOutput = placeAutoMovieHumanLeg(
    body.leftLeg,
    "left",
    body,
  );
  const rightLeg: placeAutoMovieHumanLeg.IOutput = placeAutoMovieHumanLeg(
    body.rightLeg,
    "right",
    body,
  );
  const trunk: placeAutoMovieHumanTrunk.IOutput = placeAutoMovieHumanTrunk(
    body,
    leftLeg.hip,
    rightLeg.hip,
  );
  const head: placeAutoMovieHumanHead.IOutput = placeAutoMovieHumanHead(
    body,
    identity.head,
    trunk.landmarks.cervicale.position,
  );
  const leftArm: placeAutoMovieHumanArm.IOutput = placeAutoMovieHumanArm(
    body,
    "left",
    trunk.suprasternale,
    trunk.shoulderDepth,
  );
  const rightArm: placeAutoMovieHumanArm.IOutput = placeAutoMovieHumanArm(
    body,
    "right",
    trunk.suprasternale,
    trunk.shoulderDepth,
  );

  const landmarks: IAutoMovieHumanLandmarks = {
    ...head.landmarks,
    ...trunk.landmarks,
    left: {
      ...head.left,
      ...leftArm.landmarks,
      ...leftLeg.landmarks,
      iliocristale: trunk.leftCrest,
    },
    right: {
      ...head.right,
      ...rightArm.landmarks,
      ...rightLeg.landmarks,
      iliocristale: trunk.rightCrest,
    },
  };
  const incisorRadius: number = AutoMovieHumanVector.distance(
    landmarks.stomion.position,
    head.joints.find(
      (joint: IAutoMovieHumanSkeleton.IJoint): boolean => joint.bone === "jaw",
    )!.position,
  );
  const joints: IAutoMovieHumanSkeleton.IJoint[] = [
    ...trunk.joints,
    { ...trunk.neck, tail: head.joint },
    ...head.joints,
    ...leftArm.joints,
    ...rightArm.joints,
    ...leftLeg.joints,
    ...rightLeg.joints,
  ].map(
    (joint: IAutoMovieHumanSkeleton.IJoint): IAutoMovieHumanSkeleton.IJoint => ({
      ...joint,
      constraint: constrainAutoMovieHumanJoint(joint.bone, identity, incisorRadius),
    }),
  );
  // the slide that gives the identity's span: half of what the girdle's motion alone leaves over
  const hanging: IAutoMovieHumanSkeleton = { joints, landmarks };
  const raised: IAutoMovieHumanLandmarks = abductAutoMovieHumanArms(hanging, "raise", {
    left: 0,
    right: 0,
  }).landmarks;
  const slide: number =
    (raised.left.dactylion.position.x -
      raised.right.dactylion.position.x -
      body.span) /
    2;
  return abductAutoMovieHumanArms(hanging, "raise", { left: slide, right: slide });
}
