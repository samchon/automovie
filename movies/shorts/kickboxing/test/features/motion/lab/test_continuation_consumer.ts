import assert from "node:assert/strict";
import { AutoMovieHumanRigControls } from "@automovie/human";
import type { MotionAction } from "../../../../src/motion/core/MotionAction";
import { LabActor } from "../../../../src/motion-lab/LabActor";
import { LabCase } from "../../../../src/motion-lab/LabCase";
import { LabActualMotion } from "../../../../src/motion-lab/LabActualMotion";
import { LabBodyStage } from "../../../../src/motion-lab/LabBodyStage";
import { LabCombinationCase } from "../../../../src/motion-lab/LabCombinationCase";
import { LabDefenseCase } from "../../../../src/motion-lab/LabDefenseCase";
import { LabFailure } from "../../../../src/motion-lab/LabFailure";
import type { LabSettings } from "../../../../src/motion-lab/LabSettings";
import { labContactFrame } from "../../../../src/motion-lab/labContactFrame";
import { ContactTrace } from "../../../../src/motion/interaction/ContactTrace";
import { LabPunchRecovery } from "../../../../src/motion-lab/LabPunchRecovery";
import type { LabRecovery } from "../../../../src/motion-lab/LabRecovery";
import { PunchAction } from "../../../../src/motion/punch/PunchAction";
import * as THREE from "three";

/**
 * Explicit arm ownership cannot overwrite a continuing other arm or a shared body.
 * @evidence contracts/testing.md#observable-behavior Calls the real stage merger with deliberately different left/right arm values, verifies both selected sides and every body/root/support field, and requires duplicate/foreign-side writers to refuse without mutating inputs.
 * @evidence contracts/testing.md#independent-cases The two named arm inputs and literal unchanged support anchors form the oracle. This pure authority test does not claim native fitting or visual continuity; actual combination cases below own those boundaries.
 */
export function test_continuation_arm_ownership(): void {
  assert.throws((): unknown => new LabCombinationCase({ ...settings(false,"a"), defense:"check" }), /independent kick preparation clock/u);
  const placement: MotionAction.BodyPlacement = { pose: { pelvis: { rotation: 12 }, arms: { left: { elbow: { flexion: 71 } }, right: { elbow: { flexion: 93 } } } }, rootOffset: [.1,0,.03], support: {left:.6,right:.4} };
  const left: MotionAction.Sample = { ...LabBodyStage.sample(placement), pose: { arms: { left: { elbow: {flexion:82} }, right: { elbow: {flexion:3} } } } };
  const right: MotionAction.Sample = { ...LabBodyStage.sample(placement), pose: { arms: { left: { elbow: {flexion:7} }, right: { elbow: {flexion:117} } } } };
  const leftChannels: AutoMovieHumanRigControls.DegreeChannel[] = [AutoMovieHumanRigControls.channel("arms.left.shoulder.flexion")];
  const rightChannels: AutoMovieHumanRigControls.DegreeChannel[] = [AutoMovieHumanRigControls.channel("arms.right.shoulder.flexion")];
  const before: string = JSON.stringify([placement,left,right]);
  const one: MotionAction.Sample = LabBodyStage.arm(left, placement, "left");
  assert.equal(one.pose.arms?.right.elbow?.flexion, 93);
  const both: MotionAction.Sample = LabBodyStage.arms([{side:"left",sample:left,channels:leftChannels},{side:"right",sample:right,channels:rightChannels}],placement);
  assert.equal(both.pose.arms?.left.elbow?.flexion,82);
  assert.equal(both.pose.arms?.right.elbow?.flexion,117);
  assert.equal(both.pose.pelvis?.rotation,12);
  assert.deepEqual(both.rootOffset, placement.rootOffset);
  assert.deepEqual(both.support, placement.support);
  assert.throws((): unknown => LabBodyStage.arms([{side:"left",sample:left,channels:leftChannels},{side:"left",sample:right,channels:leftChannels}],placement), /Duplicate arm writer/u);
  assert.throws((): unknown => LabBodyStage.arms([{side:"left",sample:left,channels:rightChannels}],placement), /own-side/u);
  assert.equal(JSON.stringify([placement,left,right]),before);
}

