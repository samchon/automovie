import { AutoMovieHumanGrounding, AutoMovieHumanRigControls, AutoMovieHumanSkeleton, type AutoMovieHumanClinicalIk, type AutoMovieHumanSupportFrame, type IAutoMovieHumanPose } from "@automovie/human";
import { buildHumanPolygon, type AutoMovieHumanPolygon } from "@automovie/viewer/human-polygon";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { HumanPeople } from "../internal/HumanPeople";
import { nclose } from "../internal/nclose";

/**
 * A full emitted foot population constrains a real public Human ankle solve.
 *
 * Scenarios:
 * 1. A downward ankle turn puts non-target toe/sole vertices below a fixed ankle target.
 * 2. The full-foot inequality must recover clearance while preserving that already satisfied target.
 * 3. A fresh public FK and independent Three transforms measure every original source point.
 * 4. Two body proportions, bilateral cross-bone triples and a rotated root retain hard support under conflicting expressive requests.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds the original polygon through its public CPU entry, retains every actual foot vertex and fits through public Grounding. Independently reevaluated public FK must keep the named ankle target and all actual foot vertices above the plane; dropping the non-target floor population fails.
 * @evidence contracts/testing.md#independent-expectations Neutral emitted geometry establishes a reachable plane at its actual minimum; a negative20-degree ankle seed deliberately lowers the source foot while leaving its joint centre fixed. Three's rigid transforms over fresh public FK provide the final floor and target oracle rather than the helper's own error field.
 * @evidence contracts/testing.md#distinguishing-cases Covers real bilateral full foot modules, a lower non-target vertex, fixed ankle, actual cross-bone bilateral triples on two people, nonidentity yaw, conflicting head goals, active ankle bounds and independently inspected final output. These known-feasible phase poses do not establish arbitrary production hull-plane reach, pressure or continuous clearance.
 * @evidence contracts/testing.md#execution-ownership One portable root unit reuses the HumanPeople calibration and ordinary Three geometry without a renderer, browser or native artifact. It owns and retires its polygon drawing.
 */
export function test_human_grounding_geometry():void {
  const person:HumanPeople.IPerson=HumanPeople.person("m1");
  const evaluate:AutoMovieHumanSkeleton.PoseEvaluator=AutoMovieHumanSkeleton.prepare(person.params,{calibration:person.body,neckSurface:true,footSurface:true});
  const neutral:AutoMovieHumanSkeleton.IOutput=evaluate({});
  const drawing:AutoMovieHumanPolygon.IDrawing=buildHumanPolygon(neutral);
  try {
    const feet:AutoMovieHumanSupportFrame.IPoint[]=points(drawing);
    const identity:AutoMovieHumanGrounding.IRoot={translation:[0,0,0],rotation:[0,0,0,1]};
    const height:number=minimum(neutral,identity,feet);
    const root:AutoMovieHumanGrounding.IRoot={translation:[0,-height,0],rotation:[0,0,0,1]};
    const seed:IAutoMovieHumanPose={legs:{left:{ankle:{dorsiflexion:-20}},right:{}}};
    const before:AutoMovieHumanSkeleton.IOutput=evaluate(seed);
    const target:[number,number,number]=world(neutral,root,{bone:"leftFoot",localPoint:[0,0,0]});
    const start:[number,number,number]=world(before,root,{bone:"leftFoot",localPoint:[0,0,0]});
    TestValidator.predicate("fixture already satisfies ankle target",new THREE.Vector3(...start).distanceTo(new THREE.Vector3(...target))<1e-10);
    TestValidator.predicate("actual non-target foot vertices begin below floor",minimum(before,root,feet)<-0.002);
    const solve:ReturnType<typeof AutoMovieHumanGrounding.prepare>=AutoMovieHumanGrounding.prepare(evaluate,feet);
    const fitted:AutoMovieHumanGrounding.IResult=solve(seed,root,{targets:[{bone:"leftFoot",position:target}],channels:["legs.left.ankle.dorsiflexion"],iterations:16,tolerance:0.00025});
    const fresh:AutoMovieHumanSkeleton.IOutput=evaluate(fitted.pose);
    const actualMinimum:number=minimum(fresh,fitted.root,feet);
    const actualTarget:[number,number,number]=world(fresh,fitted.root,{bone:"leftFoot",localPoint:[0,0,0]});
    TestValidator.predicate("fresh public FK full geometry clears floor",actualMinimum>=-0.00025);
    TestValidator.predicate("fresh public FK ankle remains on target",new THREE.Vector3(...actualTarget).distanceTo(new THREE.Vector3(...target))<0.00025);
    TestValidator.predicate("reported floor matches independent population",nclose(fitted.floorMinimum,actualMinimum,1e-10));
    TestValidator.equals("actual floor result is explicitly admitted",fitted.status,"admitted");
  } finally {drawing.dispose();}
  for(const name of ["m1","f2"])bilateral(name);
}

