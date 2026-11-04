import assert from "node:assert/strict";
import type { IAutoMovieMesh } from "@automovie/interface";
import { createAutoMovieMeshCrossingQuery, createAutoMovieSignedMeshQuery } from "@automovie/engine";
import type { MotionAction } from "../../../../src/motion/core/MotionAction";
import { ContactResponse } from "../../../../src/motion/interaction/ContactResponse";
import { ContactTrace } from "../../../../src/motion/interaction/ContactTrace";

/**
 * Verify actual triangle interception, conservative stopping and connected paired response.
 *
 * Scenarios:
 * 1. A guard at x=.6 intercepts a .1m-wide translating attack before a body at x=.8.
 * 2. The clear constrained configuration stops before x=.6, including fast pass-through.
 * 3. Repeated resolution and two canonical spacings preserve event identity within their brackets.
 * 4. An absent guard permits a body hit; off-line travel misses; tangential travel grazes.
 * 5. A translating receiver changes the independently calculated first contact to .6875s.
 * 6. Paired normal response is bounded, sign-correct, finite and absent for a miss.
 * 7. Malformed controls, existing intersections and exhausted capture budgets refuse.
 * 8. Unreferenced vertices cannot create a false path hit; fixed receiver queries are reused.
 * 9. A preceding shin check intercepts before guards; unintended limb contact refuses.
 * 10. Independent actor labels and world transforms cannot alias same-topology query snapshots.
 * 11. Current disjoint boxes do not suppress fast vertex paths; initial refusals attribute the real pair.
 * 12. Refusal Error.cause retains detached witness data through source mutation and later actor/query reuse.
 * 13. Head/body surfaces yield direct hits and their shared authored gain; guard/shin surfaces retain blocking gain.
 *
 * @evidence contracts/testing.md#observable-behavior Calls the actual public-Engine-backed contact resolver on explicit world triangle boxes/sheets, then consumes its returned contact through ContactResponse. It asserts earliest pair, actual clear geometry, time attribution, deterministic replay, bounded opposite displacement and independently retained refusal causes after source/configuration mutation and a later moving-receiver refit. These portable fixtures do not establish Human IK, support, viewer appearance or force realism.
 * @evidence contracts/testing.md#independent-cases First contact follows x_front=t+.05=.6, and for a receiver translating .2t it follows t+.05=.6+.2t. The initial refusal uses .575s and the incidental-leg front reaches .6 at .35s; these planes independently pin cause identity/time/world point. Head/body and guard/shin classifications consume actual resolved events at unit approach speed: at the receiver envelope peak their uncapped excursions must equal the literal .03/.02-metre authored gains. A before/after copy checks retention only, not geometric correctness. Positive/miss/graze/hit, moving receiver, exact repeat, budget and malformed boundaries are covered; the real lab owns articulated visual/solver verification.
 */