/**
 * Failure evidence remains independent of the restored actor and producer mutation.
 * @evidence contracts/testing.md#observable-behavior Uses the actual error boundary with original tasks, native status, active bound and source-fit failure, then mutates every source record. The stored nested cause must retain all original values.
 * @evidence contracts/testing.md#independent-cases Literal failed values are intentionally different from restored/admitted ones. This pure snapshot test proves ownership, while existing impossible-body and atomic-case tests own the real native rollback.
 */
export function test_continuation_failure_snapshot(): void {
  const observed: {goal:number[];native:{status:string;bounds:string[]};source:{status:string}} = {goal:[1,2,3],native:{status:"unresolved",bounds:["knee"]},source:{status:"unresolved"}};
  const producer: {pair:string[]} = {pair:["a:glove","b:guard"]};
  const error: Error = LabFailure.error("arm",new Error("raw failure",{cause:producer}),observed);
  observed.goal[0]=9; observed.native.status="admitted"; observed.native.bounds.length=0; observed.source.status="admitted"; producer.pair[0]="changed";
  const cause: {observation:typeof observed;producerCause:typeof producer} = error.cause as {observation:typeof observed;producerCause:typeof producer};
  assert.deepEqual(cause.observation.goal,[1,2,3]);
  assert.equal(cause.observation.native.status,"unresolved");
  assert.deepEqual(cause.observation.native.bounds,["knee"]);
  assert.equal(cause.observation.source.status,"unresolved");
  assert.equal(cause.producerCause.pair[0],"a:glove");
}

/**
 * The actual public reader measures known stationary geometry and refuses mixed contact branches.
 * @evidence contracts/testing.md#observable-behavior Captures one admitted original-polygon body through public applied controls and native transforms at three canonical times. Actual stationary rates must be zero at h/h2, and a changed contact branch must refuse.
 * @evidence contracts/testing.md#independent-cases A static native configuration is the independent zero-motion oracle, not an invented zero for unknown entry motion. Moving entry and overlapping arm/body rates belong to the real cases below.
 */
export function test_continuation_actual_stationary_rates(): void {
  const actor: LabActor = new LabActor("rates","a",0,0);
  try {
    actor.prepareBody({pose:actor.basePose,rootOffset:[0,0,0],support:{left:.5,right:.5,patches:[actor.patches.left.low,actor.patches.right.low]}});
    const sample: (seconds:number) => LabActualMotion.Snapshot = (seconds:number):LabActualMotion.Snapshot => LabActualMotion.capture(actor,"left",seconds,"free");
    const result: LabActualMotion.Measurement = LabActualMotion.measure(sample,.1,1/2400,"before");
    assert.ok(result.rates.every((rate):boolean => Math.abs(rate.degreesPerSecond)<1e-12 && rate.halfStepDifference<1e-12));
    assert.ok(Math.hypot(...Object.values(result.velocity.root.linear))<1e-12);
    assert.ok(Math.hypot(...Object.values(result.velocity.pad.linear))<1e-12);
    const punch: ReturnType<typeof LabActualMotion.punchEntry> = LabActualMotion.punchEntry(result,"left",.2,[.5,1.4,0]);
    assert.ok(punch.rates.every((row: typeof punch.rates[number]): boolean => row.channel.startsWith("arms.left.") && row.degreesPerSecond===0));
    assert.equal(punch.provenance.time,.1);
    const kick: ReturnType<typeof LabActualMotion.kickEntry> = LabActualMotion.kickEntry(result,actor.context("left",[.5,1.4,0]),.01);
    assert.ok(kick.channelRates.length>0 && kick.channelRates.every((row: typeof kick.channelRates[number]): boolean => !row.channel.startsWith("arms.") && row.degreesPerSecond===0));
    assert.ok(kick.loadRates.left === 0 && kick.loadRates.right === 0);
    assert.deepEqual(kick.sample.support,result.entry.placement.support);
    assert.deepEqual(kick.sample.preservedChannels,result.entry.placement.preservedChannels);
    kick.sample.rootOffset[0]=99;
    assert.equal(result.entry.placement.rootOffset[0],0);
    assert.throws((): unknown => LabActualMotion.measure((seconds:number):LabActualMotion.Snapshot => ({...sample(seconds),branch:seconds<.1?"pre-contact":"post-contact"}),.1,1/2400,"before"),/contact branch/u);
  } finally { actor.dispose(); }
}

