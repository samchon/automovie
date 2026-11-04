import { AutoMovieHumanRigControls, type IAutoMovieHumanPose } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

/**
 * Clinical interpolation retains scalar units and independent pose ownership.
 *
 * Scenarios:
 * 1. Opposite endpoint fields interpolate against omitted clinical neutral.
 * 2. Degrees and jaw millimetres retain their stated arithmetic units.
 * 3. Output mutation preserves both inputs; malformed values and weights refuse.
 *
 * @evidence contracts/testing.md#behavioral-verification Exercises the public Human blend used by prepared motion and checks actual channel values and owned nested output; returning an endpoint, sharing its objects or dropping jaw millimetres fails.
 * @evidence contracts/testing.md#independent-expectations A quarter of the authored degree/millimetre intervals gives the arithmetic expectations, independently of the table traversal and output writer. Clinical FK, collision and shortest-arc quaternion interpolation are outside this scalar operation.
 * @evidence contracts/testing.md#distinguishing-cases Covers missing source and destination regions, different own sides, degree and millimetre fields, weights zero/one/quarter, out-of-range and nonfinite weights, a nonfinite source scalar and output mutation.
 * @evidence contracts/testing.md#execution-ownership One synchronous discoverable root unit invokes only canonical pose arithmetic and portable assertions; it prepares no body, native artifact, host or renderer.
 */
export function test_human_pose_blend():void {
  const from:IAutoMovieHumanPose={legs:{left:{hip:{flexion:40}},right:{}},head:{jaw:{opening:4}},pelvis:{rotation:160}};
  const to:IAutoMovieHumanPose={arms:{left:{},right:{elbow:{flexion:80}}},head:{jaw:{opening:28}},pelvis:{rotation:-160}};
  const pose:IAutoMovieHumanPose=AutoMovieHumanRigControls.blend(from,to,0.25);
  TestValidator.predicate("omitted destination is neutral",nclose(pose.legs!.left.hip!.flexion!,30));
  TestValidator.predicate("omitted source is neutral",nclose(pose.arms!.right.elbow!.flexion!,20));
  TestValidator.predicate("jaw stays millimetres",nclose(pose.head!.jaw!.opening!,10));
  TestValidator.predicate("clinical rotations are stated scalars",nclose(pose.pelvis!.rotation!,80));
  TestValidator.predicate("zero endpoint",nclose(AutoMovieHumanRigControls.blend(from,to,0).legs!.left.hip!.flexion!,40));
  TestValidator.predicate("one endpoint",nclose(AutoMovieHumanRigControls.blend(from,to,1).arms!.right.elbow!.flexion!,80));
  pose.head!.jaw!.opening=52;
  TestValidator.predicate("source ownership",nclose(from.head!.jaw!.opening!,4));
  TestValidator.predicate("destination ownership",nclose(to.head!.jaw!.opening!,28));
  for(const weight of [-0.01,1.01,NaN,Infinity])TestValidator.predicate("invalid weight refuses",throwsError(():void=>{AutoMovieHumanRigControls.blend(from,to,weight);}));
  TestValidator.predicate("nonfinite channel refuses",throwsError(():void=>{AutoMovieHumanRigControls.blend({pelvis:{rotation:Infinity}},to,0.5);}));
  const single:IAutoMovieHumanPose=AutoMovieHumanRigControls.blend({}, {arms:{left:{},right:{elbow:{flexion:80}}}},0.5);
  TestValidator.predicate("one active arm retains bilateral structure",single.arms!==undefined&&single.arms.left!==undefined&&single.arms.right!==undefined);
  const empty:IAutoMovieHumanPose=AutoMovieHumanRigControls.blend({}, {},0.5);
  TestValidator.predicate("empty neutral retains no invented active region",empty.arms===undefined&&empty.legs===undefined);
}
