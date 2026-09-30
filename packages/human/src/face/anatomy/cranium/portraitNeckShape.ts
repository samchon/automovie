import { IPortraitNeckShape } from "./structures/IPortraitNeckShape";

/**
 * Inferred neck sections in millimetres, centred behind the facial plane.
 * The posterior axis and separate anterior/posterior radii define the throat
 * and nape envelopes. These authored values are not measurements of the subject.
 */
export const portraitNeckShape: IPortraitNeckShape = {
  upper: { y: -107, width: 35, front: 33, back: 42, centre: -53 },
  lower: { y: -145, width: 43, front: 39, back: 45, centre: -53 },
  crop: { y: -150, width: 44, front: 39, back: 45, centre: -53 },
};