/**
 * Both original actors must perform an actual overlapping jab-cross without resetting either arm.
 * @evidence contracts/testing.md#observable-behavior Uses the real case, public polygon actor, actual canonical h/h2 entry, staged body/arm solver and original complete-foot support. Exercises entry neighbors, jab return deadline, original cross body endpoint, distinct contact IDs, random seek and frame-history independence.
 * @evidence contracts/testing.md#independent-cases Both anatomical directions use the same immutable original setup and strict .25mm/1µm acceptance. Constructor refusal is a failure with raw cause, never a skipped positive case. Approximate C1 checks include measured h/h2 disagreement and retain their raw values.
 */
export function test_continuation_actual_one_two(): void { combinations(false); }

/**
 * An actual blocked jab must retain its event and continue recovery while the other arm crosses.
 * @evidence contracts/testing.md#observable-behavior Reuses the original actual guard relationship and requires a real first guard event, distinct cross identity and unchanged jab clock while the overlap body and both original feet remain admitted.
 * @evidence contracts/testing.md#independent-cases Mirrored actors retain the same seed/range and strict actual consumer checks. Missing or unsupported interception refuses rather than acquiring a synthetic contact event.
 */
export function test_continuation_actual_blocked_jab_cross(): void { combinations(true); }

/**
 * Requested one-two entry remains an actual supported prefix to both original strike clocks.
 * @evidence contracts/testing.md#observable-behavior Places the actual original polygon pair at an independently fixed outside range, requires a nonzero existing approach, then evaluates prefix, first strike, overlap and completion through the same real consumer. Both action clocks and the original jab deadline retain that prefix.
 * @evidence contracts/testing.md#independent-cases Entry-off fixtures above remain unchanged. This separate 1.6m entry-on case must physically converge and produce actual contact; a teleport, zero-length prefix or relabelled reaction cannot satisfy it.
 */
export function test_continuation_supported_entry(): void {
  const selected: LabCombinationCase = new LabCombinationCase({...settings(false,"a"),distance:1.6,entry:true});
  try {
    assert.equal(selected.admissionError,null,JSON.stringify(selected.inspect()));
    assert.ok(selected.jabStart>0);
    assert.equal(selected.actionClocks()[0]!.startSeconds,selected.jabStart);
    assert.equal(selected.actionClocks()[1]!.startSeconds,selected.crossStart);
    const start: MotionAction.Vec3 = selected.actors.a.person.object.position.toArray();
    selected.evaluate(selected.jabStart);
    assert.ok(new THREE.Vector3(...start).distanceTo(selected.actors.a.person.object.position)>.01);
    const state: {jabContact:{event?:MotionAction.ContactEvent};crossContact:{event?:MotionAction.ContactEvent}} = selected.inspect() as {jabContact:{event?:MotionAction.ContactEvent};crossContact:{event?:MotionAction.ContactEvent}};
    assert.ok(state.jabContact.event);
    assert.ok(state.crossContact.event);
    assert.equal(selected.recoveryPort().actions[0]!.releasedSeconds,selected.jabStart+state.jabContact.event.time+selected.actionClocks()[0]!.timing.contact);
    for(const seconds of [0,selected.jabStart/2,selected.jabStart,selected.crossStart,selected.jabEnd,selected.duration]) {selected.evaluate(seconds);physical(selected.actors);}
  } finally {selected.dispose();}
}

/**
 * An independent approach consumes an outgoing arm at its original complete case clock.
 * @evidence contracts/testing.md#observable-behavior Wraps and delegates the real immutable punch recovery port on two original actors. Actual constructor capture, prefix playback, expiry and reverse seeks must consume offset plus whole case time; all actor fits retain original support. An actual-entry/check combination refuses before changing borrowed actors.
 * @evidence contracts/testing.md#independent-cases The original .34s release/.74s completion and literal .4s offset are independent clocks. The requested1.6m range must produce a positive supported prefix containing the old deadline. No fake native success or replacement external task supplies admission.
 */
