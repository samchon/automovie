import { AutoMovieHumanRigControls, type IAutoMovieHumanPose } from "@automovie/human";
import * as THREE from "three";

import type { createDuelActor } from "./createDuelActor";
import type { DuelActorFrame } from "./DuelActorFrame";
import type { DuelContactFrame } from "./DuelContactFrame";
import type { DuelContactPoint } from "./DuelContactPoint";
import type { DuelRescueEntry } from "./DuelRescueEntry";
import type { evaluateDuelRescue } from "./evaluateDuelRescue";
import { duelRescueActions } from "./duelRescueActions";
import { fitDuelLeftContact } from "./fitDuelLeftContact";
import { fitDuelHeldWand } from "./fitDuelHeldWand";
import { selectDuelContactPoint } from "./selectDuelContactPoint";
import { selectDuelPalmPoint } from "./selectDuelPalmPoint";
import { selectDuelShoulderPair } from "./selectDuelShoulderPair";

/**
 * Own actual reach, redirection, protective forearm grip and shoulder-contact progression.
 * @evidence contracts/common.md#implementation-and-ownership Actual palms, middle forearm triangles and proximal-shoulder/front-knit pairs supply contact. Shared measured events drive handoff and escape. Current-frame surface checks certify continuing full press/hold, separately from historical readiness. Only admitted own-left IK results continue as contact seeds. Parting shoulders and opening Harry's ending grip have separate fixed actual entries and authored free-arm recovery; they are not shrinking positional touch constraints or successful fake IK records. Final public FK/ROM/support remains with the scene.
 * @evidence contracts/common.md#authoring-interface Construct from actual25second entries and placed actors. Fit in canonical forward order after both bodies/wands with the same authored intents. For the ending's body-placed proposal, refitHeld consumes the complete supported frame and jointly fits actual left-palm/right-wrist/wand-tip in one public call, retaining original proposals and measuring final contact. Its raw maximum spans three targets; final grip/wand limits remain separately measured. Only measured good left contact continues. No action plan is re-evaluated. The scene checks feet, floor, ROM, wand and effects; seeking reads fixed samples. Dispose actors with their scene.
 */