export function test_contact_interaction(): void {
  const block: ContactTrace.Result = ContactTrace.resolve(options("block"));
  assert.equal(block.outcome, "block");
  assert.equal(block.receipt.pair?.receiver, "guard");
  assert.ok(block.event && block.stopTime !== null && block.constrainedSample);
  assert.ok(Math.abs(block.stopTime - .55) < 1e-5);
  assert.ok(block.stopTime + .05 <= .6 + 1e-12);
  assert.equal(block.event.time, block.constrainedSample.elapsed);
  assert.equal(block.event.actorId, "north");
  assert.equal(block.event.targetId, "south");
  assert.ok(block.event.normal[0] < -.999);
  assert.ok(block.receipt.bracket && block.receipt.bracket[0] <= .55 && block.receipt.bracket[1] >= .55 - 1e-12);
  const repeated: ContactTrace.Result = ContactTrace.resolve(options("block"));
  assert.deepEqual(repeated.event, block.event);
  assert.deepEqual(repeated.constrainedSample, block.constrainedSample);
  assert.deepEqual(repeated.receipt.bracket, block.receipt.bracket);
  assert.equal(block.receipt.reactionTime, block.stopTime);
  assert.ok(block.receipt.witnessTime !== null && block.receipt.witnessTime >= block.stopTime);
  assert.ok(block.receipt.work.crossingBuilds > 0 && block.receipt.work.crossingBuilds <= 2);
  assert.equal(block.receipt.work.crossingRefits, 0);
  assert.equal(block.receipt.work.rayBuilds, 2);
  assert.ok(block.receipt.work.separatedPairs > 0);
  assert.ok(block.receipt.profile.hostCaptureMs >= 0 && block.receipt.profile.queryPreparationMs >= 0 && block.receipt.profile.crossingMs >= 0 && block.receipt.profile.raysMs >= 0);
  assert.ok(block.receipt.profile.totalMs >= block.receipt.profile.hostCaptureMs);

  const base: ContactTrace.Options = options("block");
  const unused: ContactTrace.Result = ContactTrace.resolve({ ...base, capture: (time: number): ContactTrace.Frame => {
    const frame: ContactTrace.Frame = base.capture(time);
    frame.attacks[0]!.mesh.positions.push(time * 10, 0, 0);
    return frame;
  } });
  assert.ok(unused.stopTime !== null && Math.abs(unused.stopTime - .55) < 1e-5);
  const check: ContactTrace.Result = ContactTrace.resolve({ ...base, capture: (time: number): ContactTrace.Frame => {
    const frame: ContactTrace.Frame = base.capture(time);
    frame.receivers.push({ id: "shin", relation: "shin-check", mesh: plane(.4, 1) });
    return frame;
  } });
  assert.equal(check.event?.relation, "shin-check");
  assert.ok(check.stopTime !== null && Math.abs(check.stopTime - .35) < 1e-5);
  assert.equal(check.receipt.participants.receivers.length, 3);
  assert.throws((): ContactTrace.Result => ContactTrace.resolve({ ...base, capture: (time: number): ContactTrace.Frame => {
    const frame: ContactTrace.Frame = base.capture(time);
    frame.attacks.push({ id: "incidental-leg", role: "clearance", mesh: box([time + .2, 0, 0]) });
    return frame;
  } }), /Unintended clearance contact/);

  const finer: ContactTrace.Result = ContactTrace.resolve({ ...options("block"), stepSeconds: .08 });
  assert.equal(finer.event?.actionId, block.event.actionId);
  assert.ok(finer.stopTime !== null && Math.abs(finer.stopTime - block.stopTime) < 1e-5);
  const fast: ContactTrace.Result = ContactTrace.resolve({ ...options("block"), stepSeconds: 2 });
  assert.equal(fast.outcome, "block");
  assert.ok(fast.stopTime !== null && Math.abs(fast.stopTime - .55) < 7e-5);

  const hit: ContactTrace.Result = ContactTrace.resolve(options("hit"));
  assert.equal(hit.outcome, "hit");
  assert.equal(hit.event?.relation, "body");
  const headOptions: ContactTrace.Options = options("hit");
  const head: ContactTrace.Result = ContactTrace.resolve({ ...headOptions, capture: (time: number): ContactTrace.Frame => {
    const frame: ContactTrace.Frame = headOptions.capture(time);
    frame.receivers[0]!.relation = "head";
    return frame;
  } });
  assert.equal(head.outcome, "hit");
  assert.equal(head.event?.relation, "head");
  assert.ok(head.stopTime !== null && Math.abs(head.stopTime - .55) < 1e-5);
  const miss: ContactTrace.Result = ContactTrace.resolve(options("miss"));
  assert.equal(miss.outcome, "miss");
  assert.equal(miss.event, null);
  assert.equal(miss.constrainedSample, null);
  const graze: ContactTrace.Result = ContactTrace.resolve(options("graze"));
  assert.equal(graze.outcome, "graze");
  assert.ok(graze.approachMetresPerSecond > .99 && graze.approachMetresPerSecond < 1.01);
  const moving: ContactTrace.Result = ContactTrace.resolve(options("moving"));
  assert.ok(moving.stopTime !== null && Math.abs(moving.stopTime - .6875) < 1e-5);

  const config: ContactResponse.Config = { attackerSeconds: .2, receiverSeconds: .4, attackerGainSeconds: .01, bodyGainSeconds: .03, guardGainSeconds: .02, grazeFraction: .2, maximumMetres: .025 };
  const response: ContactResponse.Sample = ContactResponse.sample(block, .1, config);
  assert.ok(response.attacker[0] < 0 && response.receiver[0] > 0);
  assert.ok(Math.hypot(...response.attacker) <= config.maximumMetres && Math.hypot(...response.receiver) <= config.maximumMetres);
  assert.equal(response.active, true);
  assert.deepEqual(ContactResponse.sample(block, 0, config).attacker, [0, 0, 0]);
  assert.deepEqual(ContactResponse.sample(block, .4, config), { attacker: [0, 0, 0], receiver: [0, 0, 0], active: false });
  assert.deepEqual(ContactResponse.sample(miss, .1, config), { attacker: [0, 0, 0], receiver: [0, 0, 0], active: false });
  assert.deepEqual(ContactResponse.sample(block, .1, config), response);
  for (const [relation, trace, expected] of [["body", hit, .03], ["head", head, .03], ["guard", block, .02], ["shin-check", check, .02]] as const) {
    assert.equal(trace.event?.relation, relation);
    assert.equal(trace.outcome, relation === "body" || relation === "head" ? "hit" : "block");
    assert.ok(Math.abs(trace.approachMetresPerSecond - 1) < 1e-10);
    const peak: ContactResponse.Sample = ContactResponse.sample(trace, .2, { ...config, maximumMetres: 1 });
    assert.ok(Math.abs(peak.receiver[0] - expected) < 1e-10);
    assert.ok(Math.abs(peak.receiver[1]) < 1e-12 && Math.abs(peak.receiver[2]) < 1e-12);
  }
  assert.throws((): ContactTrace.Result => ContactTrace.resolve({ ...options("block"), stepSeconds: 0 }));
  assert.throws((): ContactTrace.Result => ContactTrace.resolve({ ...options("block"), maximumCaptures: 2 }));
  assert.throws((): ContactTrace.Result => ContactTrace.resolve({ ...options("block"), start: .575 }));
  assert.throws((): ContactResponse.Sample => ContactResponse.sample(block, .1, { ...config, maximumMetres: -1 }));

  const transformed: ContactTrace.Result = ContactTrace.resolve({ ...base, actorId: "west", targetId: "east", capture: (time: number): ContactTrace.Frame => {
    const frame: ContactTrace.Frame = base.capture(time);
    for (const surface of [...frame.attacks, ...frame.receivers]) transform(surface.mesh);
    return frame;
  } });
  assert.equal(transformed.event?.actorId, "west");
  assert.equal(transformed.event?.targetId, "east");
  assert.ok(transformed.stopTime !== null && Math.abs(transformed.stopTime - .55) < 1e-5);
  assert.ok(transformed.event && Math.abs(transformed.event.point[2] - 4.6) < 1e-5);
  assert.ok(transformed.event && transformed.event.normal[2] < -.999);
  const afterTransform: ContactTrace.Result = ContactTrace.resolve(base);
  assert.deepEqual(afterTransform.event, block.event);
  assert.throws((): ContactTrace.Result => ContactTrace.resolve({ ...base, start: .575 }), /actual-glove-box->guard.*local 0\.575s.*world point/);
  assert.throws((): ContactTrace.Result => ContactTrace.resolve({ ...base, capture: (time: number): ContactTrace.Frame => {
    const frame: ContactTrace.Frame = base.capture(time);
    frame.attacks[0]!.mesh.indices = [0, 1];
    return frame;
  } }), /complete triangle addressing/);

  const heldFrames: ContactTrace.Frame[] = [];
  const initialOptions: ContactTrace.Options = { ...base, start: .575, capture: (time: number): ContactTrace.Frame => {
    const frame: ContactTrace.Frame = base.capture(time);
    heldFrames.push(frame);
    return frame;
  } };
  const initialCause: ContactTrace.RefusalReceipt = refusal((): ContactTrace.Result => ContactTrace.resolve(initialOptions));
  assert.equal(Object.getPrototypeOf(initialCause), Object.prototype);
  assert.equal(initialCause.kind, "initial-crossing");
  assert.equal(initialCause.actionId, "strike-one");
  assert.equal(initialCause.actorId, "north");
  assert.equal(initialCause.targetId, "south");
  assert.equal(initialCause.pair.attack, "actual-glove-box");
  assert.equal(initialCause.pair.receiver, "guard");
  assert.ok(Number.isSafeInteger(initialCause.pair.triangle) && initialCause.pair.triangle >= 0);
  assert.equal(initialCause.role, "strike");
  assert.equal(initialCause.relation, "guard");
  assert.equal(initialCause.time, .575);
  assert.deepEqual(initialCause.bracket, [.575, .575]);
  assert.equal(initialCause.witnessTime, .575);
  assert.equal(initialCause.method, "sampled-crossing");
  assert.ok(Math.abs(initialCause.point[0] - .6) < 1e-12);

  const clearanceCause: ContactTrace.RefusalReceipt = refusal((): ContactTrace.Result => ContactTrace.resolve({ ...base, capture: (time: number): ContactTrace.Frame => {
    const frame: ContactTrace.Frame = base.capture(time);
    frame.attacks.push({ id: "incidental-leg", role: "clearance", mesh: box([time + .2, 0, 0]) });
    heldFrames.push(frame);
    return frame;
  } }));
  assert.equal(clearanceCause.kind, "clearance-contact");
  assert.equal(clearanceCause.pair.attack, "incidental-leg");
  assert.equal(clearanceCause.pair.receiver, "guard");
  assert.equal(clearanceCause.role, "clearance");
  assert.equal(clearanceCause.relation, "guard");
  assert.ok(Math.abs(clearanceCause.time - .35) < 1e-5);
  assert.ok(clearanceCause.bracket[0] <= .35 && clearanceCause.bracket[1] >= .35 - 1e-12);
  assert.ok(clearanceCause.witnessTime >= clearanceCause.bracket[0] && clearanceCause.witnessTime <= clearanceCause.bracket[1]);
  assert.ok(Math.abs(clearanceCause.point[0] - .6) < 1e-12);
  const preservedInitial: ContactTrace.RefusalReceipt = structuredClone(initialCause);
  const preservedClearance: ContactTrace.RefusalReceipt = structuredClone(clearanceCause);
  initialOptions.actionId = "reused-action";
  initialOptions.actorId = "reused-actor";
  initialOptions.targetId = "reused-target";
  for (const frame of heldFrames) for (const surface of [...frame.attacks, ...frame.receivers]) { surface.id = "reused-surface"; surface.mesh.positions.fill(123); surface.mesh.indices?.fill(0); }
  const reused: ContactTrace.Result = ContactTrace.resolve(options("moving"));
  assert.ok(reused.event && reused.receipt.work.crossingRefits > 0);
  assert.deepEqual(initialCause, preservedInitial);
  assert.deepEqual(clearanceCause, preservedClearance);
}