export function test_continuation_carry_during_entry(): void {
  const actors: Record<"a" | "b", LabActor> = { a: new LabActor("a", "a", -.8, 0), b: new LabActor("b", "b", .8, Math.PI) };
  const request: MotionAction.Request = { id: "outgoing-entry-jab", actorId: "b", targetId: "a", side: "left", leadSide: "left", direction: [1, 0, 0], timing: { preparation: .1, delivery: .2, contact: .04, retraction: .3, recovery: .1 } };
  const original: LabRecovery = LabPunchRecovery.create([{ action: PunchAction.create("jab", request), context: actors.b.context("left", [.4, 1.4, 0]), startSeconds: 0 }]);
  const calls: number[] = [];
  const port: LabRecovery = { ...original, sampleArms: (seconds: number, placement: MotionAction.BodyPlacement, frame: { origin: MotionAction.Vec3; yawRadians: number }): ReturnType<LabRecovery["sampleArms"]> => { calls.push(seconds); return original.sampleArms(seconds, placement, frame); } };
  let scene: LabCase | undefined;
  try {
    scene = new LabCase({ ...settings(false, "a"), action: "jab", side: "left", defense: "catch", distance: 1.6, entry: true }, actors, { preserveEntry: true, receivingCarry: { port, offsetSeconds: .4 } });
    assert.equal(scene.admissionError, null, JSON.stringify(scene.inspect()));
    const expiry: number = original.endSeconds - .4;
    assert.ok(scene.entrySeconds > expiry);
    assert.ok(calls.some((seconds: number): boolean => seconds > .4 && seconds < original.endSeconds), "Actual entry capture consumed the still-running old arm");
    for (const seconds of [0, expiry / 2, expiry, scene.entrySeconds, scene.entrySeconds + .02, expiry / 2]) {
      calls.length = 0; scene.evaluate(seconds);
      assert.deepEqual(calls, [.4 + seconds]); physical(actors);
    }
    const checkpoint: string = JSON.stringify(Object.values(actors).map((actor: LabActor): object => actor.inspect()));
    const measurement: LabActualMotion.Measurement = LabActualMotion.measure((seconds: number): LabActualMotion.Snapshot => LabActualMotion.capture(actors.a, "left", seconds, "free"), .1, 1 / 2400, "before");
    assert.throws((): LabCase => new LabCase({ ...settings(false, "a"), action: "jab", defense: "check", entry: false }, actors, { preserveEntry: true, entryMotion: { attacker: measurement, receiver: measurement } }), /cannot wait/u);
    assert.equal(JSON.stringify(Object.values(actors).map((actor: LabActor): object => actor.inspect())), checkpoint);
  } finally { scene?.dispose(); actors.a.dispose(); actors.b.dispose(); }
}

/**
 * A real check-preparation prefix cannot delay or restart the old arm clock.
 * @evidence contracts/testing.md#observable-behavior Delegates the actual punch recovery port while the real receiver prepares its shin check. Prefix capture and shuffled playback retain whole case time, original leg tasks and admitted physical support; the prior arm expires inside the prefix.
 * @evidence contracts/testing.md#independent-cases An independent .55s offset and original .74s completion put the .19s old deadline before the check's .26s ready boundary. The incoming lower limb and old left arm have disjoint anatomical ownership despite sharing actor identity.
 */
export function test_continuation_carry_during_check(): void {
  const actors: Record<"a" | "b", LabActor> = { a: new LabActor("a", "a", -.55, 0), b: new LabActor("b", "b", .55, Math.PI) };
  const request: MotionAction.Request = { id: "outgoing-check-jab", actorId: "b", targetId: "a", side: "left", leadSide: "left", direction: [1, 0, 0], timing: { preparation: .1, delivery: .2, contact: .04, retraction: .3, recovery: .1 } };
  const original: LabRecovery = LabPunchRecovery.create([{ action: PunchAction.create("jab", request), context: actors.b.context("left", [.4, 1.4, 0]), startSeconds: 0 }]);
  const calls: number[] = [];
  const port: LabRecovery = { ...original, sampleArms: (seconds: number, placement: MotionAction.BodyPlacement, frame: { origin: MotionAction.Vec3; yawRadians: number }): ReturnType<LabRecovery["sampleArms"]> => { calls.push(seconds); return original.sampleArms(seconds, placement, frame); } };
  let scene: LabCase | undefined;
  try {
    scene = new LabCase({ ...settings(false, "a"), action: "low-kick", target: "leg", side: "left", defense: "check", entry: false }, actors, { preserveEntry: true, receivingCarry: { port, offsetSeconds: .55 } });
    assert.equal(scene.admissionError, null, JSON.stringify(scene.inspect()));
    const expiry: number = original.endSeconds - .55;
    assert.ok(scene.readySeconds > expiry && scene.entrySeconds === 0);
    assert.ok(calls.some((seconds: number): boolean => seconds > .55 && seconds < original.endSeconds));
    for (const seconds of [0, expiry, scene.readySeconds, scene.readySeconds + .02, expiry / 2]) {
      calls.length = 0; scene.evaluate(seconds);
      assert.deepEqual(calls, [.55 + seconds]); physical(actors);
    }
  } finally { scene?.dispose(); actors.a.dispose(); actors.b.dispose(); }
}

