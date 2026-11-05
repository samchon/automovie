import type { IAutoMovieHumanPose } from "@automovie/human";
import * as THREE from "three";

import type { createDuelActor } from "./createDuelActor";
import type { DuelActorFrame } from "./DuelActorFrame";
import type { DuelContactPoint } from "./DuelContactPoint";
import type { DuelRescueEntry } from "./DuelRescueEntry";
import { evaluateDuelRescue } from "./evaluateDuelRescue";
import { fitDuelLeftContact } from "./fitDuelLeftContact";
import { selectDuelContactPoint } from "./selectDuelContactPoint";
import { selectDuelPalmPoint } from "./selectDuelPalmPoint";

/**
 * Own actual reach, redirection, protective forearm grip and shoulder-contact progression.
 * @evidence contracts/common.md#implementation-and-ownership Actual left-palm vertices, middle LowerArm mesh triangles, upper-arm shoulder vertex and plain chest triangles supply contact. Reference-pose offsets define the meeting formation. Measured first touch starts redirection, followed by a continuous wrist-to-middle-forearm handoff. The shoulder presses and slides on the current chest at its actual supported height rather than pursuing a standing-pose frozen height. Each record retains its real peer carrier. Only admitted own-left results supply numerical seeds; failed fits remain measured and cannot become contact events.
 * @evidence contracts/common.md#authoring-interface Construct once from actual25second entries and the same current placed actors. Then call fit in canonical forward order after both base bodies/wands are fitted. It updates those actual drawings and returns full actor samples, including original contact requests/results. Seeking must consume those cached frames, not call this state owner. The caller separately checks full feet, both-body clearance and the cap/shield. Dispose actors with their scene.
 */