/**
 * Select actual witness-time state without changing the first intercepted pair.
 *
 * Scenarios:
 * 1. Omitted and explicit last-clear preserve the same conservative event and sample.
 * 2. First-witness captures the analytic .55s contact once more and retains that actual state.
 * 3. The original bracket, last-clear sample time, participants and geometric witness survive.
 * 4. Direct head/body witness stops remain hits; a preceding guard still blocks before a later body.
 * 5. Misses have no selected contact; invalid policies, exhausted capture budget and changed participants/topology refuse.
 *
 * @evidence contracts/testing.md#observable-behavior Uses the public Engine-backed resolver and actual in-memory triangle captures. It checks selected event/sample clocks, one additional capture within the existing budget, detached stopped state and preserved blocker identity. The analytic translated-box fixture does not prove articulated CCD, penetration depth, Human support or displayed film contact.
 * @evidence contracts/testing.md#independent-cases The .1m box reaches x=.6 when its centre is .55m at unit speed. Its source capture reports that same literal root position/time. Original last-clear and bracket are compared only for policy invariance, while .55 and the floor-free point coordinates supply the independent geometry oracle. A guard at .6 must precede a body at .8; finite query limitations remain explicit rather than becoming acceptance.
 */
export function test_contact_first_witness(): void {
  const base: ContactTrace.Options = options("block");
  const conservative: ContactTrace.Result = ContactTrace.resolve(base);
  const explicit: ContactTrace.Result = ContactTrace.resolve({ ...base, stopAt: "last-clear" });
  assert.deepEqual(explicit.event, conservative.event);
  assert.deepEqual(explicit.constrainedSample, conservative.constrainedSample);
  assert.equal(conservative.receipt.stopAt, "last-clear");
  assert.equal(conservative.receipt.lastClearTime, conservative.stopTime);
  const frames: ContactTrace.Frame[] = [];
  const witness: ContactTrace.Result = ContactTrace.resolve({ ...base, stopAt: "first-witness", capture: (time: number): ContactTrace.Frame => {
    const frame: ContactTrace.Frame = base.capture(time);
    frames.push(frame);
    return frame;
  } });
  assert.ok(witness.event && witness.constrainedSample && witness.stopTime !== null);
  assert.equal(witness.outcome, "block");
  assert.equal(witness.event.relation, "guard");
  assert.equal(witness.receipt.pair?.receiver, "guard");
  assert.equal(witness.event.time, witness.stopTime);
  assert.equal(witness.constrainedSample.elapsed, witness.stopTime);
  assert.equal(witness.receipt.reactionTime, witness.stopTime);
  assert.equal(witness.receipt.witnessTime, witness.stopTime);
  assert.equal(witness.receipt.stopAt, "first-witness");
  assert.ok(Math.abs(witness.stopTime - .55) < 1e-12);
  assert.ok(Math.abs(witness.constrainedSample.rootOffset[0] + .05 - .6) < 1e-12);
  assert.equal(frames.at(-1)!.sample.elapsed, witness.stopTime);
  assert.equal(witness.receipt.work.captures, conservative.receipt.work.captures + 1);
  assert.deepEqual(witness.receipt.bracket, conservative.receipt.bracket);
  assert.equal(witness.receipt.lastClearTime, conservative.stopTime);
  assert.deepEqual(witness.receipt.pair, conservative.receipt.pair);
  assert.deepEqual(witness.receipt.participants, conservative.receipt.participants);
  assert.equal(witness.receipt.method, conservative.receipt.method);
  frames.at(-1)!.sample.rootOffset[0] = 99;
  assert.ok(Math.abs(witness.constrainedSample.rootOffset[0] - .55) < 1e-12);
  const directOptions: ContactTrace.Options = options("hit");
  for (const relation of ["head", "body"] as const) {
    const direct: ContactTrace.Result = ContactTrace.resolve({ ...directOptions, stopAt: "first-witness", capture: (time: number): ContactTrace.Frame => {
      const frame: ContactTrace.Frame = directOptions.capture(time);
      frame.receivers[0]!.relation = relation;
      return frame;
    } });
    assert.equal(direct.outcome, "hit");
    assert.equal(direct.event?.relation, relation);
    assert.equal(direct.event?.time, direct.receipt.witnessTime);
    assert.equal(direct.constrainedSample?.elapsed, direct.receipt.witnessTime);
    assert.ok(direct.stopTime !== null && Math.abs(direct.stopTime - .55) < 1e-12);
  }
  const miss: ContactTrace.Result = ContactTrace.resolve({ ...options("miss"), stopAt: "first-witness" });
  assert.equal(miss.event, null);
  assert.equal(miss.stopTime, null);
  assert.equal(miss.receipt.lastClearTime, null);
  assert.equal(miss.receipt.witnessTime, null);
  assert.throws((): ContactTrace.Result => ContactTrace.resolve({ ...base, stopAt: "closest" as never }), /stop policy/u);
  assert.throws((): ContactTrace.Result => ContactTrace.resolve({ ...base, stopAt: "first-witness", maximumCaptures: conservative.receipt.work.captures }), /budget/u);
  let captures: number = 0;
  assert.throws((): ContactTrace.Result => ContactTrace.resolve({ ...base, stopAt: "first-witness", capture: (time: number): ContactTrace.Frame => {
    const frame: ContactTrace.Frame = base.capture(time);
    if (++captures === conservative.receipt.work.captures + 1) frame.receivers[0]!.relation = "body";
    return frame;
  } }), /original contact participants/u);
  captures = 0;
  assert.throws((): ContactTrace.Result => ContactTrace.resolve({ ...base, stopAt: "first-witness", capture: (time: number): ContactTrace.Frame => {
    const frame: ContactTrace.Frame = base.capture(time);
    if (++captures === conservative.receipt.work.captures + 1) frame.attacks[0]!.mesh.indices = [0, 1, 2];
    return frame;
  } }), /original contact topology/u);
}

