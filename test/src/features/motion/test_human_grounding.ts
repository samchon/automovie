import { AutoMovieHumanGrounding, type AutoMovieHumanSkeleton, type IAutoMovieHumanPose } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * Root translation and clinical articulation obey one exact-foot task.
 *
 * Scenarios:
 * 1. Root height and a clinical target solve together without mutating callers.
 * 2. An unreachable target retains its actual failure residual and canonical bound.
 * 3. A lower non-target vertex forces rotation while the origin target stays fixed.
 *
 * @evidence contracts/testing.md#behavioral-verification Public Grounding solves a metre target and full-foot floor inequality together, reports final applied output/root residual and preserves caller state. A later root projection or an unreported unreachable target fails.
 * @evidence contracts/testing.md#independent-expectations The translating fixture places a foot at X=kneeDegrees/100 and Y=1, with sole-local Y=-1. TargetX.2 requires20 degrees and rootY0; targetX10 exceeds the published139.8-degree knee bound and retains8m-plus residual. The rotating fixture leaves its origin fixed while the separate(-.2,-.02,0) vertex has worldY=-.2sin(angle)-.02cos(angle)+rootY, independently exposing the floor inequality.
 * @evidence contracts/testing.md#distinguishing-cases Covers independent root and clinical variables, a lower non-target vertex requiring rotation despite an already satisfied target, immutable seed, final-output agreement and clinical reach exhaustion. Real emitted geometry and public FK have a separate full-foot case.
 * @evidence contracts/testing.md#execution-ownership One portable synchronous root unit owns an arithmetic evaluator and exact in-memory witnesses, invoking no body calibration or external runtime.
 */
export function test_human_grounding():void {
  const solve:ReturnType<typeof AutoMovieHumanGrounding.prepare>=AutoMovieHumanGrounding.prepare(evaluate,[{bone:"leftFoot",localPoint:[0,-1,0]},{bone:"leftFoot",localPoint:[0.1,-0.9,0]}]);
  const pose:IAutoMovieHumanPose={legs:{left:{knee:{flexion:0}},right:{}}};
  const root:AutoMovieHumanGrounding.IRoot={translation:[0,-0.03,0],rotation:[0,0,0,1]};
  const result:AutoMovieHumanGrounding.IResult=solve(pose,root,{targets:[{bone:"leftFoot",localPoint:[0,-1,0],position:[0.2,0,0]}],channels:["legs.left.knee.flexion"],iterations:8});
  TestValidator.predicate("point/root solution",result.error<0.00025&&Math.abs(result.root.translation[1])<0.00025);
  TestValidator.predicate("actual output agrees",nclose(result.output.posed[0]!.position[0],(result.pose.legs!.left.knee!.flexion??0)/100,1e-12));
  TestValidator.predicate("entire source foot clears plane",result.floorMinimum>=-0.00025);
  TestValidator.predicate("caller root stays independent",nclose(root.translation[1],-0.03));
  TestValidator.predicate("caller clinical seed stays independent",nclose(pose.legs!.left.knee!.flexion!,0));
  const unreachable:AutoMovieHumanGrounding.IResult=solve(pose,root,{targets:[{bone:"leftFoot",localPoint:[0,-1,0],position:[10,0,0]}],channels:["legs.left.knee.flexion"],iterations:16});
  TestValidator.predicate("unreachable remains a failure",unreachable.error>8&&unreachable.pose.legs!.left.knee!.flexion!<=139.8);
  TestValidator.equals("finite unreachable state is not admitted",unreachable.status,"unresolved");
  const floorSolve:ReturnType<typeof AutoMovieHumanGrounding.prepare>=AutoMovieHumanGrounding.prepare(rotating,[{bone:"leftFoot",localPoint:[0,0,0]},{bone:"leftFoot",localPoint:[-0.2,-0.02,0]}]);
  const floorResult:AutoMovieHumanGrounding.IResult=floorSolve({}, {translation:[0,0,0],rotation:[0,0,0,1]}, {targets:[{bone:"leftFoot",position:[0,0,0]}],channels:["legs.left.ankle.dorsiflexion"],iterations:8});
  const angle:number=(floorResult.pose.legs?.left.ankle?.dorsiflexion??0)*Math.PI/180;
  const lowest:number=-0.2*Math.sin(angle)-0.02*Math.cos(angle)+floorResult.root.translation[1];
  TestValidator.predicate("independent lower vertex forces articulation",Math.abs(angle)>0.05&&lowest>=-0.00025);
  TestValidator.predicate("original point target remains satisfied",Math.abs(floorResult.root.translation[1])<0.00025);
}

/** One angular coordinate drives an independently specified rigid effector. */
function evaluate(pose:IAutoMovieHumanPose={}):AutoMovieHumanSkeleton.IOutput {const value:number=pose.legs?.left.knee?.flexion??0;const applied:number=Math.max(-1.3,Math.min(139.8,value));return {bones:[{bone:"leftFoot",parent:null,position:[0,1,0],tip:null,radius:0.01}],posed:[{bone:"leftFoot",position:[applied/100,1,0],rotation:[0,0,0,1]}],clamped:value===applied?[]:[{path:"legs.left.knee.flexion",requested:value,applied}]};}

/** A clinical Z hinge leaves the exact origin target unchanged while lifting a lower rear vertex. */
function rotating(pose:IAutoMovieHumanPose={}):AutoMovieHumanSkeleton.IOutput {
  const half:number=(pose.legs?.left.ankle?.dorsiflexion??0)*Math.PI/360;
  return {bones:[{bone:"leftFoot",parent:null,position:[0,0,0],tip:null,radius:0.01}],posed:[{bone:"leftFoot",position:[0,0,0],rotation:[0,0,Math.sin(half),Math.cos(half)]}],clamped:[]};
}
