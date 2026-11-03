import { HumanCurveBody } from "./HumanCurveBody";
import { HumanCurveFinding } from "./HumanCurveFinding";
import { HumanCurveFoot } from "./HumanCurveFoot";
import { HumanCurveHand } from "./HumanCurveHand";
import { HumanCurvePlacement } from "./HumanCurvePlacement";

/**
 * Finds every place a generated body is mathematically unsound. The rules live
 * in the `HumanCurve*` pieces by family (chain, join, sides, ear, nose, jaw,
 * foot, hand and placement); this barrel names the entries tests call.
 */
export namespace HumanCurveAudit {
  /** One group of points that break the same rule in the same place. */
  export type IHumanCurveFinding = HumanCurveFinding.IHumanCurveFinding;

  /** The curve audit of a body's chains: {@link HumanCurveBody.auditHumanCurves}. */
  export const auditHumanCurves: typeof HumanCurveBody.auditHumanCurves = HumanCurveBody.auditHumanCurves;

  /** The thigh's top and girth against its tape: {@link HumanCurvePlacement.auditHumanThigh}. */
  export const auditHumanThigh: typeof HumanCurvePlacement.auditHumanThigh = HumanCurvePlacement.auditHumanThigh;

  /** Where every part of the body stands: {@link HumanCurvePlacement.auditHumanPlacement}. */
  export const auditHumanPlacement: typeof HumanCurvePlacement.auditHumanPlacement = HumanCurvePlacement.auditHumanPlacement;

  /** The hand's mesh and joins: {@link HumanCurveHand.auditHumanHand}. */
  export const auditHumanHand: typeof HumanCurveHand.auditHumanHand = HumanCurveHand.auditHumanHand;

  /** The foot's ribs, ball and tips: {@link HumanCurveFoot.auditHumanFoot}. */
  export const auditHumanFoot: typeof HumanCurveFoot.auditHumanFoot = HumanCurveFoot.auditHumanFoot;
}