/**
 * Every actual visible carrier participates symmetrically, including a foot-first interception.
 * @evidence contracts/testing.md#observable-behavior Cross-checks the real actor object traversal against both collision populations without filtering an anatomical class. A detached original articulated foot carrier translation must encounter the original receiver; classifying that same geometry as incidental clearance must refuse rather than admit a strike.
 * @evidence contracts/testing.md#independent-cases Source meshes and the receiver's actual head triangles supply the first-contact oracle; only detached WORLD coordinates move in this pure query case. It proves population/query coverage, not a physically authored kick or whole-body CCD.
 */
export function test_continuation_actual_collision_population(): void {
  const actors: Record<"a"|"b",LabActor> = pair();
  try {
    const sample: MotionAction.Sample = LabBodyStage.sample({pose:actors.a.basePose,rootOffset:[0,0,0],support:{left:.5,right:.5}});
    const frame: ContactTrace.Frame = labContactFrame(actors.a,actors.b,sample,{action:"high-kick",side:"left",defense:"none"},"right");
    const actual: THREE.Mesh[] = [];
    actors.a.person.object.traverseVisible((object: THREE.Object3D): void => {if(object instanceof THREE.Mesh) actual.push(object);});
    assert.equal(actors.a.person.collisionParts().length,actual.length);
    assert.equal(frame.attacks.length,actual.length);
    assert.equal(new Set(frame.attacks.map((part:ContactTrace.Attack):string=>part.id)).size,actual.length);
    assert.equal(frame.receivers.length,actors.b.person.collisionParts().length);
    for(const bone of ["leftSubtalar","leftMidfoot","neck","spine"]) assert.ok(actors.a.person.collisionParts().some((part:{bone:string}):boolean=>part.bone===bone),bone);
    const carrier: ReturnType<LabActor["person"]["collisionParts"]>[number] = actors.a.person.collisionParts().find((part: ReturnType<LabActor["person"]["collisionParts"]>[number]): boolean => part.bone === "leftMidfoot")!;
    assert.ok(carrier);
    const foot: ContactTrace.Attack = frame.attacks.find((part:ContactTrace.Attack):boolean=>part.id===`a:${carrier.id}`)!;
    const head: ContactTrace.Receiver = frame.receivers.find((part:ContactTrace.Receiver):boolean=>part.id==="b:head")!;
    assert.ok(foot && head);assert.equal(foot.role,"strike");
    const center: (positions: readonly number[]) => THREE.Vector3 = (positions: readonly number[]):THREE.Vector3 => {const box:THREE.Box3=new THREE.Box3();for(let i:number=0;i<positions.length;i+=3) box.expandByPoint(new THREE.Vector3(positions[i]!,positions[i+1]!,positions[i+2]!));return box.getCenter(new THREE.Vector3());};
    const footCenter:THREE.Vector3=center(foot.mesh.positions);
    const headCenter:THREE.Vector3=center(head.mesh.positions);
    const capture:(seconds:number)=>ContactTrace.Frame=(seconds:number):ContactTrace.Frame=>({sample:{...sample,elapsed:seconds},attacks:[{...foot,mesh:{...foot.mesh,positions:foot.mesh.positions.map((value:number,index:number):number=>value+headCenter.getComponent(index%3)-footCenter.getComponent(index%3)+(index%3===0?seconds-.5:0))}}],receivers:[head]});
    const options:ContactTrace.Options={actionId:"foot-first",actorId:"a",targetId:"b",start:0,end:1,stepSeconds:1/20,refinementSteps:8,maximumCaptures:100,grazeCosine:.25,capture};
    const trace:ContactTrace.Result=ContactTrace.resolve(options);
    assert.ok(trace.event);assert.equal(trace.event.relation,"head");
    assert.equal(trace.receipt.participants.attacks[0]!.id,foot.id);
    assert.throws(():unknown=>ContactTrace.resolve({...options,capture:(seconds:number):ContactTrace.Frame=>{const current:ContactTrace.Frame=capture(seconds);current.attacks[0]!.role="clearance";return current;}}),/clearance/u);
  } finally {actors.a.dispose();actors.b.dispose();}
}

