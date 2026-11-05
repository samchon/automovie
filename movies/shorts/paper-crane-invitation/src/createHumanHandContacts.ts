import { AutoMovieHumanClinicalIk, AutoMovieHumanRigControls, type AutoMovieHumanSkeleton, type IAutoMovieHumanPose } from "@automovie/human";
import * as THREE from "three";

import type { createHumanPerformer } from "./createHumanPerformer";
import { meshSurfacePoint } from "./meshSurfacePoint";
import { preparePaperGrasp } from "./preparePaperGrasp";
import { createRigidHandCarry } from "./createRigidHandCarry";
import { paperGripThickness } from "./paperGripThickness";

/**
 * Derive palm and thumb/index contact frames from the actual emitted triangles.
 * All stored points are bone-local. The palm ray uses source index/little/middle axes to address its palmar face;
 * fixed measured motion controls retain true thumb pulp and a separately named distal-palmar or radial-index contact site.
 *
 * @evidence contracts/common.md#implementation-and-ownership Actual ray/triangle hits re-address original anatomical materials and exact model digests guard the retained measured motion controls. Public Human IK replays both fingers against two distinct faces of a Hand-local paper frame fixed before the fit, with explicit auxiliary normal-direction intervals; other digits and body controls remain authored. Full-frame arm carrying uses three original material points and two separately labelled frame-direction probes; final contact remains a separate actual-skin/finite-paper measurement. The separate aim action fits only the fixed prop anchor and an explicitly auxiliary 80mm actual-beak direction probe, leaving nonessential bank unconstrained while preserving all fingers. Failed finger output cannot recenter the paper. The returned gap/residual stay explicit; paper placement must use its own actual anchor and the returned fixed frame.
 * @evidence contracts/common.md#authoring-interface Supply one live actor and anatomical side. palm reads its current world surface frame. pinch applies the prepared complete finger pose and remeasures original material points/normals. valid addresses the actual opposing material face sides only; the caller must also inspect actual finite paper faces and original-hand interior intersections through measurePaperContact. Raw point distance is retained as telemetry, not a coincidence criterion. Neither method certifies whole-hand collision or gravity support.
 */