/**
 * Distinguish actual separated, touching and overlapping states at one original witness.
 *
 * Scenarios:
 * 1. A coarse last-clear box remains 62.5mm from the original witnessed receiving surface.
 * 2. Its first-witness capture touches both actual surfaces without a strict crossing.
 * 3. Independent 0.1mm and 1mm overlaps produce strict crossings and their analytic signed depths.
 *
 * @evidence contracts/testing.md#observable-behavior Calls ContactTrace and public Engine crossing/signed-surface queries on the same original world geometry. It catches treating strict-crossing absence as universal separation or treating the earlier last-clear sample as displayed contact. These measurements do not implement Film acceptance, full penetration-depth proof, Human support or articulated CCD.
 * @evidence contracts/testing.md#independent-cases Exact binary coordinates place a box centre at .5 with a .0625m half-extent, leaving .0625m before x=.625; centre .5625 touches it. Moving that centre by literal .0001/.001m supplies independent depth and receiving-face-centre separation expectations. The original vertex witness can remain on a side face despite penetration, so its distance alone is insufficient. Open-sheet side is queried inside its finite face, and the box remains outward-oriented. Film owns its unchanged precision and exact original-pair/time acceptance.
 */
export function test_contact_witness_geometry(): void {
  const input: ContactTrace.Options = options("hit");
  const base: ContactTrace.Options = { ...input, stepSeconds: .25, refinementSteps: 0, capture: (time: number): ContactTrace.Frame => {
    const frame: ContactTrace.Frame = input.capture(time);
    frame.attacks[0]!.mesh = binaryBox([time, 0, 0]);
    frame.receivers[0]!.mesh = plane(.625, 20);
    return frame;
  } };
  const clear: ContactTrace.Result = ContactTrace.resolve(base);
  const touch: ContactTrace.Result = ContactTrace.resolve({ ...base, stopAt: "first-witness" });
  assert.ok(clear.constrainedSample && touch.constrainedSample && touch.event);
  const witness: MotionAction.Vec3 = [...touch.event.point];
  const receiver: IAutoMovieMesh = plane(.625, 20);
  const clearMesh: IAutoMovieMesh = binaryBox(clear.constrainedSample.rootOffset);
  const touchMesh: IAutoMovieMesh = binaryBox(touch.constrainedSample.rootOffset);
  const receiverQuery: ReturnType<typeof createAutoMovieSignedMeshQuery> = createAutoMovieSignedMeshQuery(receiver, { boundary: "open" });
  const clearQuery: ReturnType<typeof createAutoMovieSignedMeshQuery> = createAutoMovieSignedMeshQuery(clearMesh);
  const touchQuery: ReturnType<typeof createAutoMovieSignedMeshQuery> = createAutoMovieSignedMeshQuery(touchMesh);
  assert.ok(Math.abs(clearQuery(witness).distance - .0625) < 1e-12);
  assert.ok(receiverQuery(witness).distance < 1e-12);
  assert.ok(touchQuery(witness).distance < 1e-12);
  assert.equal(createAutoMovieMeshCrossingQuery(receiver).crosses(clearMesh), false);
  assert.equal(createAutoMovieMeshCrossingQuery(receiver).crosses(touchMesh), false);
  assert.equal(clear.receipt.stopAt, "last-clear");
  assert.equal(touch.receipt.stopAt, "first-witness");
  assert.deepEqual(touch.receipt.pair, clear.receipt.pair);
  assert.equal(touch.event.time, touch.receipt.witnessTime);
  for (const overlap of [.0001, .001]) {
    const mesh: IAutoMovieMesh = binaryBox([.5625 + overlap, 0, 0]);
    const query: ReturnType<typeof createAutoMovieSignedMeshQuery> = createAutoMovieSignedMeshQuery(mesh);
    assert.equal(createAutoMovieMeshCrossingQuery(receiver).crosses(mesh), true);
    assert.ok(Math.abs(query([.625, 0, 0]).distance - overlap) < 1e-12);
    assert.ok(Math.abs(receiverQuery([.625 + overlap, 0, 0]).signedDistance + overlap) < 1e-12);
  }
  assert.deepEqual(witness, touch.event.point);
}