/**
 * Standalone defense choices use real modules and never synthesize an incoming event.
 * @evidence contracts/testing.md#observable-behavior Evaluates guard-like cover, parry, slip, weave and check through the standalone Viewer case at preparation, motion and return endpoints, inspecting native floor/load support and contact:null.
 * @evidence contracts/testing.md#independent-cases Original guard/support/receiving definitions and thresholds remain unchanged. Every selected module is attempted and all failures are collected so one bad defense cannot mask the remainder.
 */
export function test_continuation_standalone_defenses(): void {
  const actors: Record<"a"|"b",LabActor> = pair();
  const failures: string[] = [];
  try {
    for (const defense of ["cover","parry","slip","weave","check"] as const) {
      const selected: LabDefenseCase = new LabDefenseCase({...settings(false,"a"),action:"defense",defense},actors);
      try {
        assert.equal(selected.admissionError,null,JSON.stringify(selected.inspect()));
        for (const fraction of [0,.3,.5,.8,1]) { selected.evaluate(selected.duration*fraction); physical(actors); }
        assert.equal((selected.inspect() as {contact:null}).contact,null);
      } catch(error:unknown) { failures.push(`${defense}: ${error instanceof Error?error.message:String(error)} ${JSON.stringify(selected.inspect())}`); }
      finally { selected.dispose(); }
    }
  } finally { actors.a.dispose();actors.b.dispose(); }
  assert.deepEqual(failures,[]);
}

