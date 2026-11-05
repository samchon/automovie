import * as THREE from "three";

import type { createDuelActor } from "./createDuelActor";
import type { createDuelFootFitter } from "./createDuelFootFitter";
import type { DuelActorFrame } from "./DuelActorFrame";
import type { DuelContactPoint } from "./DuelContactPoint";
import type { evaluateDuelEnding } from "./evaluateDuelEnding";
import { resolveDuelUpperGoals } from "./resolveDuelUpperGoals";

/**
 * Couple the held turn's actual palm placement with its reserved foot support.
 * @evidence contracts/common.md#implementation-and-ownership The original bounded arm result is a placement proposal, not an admitted touch. Actual target-minus-achieved palm derives a root seed. Public Grounding retains the original foot targets, floor population, clinical intervals and16-update budget, adding that same real palm as a hard world anchor. Fixed upper controls make it constrain rootXYZ rather than leaving free body drift. Original proposal/contact/support records remain separate. No route constant, proxy, local solver or pose smoothing is used.
 * @evidence contracts/common.md#authoring-interface Call only for an unresolved full forearm hold in the ending, after both current actors are posed. The contact owner must then refitHeld with actual palm/wrist/tip in one public call from this new body pose. Body-relative right-wand goals are rebased once; the original right result remains historical under heldBody, not final admission. Returns a proposed composite. Failed public body results remain raw and the scene measures the final feet, floor, ROM and both hands.
 */
export function anchorDuelHeldTurn(actor: ReturnType<typeof createDuelActor>, feet: ReturnType<typeof createDuelFootFitter>, frame: DuelActorFrame, plan: ReturnType<typeof evaluateDuelEnding>): DuelActorFrame {
  if (plan.forearmGrip < 0.999 || plan.bodyWrist !== 1 || plan.bodyAim !== 1) throw new Error("Held-body placement requires the full ending hold and body-relative wand");
  const contact: NonNullable<DuelActorFrame["contacts"]>[number] | undefined = frame.contacts?.find((item: NonNullable<DuelActorFrame["contacts"]>[number]): boolean => item.stage === "final" && item.kind === "protective forearm");
  const descriptor: NonNullable<typeof contact>["fit"]["input"]["request"]["targets"][number] | undefined = contact?.fit.input.request.targets[0];
  if (contact === undefined || descriptor?.bone !== "leftHand" || descriptor.localPoint === undefined) throw new Error("Actual palm contact descriptor is missing");
  const point: DuelContactPoint = { bone: "leftHand", localPoint: [...descriptor.localPoint] };
  const body: ReturnType<typeof feet.anchor> = feet.anchor(frame.pose, frame.supportSolve, point, new THREE.Vector3(...contact.target));
  actor.object.position.set(...body.root.translation);
  actor.object.quaternion.set(...body.root.rotation);
  actor.drawing.setPose(body.output);
  const goals: ReturnType<typeof resolveDuelUpperGoals> = resolveDuelUpperGoals(plan, actor.object.position, { bodyWrist: plan.bodyWrist, bodyAim: plan.bodyAim, raised: 0, outward: 0 });
  const bodyGripError: number = actor.drawing.bones.get(point.bone)!.localToWorld(new THREE.Vector3(...point.localPoint)).distanceTo(new THREE.Vector3(...contact.target));
  const { output: _output, anchor, ...support } = body;
  return {
    ...frame, root: [...body.root.translation], pose: body.pose, output: { posed: body.output.posed, clamped: body.output.clamped },
    supportSolve: support, supportStatus: body.status, supportError: body.error, floorMinimum: body.floorMinimum,
    requestedWrist: goals.wrist.toArray(), requestedAim: goals.aim.toArray(), gripError: bodyGripError,
    contacts: frame.contacts?.map((item: NonNullable<DuelActorFrame["contacts"]>[number]): NonNullable<DuelActorFrame["contacts"]>[number] => ({ ...item, stage: "placement-proposal" })),
    heldBody: { originalRoot: [...frame.root], originalSupport: frame.supportSolve, originalWand: frame.wandSolve, originalGripError: frame.gripError, bodyGripError, anchor },
  };
}
