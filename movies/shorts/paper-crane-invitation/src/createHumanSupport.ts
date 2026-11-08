import {
  AutoMovieHumanGrounding,
  type AutoMovieHumanClinicalIk,
  AutoMovieHumanLegIk,
  AutoMovieHumanRigControls,
  AutoMovieHumanSupportFrame,
  type AutoMovieHumanSkeleton,
  type IAutoMovieHumanPose,
} from "@automovie/human";
import * as THREE from "three";

import type { createHumanPerformer } from "./createHumanPerformer";
import { durationSeconds } from "./durationSeconds";
import { performanceFrameRate } from "./performanceFrameRate";

/**
 * Fit actual emitted Human foot points to explicit world supports.
 * All Human foot and shoe vertices participate in floor admission. Three
 * actual flat shoe-sole vertices preserve each planted support frame. A lifted
 * foot has one moving witness, allowing its actual ankle to pitch in swing.
 * Heading, foot destinations and root XZ belong to staging. Grounding fits Y
 * and clinical legs. Explicit route contacts permit real toe/heel support
 * rather than constraining every walking foot to a complete flat frame.
 *
 * @evidence contracts/common.md#implementation-and-ownership Parent ancestry selects every original foot vertex and real shoe geometry contributes all its vertices/sole witnesses. Flat uses three actual points; toe uses front/max-X sole vertex1, heel/air use rear vertex0. LegIk seeds the point that is actually constrained. Optional authored kneeSeed derives the desired ankle from the actual selected sole witness, its neutral carrier-to-ankle offset and its flat heading, subtracting that witness once. Public supportHeight and LegIk.seed orient a bent initial knee plane toward that ankle; the previous pitched foot offset is not reused across the seed's neutral ankle reset. This is neither a hard final bend nor copied limb mathematics. Grounding then admits full-foot floor and real support with authored XZ fixed. A soft hips preference cannot supersede physical admission. Legacy opening calls retain their original seed/support rules; all unresolved results remain visible.
 * @evidence contracts/common.md#authoring-interface Supply fixed actor, root/yaw and sole destinations. Optional placement supplies independent headings/contact roles and a nonnegative clinical kneeSeed for route landing initialization. The seed is measured from this exact actor's public FK and cannot guarantee final contact; hard final fitting/inspection remain required. Without explicit contacts the original swing-side/positive-Y convention remains. Every original foot/shoe vertex always obeys the floor. Inspect returned XYZ, leg changes, support and visible joins rather than treating a seed or role label as balance approval.
 */