/**
 * Preserve co-first clearance authority independently of participant enumeration.
 *
 * Scenarios:
 * 1. Equal-time translated vertex hits refuse when a strike and clearance limb arrive together.
 * 2. Equal sampled-crossing endpoints retain the same clearance refusal without translated rays.
 * 3. Both attack orders, both receiver orders and both stopping policies preserve original cause identity.
 * 4. A clearance exactly1/1024second later cannot replace an earlier strike; one equally earlier must refuse.
 * 5. Native tangential coplanar clearance earlier than a box strike, or at its sampled endpoint, refuses under every order and policy.
 * 6. Coplanar clearance beginning after the actual .5625second strike preserves that original hit and witness.
 * 7. A coplanar pair clear at the strike endpoint but with overlapping swept bounds remains refused.
 *
 * @evidence contracts/testing.md#observable-behavior Calls the actual Engine-backed resolver on independently located moving boxes and original receiving sheets, including a tangential coplanar pair whose native boolean bypasses the transverse-point callback. It catches attributed ties and unlocalized overlap masked by another pair's strike, checks original pair/time in refusal text, and permits genuinely later coplanar clearance. No query, actor or global method is replaced; sampled crossings and witness-time reinspection remain finite observations.
 * @evidence contracts/testing.md#independent-cases Exact binary half-extents .0625 and receiving x=.625 make translated strikes occur at .5625seconds. A changing head-sheet extent disables translation, so its first observed crossing is the literal .625second endpoint. Separate z-lanes preserve original identities under array permutations. Coplanar sheets begin overlap at .53125 or .59375seconds from their literal left edge minus .0625; these straddle the strike independently of the implementation. A sheet travelling in y from -.25 at .5 to .25 at .5625 crosses the receiver's y range before ending clear, so that endpoint cannot justify ordering. Signed1/1024metre box shifts distinguish true ordering from an epsilon tie. Existing refinement and capture controls are unchanged; the real Viewer owns articulated appearance.
 */
