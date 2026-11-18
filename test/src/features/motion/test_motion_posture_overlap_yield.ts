import type { AutoMovieHumanSide, IAutoMovieMotionHumanPerformance } from "@automovie/interface";
import { HumanChain, HumanPerformance, HumanRefusal } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Concurrent arm tasks can borrow opposite arms on a walk; both cannot own the right arm.
 *
 * Scenarios:
 * 1. Read two placed upper-body tasks on the left and right arms.
 * 2. Move the second task to the occupied right arm and observe the public channel refusal.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the shared carrier and the single changed ownership input.
 * @evidence contracts/development/testing.md#behavioral-verification Queries actual scheduled overlays and the public channel error.
 * @evidence contracts/development/testing.md#independent-expectations Two spatially disjoint arm channels can be assigned independently, while a single arm has one owner per instant.
 * @evidence contracts/development/testing.md#distinguishing-cases Only the second arm changes between the feasible and conflicting composition.
 * @evidence contracts/development/testing.md#execution-ownership One body and two short compositions in memory.
 */
export function test_motion_posture_overlap_yield(): void {
 const body = motionHumanBody("m-average");
 const make = (side:AutoMovieHumanSide): IAutoMovieMotionHumanPerformance => new HumanPerformance({
 seed:"hand-ownership",performers:[{subject:"a",body,at:{x:0,y:0,z:0},yaw:0,proficiency:{level:"trained"}}],
 composition:HumanChain.subject("a").walk({to:{x:0,y:0,z:3}}).over(part=>part.handToFace({task:"phone",side:"right"})).over(part=>part.handToFace({task:"drink",side})).node});
 TestValidator.equals("two distinct arms admit two tasks",make("left").overlays("a").length,2);
 let error:unknown;
 try {make("right").overlays("a");} catch(cause) {error=cause;}
 TestValidator.predicate("two right-arm tasks refuse the overlap",error instanceof HumanRefusal && error.kind==="channel" && error.axis==="over");
}
