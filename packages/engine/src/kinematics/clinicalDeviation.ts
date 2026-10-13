/** Squared clinical deviation from the anatomical neutral, in degrees². */
export const clinicalDeviation = (joint: {
  flexion: number;
  abduction: number;
  twist: number;
}): number =>
  joint.flexion * joint.flexion +
  joint.abduction * joint.abduction +
  joint.twist * joint.twist;
