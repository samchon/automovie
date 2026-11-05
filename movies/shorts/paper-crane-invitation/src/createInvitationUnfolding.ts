import { AutoMovieHumanRigControls, type IAutoMovieHumanPose } from "@automovie/human";
import * as THREE from "three";
import { admitSurfacePushFit } from "./admitSurfacePushFit";
import type { createHumanPerformer } from "./createHumanPerformer";
import type { createHumanSupport } from "./createHumanSupport";
import type { createInvitationPaper } from "./createInvitationPaper";
import { createPalmCarry } from "./createPalmCarry";
import { createHumanHandContacts } from "./createHumanHandContacts";
import { fitHumanSurfaceContact } from "./fitHumanSurfaceContact";
import { fitPerformanceCamera } from "./fitPerformanceCamera";
import type { IPerformancePoseFrame } from "./IPerformancePoseFrame";
import { measurePaperTouch } from "./measurePaperTouch";
import { measurePaperSkin } from "./measurePaperSkin";
import { placePaperOnPalm } from "./placePaperOnPalm";
import { sampleInvitationContinuation } from "./sampleInvitationContinuation";

/**
 * Bring the caught note centrally, then push its actual upper flap open.
 * The push requests0.7mm preparation and an inward cosine cone>=0.25 instead
 * of prescribing a parallel pad. Its existing5mm native/applied budget and
 * actual finite-face3mm, strict cosine>0.25, original-solid and ROM checks
 * remain final predicates; the preparation target adds no stricter threshold.
 * @evidence contracts/common.md#implementation-and-ownership Accepted frame9 supplies exact bodies, roots and original shoe witnesses. Explicit Carina toe/air phases keep original shoe contact and full-foot floor while authored root XZ stays fixed; both feet settle flat at the paired landing. Public Grounding fits Y/legs and a subordinate original hips preference. Actual route corrections, contact roles and applied legs remain exported. Harry brings his original palm below chest into central reach, fitting its actual upward normal while leaving unnecessary yaw free. His straight right IndexDistal pulp approaches the actual finite lower flap face with an opened thumb and supinated forearm; the original clinical source points remain, without inheriting the former pinch posture. A measured closed-form touch at frame236 alone enables opening. Without that touch and base support the sheet stays closed. Later samples independently check the original material, all right-hand solids and left support. No old static grasp approval transfers to this push. Skin, ROM and physical tolerances stay fixed; native requests/results, physical observations and route state remain with each frame.
 * @evidence contracts/common.md#authoring-interface Construct after applying accepted frame9 to the same actors. seek accepts9–19seconds, reconstructs its causal take event when accessed out of order, then returns actual state and all numerical failures. A below-paper insert shows the blank underside during manual opening; later master and reference captions preserve audience knowledge. clear retires owned numerical caches only. Caller owns actors, prop, camera and normal playback; this action establishes no return, seat, whole film or soundtrack.
 */