export function test_contact_cofirst_clearance(): void {
  for (const stopAt of ["last-clear", "first-witness"] as const) for (const reverseAttacks of [false, true]) for (const reverseReceivers of [false, true]) {
    for (const mode of ["translated", "sampled"] as const) {
      const cause: ContactTrace.RefusalReceipt = refusal((): ContactTrace.Result => ContactTrace.resolve({ ...cofirstOptions(reverseAttacks, reverseReceivers, mode, 0), stopAt }));
      assert.equal(cause.kind, "clearance-contact");
      assert.equal(cause.pair.attack, "incidental-leg");
      assert.equal(cause.pair.receiver, "guard");
      assert.equal(cause.role, "clearance");
      assert.equal(cause.relation, "guard");
      assert.equal(cause.method, mode === "translated" ? "translated-vertex-path" : "sampled-crossing");
      assert.equal(cause.time, .5);
      assert.deepEqual(cause.bracket, [.5, .625]);
      assert.ok(Math.abs(cause.witnessTime - (mode === "translated" ? .5625 : .625)) < 1e-12);
      assert.ok(Math.abs(cause.point[0] - .625) < 1e-12);
    }
    const earlier: ContactTrace.RefusalReceipt = refusal((): ContactTrace.Result => ContactTrace.resolve({ ...cofirstOptions(reverseAttacks, reverseReceivers, "translated", 1 / 1024), stopAt }));
    assert.equal(earlier.pair.attack, "incidental-leg");
    assert.ok(Math.abs(earlier.witnessTime - (.5625 - 1 / 1024)) < 1e-12);
    const later: ContactTrace.Result = ContactTrace.resolve({ ...cofirstOptions(reverseAttacks, reverseReceivers, "translated", -1 / 1024), stopAt });
    assert.equal(later.outcome, "hit");
    assert.equal(later.receipt.pair?.attack, "permitted-glove");
    assert.equal(later.receipt.pair?.receiver, "head");
    assert.equal(later.event?.relation, "head");
    assert.ok(later.receipt.witnessTime !== null && Math.abs(later.receipt.witnessTime - .5625) < 1e-12);
    for (const mode of ["translated", "sampled"] as const) {
      const ambiguous: ContactTrace.Options = coplanarOptions(reverseAttacks, reverseReceivers, mode, .59375);
      const frame: ContactTrace.Frame = ambiguous.capture(.625);
      let transverse: number = 0;
      assert.equal(createAutoMovieMeshCrossingQuery(frame.receivers.find((entry: ContactTrace.Receiver): boolean => entry.id === "guard")!.mesh).crosses(frame.attacks.find((entry: ContactTrace.Attack): boolean => entry.id === "incidental-leg")!.mesh, { acceptTransversePoint: (): boolean => { transverse++; return true; } }), true);
      assert.equal(transverse, 0);
      assert.throws((): ContactTrace.Result => ContactTrace.resolve({ ...ambiguous, stopAt }), (error: unknown): boolean => error instanceof Error && /Coplanar overlap/u.test(error.message) && /incidental-leg->guard \(clearance\)/u.test(error.message) && error.message.includes(`at local ${mode === "translated" ? .5625 : .625}s`));
    }
    const laterCoplanar: ContactTrace.Result = ContactTrace.resolve({ ...coplanarOptions(reverseAttacks, reverseReceivers, "translated", .65625), stopAt });
    assert.equal(laterCoplanar.outcome, "hit");
    assert.equal(laterCoplanar.receipt.pair?.attack, "permitted-glove");
    assert.equal(laterCoplanar.receipt.pair?.receiver, "head");
    assert.equal(laterCoplanar.receipt.witnessTime, .5625);
    assert.equal(laterCoplanar.event?.point[0], .625);
    assert.deepEqual(laterCoplanar.receipt.bracket, [.5, .625]);
    assert.equal(laterCoplanar.stopTime, stopAt === "first-witness" ? .5625 : .5);
    assert.ok(laterCoplanar.receipt.unlocalizedCrossings > 0);
    assert.throws((): ContactTrace.Result => ContactTrace.resolve({ ...coplanarOptions(reverseAttacks, reverseReceivers, "translated", .65625), stopAt, maximumCaptures: 6 }), /capture budget/u);
    const transientBase: ContactTrace.Options = coplanarOptions(reverseAttacks, reverseReceivers, "translated", .59375);
    const transient: ContactTrace.Options = { ...transientBase, stopAt, capture: (time: number): ContactTrace.Frame => {
      const frame: ContactTrace.Frame = transientBase.capture(time);
      const attack: ContactTrace.Attack = frame.attacks.find((entry: ContactTrace.Attack): boolean => entry.id === "incidental-leg")!;
      const offset: number = time <= .5 ? -.25 : time <= .5625 ? -.25 + 8 * (time - .5) : time <= .625 ? .25 - 4 * (time - .5625) : 0;
      for (let index: number = 1; index < attack.mesh.positions.length; index += 3) attack.mesh.positions[index]! += offset;
      return frame;
    } };
    const clearEndpoint: ContactTrace.Frame = transient.capture(.5625);
    assert.equal(createAutoMovieMeshCrossingQuery(clearEndpoint.receivers.find((entry: ContactTrace.Receiver): boolean => entry.id === "guard")!.mesh).crosses(clearEndpoint.attacks.find((entry: ContactTrace.Attack): boolean => entry.id === "incidental-leg")!.mesh), false);
    assert.throws((): ContactTrace.Result => ContactTrace.resolve(transient), /incidental-leg->guard \(clearance\) at local 0\.625s/u);
  }
}