export function createHumanHandContacts(actor: ReturnType<typeof createHumanPerformer>, side: "left" | "right"): {
  preparation: () => { selected: string; valid: boolean; candidates: ReturnType<typeof preparePaperGrasp>["report"]; carrier: ReturnType<typeof createRigidHandCarry>["record"] };
  carrierFrame: () => {point:THREE.Vector3;rotation:THREE.Quaternion};
  carry: (pose: IAutoMovieHumanPose, origin: THREE.Vector3, rotation: THREE.Quaternion) => AutoMovieHumanClinicalIk.IResult;
  aim:(pose:IAutoMovieHumanPose,origin:THREE.Vector3,direction:THREE.Vector3,paperBeak:THREE.Vector3)=>AutoMovieHumanClinicalIk.IResult;
  palm: () => { point: THREE.Vector3; normal: THREE.Vector3; rotation: THREE.Quaternion };
  pinch: (pose: IAutoMovieHumanPose, amount?: number) => { pose: IAutoMovieHumanPose; point: THREE.Vector3; rotation: THREE.Quaternion; error: number; gap: number; valid: boolean; margin: number; normalDot: number; index: THREE.Vector3; thumb: THREE.Vector3; indexNormal: THREE.Vector3; thumbNormal: THREE.Vector3; clamps: unknown[] };
  pinchFrame: () => { point: THREE.Vector3; rotation: THREE.Quaternion; gap: number; valid: boolean; margin: number; normalDot: number; index: THREE.Vector3; thumb: THREE.Vector3; indexNormal: THREE.Vector3; thumbNormal: THREE.Vector3; clamps: unknown[] };
} {
  const handId: "leftHand" | "rightHand" = side === "left" ? "leftHand" : "rightHand";
  const hand: THREE.Mesh | undefined = actor.drawing.parts.get(handId);
  const frame: THREE.Group | undefined = actor.drawing.bones.get(handId);
  if (!hand || !frame) throw new Error("Hand contact requires an emitted palm");
  hand.geometry.computeBoundingBox();
  const box: THREE.Box3 = hand.geometry.boundingBox!;
  const centre: THREE.Vector3 = box.getCenter(new THREE.Vector3());
  /** Read a fixed source joint in the mesh's registered bind axes. */
  const sourcePoint: (suffix: string) => THREE.Vector3 = (suffix: string): THREE.Vector3 => {
    const bone: AutoMovieHumanSkeleton.IBone | undefined = actor.neutral.bones.find((item: AutoMovieHumanSkeleton.IBone): boolean => item.bone === side + suffix);
    if (!bone) throw new Error("Missing hand source joint: " + suffix);
    return new THREE.Vector3(...bone.position);
  };
  const forward: THREE.Vector3 = sourcePoint("MiddleProximal").sub(sourcePoint("Hand")).normalize();
  const radial: THREE.Vector3 = sourcePoint("IndexProximal").sub(sourcePoint("LittleProximal")).normalize();
  const palmar: THREE.Vector3 = radial.clone().cross(forward).normalize().multiplyScalar(side === "left" ? 1 : -1);
  const palm: ReturnType<typeof meshSurfacePoint> = meshSurfacePoint(hand, centre.clone().addScaledVector(palmar, 0.15), palmar.clone().negate());
  const grasp: ReturnType<typeof preparePaperGrasp> = preparePaperGrasp(actor, side);
  const handPose = grasp.hand;
  let appliedClamps: unknown[] = [];
  const referenceArms: NonNullable<IAutoMovieHumanPose["arms"]>={left:{},right:{}};
  referenceArms[side]={hand:structuredClone(handPose)};
  const referencePose: IAutoMovieHumanPose={arms:referenceArms};
  const reference: AutoMovieHumanSkeleton.IOutput=actor.evaluate(referencePose);
  const referencePoint: (bone:string,point:[number,number,number])=>THREE.Vector3=(bone:string,point:[number,number,number]):THREE.Vector3=>{
    const at:AutoMovieHumanSkeleton.IPlacement|undefined=reference.posed.find((p:AutoMovieHumanSkeleton.IPlacement):boolean=>p.bone===bone);
    if(!at)throw new Error("Missing carrier reference bone");
    return new THREE.Vector3(...point).applyQuaternion(new THREE.Quaternion(...at.rotation)).add(new THREE.Vector3(...at.position));
  };
  const referenceHand:AutoMovieHumanSkeleton.IPlacement=reference.posed.find((p:AutoMovieHumanSkeleton.IPlacement):boolean=>p.bone===handId)!;
  const handRotation:THREE.Quaternion=new THREE.Quaternion(...referenceHand.rotation);
  const paperLocalRotation:THREE.Quaternion=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(grasp.xLocal,grasp.axisLocal.clone().cross(grasp.xLocal),grasp.axisLocal));
  const referenceRotation:THREE.Quaternion=handRotation.clone().multiply(paperLocalRotation);
  const indexSurface:THREE.Mesh=actor.drawing.parts.get(grasp.index.bone)!;
  const indexPositions:THREE.BufferAttribute=indexSurface.geometry.getAttribute("position") as THREE.BufferAttribute;
  const indexIndices:THREE.BufferAttribute|null=indexSurface.geometry.getIndex();
  const indexPoint:THREE.Vector3=referencePoint(grasp.index.bone,grasp.index.localPoint);
  const thumbPoint:THREE.Vector3=referencePoint(grasp.thumb.bone,grasp.thumb.localPoint);
  const options:[number,number,number][]=[0,1,2].map((n:number):[number,number,number]=>new THREE.Vector3().fromBufferAttribute(indexPositions,indexIndices?indexIndices.getX(grasp.index.triangle*3+n):grasp.index.triangle*3+n).toArray());
  options.sort((a:[number,number,number],b:[number,number,number]):number=>{
    const area:(p:[number,number,number])=>number=(p:[number,number,number]):number=>referencePoint(grasp.index.bone,p).sub(indexPoint).cross(thumbPoint.clone().sub(indexPoint)).lengthSq();
    return area(b)-area(a);
  });
  const carry:ReturnType<typeof createRigidHandCarry>=createRigidHandCarry(actor,side,referencePose,{origin:referencePoint(handId,grasp.centreLocal.toArray()),rotation:referenceRotation},[{bone:grasp.index.bone,localPoint:[...grasp.index.localPoint]},{bone:grasp.thumb.bone,localPoint:[...grasp.thumb.localPoint]},{bone:grasp.index.bone,localPoint:options[0]!}]);

  /** Read the current palm orientation through its actual bone world transform. */
  const palmFrame: () => { point: THREE.Vector3; normal: THREE.Vector3; rotation: THREE.Quaternion } = (): { point: THREE.Vector3; normal: THREE.Vector3; rotation: THREE.Quaternion } => {
    actor.object.updateMatrixWorld(true);
    const normal: THREE.Vector3 = palm.normal.clone().transformDirection(frame.matrixWorld);
    const y: THREE.Vector3 = forward.clone().transformDirection(frame.matrixWorld);
    y.addScaledVector(normal, -y.dot(normal)).normalize();
    const x: THREE.Vector3 = y.clone().cross(normal).normalize();
    return {
      point: frame.localToWorld(palm.point.clone()), normal,
      rotation: new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, normal)),
    };
  };
  /** Measure transported original contact surfaces and their finite-paper separating margin. */
  const pinchFrame: () => { point: THREE.Vector3; rotation: THREE.Quaternion; gap: number; valid: boolean; margin: number; normalDot: number; index: THREE.Vector3; thumb: THREE.Vector3; indexNormal: THREE.Vector3; thumbNormal: THREE.Vector3; clamps: unknown[] } = () => {
    actor.object.updateMatrixWorld(true);
    const index: THREE.Vector3 = actor.object.localToWorld(actor.point(grasp.index.bone, grasp.index.localPoint));
    const thumb: THREE.Vector3 = actor.object.localToWorld(actor.point(grasp.thumb.bone, grasp.thumb.localPoint));
    const axis: THREE.Vector3 = grasp.axisLocal.clone().transformDirection(frame.matrixWorld);
    const x: THREE.Vector3 = grasp.xLocal.clone().transformDirection(frame.matrixWorld);
    const y: THREE.Vector3 = axis.clone().cross(x).normalize();
    const rotation: THREE.Quaternion = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, axis));
    const margin: number = index.clone().sub(thumb).dot(axis);
    const normal: (bone: string, value: THREE.Vector3) => THREE.Vector3 = (bone: string, value: THREE.Vector3): THREE.Vector3 => {
      const actual: THREE.Group | undefined = actor.drawing.bones.get(bone);
      if (!actual) throw new Error("Missing actual grasp normal frame");
      return value.clone().transformDirection(actual.matrixWorld);
    };
    const indexNormal: THREE.Vector3 = normal(grasp.index.bone, grasp.index.normal);
    const thumbNormal: THREE.Vector3 = normal(grasp.thumb.bone, grasp.thumb.normal);
    const normalDot: number = indexNormal.dot(thumbNormal);
    return { point: frame.localToWorld(grasp.centreLocal.clone()), rotation, gap: index.distanceTo(thumb), margin, normalDot, index, thumb, indexNormal, thumbNormal, clamps: [...appliedClamps],
      valid: grasp.valid && margin >= paperGripThickness - 1e-6 && normalDot < -0.25 && indexNormal.dot(axis) < -0.25 && thumbNormal.dot(axis) > 0.25 && appliedClamps.length === 0 };
  };
  return {
    preparation: () => ({selected:grasp.kind,valid:grasp.valid,candidates:structuredClone(grasp.report),carrier:structuredClone(carry.record)}),
    carry(pose:IAutoMovieHumanPose,origin:THREE.Vector3,rotation:THREE.Quaternion):AutoMovieHumanClinicalIk.IResult {
      const arms:NonNullable<IAutoMovieHumanPose["arms"]>={left:{...pose.arms?.left},right:{...pose.arms?.right}};arms[side]={...arms[side],hand:structuredClone(handPose)};
      return carry.fit({...pose,arms},origin,rotation);
    },
    /** Fit only the coupled paper anchor and heading; bank is deliberately free. */
    aim(pose:IAutoMovieHumanPose,origin:THREE.Vector3,direction:THREE.Vector3,paperBeak:THREE.Vector3):AutoMovieHumanClinicalIk.IResult {
      if(![...origin.toArray(),...direction.toArray(),...paperBeak.toArray()].every(Number.isFinite)||Math.abs(direction.length()-1)>1e-6||paperBeak.lengthSq()<1e-12)throw new Error("Paper heading requires finite actual geometry and a unit world direction");
      const arms:NonNullable<IAutoMovieHumanPose["arms"]>={left:{...pose.arms?.left},right:{...pose.arms?.right}};arms[side]={...arms[side],hand:structuredClone(handPose)};
      const localDirection:THREE.Vector3=paperBeak.clone().normalize().applyQuaternion(paperLocalRotation);
      const auxiliary:THREE.Vector3=grasp.centreLocal.clone().addScaledVector(localDirection,.08);
      actor.object.updateWorldMatrix(true,false);
      const request:AutoMovieHumanClinicalIk.IRequest={channels:carry.record.channels.map((name:string):AutoMovieHumanRigControls.DegreeChannel=>AutoMovieHumanRigControls.channel(name)),targets:[{bone:handId,localPoint:grasp.centreLocal.toArray(),position:actor.object.worldToLocal(origin.clone()).toArray()},{bone:handId,localPoint:auxiliary.toArray(),position:actor.object.worldToLocal(origin.clone().addScaledVector(direction,.08)).toArray()}],iterations:16,tolerance:.003};
      const result:AutoMovieHumanClinicalIk.IResult=AutoMovieHumanClinicalIk.solve(actor.evaluate,{...pose,arms},request);actor.pose(result.pose);return result;
    },
    carrierFrame: () => {actor.object.updateMatrixWorld(true);return {point:frame.localToWorld(grasp.centreLocal.clone()),rotation:pinchFrame().rotation};},
    palm: palmFrame, pinchFrame,
    /** Apply the fixed-body finger solution and remeasure its actual current surface error. */
    pinch(pose: IAutoMovieHumanPose, amount: number = 1): { pose: IAutoMovieHumanPose; point: THREE.Vector3; rotation: THREE.Quaternion; error: number; gap: number; valid: boolean; margin: number; normalDot: number; index: THREE.Vector3; thumb: THREE.Vector3; indexNormal: THREE.Vector3; thumbNormal: THREE.Vector3; clamps: unknown[] } {
      const arms: NonNullable<IAutoMovieHumanPose["arms"]> = { left: { ...pose.arms?.left }, right: { ...pose.arms?.right } };
      if (!Number.isFinite(amount) || amount < 0 || amount > 1) throw new Error("Grip amount must be a unit value");
      const full: NonNullable<IAutoMovieHumanPose["arms"]>={left:{},right:{}};full[side]={hand:structuredClone(handPose)};
      const interpolated: IAutoMovieHumanPose=AutoMovieHumanRigControls.blend({}, {arms:full},amount);
      arms[side]={...arms[side],hand:interpolated.arms?.[side].hand};
      const combined: IAutoMovieHumanPose = { ...pose, arms };
      const output: AutoMovieHumanSkeleton.IOutput = actor.pose(combined);
      appliedClamps = [...output.clamped];
      const actual: ReturnType<typeof pinchFrame> = pinchFrame();
      const axis: THREE.Vector3 = new THREE.Vector3(0,0,1).applyQuaternion(actual.rotation);
      const error: number = Math.max(Math.abs(actual.index.clone().sub(actual.point).dot(axis)-paperGripThickness/2),Math.abs(actual.thumb.clone().sub(actual.point).dot(axis)+paperGripThickness/2));
      return { pose: combined, ...actual, error };
    },
  };
}