/** Known reachable bilateral phase targets preserve actual cross-bone geometry at a nonidentity scene root. */
function bilateral(name:string):void {
  const person:HumanPeople.IPerson=HumanPeople.person(name);
  const evaluate:AutoMovieHumanSkeleton.PoseEvaluator=AutoMovieHumanSkeleton.prepare(person.params,{calibration:person.body,neckSurface:true,footSurface:true});
  const drawing:AutoMovieHumanPolygon.IDrawing=buildHumanPolygon(evaluate({}));
  try {
    const feet:AutoMovieHumanSupportFrame.IPoint[]=points(drawing);
    const reference:IAutoMovieHumanPose={legs:{left:{hip:{flexion:12,abduction:5},knee:{flexion:30},ankle:{dorsiflexion:13.25},foot:{subtalarInversion:3}},right:{hip:{flexion:8,abduction:4},knee:{flexion:24},ankle:{dorsiflexion:7},foot:{subtalarInversion:2}}}};
    const output:AutoMovieHumanSkeleton.IOutput=evaluate(reference);
    const rotation:[number,number,number,number]=[0,Math.sin(0.37/2),0,Math.cos(0.37/2)];
    const root:AutoMovieHumanGrounding.IRoot={translation:[0.13,0,-0.21],rotation};
    root.translation[1]=-minimum(output,root,feet);
    const witnesses:AutoMovieHumanSupportFrame.IPoint[]=(["left","right"] as const).flatMap((side:"left"|"right"):AutoMovieHumanSupportFrame.IPoint[]=>["Subtalar","Toe2Proximal","Toe5Proximal"].map((part:string):AutoMovieHumanSupportFrame.IPoint=>{
      const point:AutoMovieHumanSupportFrame.IPoint|undefined=feet.find((candidate:AutoMovieHumanSupportFrame.IPoint):boolean=>candidate.bone===`${side}${part}`);
      if(!point)throw new Error(`Actual ${side}${part} patch point absent`);
      return point;
    }));
    const targets:AutoMovieHumanClinicalIk.ITarget[]=witnesses.map((point:AutoMovieHumanSupportFrame.IPoint):AutoMovieHumanClinicalIk.ITarget=>({...point,position:world(output,root,point)}));
    const channels:AutoMovieHumanRigControls.DegreeChannel[]=[...AutoMovieHumanRigControls.chain({region:"leg",side:"left"}),...AutoMovieHumanRigControls.chain({region:"leg",side:"right"})].filter((path:AutoMovieHumanRigControls.DegreeChannel):boolean=>!path.endsWith("midfootSupination"));
    const request:AutoMovieHumanGrounding.IRequest={targets,channels,rootAxes:["x","y","z"],floorTolerance:1e-6,tolerance:0.00025,softTargets:[{bone:"head",position:[0,-10,0]}]};
    const solve:AutoMovieHumanGrounding.IPrepared=AutoMovieHumanGrounding.prepare(evaluate,feet);
    const initial:AutoMovieHumanGrounding.IResult=solve.inspect(reference,root,request);
    TestValidator.predicate(`${name}: active ankle bound diagnosed`,initial.activeBounds.some((row:{path:AutoMovieHumanRigControls.DegreeChannel;value:number}):boolean=>row.path==="legs.left.ankle.dorsiflexion"));
    const before:string=JSON.stringify({reference,root});
    const fitted:AutoMovieHumanGrounding.IResult=solve(reference,root,request);
    const fresh:AutoMovieHumanSkeleton.IOutput=evaluate(fitted.pose);
    const actualMinimum:number=minimum(fresh,fitted.root,feet);
    const actualError:number=Math.max(...targets.map((target:AutoMovieHumanClinicalIk.ITarget):number=>new THREE.Vector3(...world(fresh,fitted.root,{bone:target.bone,localPoint:target.localPoint!})).distanceTo(new THREE.Vector3(...target.position))));
    TestValidator.equals(`${name}: physical admission survives impossible head goal`,fitted.status,"admitted");
    TestValidator.predicate(`${name}: independent complete floor`,actualMinimum>=-1e-6);
    TestValidator.predicate(`${name}: all six independent support targets`,actualError<=0.00025);
    TestValidator.predicate(`${name}: expressive failure remains visible`,fitted.softError>5);
    const inspected:AutoMovieHumanGrounding.IResult=solve.inspect(fitted.pose,fitted.root,request);
    TestValidator.equals(`${name}: inspect shares admission`,inspected.status,"admitted");
    TestValidator.predicate(`${name}: inspect full geometry agrees`,nclose(inspected.floorMinimum,actualMinimum,1e-10));
    TestValidator.equals(`${name}: caller state unchanged`,JSON.stringify({reference,root}),before);
    const invalid:AutoMovieHumanGrounding.IResult=solve.inspect(reference,{translation:[root.translation[0],root.translation[1]-0.03,root.translation[2]],rotation},request);
    TestValidator.equals(`${name}: independent floor refusal`,invalid.status,"unresolved");
    TestValidator.equals(`${name}: inspection does not pretend an iterative attempt`,invalid.reason,"constraints-violated");
  } finally {drawing.dispose();}
}