/** Separate actual tangential sheets start overlap at their left edge minus the moving .0625m half-width. */
function coplanarOptions(reverseAttacks: boolean, reverseReceivers: boolean, mode: "translated" | "sampled", left: number): ContactTrace.Options {
  const input: ContactTrace.Options = cofirstOptions(reverseAttacks, reverseReceivers, mode, 0);
  return { ...input, capture: (time: number): ContactTrace.Frame => {
    const frame: ContactTrace.Frame = input.capture(time);
    const attack: ContactTrace.Attack = frame.attacks.find((entry: ContactTrace.Attack): boolean => entry.id === "incidental-leg")!;
    const receiver: ContactTrace.Receiver = frame.receivers.find((entry: ContactTrace.Receiver): boolean => entry.id === "guard")!;
    attack.mesh = { positions: [time - .0625, -.0625, .25, time + .0625, -.0625, .25, time + .0625, .0625, .25, time - .0625, .0625, .25], indices: [0, 1, 2, 0, 2, 3], normals: null, uvs: null, skin: null };
    receiver.mesh = { positions: [left, -.125, .25, left + .25, -.125, .25, left + .25, .125, .25, left, .125, .25], indices: [0, 1, 2, 0, 2, 3], normals: null, uvs: null, skin: null };
    return frame;
  } };
}