export function createHumanSupport(actor: ReturnType<typeof createHumanPerformer>): {
  rest: { left: THREE.Vector3; right: THREE.Vector3 };
  place: (
    pose: IAutoMovieHumanPose,
    position: [number, number, number],
    yaw: number,
    feet: { left: THREE.Vector3; right: THREE.Vector3 },
    placement?: { headings: {left:number;right:number}; swing:"left"|"right"|null;kneeSeed?:number;contacts?:{left:"flat"|"toe"|"heel"|"air";right:"flat"|"toe"|"heel"|"air"} },
  ) => AutoMovieHumanGrounding.IResult;
  reach: (
    pose: IAutoMovieHumanPose,
    side: "left" | "right",
    worldTarget: THREE.Vector3,
  ) => ReturnType<typeof actor.reach>;
  worldPoint: (bone: string, offset?: [number, number, number]) => THREE.Vector3;
  clearCache: () => void;
} {
  const parents: Map<string, string | null> = new Map(actor.neutral.bones.map(
    (bone: AutoMovieHumanSkeleton.IBone): [string, string | null] => [bone.bone, bone.parent],
  ));
  const points: AutoMovieHumanSupportFrame.IPoint[] = [];
  const rest: { left: THREE.Vector3; right: THREE.Vector3 } = {
    left: new THREE.Vector3(0, Infinity, 0), right: new THREE.Vector3(0, Infinity, 0),
  };
  for (const [id, mesh] of actor.drawing.parts) {
    let ancestor: string | null = id;
    let side: "left" | "right" | undefined;
    while (ancestor !== null) {
      if (ancestor === "leftFoot") { side = "left"; break; }
      if (ancestor === "rightFoot") { side = "right"; break; }
      ancestor = parents.get(ancestor) ?? null;
    }
    if (side === undefined) continue;
    const positions: THREE.BufferAttribute = mesh.geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let index: number = 0; index < positions.count; index++) {
      const localPoint: [number, number, number] = [positions.getX(index), positions.getY(index), positions.getZ(index)];
      const point: AutoMovieHumanSupportFrame.IPoint = {
        bone: AutoMovieHumanRigControls.joint(id), localPoint,
      };
      points.push(point);
    }
  }
  const soleFrames: Record<"left" | "right", ReturnType<typeof AutoMovieHumanSupportFrame.prepare>> = {
    left: AutoMovieHumanSupportFrame.prepare(actor.neutral, actor.feet.left.sole),
    right: AutoMovieHumanSupportFrame.prepare(actor.neutral, actor.feet.right.sole),
  };
  for (const side of ["left", "right"] as const) {
    points.push(...actor.feet[side].vertices);
    rest[side].set(0, 0, 0);
    for (const point of actor.feet[side].sole)
      rest[side].add(actor.point(point.bone, point.localPoint));
    rest[side].divideScalar(3);
  }
  const ground: AutoMovieHumanGrounding.IPrepared = AutoMovieHumanGrounding.prepare(actor.evaluate, points);
  const channels: AutoMovieHumanRigControls.DegreeChannel[] = [
    ...AutoMovieHumanRigControls.chain({ region: "leg", side: "left" }),
    ...AutoMovieHumanRigControls.chain({ region: "leg", side: "right" }),
  ];
  const solved: Map<string, AutoMovieHumanGrounding.IResult> = new Map();
  return {
    rest,
    clearCache: (): void => solved.clear(),
    /** Fit both actual sole frames with complete Human/shoe nonpenetration retained. */
    place(
      pose: IAutoMovieHumanPose,
      position: [number, number, number],
      yaw: number,
      feet: { left: THREE.Vector3; right: THREE.Vector3 },
      placement?: { headings: {left:number;right:number}; swing:"left"|"right"|null;kneeSeed?:number;contacts?:{left:"flat"|"toe"|"heel"|"air";right:"flat"|"toe"|"heel"|"air"} },
    ): AutoMovieHumanGrounding.IResult {
      const rotation: THREE.Quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
      const targets: AutoMovieHumanClinicalIk.ITarget[] = [];
      const seedGoals: AutoMovieHumanClinicalIk.ITarget[] = [];
      for (const side of ["left", "right"] as const) {
        const forward:THREE.Vector3=new THREE.Vector3(1,0,0).applyAxisAngle(new THREE.Vector3(0,1,0),placement?.headings[side]??yaw);
        const frameTargets: AutoMovieHumanClinicalIk.ITarget[] = soleFrames[side]({ origin: feet[side].toArray(), forward: forward.toArray(), normal: [0, 1, 0] });
        const role:"flat"|"toe"|"heel"|"air"=placement?.contacts?.[side]??((placement?placement.swing===side:feet[side].y>1e-6)?"air":"flat");
        const selected:AutoMovieHumanClinicalIk.ITarget[]=role==="flat"?frameTargets:[frameTargets[role==="toe"?1:0]!];
        seedGoals.push(selected[0]!);targets.push(...selected);
      }
      const request: AutoMovieHumanGrounding.IRequest = {
        targets, channels, rootAxes: ["y"], floor: 0, iterations: 16, tolerance: 0.005,
      };
      if(placement){
        const hips:AutoMovieHumanSkeleton.IPlacement|undefined=actor.neutral.posed.find((p:AutoMovieHumanSkeleton.IPlacement):boolean=>p.bone==="hips");
        if(!hips)throw new Error("Route posture needs the original hips centre");
        request.softTargets=[{bone:AutoMovieHumanRigControls.joint("hips"),localPoint:[0,0,0],position:new THREE.Vector3(...hips.position).applyQuaternion(rotation).add(new THREE.Vector3(...position)).toArray()}];
      }
      const key: string = JSON.stringify([position, yaw, feet.left.toArray(), feet.right.toArray(), placement??null, pose.pelvis ?? {}, pose.legs ?? {}]);
      const previous: AutoMovieHumanGrounding.IResult | undefined = solved.get(key);
      if (previous) {
        const combined: IAutoMovieHumanPose = { ...pose, legs: previous.pose.legs };
        const inspected: AutoMovieHumanGrounding.IResult = ground.inspect(combined, previous.root, request);
        actor.pose(inspected.pose);
        actor.object.position.set(...inspected.root.translation);
        actor.object.quaternion.set(...inspected.root.rotation);
        actor.object.updateMatrixWorld(true);
        return inspected;
      }
      const seedPosition:[number,number,number]=[...position];
      const ankleGoals: Map<"left"|"right",THREE.Vector3>=new Map();
      if(placement?.kneeSeed!==undefined){
        if(!Number.isFinite(placement.kneeSeed)||placement.kneeSeed<0)throw new Error("Authored knee seed must be a nonnegative clinical angle");
        const current:AutoMovieHumanSkeleton.IOutput=actor.evaluate(pose);
        const supports:AutoMovieHumanLegIk.ISupport[]=[];
        for(const [ordinal,side] of (["left","right"] as const).entries()){
          const target:AutoMovieHumanClinicalIk.ITarget=seedGoals[ordinal]!;
          const neutral:AutoMovieHumanSkeleton.IPlacement|undefined=actor.neutral.posed.find((p:AutoMovieHumanSkeleton.IPlacement):boolean=>p.bone===target.bone);
          const ankle:AutoMovieHumanSkeleton.IPlacement|undefined=actor.neutral.posed.find((p:AutoMovieHumanSkeleton.IPlacement):boolean=>p.bone===side+"Foot");
          if(!neutral||!ankle)throw new Error("Shoe seeding requires its actual carrier and original ankle neutral frames");
          // These shoe witnesses were cut from the world-neutral horizontal
          // sole. Heading rotates the same neutral material-to-ankle vector,
          // including the actual Subtalar carrier-to-Foot displacement.
          // Subtract the ACTUAL selected witness, including toe1, exactly once.
          // A prior pitched Foot offset is incompatible with seed's neutral
          // ankle reset and can strand a newly landed shoe on one edge.
          const offset:THREE.Vector3=new THREE.Vector3(...(target.localPoint??[0,0,0])).applyQuaternion(new THREE.Quaternion(...neutral.rotation)).add(new THREE.Vector3(...neutral.position)).sub(new THREE.Vector3(...ankle.position));
          const worldAnkle:THREE.Vector3=new THREE.Vector3(...target.position).sub(offset.applyAxisAngle(new THREE.Vector3(0,1,0),placement.headings[side]));
          ankleGoals.set(side,worldAnkle);
          supports.push({side,position:worldAnkle.toArray(),kneeFlexion:placement.kneeSeed});
        }
        const height:ReturnType<typeof AutoMovieHumanLegIk.supportHeight>=AutoMovieHumanLegIk.supportHeight(current,actor.neutral,{translation:[...position],rotation:rotation.toArray()},supports);
        if(!height.feasible)throw new Error("Authored foot destinations have no measured knee-seed reach");
        seedPosition[1]=Math.min(seedPosition[1],height.height);
      }
      let seed: IAutoMovieHumanPose = pose;
      for (const [ordinal, side] of (["left", "right"] as const).entries()) {
        const goal: AutoMovieHumanClinicalIk.ITarget = seedGoals[ordinal]!;
        const target: THREE.Vector3 = new THREE.Vector3(...goal.position).sub(new THREE.Vector3(...seedPosition)).applyQuaternion(rotation.clone().invert());
        const ankle:THREE.Vector3|undefined=ankleGoals.get(side);
        if(ankle){
          const bodyAnkle:THREE.Vector3=ankle.clone().sub(new THREE.Vector3(...seedPosition)).applyQuaternion(rotation.clone().invert());
          // Orient the seed's anatomical knee plane toward its actual ankle.
          // This is an initial pose, never a hard knee or toe orientation.
          seed=AutoMovieHumanLegIk.seed(seed,side,bodyAnkle.toArray(),actor.evaluate(seed),actor.neutral,true);
        }else seed = AutoMovieHumanLegIk.seedPoint(actor.evaluate, seed, side, {
          ...goal, position: target.toArray(),
        });
      }
      const result: AutoMovieHumanGrounding.IResult = ground(seed, {
        translation: seedPosition, rotation: [rotation.x, rotation.y, rotation.z, rotation.w],
      }, request);
      if (solved.size < durationSeconds * performanceFrameRate + 1) solved.set(key, result);
      actor.pose(result.pose);
      actor.object.position.set(...result.root.translation);
      actor.object.quaternion.set(...result.root.rotation);
      actor.object.updateMatrixWorld(true);
      return result;
    },
    /** Solve one actual arm after support fitting without changing root placement. */
    reach(pose: IAutoMovieHumanPose, side: "left" | "right", worldTarget: THREE.Vector3): ReturnType<typeof actor.reach> {
      const target: THREE.Vector3 = actor.object.worldToLocal(worldTarget.clone());
      return actor.reach(pose, side, [target.x, target.y, target.z]);
    },
    /** Read an actual bone-bound point through the currently applied actor root. */
    worldPoint(bone: string, offset: [number, number, number] = [0, 0, 0]): THREE.Vector3 {
      return actor.object.localToWorld(actor.point(bone, offset));
    },
  };
}