export function createDuelRescueContacts(actors: Record<"Carina" | "Harry", ReturnType<typeof createDuelActor>>, entries: Readonly<Record<"Carina" | "Harry", DuelRescueEntry>>): {
  meeting: Record<"Carina" | "Harry", THREE.Vector3>;
  fit: (seconds: number, frames: { carina: DuelContactFrame; harry: DuelContactFrame }, intents: { carina: Pick<ReturnType<typeof evaluateDuelRescue>, "redirect" | "shoulder">; harry: Pick<ReturnType<typeof evaluateDuelRescue>, "reach" | "forearmGrip">; ending: boolean }) => { carina: DuelContactFrame; harry: DuelContactFrame };
  refitHeld: (frame: DuelActorFrame) => DuelActorFrame;
  events: () => { redirectTouch: number | null; forearmTouch: number | null; shoulderTouch: number | null; escapeReady: boolean; protectiveContactActive: boolean };
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
  let protectiveContactActive: boolean = false;
  let shoulderRecovery: IAutoMovieHumanPose | undefined;
  let forearmRecovery: IAutoMovieHumanPose | undefined;

  /** Recover a released arm from its actual entry toward the authored free action. */
  function recover(role: "Carina" | "Harry", frame: DuelContactFrame, entry: IAutoMovieHumanPose, weight: number): DuelContactFrame {
    const pose: IAutoMovieHumanPose = structuredClone(frame.pose);
    pose.arms ??= { left: {}, right: {} };
    pose.arms.left = AutoMovieHumanRigControls.blend(frame.pose, entry, weight).arms?.left ?? {};
    pose.arms.left.hand = frame.pose.arms?.left.hand;
    const output: ReturnType<typeof actors.Carina.pose> = actors[role].pose(pose);
    return { ...frame, pose, output: { posed: output.posed, clamped: output.clamped } };
  }

  /** Fit and record one true carrier; only a good own-left result continues. */
  function contact(role: "Carina" | "Harry", frame: DuelContactFrame, kind: string, point: DuelContactPoint, surface: THREE.Vector3, weight: number, stage: "initial-touch" | "final" = "final", targetOverride?: THREE.Vector3, peer?: { role: "Carina" | "Harry"; point: DuelContactPoint }, currentBodySeed: boolean = false, supplied?: ReturnType<typeof fitDuelLeftContact>): DuelContactFrame {
    const actor: ReturnType<typeof createDuelActor> = actors[role];
    const free: THREE.Vector3 = at(actor, point);
    const target: THREE.Vector3 = targetOverride ?? free.clone().lerp(surface, weight);
    const seed: IAutoMovieHumanPose = structuredClone(frame.pose);
    if (!currentBodySeed && previousLeft[role]?.arms?.left !== undefined) {
      seed.arms ??= { left: {}, right: {} };
      seed.arms.left = { ...previousLeft[role]!.arms!.left, hand: frame.pose.arms?.left.hand };
    }
    const fitted: ReturnType<typeof fitDuelLeftContact> = supplied ?? fitDuelLeftContact(actor, seed, point, target);
    actor.pose(fitted.result.pose);
    const actual: THREE.Vector3 = at(actor, point);
    const error: number = actual.distanceTo(target);
    const { output: _output, ...raw } = fitted.result;
    if (error <= 0.003 && fitted.result.output.clamped.length === 0) previousLeft[role] = fitted.result.pose;
    return { ...frame, pose: fitted.result.pose, output: { posed: fitted.result.output.posed, clamped: fitted.result.output.clamped }, gripError: Math.max(frame.gripError, error), contacts: [...(frame.contacts ?? []), { kind, stage, weight, error, separation: actual.distanceTo(surface), actual: [actual.x, actual.y, actual.z], target: [target.x, target.y, target.z], ...(peer === undefined ? {} : { peer: { ...peer, world: [surface.x, surface.y, surface.z] as [number, number, number] } }), fit: { input: fitted.input, result: raw } }] };
  }

  return {
    meeting,
    refitHeld: (frame: DuelActorFrame): DuelActorFrame => {
      if (heldForearm === undefined || forearmTouch === null) throw new Error("A body-placed refit needs the established actual forearm carrier");
      const surface: THREE.Vector3 = at(actors.Carina, heldForearm);
      const fitted: ReturnType<typeof fitDuelHeldWand> = fitDuelHeldWand(actors.Harry, frame.pose, palms.Harry, surface, new THREE.Vector3(...frame.requestedWrist), new THREE.Vector3(...frame.requestedAim));
      const final: DuelContactFrame = contact("Harry", { ...frame, gripError: 0 }, "protective forearm", palms.Harry, surface, 1, "final", undefined, { role: "Carina", point: heldForearm }, true, fitted);
      const { output: _output, ...raw } = fitted.result;
      return { ...frame, ...final, wandSolve: { seed: fitted.input.seed, result: raw } };
    },
    fit: (seconds: number, original: { carina: DuelContactFrame; harry: DuelContactFrame }, intents: { carina: Pick<ReturnType<typeof evaluateDuelRescue>, "redirect" | "shoulder">; harry: Pick<ReturnType<typeof evaluateDuelRescue>, "reach" | "forearmGrip">; ending: boolean }): { carina: DuelContactFrame; harry: DuelContactFrame } => {
      let carina: DuelContactFrame = original.carina;
      let harry: DuelContactFrame = original.harry;
      const c: typeof intents.carina = intents.carina;
      const h: typeof intents.harry = intents.harry;
      const cWrist: THREE.Vector3 = actors.Carina.wristContact("right", actors.Harry.point("leftUpperArm"));
      if (h.forearmGrip > 0 && heldForearm === undefined) heldForearm = selectDuelContactPoint(actors.Carina, "rightLowerArm", { kind: "forearm", toward: actors.Harry.point("leftUpperArm") });
      const held: THREE.Vector3 = heldForearm === undefined ? cWrist : at(actors.Carina, heldForearm);
      const releasingForearm: boolean = intents.ending && forearmTouch !== null && h.forearmGrip < 0.999;
      if (releasingForearm) {
        forearmRecovery ??= structuredClone(previousLeft.Harry ?? harry.pose);
        harry = recover("Harry", harry, forearmRecovery, h.forearmGrip);
      } else if (h.reach > 0 && redirectTouch === null) {
        harry = contact("Harry", harry, "reaching wrist", palms.Harry, cWrist, h.reach, c.redirect > 0 ? "initial-touch" : "final");
      }
      if (c.redirect > 0 && redirectTouch === null) {
        const candidate: DuelContactPoint = selectDuelContactPoint(actors.Harry, "leftLowerArm", { kind: "forearm", toward: actors.Carina.point("leftUpperArm") });
        carina = contact("Carina", carina, "forearm redirect touch", palms.Carina, at(actors.Harry, candidate), c.redirect, "initial-touch", undefined, { role: "Harry", point: candidate });
        const touch: NonNullable<DuelContactFrame["contacts"]>[number] = carina.contacts!.at(-1)!;
        if (touch.error <= 0.003 && touch.separation <= 0.003) {
          redirectTouch = seconds;
          redirectedForearm = candidate;
        }
      }
      if (redirectTouch !== null && !intents.ending && (c.redirect > 0 || h.forearmGrip > 0)) {
        const progress: number = THREE.MathUtils.clamp((seconds - redirectTouch) / duelRescueActions.redirect.pushSeconds, 0, 1);
        const push: number = progress * progress * (3 - 2 * progress) * c.redirect * (1 - h.forearmGrip);
        const target: THREE.Vector3 = cWrist.clone().lerp(held, h.forearmGrip).add(new THREE.Vector3(0.12, 0, -0.08).multiplyScalar(push));
        harry = contact("Harry", harry, h.forearmGrip >= 0.999 ? "protective forearm" : "redirected forearm handoff", palms.Harry, held, h.forearmGrip, "final", target, heldForearm === undefined ? undefined : { role: "Carina", point: heldForearm });
        if (c.redirect > 0) carina = contact("Carina", carina, "continuing redirect", palms.Carina, at(actors.Harry, redirectedForearm!), c.redirect * (1 - h.forearmGrip), "final", undefined, { role: "Harry", point: redirectedForearm! });
      } else if (h.forearmGrip > 0 && !releasingForearm) {
        harry = contact("Harry", harry, "protective forearm", palms.Harry, held, h.forearmGrip, "final", undefined, { role: "Carina", point: heldForearm! });
      }
      if (h.forearmGrip > 0 && !releasingForearm) {
        const touch: NonNullable<DuelContactFrame["contacts"]>[number] = harry.contacts!.at(-1)!;
        if (h.forearmGrip >= 0.999 && touch.error <= 0.003 && touch.separation <= 0.003) forearmTouch ??= seconds;
      }
      if (shoulderTouch !== null && c.shoulder < 0.999) {
        // Parting is an authored recovery from the real press, not another
        // positional shoulder-contact solve against the receding chest.
        shoulderRecovery ??= structuredClone(previousLeft.Carina ?? carina.pose);
        carina = recover("Carina", carina, shoulderRecovery, c.shoulder);
      } else if (c.shoulder > 0) {
        const pair: ReturnType<typeof selectDuelShoulderPair> = selectDuelShoulderPair(actors.Carina, actors.Harry);
        carina = contact("Carina", carina, "protective shoulder", pair.shoulder, at(actors.Harry, pair.chest), c.shoulder, "final", undefined, { role: "Harry", point: pair.chest });
        const touch: NonNullable<DuelContactFrame["contacts"]>[number] = carina.contacts!.at(-1)!;
        if (c.shoulder >= 0.999 && touch.error <= 0.003 && touch.separation <= 0.003) shoulderTouch ??= seconds;
      }
      escapeReady ||= redirectTouch !== null && forearmTouch !== null && shoulderTouch !== null;
      const shoulderContact: NonNullable<DuelContactFrame["contacts"]>[number] | undefined = carina.contacts?.find((item: NonNullable<DuelContactFrame["contacts"]>[number]): boolean => item.kind === "protective shoulder");
      const forearmContact: NonNullable<DuelContactFrame["contacts"]>[number] | undefined = harry.contacts?.find((item: NonNullable<DuelContactFrame["contacts"]>[number]): boolean => item.kind === "protective forearm");
      protectiveContactActive = c.shoulder >= 0.999 && h.forearmGrip >= 0.999 && shoulderContact !== undefined && forearmContact !== undefined && shoulderContact.error <= 0.003 && shoulderContact.separation <= 0.003 && forearmContact.error <= 0.003 && forearmContact.separation <= 0.003;
      return { carina, harry };
    },
    events: (): { redirectTouch: number | null; forearmTouch: number | null; shoulderTouch: number | null; escapeReady: boolean; protectiveContactActive: boolean } => ({ redirectTouch, forearmTouch, shoulderTouch, escapeReady, protectiveContactActive }),
  };
}
