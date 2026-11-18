import type { IAutoMovieMotionHumanProp, IAutoMovieMotionHumanPerformance } from "@automovie/interface";
import { AutoMovieMotionManner, HumanChain, HumanPerformance, HumanVerdicts } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * An arm overlay on stairs and on a left-handed carry preserves carrier support.
 *
 * Scenarios:
 * 1. The small actor performs the original obstacle or stair crossing.
 * 2. The average actor performs the original flat-floor carrier.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the two source actors and the public support outcomes.
 * @evidence contracts/development/testing.md#behavioral-verification Plans each actual action and evaluates its contact and clearance over the independently posed frame sequence.
 * @evidence contracts/development/testing.md#independent-expectations Planted feet stay within the public floor-relative slip limit, and anatomy stays within the separate skin margin.
 * @evidence contracts/development/testing.md#distinguishing-cases These two geometry and support branches have different admission and contact histories.
 * @evidence contracts/development/testing.md#execution-ownership One actual public plan per historical failing input.
 */
export function test_motion_posture_slope_overlay(): void {
 const findings: string[]=[];
 
 for (const name of ["f-small","m-average"] as const) {
   const body=motionHumanBody(name);
   const actor=HumanChain.subject("a");
       const carrier = name === "f-small"
      ? actor.climbStairs({count:4,direction:"up"})
      : actor.carry({to:{x:0,y:0,z:2.5},how:"oneHand",side:"left",load:0.15});
    const chain = carrier.over(part => part.gesture({kind:"wave",side:"right"}));
   try {
    const performance: IAutoMovieMotionHumanPerformance = new HumanPerformance({
       seed:"recompose-travel",props:[], performers:[{subject:"a",body,at:{x:0,y:0,z:0},yaw:0,proficiency:{level:"trained"}}],composition:chain.node
    });
    TestValidator.equals("one scheduled right-hand overlay", performance.overlays("a").length,1);
    const verdict = HumanVerdicts.of(performance);
    if (!verdict.clean) findings.push(name + ": " + HumanVerdicts.describe(verdict));
   } catch(error) { findings.push(name+": "+String(error)); }
 }
 TestValidator.equals("the composed support and exposed limb remain admissible",findings,[]);
}
