import type { IAutoMovieHumanPose } from "@automovie/human";
import * as THREE from "three";

import { createPalmCarry } from "./createPalmCarry";
import { createInvitationUnfolding } from "./createInvitationUnfolding";
import { createDialogueCues } from "./createDialogueCues";
import { placePaperOnPalm } from "./placePaperOnPalm";
import { createHumanHandContacts } from "./createHumanHandContacts";
import { createHumanPerformer } from "./createHumanPerformer";
import { createHumanSupport } from "./createHumanSupport";
import { createInvitationPaper } from "./createInvitationPaper";
import { createPerformanceClock } from "./createPerformanceClock";
import { createWindowBay } from "./createWindowBay";
import { durationSeconds } from "./durationSeconds";
import { fitPerformanceCamera } from "./fitPerformanceCamera";
import type { IPerformancePreparation } from "./IPerformancePreparation";
import type { IPerformancePoseFrame } from "./IPerformancePoseFrame";
import { performanceFrameRate } from "./performanceFrameRate";
import { performanceFrameFailures } from "./performanceFrameFailures";
import { placePropAnchor } from "./placePropAnchor";
import { measurePaperContact } from "./measurePaperContact";
import { sampleWalkingApproach } from "./sampleWalkingApproach";

/**
 * Stage the send, missed recall, palm catch and manual unfolding with Human FK.
 * The implemented review range is 0–19 seconds. Later action is not silently
 * replaced by a held frame. The full output clock is 60 seconds at 24 fps.
 *
 * @evidence contracts/common.md#implementation-and-ownership Public Human arm/finger IK, whole Human/shoe floor admission and measured sole-frame targets drive the actors. Distinct opposing material patches contact the actual finite folded-paper faces; the later upward palm supports the actual finite lower base face, using clipped original palm triangles and complete original-hand penetration checks. Engine owns the continuous shot time; frame-indexed caches retain the actual solved states. The visible partial-range metadata prevents an unfinished tail from masquerading as a film. All owned caches and resources retire together.
 * @evidence contracts/common.md#authoring-interface Seek finite in-range seconds; the returned time is the evaluated 24fps instant. warm evaluates every requested frame before playback and retains all failures in one report. exportFrames returns owned copies of actual Human states. Metres use +X along wall, +Y up and +Z toward the open front. Intro coverage uses the actual folded-paper face and upper body/cups; the catch insert uses the actual palm and finite prop from above, without moving either to serve the view. Numerical support/contact observations do not certify readable action or collision-free fabric.
 */