export function createInvitationUnfolding(options:{
  carina:ReturnType<typeof createHumanPerformer>;harry:ReturnType<typeof createHumanPerformer>;
  cSupport:ReturnType<typeof createHumanSupport>;hSupport:ReturnType<typeof createHumanSupport>;
  palm:ReturnType<typeof createPalmCarry>;paper:ReturnType<typeof createInvitationPaper>;
  entry:IPerformancePoseFrame;camera:THREE.PerspectiveCamera;
}):{seek:(time:number)=>{frame:IPerformancePoseFrame;paper:object;failures:string[]};clear:()=>void} {
  const {carina,harry,cSupport,hSupport,palm,paper,camera}=options;
  const entry:IPerformancePoseFrame=structuredClone(options.entry);
  /** Replay the complete applied state before reading original materials. */
  const apply:(actor:typeof carina,state:typeof entry.carina)=>void=(actor:typeof carina,state:typeof entry.carina):void=>{
    actor.pose(state.pose);actor.object.position.set(...state.position);actor.object.quaternion.set(...state.rotation);actor.object.updateMatrixWorld(true);
  };
  apply(carina,entry.carina);apply(harry,entry.harry);
  const palmEntry:ReturnType<typeof palm.frame>=palm.frame();
  const palmLocal:THREE.Vector3=harry.object.worldToLocal(palmEntry.point.clone());
  const hMaterial:{bone:string;point:[number,number,number];normal:[number,number,number]}={bone:palm.record.palm.bone,point:[palm.record.palm.point[0]!,palm.record.palm.point[1]!,palm.record.palm.point[2]!],normal:[palm.record.palm.normal[0]!,palm.record.palm.normal[1]!,palm.record.palm.normal[2]!]};
  /** Read actual accepted sole centres, preserving the measured entry root. */
  const routeEntry:(actor:typeof carina,support:typeof cSupport)=>Parameters<typeof sampleInvitationContinuation>[0]["carina"]=(actor:typeof carina,support:typeof cSupport):Parameters<typeof sampleInvitationContinuation>[0]["carina"]=>{
    const feet:{left:THREE.Vector3;right:THREE.Vector3}={left:new THREE.Vector3(),right:new THREE.Vector3()};
    for(const side of ["left","right"] as const){for(const p of actor.feet[side].sole)feet[side].add(actor.object.localToWorld(actor.point(p.bone,p.localPoint)));feet[side].divideScalar(3);feet[side].y=0;}
    const yaw:number=new THREE.Euler().setFromQuaternion(actor.object.quaternion,"YXZ").y;
    return {rest:support.rest,initial:{root:actor.object.position.clone(),yaw,feet,headings:{left:yaw,right:yaw}}};
  };
  const cEntry:ReturnType<typeof routeEntry>=routeEntry(carina,cSupport);
  const hEntry:ReturnType<typeof routeEntry>=routeEntry(harry,hSupport);
  const right:ReturnType<typeof createHumanHandContacts>=createHumanHandContacts(harry,"right");
  const record:ReturnType<typeof right.preparation>["candidates"][number]["material"]["index"]=right.preparation().candidates[0]!.material.index;
  const finger:{bone:string;point:[number,number,number];normal:[number,number,number]}={bone:record.bone,point:[record.local[0]!,record.local[1]!,record.local[2]!],normal:[record.normal[0]!,record.normal[1]!,record.normal[2]!]};
  const cPalm:ReturnType<typeof createPalmCarry>=createPalmCarry(carina,"right");
  const cMaterial:typeof finger={bone:cPalm.record.palm.bone,point:[cPalm.record.palm.point[0]!,cPalm.record.palm.point[1]!,cPalm.record.palm.point[2]!],normal:[cPalm.record.palm.normal[0]!,cPalm.record.palm.normal[1]!,cPalm.record.palm.normal[2]!]};
  const leftSkin:THREE.Mesh[]=[...harry.drawing.parts].filter(([id]):boolean=>/^left(Hand|Index|Thumb|Middle|Ring|Little)/.test(id)).map(([,m]):THREE.Mesh=>m);
  const rightSkin:THREE.Mesh[]=[...harry.drawing.parts].filter(([id]):boolean=>/^right(Hand|Index|Thumb|Middle|Ring|Little)/.test(id)).map(([,m]):THREE.Mesh=>m);
  const frames:Map<number,IPerformancePoseFrame>=new Map();
  const touches:Map<number,{request:ReturnType<typeof fitHumanSurfaceContact>["request"];nativePose:IAutoMovieHumanPose;constraintsSatisfied:boolean;constraintValues:ReturnType<typeof fitHumanSurfaceContact>["result"]["constraintValues"];error:number;iterations:number;pointGoal:number[];normalGoal:number[];position:number;normal:number;point:number[];normalActual:number[];clamps:unknown[]}>=new Map();
  const takeFrame:number=236;
  const takeTime:number=takeFrame/24;
  let event:{index:number;valid:boolean;point:number[];normal:number[];supportTriangle:number;contact:ReturnType<typeof measurePaperTouch>}|undefined;
  apply(carina,entry.carina);apply(harry,entry.harry);
  /** Evaluate one absolute instant, including the same measured take when sought backwards. */
  const seek:(time:number)=>{frame:IPerformancePoseFrame;paper:object;failures:string[]}=(time:number):{frame:IPerformancePoseFrame;paper:object;failures:string[]}=>{
    if(!Number.isFinite(time)||time<9||time>19)throw new Error("Unfolding time must be9–19seconds");
    if(time>takeTime&&!event)seek(takeTime);
    const phase:(a:number,b:number)=>number=(a:number,b:number):number=>THREE.MathUtils.smoothstep(time,a,b);
    const index:number=Math.round(time*24);
    const plan:ReturnType<typeof sampleInvitationContinuation>=sampleInvitationContinuation({seconds:time,carina:cEntry,harry:hEntry});
    const opening:number=event?.valid?phase(takeTime,12.2):0;
    const take:number=phase(9,takeTime);
    paper.form(opening,0);paper.gripFlap.visible=time>9;
    let frame:IPerformancePoseFrame|undefined=frames.get(index);
    if(!frame) {
      const cSeed:IAutoMovieHumanPose=structuredClone(entry.carina.pose);
      cSeed.neck={atlantoOccipital:{flexion:5},atlantoAxial:{rotation:4}};
      cSeed.arms!.right.forearm={pronation:THREE.MathUtils.lerp(entry.carina.pose.arms?.right.forearm?.pronation??0,-65,phase(11,12.5))};
      const cGround:ReturnType<typeof cSupport.place>=cSupport.place(cSeed,plan.carina.root.toArray(),plan.carina.yaw,plan.carina.feet,{...plan.carina,kneeSeed:8});
      const currentPalm:ReturnType<typeof cPalm.frame>=cPalm.frame();
      const offer:THREE.Vector3=carina.object.localToWorld(new THREE.Vector3(.23,1.08,-.08));
      const cGoal:THREE.Vector3=currentPalm.point.clone().lerp(offer,phase(11,12.5));
      const receiveUp:THREE.Vector3=new THREE.Vector3(0,1,0);
      const cNormal:THREE.Vector3=currentPalm.normal.clone().applyQuaternion(new THREE.Quaternion().slerp(new THREE.Quaternion().setFromUnitVectors(currentPalm.normal,receiveUp),phase(11,12.5)));
      const cFit:ReturnType<typeof fitHumanSurfaceContact>=fitHumanSurfaceContact(carina,cGround.pose,"right",cMaterial,{point:cGoal,normal:cNormal});
      const hSeed:IAutoMovieHumanPose=structuredClone(entry.harry.pose);
      hSeed.neck={atlantoOccipital:{flexion:THREE.MathUtils.lerp(8,10,phase(9,11.5))*(1-phase(13.7,14.3))},cervical:{flexion:10*phase(9,11.5)*(1-phase(13.7,14.3))},atlantoAxial:{rotation:-8+10*phase(13.7,14.3)}};
      const hGround:ReturnType<typeof hSupport.place>=hSupport.place(hSeed,plan.harry.root.toArray(),plan.harry.yaw,plan.harry.feet,plan.harry);
      const palmGoal:THREE.Vector3=harry.object.localToWorld(palmLocal.clone().lerp(new THREE.Vector3(.27,1.12,.04),phase(9,takeTime)));
      const palmNormal:THREE.Vector3=new THREE.Vector3(0,1,0);
      const leftFit:ReturnType<typeof fitHumanSurfaceContact>=fitHumanSurfaceContact(harry,hGround.pose,"left",hMaterial,{point:palmGoal,normal:palmNormal});
      placePaperOnPalm(paper.object,paper.gripBase,palm.frame(),harry.drawing.parts.get("leftHand")!,leftSkin);
      const normal:THREE.Vector3=new THREE.Vector3(0,0,1).applyQuaternion(paper.object.quaternion);
      // The original distal skin rises1.727mm above this material within the
      // actual finite flap footprint. A2mm authored stand-off clears that skin;
      // the separate3mm face limit and complete skin checks are unchanged.
      const flapGoal:THREE.Vector3=paper.object.localToWorld(paper.flap()).addScaledVector(normal,-.0004-.002);
      const authored:IAutoMovieHumanPose=right.pinch(leftFit.result.pose).pose;
      authored.arms!.right.hand!.index={mcpFlexion:0,pipFlexion:0,dipFlexion:0,mcpAbduction:0};
      for(const digit of ["middle","ring","little"] as const)authored.arms!.right.hand![digit]={mcpFlexion:45,pipFlexion:60,dipFlexion:30};
      authored.arms!.right.hand!.thumb={cmcFlexion:-10,cmcAbduction:40,cmcOpposition:0,mcpFlexion:0,ipFlexion:0};
      authored.arms!.right.shoulder={flexion:45,abduction:15};authored.arms!.right.elbow={flexion:85};authored.arms!.right.forearm={pronation:-65};
      const rightFit:ReturnType<typeof fitHumanSurfaceContact>=fitHumanSurfaceContact(harry,authored,"right",finger,{point:flapGoal,normal,normalMinimum:.25,tolerance:.0007});
      const hPose:IAutoMovieHumanPose=AutoMovieHumanRigControls.blend(leftFit.result.pose,rightFit.result.pose,take);
      harry.pose(hPose);harry.object.updateMatrixWorld(true);
      const actualPoint:THREE.Vector3=harry.object.localToWorld(harry.point(finger.bone,finger.point));
      const actualNormal:THREE.Vector3=new THREE.Vector3(...finger.normal).transformDirection(harry.drawing.bones.get(finger.bone)!.matrixWorld);
      touches.set(index,{request:rightFit.request,nativePose:structuredClone(rightFit.result.pose),constraintsSatisfied:rightFit.result.constraintsSatisfied,constraintValues:structuredClone(rightFit.result.constraintValues),error:rightFit.result.error,iterations:rightFit.result.iterations,pointGoal:flapGoal.toArray(),normalGoal:normal.toArray(),position:actualPoint.distanceTo(flapGoal),normal:actualNormal.angleTo(normal)*180/Math.PI,point:actualPoint.toArray(),normalActual:actualNormal.toArray(),clamps:[...rightFit.result.output.clamped]});
      frame={index,carina:{pose:cFit.result.pose,position:carina.object.position.toArray(),rotation:carina.object.quaternion.toArray()},harry:{pose:hPose,position:harry.object.position.toArray(),rotation:harry.object.quaternion.toArray()},diagnostics:{implementedThrough:19,time,carina:{support:cGround.status,supportError:cGround.error,floorMinimum:cGround.floorMinimum,handMode:"directed-palm",wristGoalError:null,handFrameGoalError:cFit.positionError,handFrameFitError:cFit.result.error,handDirectionError:cFit.normalError,handDirectionGoal:{origin:cGoal.toArray(),direction:cNormal.toArray(),probeLength:.08,iterations:cFit.result.iterations},clamps:cFit.result.output.clamped,pinchGap:null,pinchGoalError:null,reason:cGround.reason,iterations:cGround.iterations},harry:{support:hGround.status,supportError:hGround.error,floorMinimum:hGround.floorMinimum,wristGoalError:null,handMode:"palm-normal",handFrameGoalError:leftFit.positionError,handFrameFitError:leftFit.result.error,handDirectionError:leftFit.normalError,palmNormal:palm.frame().normal.toArray(),clamps:harry.evaluate(hPose).clamped,reason:hGround.reason,iterations:hGround.iterations}}};
      frame.diagnostics.interaction={role:"unilateral index-pulp flap push over original palm support",failures:[],observations:{route:{carina:{authored:plan.carina.root.toArray(),actual:frame.carina.position,correction:carina.object.position.clone().sub(plan.carina.root).toArray(),feet:{left:plan.carina.feet.left.toArray(),right:plan.carina.feet.right.toArray()},headings:plan.carina.headings,swing:plan.carina.swing,contacts:plan.carina.contacts,legs:frame.carina.pose.legs,activeBounds:cGround.activeBounds},harry:{authored:plan.harry.root.toArray(),actual:frame.harry.position,correction:harry.object.position.clone().sub(plan.harry.root).toArray(),feet:{left:plan.harry.feet.left.toArray(),right:plan.harry.feet.right.toArray()},headings:plan.harry.headings,swing:plan.harry.swing,contacts:plan.harry.contacts,legs:frame.harry.pose.legs,activeBounds:hGround.activeBounds}},carinaPalm:{material:cMaterial,request:cFit.request,position:cFit.positionError,normal:cFit.normalError,error:cFit.result.error},harryPalm:{material:hMaterial,request:leftFit.request,position:leftFit.positionError,normal:leftFit.normalError,error:leftFit.result.error,actualNormal:palm.frame().normal.toArray()},opening}};
      frames.set(index,frame);
    }
    apply(carina,frame.carina);apply(harry,frame.harry);
    const base:ReturnType<typeof placePaperOnPalm>=placePaperOnPalm(paper.object,paper.gripBase,palm.frame(),harry.drawing.parts.get("leftHand")!,leftSkin);
    const actualPoint:THREE.Vector3=harry.object.localToWorld(harry.point(finger.bone,finger.point));
    const actualNormal:THREE.Vector3=new THREE.Vector3(...finger.normal).transformDirection(harry.drawing.bones.get(finger.bone)!.matrixWorld);
    const contact:ReturnType<typeof measurePaperTouch>=measurePaperTouch(paper.gripFlap,actualPoint,actualNormal,rightSkin);
    const leftFlap:ReturnType<typeof measurePaperSkin>=measurePaperSkin(paper.gripFlap,leftSkin);
    const push:ReturnType<typeof touches.get>=touches.get(index);
    const fitValid:boolean=admitSurfacePushFit(push);
    if(index===takeFrame&&!event)event={index,valid:base.valid&&contact.valid&&leftFlap.valid&&fitValid,point:actualPoint.toArray(),normal:actualNormal.toArray(),supportTriangle:base.triangle,contact:structuredClone(contact)};
    const failures:string[]=[];
    if(!base.valid)failures.push("Harry original palm/finite base support failed");
    if(time>=takeTime){if(!event?.valid)failures.push("Actual closed-flap take event not admitted; sheet remains closed");if(!contact.valid)failures.push("Harry original index-pulp/finite lower-flap touch failed");if(!leftFlap.valid)failures.push("Upper flap intersects original supporting hand");if(!fitValid)failures.push("Harry original pulp point/normal fit failed");}
    frame.diagnostics.interaction!.failures=[...failures];
    Object.assign(frame.diagnostics.interaction!.observations,{pushMaterial:finger,push,contact,base,leftFlap,takeEvent:event??null,opening});
    carina.expression(time<14.3?"startled":"neutral");harry.expression("neutral");
    const insert:boolean=time>=takeTime&&time<12.3;
    const centre:THREE.Vector3=paper.object.getWorldPosition(new THREE.Vector3());
    const blankNormal:THREE.Vector3=new THREE.Vector3(0,0,-1).transformDirection(paper.object.matrixWorld);
    const acrossPaper:THREE.Vector3=new THREE.Vector3(1,0,0).transformDirection(paper.object.matrixWorld);
    // Look across the sheet, perpendicular to the two supporting hands, rather
    // than from the far hand's end. Fit the sheet itself, including both edges.
    const eye:THREE.Vector3=insert?centre.clone().addScaledVector(blankNormal,.8).addScaledVector(acrossPaper,.25):new THREE.Vector3(5.8,.8,5.0);
    fitPerformanceCamera(camera,insert?[paper.object]:[carina.object,harry.object,paper.object],eye);
    return {frame,paper:{custody:"Harry original left palm and right index-pulp push",opening,base,contact,push,takeEvent:event??null,actualAnchorError:base.anchorError,failures,camera:insert?"blank-underside unfolding insert":"blank-underside two-person master"},failures};
  };
  return {seek,clear():void{frames.clear();touches.clear();event=undefined;}};
}