/** Copy every actual foot mesh point through its native mesh-to-bone transform. */
function points(drawing:AutoMovieHumanPolygon.IDrawing):AutoMovieHumanSupportFrame.IPoint[] {
  drawing.object.updateWorldMatrix(true,true);
  const result:AutoMovieHumanSupportFrame.IPoint[]=[];
  for(const [name,mesh] of drawing.parts){
    if(!/^(?:left|right)(?:Subtalar|Midfoot|Hallux|Toe)/u.test(name))continue;
    const bone:AutoMovieHumanRigControls.Joint=AutoMovieHumanRigControls.joint(name);
    const matrix:THREE.Matrix4=drawing.bones.get(name)!.matrixWorld.clone().invert().multiply(mesh.matrixWorld);
    const positions:THREE.BufferAttribute|THREE.InterleavedBufferAttribute=mesh.geometry.getAttribute("position");
    for(let index:number=0;index<positions.count;++index){
      const point:THREE.Vector3=new THREE.Vector3().fromBufferAttribute(positions,index).applyMatrix4(matrix);
      result.push({bone,localPoint:[point.x,point.y,point.z]});
    }
  }
  if(!result.length)throw new Error("Actual polygon foot population is absent");
  return result;
}

/** Native independent rigid composition, applied to a fresh public FK snapshot. */
function world(output:AutoMovieHumanSkeleton.IOutput,root:AutoMovieHumanGrounding.IRoot,point:AutoMovieHumanSupportFrame.IPoint):[number,number,number] {
  const bone:AutoMovieHumanSkeleton.IPlacement|undefined=output.posed.find((row:AutoMovieHumanSkeleton.IPlacement):boolean=>row.bone===point.bone);
  if(!bone)throw new Error(`Missing public FK foot ${point.bone}`);
  const at:THREE.Vector3=new THREE.Vector3(...point.localPoint).applyQuaternion(new THREE.Quaternion(...bone.rotation)).add(new THREE.Vector3(...bone.position)).applyQuaternion(new THREE.Quaternion(...root.rotation)).add(new THREE.Vector3(...root.translation));
  return [at.x,at.y,at.z];
}

/** Inspect the complete saved source population, without consulting Grounding diagnostics. */
function minimum(output:AutoMovieHumanSkeleton.IOutput,root:AutoMovieHumanGrounding.IRoot,feet:readonly AutoMovieHumanSupportFrame.IPoint[]):number {
  return Math.min(...feet.map((point:AutoMovieHumanSupportFrame.IPoint):number=>world(output,root,point)[1]));
}
