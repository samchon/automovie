import type { IAutoMovieMotionHumanSequentialConvex } from "@automovie/interface";
import { HumanSequentialConvex as SCO } from "../../posture/internal/HumanSequentialConvex";

export namespace CrutchHeldLegData {
  /*
   * Trajopt's sco settings for a joint-space course (`OptimizeProblem`,
   * src/trajopt/problem_description.cpp lines 244-257, github.com/joschu/trajopt
   * at commit 8da5bb00b690647318a12fa4f5dd7e6c8a0f501c, BSD-2-Clause), the same
   * the arm course is solved at (`HumanArmOptimiser`), its boxes read in this
   * course's degrees.
   */
  export const LEG: Readonly<IAutoMovieMotionHumanSequentialConvex.IParameters> = {
    ...SCO.DEFAULTS,
    maxIter: 40,
    minApproxImproveFrac: 0.001,
    improveRatioThreshold: 0.2,
    meritErrorCoeff: 20,
    trustBoxSize: (0.1 * 180) / Math.PI,
    minTrustBoxSize: (1e-4 * 180) / Math.PI,
  };

  /*
   * A knot's variables: the hip's flexion, abduction and twist, the knee's
   * flexion and the ankle's flexion.
   */
  export const WIDTH: number = 5;

  /*
   * The leg's segments the held leg's course keeps clear, by bone suffix.
   */
  export const LEG_BONES: readonly string[] = ["UpperLeg", "LowerLeg", "Foot", "Toes"];
}
