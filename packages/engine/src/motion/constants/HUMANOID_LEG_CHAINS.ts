import { IAutoMoviePlantChain } from "../IAutoMoviePlantChain";

/** The humanoid leg chains, the default both plant passes pin. */
export const HUMANOID_LEG_CHAINS: readonly IAutoMoviePlantChain[] = [
  { effector: "leftFoot", upper: "leftUpperLeg", lower: "leftLowerLeg" },
  { effector: "rightFoot", upper: "rightUpperLeg", lower: "rightLowerLeg" },
];