/** Keep one source actor pair across both mirrored actual cases. */
function combinations(blocked:boolean):void {
  const actors: Record<"a"|"b",LabActor> = pair();
  const failures: string[] = [];
  try {
    for (const role of ["a","b"] as const) {
      const selected: LabCombinationCase = new LabCombinationCase(settings(blocked,role),actors);
      try {
        assert.equal(selected.admissionError,null,JSON.stringify(selected.inspect()));
        const entry: number = selected.crossStart;
        const h: number = 1/2400;
        const authority: { entry: Record<MotionAction.Side, LabActualMotion.Measurement>; stopped: { jab?: { attacker: MotionAction.ContactState; observedSupport: Record<"attacker" | "receiver", MotionAction.Support> } }; jabContact?: { constrainedSample?: MotionAction.Sample } } = selected.inspect() as { entry: Record<MotionAction.Side, LabActualMotion.Measurement>; stopped: { jab?: { attacker: MotionAction.ContactState; observedSupport: Record<"attacker" | "receiver", MotionAction.Support> } }; jabContact?: { constrainedSample?: MotionAction.Sample } };
        if (authority.stopped.jab) {
          assert.deepEqual(authority.stopped.jab.observedSupport.attacker, authority.jabContact!.constrainedSample!.support);
          for (const patch of authority.entry[settings(blocked,role).side].entry.placement.support.patches ?? []) {
            if (patch.mode === "free") continue;
            assert.ok(actors[role].context(settings(blocked,role).side,[0,0,0]).supportPatches!.some((original: MotionAction.SupportPatch): boolean => original.side === patch.side && original.bone === patch.bone && JSON.stringify(original.localPoint) === JSON.stringify(patch.localPoint) && JSON.stringify(original.world) === JSON.stringify(patch.world)), "Entry retains original ground authority independently of stopped observations");
          }
        }
        for (const side of ["left","right"] as const) {
          const before: LabActualMotion.Measurement = selected.ratesAt(entry,side,h,"before");
          const after: LabActualMotion.Measurement = selected.ratesAt(entry,side,h,"after");
          assert.ok(before.provenance.maximumLinearDifference<=.025 && after.provenance.maximumLinearDifference<=.025,JSON.stringify({before:before.provenance,after:after.provenance}));
          assert.ok(before.provenance.maximumAngularDifference<=.025 && after.provenance.maximumAngularDifference<=.025);
          const gap: number = Math.hypot(before.velocity.pad.linear.x-after.velocity.pad.linear.x,before.velocity.pad.linear.y-after.velocity.pad.linear.y,before.velocity.pad.linear.z-after.velocity.pad.linear.z);
          assert.ok(gap <= .05 + 2*(before.provenance.maximumLinearDifference+after.provenance.maximumLinearDifference),JSON.stringify({side,gap,before,after}));
          const torsoGap: number = Math.hypot(before.velocity.torso.angular.x-after.velocity.torso.angular.x,before.velocity.torso.angular.y-after.velocity.torso.angular.y,before.velocity.torso.angular.z-after.velocity.torso.angular.z);
          assert.ok(torsoGap <= .05+2*(before.provenance.maximumAngularDifference+after.provenance.maximumAngularDifference));
          const receiverBefore: LabActualMotion.Measurement = selected.ratesAt(entry,side,h,"before","receiver");
          const receiverAfter: LabActualMotion.Measurement = selected.ratesAt(entry,side,h,"after","receiver");
          const receiverPadGap: number = Math.hypot(receiverBefore.velocity.pad.linear.x-receiverAfter.velocity.pad.linear.x,receiverBefore.velocity.pad.linear.y-receiverAfter.velocity.pad.linear.y,receiverBefore.velocity.pad.linear.z-receiverAfter.velocity.pad.linear.z);
          assert.ok(receiverPadGap <= .05+2*(receiverBefore.provenance.maximumLinearDifference+receiverAfter.provenance.maximumLinearDifference),JSON.stringify({side,receiverPadGap,receiverBefore,receiverAfter}));
          for (const rate of receiverBefore.rates) {
            const continued: LabActualMotion.Measurement["rates"][number] | undefined = receiverAfter.rates.find((row: LabActualMotion.Measurement["rates"][number]): boolean => row.channel === rate.channel);
            assert.ok(continued);
            assert.ok(Math.abs(rate.degreesPerSecond-continued.degreesPerSecond)<=.5+2*(rate.halfStepDifference+continued.halfStepDifference),JSON.stringify({side,rate,continued}));
          }
        }
        const receiving: {kind:string;request:MotionAction.Request;firstReturn?:{side:MotionAction.Side;endSeconds:number};entry:Record<MotionAction.Side,LabActualMotion.Measurement>} = (selected.inspect() as {receiving:{kind:string;request:MotionAction.Request;firstReturn?:{side:MotionAction.Side;endSeconds:number};entry:Record<MotionAction.Side,LabActualMotion.Measurement>}}).receiving;
        assert.equal(receiving.kind,"cover");
        assert.equal(receiving.request.side,settings(blocked,role).side);
        if(receiving.firstReturn) {assert.notEqual(receiving.firstReturn.side,receiving.request.side);assert.ok(receiving.firstReturn.endSeconds>entry);}
        assert.equal(receiving.entry.left.provenance.actualTime,entry);
        assert.equal(receiving.entry.right.provenance.actualTime,entry);
        const state: {originalCrossTiming:MotionAction.Timing;sharedBody:{endSeconds:number;terminal:MotionAction.BodyPlacement};jabContact?:{event?:MotionAction.ContactEvent};crossContact?:{event?:MotionAction.ContactEvent}} = selected.inspect() as {originalCrossTiming:MotionAction.Timing;sharedBody:{endSeconds:number;terminal:MotionAction.BodyPlacement};jabContact?:{event?:MotionAction.ContactEvent};crossContact?:{event?:MotionAction.ContactEvent}};
        if(blocked) assert.equal(state.jabContact?.event?.relation,"guard");
        if(state.jabContact?.event && state.crossContact?.event) assert.notEqual(state.jabContact.event.actionId,state.crossContact.event.actionId);
        const marker: number = entry+state.sharedBody.endSeconds;
        for(const time of [entry-h,entry,entry+h,selected.jabEnd,marker,selected.duration]) {selected.evaluate(time);physical(actors);}
        selected.evaluate(marker);
        if(!state.crossContact?.event) {
          const planned: MotionAction.BodyPlacement = state.sharedBody.terminal;
          const requested: MotionAction.Sample = actors[role].sample!;
          assert.ok(Math.abs((requested.pose.pelvis?.rotation??0)-(planned.pose.pelvis?.rotation??0))<1e-10);
          assert.ok(Math.abs((requested.pose.spine?.lumbar?.rotation??0)-(planned.pose.spine?.lumbar?.rotation??0))<1e-10);
        }
        const original: string = physicalState(actors);
        for(const fps of [30,60,120]) {for(const time of [Math.max(0,marker-2/fps),Math.max(0,marker-1/fps),marker])selected.evaluate(time);assert.equal(physicalState(actors),original);}
        selected.evaluate(0);selected.evaluate(marker);assert.equal(physicalState(actors),original);
        const port: LabRecovery = selected.recoveryPort();
        const body: MotionAction.BodyPlacement = LabActualMotion.capture(actors[role],settings(blocked,role).side,marker,"free").placement;
        for (const yawRadians of [actors[role].yaw, actors[role].yaw + .7]) {
          const carried: ReturnType<LabRecovery["sampleArms"]> = port.sampleArms(port.endSeconds+.001,body,{origin:[actors[role].origin.x+2,actors[role].origin.y,actors[role].origin.z-.3],yawRadians});
          assert.equal(carried.length,2);
          for (const writer of carried) { assert.equal(writer.sample.phase,"complete");assert.deepEqual(writer.sample.support,body.support); }
        }
        if(!blocked && role==="a") {
          const originalEntry: {entry:Record<"left"|"right",LabActualMotion.Measurement>;originalCrossWorldAim:MotionAction.Vec3} = selected.inspect() as {entry:Record<"left"|"right",LabActualMotion.Measurement>;originalCrossWorldAim:MotionAction.Vec3};
          const variant: LabCombinationCase = new LabCombinationCase({...settings(false,role),seed:18},actors);
          try {
            assert.equal(variant.admissionError,null,JSON.stringify(variant.inspect()));
            const other: typeof originalEntry = variant.inspect() as typeof originalEntry;
            assert.ok(Math.hypot(...other.originalCrossWorldAim.map((value:number,index:number):number=>value-originalEntry.originalCrossWorldAim[index]!))<1e-12);
            assert.notEqual(JSON.stringify(other.entry.right.rates),JSON.stringify(originalEntry.entry.right.rates));
            variant.evaluate(variant.crossStart+other.entry.right.provenance.h);physical(actors);
          } finally {variant.dispose();}
        }
      } catch(error:unknown) {failures.push(`${role}: ${error instanceof Error?error.message:String(error)} ${JSON.stringify(selected.inspect())}`);}
      finally {selected.dispose();}
    }
  } finally {actors.a.dispose();actors.b.dispose();}
  assert.deepEqual(failures,[]);
}