export function createProduction(): {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  implementedThrough: number;
  seek: (seconds: number) => number;
  warm: (through?: number) => Promise<IPerformancePreparation>;
  dispose: () => void;
  exportFrames: () => IPerformancePoseFrame[];
  exportModels: () => object;
} {
  const implementedThrough: number = 19;
  const clock: ReturnType<typeof createPerformanceClock> = createPerformanceClock(durationSeconds, performanceFrameRate);
  const scene: THREE.Scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd4d5d0);
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(45, 9 / 16, 0.1, 100);
  const owners: (() => void)[] = [];
  let retired: boolean = false;
  /** Attempt every acquired owner, including construction failure. */
  const retire: () => void = (): void => {
    if (retired) return;
    retired = true;
    const errors: unknown[] = [];
    for (const owner of owners.reverse()) { try { owner(); } catch (error: unknown) { errors.push(error); } }
    scene.clear();
    if (errors.length) throw new AggregateError(errors, "Production retirement failed");
  };
  try {
  const cues:ReturnType<typeof createDialogueCues>=createDialogueCues(camera);owners.push(cues.dispose);scene.add(camera);
  const bay: ReturnType<typeof createWindowBay> = createWindowBay();
  owners.push(bay.dispose);
  scene.add(bay.object);
  scene.add(new THREE.HemisphereLight(0xe8f5ff, 0xa8a6a0, 2.2));
  const light: THREE.DirectionalLight = new THREE.DirectionalLight(0xffe7c2, 2.5);
  light.position.set(2, 3, 2); scene.add(light);
  const carina: ReturnType<typeof createHumanPerformer> = createHumanPerformer({ stature: 1.7, female: true, houseColor: 0x23553e });
  owners.push(carina.dispose);
  const harry: ReturnType<typeof createHumanPerformer> = createHumanPerformer({ stature: 1.76, female: false, houseColor: 0x7d2830 });
  owners.push(harry.dispose);
  scene.userData.models = [carina, harry].map((actor: typeof carina): object => ({ parameters: actor.parameters, vertices: actor.model.vertices, footSamples: actor.model.footSamples, maximumFootProjectionError: actor.model.maximumFootProjectionError }));
  const cContact: ReturnType<typeof createHumanHandContacts> = createHumanHandContacts(carina, "right");
  const hContact: ReturnType<typeof createHumanHandContacts> = createHumanHandContacts(harry, "left");
  scene.userData.contactPreparation = { carina: cContact.preparation(), harry: hContact.preparation() };
  const hPalmCarry:ReturnType<typeof createPalmCarry>=createPalmCarry(harry,"left");
  const hHandSkin:THREE.Mesh[]=[...harry.drawing.parts].filter(([id]):boolean=>/^left(Hand|Index|Thumb|Middle|Ring|Little)/.test(id)).map(([,mesh]):THREE.Mesh=>mesh);
  scene.userData.palmPreparation=hPalmCarry.record;
  const cHandSkin: THREE.Mesh[] = [...carina.drawing.parts].filter(([id]): boolean => /^right(Hand|Index|Thumb|Middle|Ring|Little)/.test(id)).map(([,mesh]): THREE.Mesh => mesh);
  const carinaSupport: ReturnType<typeof createHumanSupport> = createHumanSupport(carina);
  owners.push(carinaSupport.clearCache);
  const harrySupport: ReturnType<typeof createHumanSupport> = createHumanSupport(harry);
  owners.push(harrySupport.clearCache);
  const paper: ReturnType<typeof createInvitationPaper> = createInvitationPaper();
  owners.push(paper.dispose);
  paper.form(0,0);
  const beakLocal: THREE.Vector3=paper.beak().sub(paper.anchor());
  scene.add(carina.object, harry.object, paper.object);
  const cRoot: THREE.Vector3 = new THREE.Vector3(4.4, 0, 0.54);
  const cYaw: number = -2.07;
  const cRotation: THREE.Quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), cYaw);
  const cFeet: { left: THREE.Vector3; right: THREE.Vector3 } = {
    left: carinaSupport.rest.left.clone().applyQuaternion(cRotation).add(cRoot),
    right: carinaSupport.rest.right.clone().applyQuaternion(cRotation).add(cRoot),
  };
  cFeet.left.y = 0; cFeet.right.y = 0;
  const frameCache: Map<number, IPerformancePoseFrame> = new Map();
  owners.push((): void => frameCache.clear());
  /** Apply a retained exact Human result, without solving or changing its data. */
  const applyFrame: (frame: IPerformancePoseFrame) => void = (frame: IPerformancePoseFrame): void => {
    for (const [actor, state] of [[carina, frame.carina], [harry, frame.harry]] as const) {
      actor.pose(state.pose); actor.object.position.set(...state.position); actor.object.quaternion.set(...state.rotation);
      actor.object.updateMatrixWorld(true);
    }
    scene.userData.performance = frame.diagnostics;
  };
  /** Evaluate both actors independently from one admitted absolute frame. */
  const actorsAt: (time: number) => IPerformancePoseFrame = (time: number): IPerformancePoseFrame => {
    const index: number = Math.round(time * performanceFrameRate);
    const cached: IPerformancePoseFrame | undefined = frameCache.get(index);
    if (cached) { applyFrame(cached); return cached; }
    const walk: ReturnType<typeof sampleWalkingApproach> = sampleWalkingApproach({
      seconds: time, begin: 0.5, end: 4.2, start: new THREE.Vector3(3.8, 0, 3.1), finish: new THREE.Vector3(3.35, 0, 1.75), yaw: 1.8, steps: 8, rest: harrySupport.rest,
    });
    const miss: number = THREE.MathUtils.smoothstep(time, 6.7, 7.5);
    const stride: THREE.Vector3 = new THREE.Vector3(-0.086, 0, 0.158);
    const root: THREE.Vector3 = cRoot.clone().addScaledVector(stride, miss);
    root.y -= 0.035 * miss; // Authored knee bend seeds the short lunge; public support still owns the final root.
    const feet: typeof cFeet = { left: cFeet.left.clone(), right: cFeet.right.clone().addScaledVector(stride, 2 * miss) };
    feet.right.y = time > 6.7 && time < 7.5 ? Math.sin(Math.PI * (time - 6.7) / 0.8) * 0.035 : 0;
    const withdrawal: number = THREE.MathUtils.smoothstep(time, 6, 6.5) * (1 - THREE.MathUtils.smoothstep(time, 6.7, 7.3));
    const aim: number = THREE.MathUtils.smoothstep(time, 0.5, 4.2);
    if(time>6&&(!releasePose||!releaseWrist))throw new Error("Empty-hand recovery requires the retained actual release state");
    const cSeed: IAutoMovieHumanPose = {
      neck: { atlantoAxial: { rotation: THREE.MathUtils.lerp(-22, 12, aim) }, atlantoOccipital: { flexion: 10 } },
      arms: { left: {}, right:time>6?structuredClone(releasePose!.arms?.right??{}):{ shoulder: { flexion: 45 }, elbow: { flexion: 80 } } },
    };
    const cGround: ReturnType<typeof carinaSupport.place> = carinaSupport.place(cSeed, root.toArray(), cYaw, feet);
    const wristGoal:THREE.Vector3=new THREE.Vector3(0.32+miss*.075-withdrawal*.16+THREE.MathUtils.smoothstep(time,5.5,6)*.025,1.13,-.16+aim*.06);
    if(time>6)wristGoal.copy(releaseWrist!.clone().lerp(wristGoal,THREE.MathUtils.smoothstep(time,6,6.5)));
    const cReach:ReturnType<typeof carina.reach>=carina.reach(cGround.pose,"right",wristGoal.toArray());
    const carryOrigin: THREE.Vector3=carina.object.localToWorld(new THREE.Vector3(0.4+miss*0.075-withdrawal*0.16+THREE.MathUtils.smoothstep(time,5.5,6)*0.025,1.16,-0.16+aim*0.06));
    const receiver:THREE.Vector3=walk.root.clone().sub(carryOrigin);receiver.y=0;receiver.normalize();
    const cCarry:ReturnType<typeof cContact.aim>|null=time<=6?cContact.aim(cReach.pose,carryOrigin,receiver,beakLocal):null;
    let cPose:IAutoMovieHumanPose=cCarry?.pose??cReach.pose;
    let pinch:ReturnType<typeof cContact.pinch>|null=null;
    const gripAmount:number=1-THREE.MathUtils.smoothstep(time,6,6.25);
    const grip:ReturnType<typeof cContact.pinch>=cContact.pinch(cPose,gripAmount);cPose=grip.pose;
    const actualCarrier:ReturnType<typeof cContact.carrierFrame>=cContact.carrierFrame();
    const carryPositionError:number=actualCarrier.point.distanceTo(carryOrigin);
    const actualHeading:THREE.Vector3=beakLocal.clone().normalize().applyQuaternion(actualCarrier.rotation);
    const carryDirectionError:number=actualHeading.angleTo(receiver)*180/Math.PI;
    if (time <= 6) pinch = grip;
    const catchPhase: number = THREE.MathUtils.smoothstep(time, 6.2, 8.6);
    const hSeed: IAutoMovieHumanPose = {
      neck: { atlantoOccipital: { flexion: 8 * catchPhase }, atlantoAxial: { rotation: -8 * catchPhase } },
      arms: {
        left: { shoulder: { flexion: (time < 4.2 ? -Math.sin(time * 4) * 7 * (1 - THREE.MathUtils.smoothstep(time, 3.8, 4.2)) : 0) + 20 * catchPhase }, elbow: { flexion: 70 * catchPhase }, forearm: { pronation: -65 * catchPhase } },
        right: { shoulder: { flexion: time < 4.2 ? Math.sin(time * 4) * 7 * (1 - THREE.MathUtils.smoothstep(time, 3.8, 4.2)) : 0 } },
      },
    };
    const hGround: ReturnType<typeof harrySupport.place> = harrySupport.place(hSeed, walk.root.toArray(), 1.8, walk.feet);
    const hTarget: THREE.Vector3 = harry.point("leftHand").lerp(new THREE.Vector3(0.35, 1.2, 0.33), catchPhase);
    const hReach: ReturnType<typeof harry.reach> | null = catchPhase > 0 ? harry.reach(hGround.pose, "left", hTarget.toArray()) : null;
    const initialPalm:ReturnType<typeof hPalmCarry.frame>=hPalmCarry.frame();
    const palmUp:THREE.Vector3=new THREE.Vector3(0,1,0);
    const palmForward:THREE.Vector3=carina.object.position.clone().sub(harry.object.position);palmForward.y=0;palmForward.normalize();
    const palmRight:THREE.Vector3=palmForward.clone().cross(palmUp).normalize();
    const desiredPalm:THREE.Quaternion=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(palmRight,palmForward,palmUp));
    const palmRotation:THREE.Quaternion=initialPalm.rotation.clone().slerp(desiredPalm,catchPhase);
    const hCarry:ReturnType<typeof hPalmCarry.fit>|null=catchPhase>0?hPalmCarry.fit(hReach?.pose??hGround.pose,initialPalm.point,palmRotation):null;
    const actualPalm:ReturnType<typeof hPalmCarry.frame>=hPalmCarry.frame();

    const diagnostics: IPerformancePoseFrame["diagnostics"] = {
      implementedThrough, time,
      carina: { support: cGround.status, supportError: cGround.error, floorMinimum: cGround.floorMinimum, handMode: time<=6?"directed-grasp-carrier":"wrist", wristGoalError:time<=6?null:cReach.error, wristSeedError:cReach.error, handFrameGoalError:time<=6?carryPositionError:undefined, handFrameFitError:cCarry?.error, handDirectionError:time<=6?carryDirectionError:undefined, handDirectionGoal:cCarry?{origin:carryOrigin.toArray(),direction:receiver.toArray(),probeLength:.08,iterations:cCarry.iterations}:undefined, handGoalKind:time<=6?"fixed original grasp anchor plus actual-beak direction, bank free":"empty-hand wrist reach after release", clamps: grip.clamps, pinchGap: pinch?.gap ?? null, pinchGoalError: pinch?.error ?? null, pinchValid: pinch?.valid, pinchMargin: pinch?.margin, pinchNormalDot: pinch?.normalDot, reason: cGround.reason, iterations: cGround.iterations },
      harry: { support: hGround.status, supportError: hGround.error, floorMinimum: hGround.floorMinimum, wristGoalError: null, handFrameGoalError:hCarry?actualPalm.point.distanceTo(initialPalm.point):null,handFrameFitError:hCarry?.error??null,handFrameRotationError:hCarry?actualPalm.rotation.angleTo(palmRotation)*180/Math.PI:null, palmNormal:actualPalm.normal.toArray(), clamps: hCarry?.output.clamped ?? hGround.output.clamped, reason: hGround.reason, iterations: hGround.iterations },
    };
    const frame: IPerformancePoseFrame = {
      index,
      carina: { pose: cPose, position: carina.object.position.toArray(), rotation: carina.object.quaternion.toArray() },
      harry: { pose: hCarry?.pose ?? hGround.pose, position: harry.object.position.toArray(), rotation: harry.object.quaternion.toArray() },
      diagnostics,
    };
    frameCache.set(index, frame); scene.userData.performance = diagnostics;
    return frame;
  };
  /** Carry the prepared real material grasp rigidly; never spin the paper independently inside it. */
  const heldFrame: () => ReturnType<typeof cContact.pinchFrame> = (): ReturnType<typeof cContact.pinchFrame> => cContact.pinchFrame();
  actorsAt(6);
  const release: ReturnType<typeof cContact.pinchFrame> = heldFrame();
  const releasePose:IAutoMovieHumanPose=structuredClone(frameCache.get(144)!.carina.pose);
  const releaseWrist:THREE.Vector3=carina.point("rightHand");
  actorsAt(212 / performanceFrameRate);
  const catchFrame: ReturnType<typeof hPalmCarry.frame> = hPalmCarry.frame();
  const catchSupport:ReturnType<typeof placePaperOnPalm>=placePaperOnPalm(paper.object,paper.gripBase,catchFrame,harry.drawing.parts.get("leftHand")!,hHandSkin);
  actorsAt(0);
  const introGrip:ReturnType<typeof cContact.pinchFrame>=heldFrame();
  const introNormal:THREE.Vector3=new THREE.Vector3(0,0,1).applyQuaternion(introGrip.rotation);
  if(Math.abs(introNormal.z)>.3?introNormal.z<0:introNormal.y<0)introNormal.negate();
  const introView:THREE.Vector3=introNormal.multiplyScalar(.8).add(new THREE.Vector3(0,.15,.4)).normalize();
  const introEye:THREE.Vector3=introGrip.point.clone().addScaledVector(introView,2).add(new THREE.Vector3(0,.2,0));
  let continuation:ReturnType<typeof createInvitationUnfolding>|undefined;
  owners.push(():void=>continuation?.clear());
  /** Draw the exact quantized instant and expose actual ownership/contact feedback. */
  const seek: (seconds: number) => number = (seconds: number): number => {
    if (retired) throw new Error("Production is retired");
    if (!Number.isFinite(seconds) || seconds < 0 || seconds > implementedThrough)
      throw new Error("Seek exceeds the implemented review range");
    const time: number = Math.min(implementedThrough, (clock.frames - 1) / performanceFrameRate, Math.round(seconds * performanceFrameRate) / performanceFrameRate);
    clock.sample(time);
    if(time>9) {
      if(!continuation){seek(9);continuation=createInvitationUnfolding({carina,harry,cSupport:carinaSupport,hSupport:harrySupport,palm:hPalmCarry,paper,entry:frameCache.get(216)!,camera});}
      const next:ReturnType<typeof continuation.seek>=continuation.seek(time);
      frameCache.set(Math.round(time*performanceFrameRate),next.frame);
      scene.userData.performance=next.frame.diagnostics;scene.userData.paper=next.paper;
      scene.userData.implementedThrough=implementedThrough;scene.userData.frameIndex=next.frame.index;
      scene.userData.camera={name:Reflect.get(next.paper,"camera"),position:camera.position.toArray(),rotation:camera.quaternion.toArray(),fov:camera.fov,aspect:camera.aspect};
      cues.update(time);scene.updateMatrixWorld(true);return time;
    }
    const state: IPerformancePoseFrame = actorsAt(time); paper.form(0, 0);paper.gripFlap.visible=false;
    carina.expression(time < 5.8 ? "smirk" : "startled");
    harry.expression("neutral");
    let contact: THREE.Vector3;
    let orientation: THREE.Quaternion;
    if (time <= 6) { const grip: ReturnType<typeof cContact.pinchFrame> = heldFrame(); contact = grip.point; orientation = grip.rotation; }
    else if (time < 212 / performanceFrameRate) {
      const phase: number = (time - 6) / (212 / performanceFrameRate - 6);
      contact = release.point.clone().lerp(catchSupport.centre, phase); contact.y += 0.08 * Math.sin(Math.PI * phase);
      orientation = release.rotation.clone().slerp(catchFrame.rotation, phase);
    } else { const palm: ReturnType<typeof hPalmCarry.frame> = hPalmCarry.frame(); contact = palm.point; orientation = palm.rotation; }
    const palmSupport:ReturnType<typeof placePaperOnPalm>|null=time>=212/performanceFrameRate?placePaperOnPalm(paper.object,paper.gripBase,hPalmCarry.frame(),harry.drawing.parts.get("leftHand")!,hHandSkin):null;
    const anchorError:number=palmSupport?palmSupport.anchorError:placePropAnchor(paper.object,paper.anchor(),contact,orientation);
    const grasp: ReturnType<typeof cContact.pinchFrame> = cContact.pinchFrame();
    const paperContact: ReturnType<typeof measurePaperContact> | null = time <= 6 ? measurePaperContact(paper.gripBase,grasp,cHandSkin) : null;
    const paperFaceError: number | null = paperContact ? Math.max(paperContact.frontError,paperContact.backError) : null;
    if (paperContact) { state.diagnostics.carina.pinchValid = grasp.valid && paperContact.valid; state.diagnostics.carina.pinchGoalError = paperFaceError; }
    const actualBeak: THREE.Vector3=paper.object.localToWorld(paper.beak()).sub(contact).normalize();
    const receiverDirection: THREE.Vector3=harry.object.position.clone().sub(contact);receiverDirection.y=0;receiverDirection.normalize();
    const beakTargetAngle: number=time<=6?actualBeak.angleTo(receiverDirection)*180/Math.PI:0;
    scene.userData.paper = { beakTargetAngle, custody: time <= 6 ? "Carina pinch" : time < 212 / performanceFrameRate ? "one-use charm" : "Harry palm", actualAnchorError: anchorError, paperFaceError, paperContact, palmSupport, palmNormal: hPalmCarry.frame().normal.toArray() };
    scene.userData.implementedThrough = implementedThrough;
    scene.userData.frameIndex = Math.round(time * performanceFrameRate);
    const opening:boolean=time<1.5;const catching:boolean=time>=8.55;const releasing:boolean=time>=5.4&&time<6.35;
    const subjects:THREE.Object3D[]=opening?[carina.drawing.head.object,carina.drawing.parts.get("chest")!,carina.drawing.parts.get("rightHand")!,paper.object,...bay.cups]:releasing?[paper.object,carina.drawing.parts.get("rightHand")!,carina.drawing.parts.get("rightLowerArm")!]:catching?[paper.object,harry.drawing.parts.get("leftHand")!,harry.drawing.parts.get("leftLowerArm")!]:[carina.object,harry.object,paper.object,...bay.cups];
    const releaseNormal:THREE.Vector3=new THREE.Vector3(0,0,1).applyQuaternion(paper.object.quaternion);
    if(Math.abs(releaseNormal.z)>.3?releaseNormal.z<0:releaseNormal.y<0)releaseNormal.negate();
    const releaseView:THREE.Vector3=releaseNormal.multiplyScalar(.8).add(new THREE.Vector3(0,.15,.4)).normalize();
    const releaseEye:THREE.Vector3=paper.object.localToWorld(paper.anchor()).addScaledVector(releaseView,1.5).add(new THREE.Vector3(0,.15,0));
    const eye:THREE.Vector3=opening?introEye:releasing?releaseEye:catching?hPalmCarry.frame().point.clone().add(new THREE.Vector3(.22,.55,.5)):new THREE.Vector3(5.65,2.45,6);
    fitPerformanceCamera(camera,subjects,eye);
    scene.userData.camera={name:opening?"crane-cups-and-face":releasing?"paper-release-insert":catching?"palm-catch-insert":"front-right-master",position:camera.position.toArray(),rotation:camera.quaternion.toArray(),fov:camera.fov,aspect:camera.aspect};
    cues.update(time);scene.updateMatrixWorld(true);
    return time;
  };
  return {
    scene, camera, seek, implementedThrough,
    exportModels: (): object => ({ carina: carina.model, harry: harry.model }),
    exportFrames: (): IPerformancePoseFrame[] => structuredClone([...frameCache.values()].sort((a: IPerformancePoseFrame, b: IPerformancePoseFrame): number => a.index - b.index)),
    /** Finish every requested frame and retain all failures rather than stopping at one. */
    async warm(through: number = implementedThrough): Promise<IPerformancePreparation> {
      if (retired) throw new Error("Production is retired");
      if (!Number.isFinite(through) || through < 0 || through > implementedThrough) throw new Error("Warm exceeds implemented range");
      const failures: { index: number; error: string }[] = [];
      const structuralFailures: { index: number; error: string }[] = [];
      const completeFrames: number[] = [];
      const last: number = Math.min(clock.frames - 1, Math.round(through * performanceFrameRate));
      for (let index: number = 0; index <= last; index++) {
        if (retired) { failures.push({ index, error: "Preparation retired" }); break; }
        try {
          seek(index / performanceFrameRate);
          const frame: IPerformancePoseFrame = frameCache.get(index)!;
          const numerical: string[] = performanceFrameFailures(frame);
          if (numerical.length) failures.push({ index, error: numerical.join("; ") });
          if (!Number.isFinite(scene.userData.paper.actualAnchorError) || scene.userData.paper.actualAnchorError > 1e-6)
            failures.push({ index, error: "Actual paper anchor did not meet its witness" });
          if (index/performanceFrameRate<=6 && (!Number.isFinite(scene.userData.paper.beakTargetAngle)||scene.userData.paper.beakTargetAngle>25)) failures.push({index,error:"Held beak does not follow the actual receiver"});
          if (index<=144 && (!Number.isFinite(scene.userData.paper.paperFaceError) || scene.userData.paper.paperFaceError > 0.003))
            failures.push({ index, error: "Original finger surfaces did not meet actual paper faces" });
          if(index>=212&&index<=216&&scene.userData.paper.palmSupport?.valid!==true)failures.push({index,error:"Actual palm/finite paper underside support not admitted"});
          if (![...camera.position.toArray(), ...camera.quaternion.toArray(), camera.fov].every(Number.isFinite))
            throw new Error("Nonfinite camera");
          completeFrames.push(index);
        }
        catch (error: unknown) { const item: { index: number; error: string } = { index, error: String(error) }; failures.push(item); structuralFailures.push(item); }
        scene.userData.preparation = { completed: index + 1, total: last + 1, failures: failures.length };
        if (index % 12 === 0) await new Promise<void>((resolve: () => void): void => { setTimeout(resolve, 0); });
      }
      if (!retired) seek(0);
      return { frames: frameCache.size, completeFrames, failures, structuralFailures };
    },
    dispose: retire,
  };
  } catch (error: unknown) {
    try { retire(); } catch (cleanup: unknown) { throw new AggregateError([error, cleanup], "Production construction and cleanup failed"); }
    throw error;
  }
}