export function createDuelRescueContacts(actors: Record<"Carina" | "Harry", ReturnType<typeof createDuelActor>>, entries: Readonly<Record<"Carina" | "Harry", DuelRescueEntry>>, references: Readonly<Record<"Carina" | "Harry", { left: THREE.Vector3; right: THREE.Vector3 }>>): {
  meeting: Record<"Carina" | "Harry", THREE.Vector3>;
  fit: (seconds: number, frames: { carina: DuelActorFrame; harry: DuelActorFrame }, ending?: { forearmGrip: number }, recoveryEnabled?: boolean) => { carina: DuelActorFrame; harry: DuelActorFrame };
  events: () => { redirectTouch: number | null; forearmTouch: number | null; shoulderTouch: number | null; escapeReady: boolean };
} {
  /** Read a fixed actual material point through its current carrier. */
  function at(actor: ReturnType<typeof createDuelActor>, point: DuelContactPoint): THREE.Vector3 {
    actor.object.updateWorldMatrix(true, true);
    const bone: THREE.Group | undefined = actor.drawing.bones.get(point.bone);
    if (bone === undefined) throw new Error(`Contact carrier missing:${point.bone}`);
    return bone.localToWorld(new THREE.Vector3(...point.localPoint));
  }

  const palms: Record<"Carina" | "Harry", DuelContactPoint> = {
    Carina: { bone: "leftHand", localPoint: selectDuelPalmPoint(actors.Carina.drawing.parts.get("leftHand")!) },
    Harry: { bone: "leftHand", localPoint: selectDuelPalmPoint(actors.Harry.drawing.parts.get("leftHand")!) },
  };
  for (const role of ["Carina", "Harry"] as const) {
    actors[role].object.position.set(0, entries[role].position.y, 0);
    actors[role].object.rotation.set(0, role === "Carina" ? Math.PI / 4 : Math.PI, 0);
    actors[role].pose(entries[role].pose);
  }
  const shoulder: DuelContactPoint = selectDuelContactPoint(actors.Carina, "leftUpperArm", { kind: "upper" });
  const shoulderWorld: THREE.Vector3 = at(actors.Carina, shoulder);
  const chest: DuelContactPoint = selectDuelContactPoint(actors.Harry, "chest", { kind: "front", height: shoulderWorld.y, lateral: 0.06 });
  const chestWorld: THREE.Vector3 = at(actors.Harry, chest);
  const offset: THREE.Vector3 = chestWorld.clone().sub(shoulderWorld);
  offset.y = 0;
  const harryMeeting: THREE.Vector3 = entries.Harry.position.clone();
  harryMeeting.y = 0;
  const meeting: Record<"Carina" | "Harry", THREE.Vector3> = { Carina: harryMeeting.clone().add(offset), Harry: harryMeeting };
  for (const role of ["Carina", "Harry"] as const) {
    actors[role].object.position.copy(entries[role].position);
    actors[role].object.rotation.set(0, entries[role].yaw, 0);
    actors[role].pose(entries[role].pose);
  }
  const previousLeft: Partial<Record<"Carina" | "Harry", IAutoMovieHumanPose>> = {};
  let heldForearm: DuelContactPoint | undefined;
  let redirectedForearm: DuelContactPoint | undefined;
  let redirectTouch: number | null = null;
  let forearmTouch: number | null = null;
  let shoulderTouch: number | null = null;
  let escapeReady: boolean = false;

  /** Fit and record one true carrier; only a good own-left result continues. */
  function contact(role: "Carina" | "Harry", frame: DuelActorFrame, kind: string, point: DuelContactPoint, surface: THREE.Vector3, weight: number, stage: "initial-touch" | "final" = "final", targetOverride?: THREE.Vector3, peer?: { role: "Carina" | "Harry"; point: DuelContactPoint }): DuelActorFrame {
    const actor: ReturnType<typeof createDuelActor> = actors[role];
    const free: THREE.Vector3 = at(actor, point);
    const target: THREE.Vector3 = targetOverride ?? free.clone().lerp(surface, weight);
    const seed: IAutoMovieHumanPose = structuredClone(frame.pose);
    if (previousLeft[role]?.arms?.left !== undefined) {
      seed.arms ??= { left: {}, right: {} };
      seed.arms.left = { ...previousLeft[role]!.arms!.left, hand: frame.pose.arms?.left.hand };
    }
    const fitted: ReturnType<typeof fitDuelLeftContact> = fitDuelLeftContact(actor, seed, point, target);
    actor.pose(fitted.result.pose);
    const actual: THREE.Vector3 = at(actor, point);
    const error: number = actual.distanceTo(target);
    const { output: _output, ...raw } = fitted.result;
    if (error <= 0.003 && fitted.result.output.clamped.length === 0) previousLeft[role] = fitted.result.pose;
    return { ...frame, pose: fitted.result.pose, output: { posed: fitted.result.output.posed, clamped: fitted.result.output.clamped }, gripError: Math.max(frame.gripError, error), contacts: [...(frame.contacts ?? []), { kind, stage, weight, error, separation: actual.distanceTo(surface), actual: [actual.x, actual.y, actual.z], target: [target.x, target.y, target.z], ...(peer === undefined ? {} : { peer: { ...peer, world: [surface.x, surface.y, surface.z] as [number, number, number] } }), fit: { input: fitted.input, result: raw } }] };
  }

  return {
    meeting,
    fit: (seconds: number, original: { carina: DuelActorFrame; harry: DuelActorFrame }, ending?: { forearmGrip: number }, recoveryEnabled: boolean = true): { carina: DuelActorFrame; harry: DuelActorFrame } => {
      let carina: DuelActorFrame = original.carina;
      let harry: DuelActorFrame = original.harry;
      const c: ReturnType<typeof evaluateDuelRescue> = evaluateDuelRescue(seconds, "Carina", entries, references.Carina, meeting, true, true, recoveryEnabled);
      const h: ReturnType<typeof evaluateDuelRescue> = evaluateDuelRescue(seconds, "Harry", entries, references.Harry, meeting, true, true, recoveryEnabled);
      if (ending !== undefined) {
        c.redirect = 0;
        c.shoulder = 0;
        h.reach = 0;
        h.forearmGrip = ending.forearmGrip;
      }
      const cWrist: THREE.Vector3 = actors.Carina.wristContact("right", actors.Harry.point("leftUpperArm"));
      if (h.forearmGrip > 0 && heldForearm === undefined) heldForearm = selectDuelContactPoint(actors.Carina, "rightLowerArm", { kind: "forearm", toward: actors.Harry.point("leftUpperArm") });
      const held: THREE.Vector3 = heldForearm === undefined ? cWrist : at(actors.Carina, heldForearm);
      if (h.reach > 0 && redirectTouch === null) {
        harry = contact("Harry", harry, "reaching wrist", palms.Harry, cWrist, h.reach, c.redirect > 0 ? "initial-touch" : "final");
      }
      if (c.redirect > 0 && redirectTouch === null) {
        const candidate: DuelContactPoint = selectDuelContactPoint(actors.Harry, "leftLowerArm", { kind: "forearm", toward: actors.Carina.point("leftUpperArm") });
        carina = contact("Carina", carina, "forearm redirect touch", palms.Carina, at(actors.Harry, candidate), c.redirect, "initial-touch", undefined, { role: "Harry", point: candidate });
        const touch: NonNullable<DuelActorFrame["contacts"]>[number] = carina.contacts!.at(-1)!;
        if (touch.error <= 0.003 && touch.separation <= 0.003) {
          redirectTouch = seconds;
          redirectedForearm = candidate;
        }
      }
      if (redirectTouch !== null && ending === undefined && (c.redirect > 0 || h.forearmGrip > 0)) {
        const progress: number = THREE.MathUtils.clamp((seconds - redirectTouch) / 0.30, 0, 1);
        const push: number = progress * progress * (3 - 2 * progress) * c.redirect * (1 - h.forearmGrip);
        const target: THREE.Vector3 = cWrist.clone().lerp(held, h.forearmGrip).add(new THREE.Vector3(0.12, 0, -0.08).multiplyScalar(push));
        harry = contact("Harry", harry, h.forearmGrip >= 0.999 ? "protective forearm" : "redirected forearm handoff", palms.Harry, held, h.forearmGrip, "final", target, heldForearm === undefined ? undefined : { role: "Carina", point: heldForearm });
        if (c.redirect > 0) carina = contact("Carina", carina, "continuing redirect", palms.Carina, at(actors.Harry, redirectedForearm!), c.redirect * (1 - h.forearmGrip), "final", undefined, { role: "Harry", point: redirectedForearm! });
      } else if (h.forearmGrip > 0) {
        harry = contact("Harry", harry, "protective forearm", palms.Harry, held, h.forearmGrip, "final", undefined, { role: "Carina", point: heldForearm! });
      }
      if (h.forearmGrip > 0) {
        const touch: NonNullable<DuelActorFrame["contacts"]>[number] = harry.contacts!.at(-1)!;
        if (h.forearmGrip >= 0.999 && touch.error <= 0.003 && touch.separation <= 0.003) forearmTouch ??= seconds;
      }
      if (c.shoulder > 0) {
        const slidingChest: DuelContactPoint = selectDuelContactPoint(actors.Harry, "chest", { kind: "front", height: at(actors.Carina, shoulder).y, lateral: 0.06 });
        carina = contact("Carina", carina, "protective shoulder", shoulder, at(actors.Harry, slidingChest), c.shoulder, "final", undefined, { role: "Harry", point: slidingChest });
        const touch: NonNullable<DuelActorFrame["contacts"]>[number] = carina.contacts!.at(-1)!;
        if (c.shoulder >= 0.999 && touch.error <= 0.003 && touch.separation <= 0.003) shoulderTouch ??= seconds;
      }
      escapeReady ||= redirectTouch !== null && forearmTouch !== null && shoulderTouch !== null;
      return { carina, harry };
    },
    events: (): { redirectTouch: number | null; forearmTouch: number | null; shoulderTouch: number | null; escapeReady: boolean } => ({ redirectTouch, forearmTouch, shoulderTouch, escapeReady }),
  };
}