/** Original range/seed and explicit entry-off match the existing guard fixture. */
function settings(blocked:boolean,role:"a"|"b"):LabSettings {return{action:blocked?"blocked-one-two":"one-two",actor:role,side:role==="a"?"left":"right",target:"guard",defense:role==="a"?"catch":"cover",distance:1.1,seed:17,aim:0,timingVariation:0,timingScale:1,direction:0,entry:false};}
/** The real original polygon pair is reused, never a dummy motion implementation. */
function pair():Record<"a"|"b",LabActor>{return{a:new LabActor("a","a",-.55,0),b:new LabActor("b","b",.55,Math.PI)};}
/** Keep original native hard/floor tolerances and each loaded-foot role. */
function physical(actors:Record<"a"|"b",LabActor>):void{for(const actor of Object.values(actors)){assert.equal(actor.support?.status,"admitted");assert.ok(actor.support!.supportError<=.00025);assert.ok(actor.support!.floorMinimum>=-.000001);}}
/** Compare actual geometry authority independently of CPU timing and prior display history. */
function physicalState(actors:Record<"a"|"b",LabActor>):string{return JSON.stringify(Object.values(actors).map((actor:LabActor):object=>({pose:actor.pose,root:actor.person.object.position.toArray(),support:actor.sample?.support,effectors:actor.sample?.effectors})));}