/** Two separate binary-coordinate lanes distinguish policy ties from participant or geometry aliases. */
function cofirstOptions(reverseAttacks: boolean, reverseReceivers: boolean, mode: "translated" | "sampled", clearanceOffset: number): ContactTrace.Options {
  const input: ContactTrace.Options = options("hit");
  return { ...input, stepSeconds: .25, refinementSteps: 0, capture: (time: number): ContactTrace.Frame => {
    const frame: ContactTrace.Frame = input.capture(time);
    const attacks: ContactTrace.Attack[] = [{ id: "permitted-glove", role: "strike", mesh: binaryBox([time, 0, -.25]) }, { id: "incidental-leg", role: "clearance", mesh: binaryBox([time + clearanceOffset, 0, .25]) }];
    const extent: number = mode === "sampled" ? .125 + time / 64 : .125;
    const receivers: ContactTrace.Receiver[] = [{ id: "head", relation: "head", mesh: plane(.625, extent) }, { id: "guard", relation: "guard", mesh: plane(.625, extent) }];
    for (const [ordinal, receiver] of receivers.entries()) for (let index: number = 2; index < receiver.mesh.positions.length; index += 3) receiver.mesh.positions[index]! += ordinal === 0 ? -.25 : .25;
    return { sample: frame.sample, attacks: reverseAttacks ? attacks.reverse() : attacks, receivers: reverseReceivers ? receivers.reverse() : receivers };
  } };
}

/** Exact binary box coordinates keep the strict-touch oracle independent of decimal rounding. */
function binaryBox(centre: MotionAction.Vec3): IAutoMovieMesh {
  const mesh: IAutoMovieMesh = box([0, 0, 0]);
  for (let index: number = 0; index < mesh.positions.length; index++) mesh.positions[index] = centre[index % 3]! + (mesh.positions[index]! < 0 ? -.0625 : .0625);
  return mesh;
}

/** Read the standard Error cause without replacing or duplicating collision behavior. */
function refusal(run: () => ContactTrace.Result): ContactTrace.RefusalReceipt {
  try { run(); } catch (error: unknown) {
    assert.ok(error instanceof Error);
    assert.ok(error.cause && typeof error.cause === "object");
    return error.cause as ContactTrace.RefusalReceipt;
  }
  throw new Error("Expected a witness-bearing contact refusal.");
}

/** Analytic geometry fixtures, with no guessed Human body dimensions. */
function options(kind: "block" | "hit" | "miss" | "graze" | "moving"): ContactTrace.Options {
  return {
    actionId: "strike-one", actorId: "north", targetId: "south", start: 0, end: 1,
    stepSeconds: .2, refinementSteps: 14, maximumCaptures: 256, grazeCosine: .2,
    capture: (time: number): ContactTrace.Frame => {
      const position: MotionAction.Vec3 = [time, kind === "graze" ? time * 10 : 0, kind === "miss" ? 3 : 0];
      const sample: MotionAction.Sample = { pose: {}, rootOffset: position, support: { left: 1, right: 0 }, effectors: [], phase: "delivery", elapsed: time, progress: time };
      const receivers: ContactTrace.Receiver[] = kind === "hit" ? [{ id: "body", relation: "body", mesh: plane(.6, 20) }] : [
        { id: "guard", relation: "guard", mesh: plane(.6 + (kind === "moving" ? time * .2 : 0), kind === "graze" ? 20 : 1) },
        { id: "body", relation: "body", mesh: plane(.8, 20) },
      ];
      if (kind === "miss") receivers.splice(1, 1);
      return { sample, attacks: [{ id: "actual-glove-box", mesh: box(position) }], receivers };
    },
  };
}

/** A square receiving sheet whose x position supplies the independent contact oracle. */
function plane(x: number, extent: number): IAutoMovieMesh {
  return { positions: [x, -extent, -extent, x, extent, -extent, x, extent, extent, x, -extent, extent], indices: [0, 2, 1, 0, 3, 2], normals: null, uvs: null, skin: null };
}

/** A complete .1m cuboid; its actual leading face is centre x plus .05. */
function box(centre: MotionAction.Vec3): IAutoMovieMesh {
  const positions: number[] = [];
  for (const x of [-.05, .05]) for (const y of [-.05, .05]) for (const z of [-.05, .05]) positions.push(centre[0] + x, centre[1] + y, centre[2] + z);
  return { positions, indices: [0, 1, 3, 0, 3, 2, 4, 6, 7, 4, 7, 5, 0, 4, 5, 0, 5, 1, 2, 3, 7, 2, 7, 6, 0, 2, 6, 0, 6, 4, 1, 5, 7, 1, 7, 3], normals: null, uvs: null, skin: null };
}

/** Apply the rigid world transform x to z and z to minus x, then translate the origin. */
function transform(mesh: IAutoMovieMesh): void {
  for (let index: number = 0; index < mesh.positions.length; index += 3) {
    const x: number = mesh.positions[index]!;
    const z: number = mesh.positions[index + 2]!;
    mesh.positions[index] = 3 - z;
    mesh.positions[index + 1]! += 2;
    mesh.positions[index + 2] = 4 + x;
  }
}
