import type { IHumanSourceEyeSide } from "./structures/IHumanSourceEyeSide.ts";

/**
 * The two eye sides by the names the published face declares (its
 * attachment owners, articulation eyes and joint landmarks). The left eye is
 * +X, so its lateral canthus has the larger x; the right eye's the smaller.
 */
export const HUMAN_SOURCE_EYE_SIDES: readonly IHumanSourceEyeSide[] = [
  { side: "left", owner: "leftEye", center: "joint-l-eye", target: "joint-l-eye-target", lateral: 1 },
  { side: "right", owner: "rightEye", center: "joint-r-eye", target: "joint-r-eye-target", lateral: -1 },
];
