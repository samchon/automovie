import * as THREE from "three";
import type { AutoMovieHumanRigControls } from "@automovie/human";
import type { MotionAction } from "../motion/core/MotionAction";
import type { LabActor } from "./LabActor";
import type { LabArmWriter } from "./LabArmWriter";
import { LabFitPlan } from "./LabFitPlan";
import type { LabRecovery } from "./LabRecovery";
import { LabArmAnatomy } from "./LabArmAnatomy";

/**
 * Consume an incoming defense and a prior released arm on one actual supported body.
 * @evidence contracts/common.md#implementation-and-ownership The receiver prepares its one body once, then consumes original recovery arms and disjoint external defensive-arm tasks in one native arm fit. Conflicting active sides refuse rather than dropping an older clock or averaging tasks. No second whole-actor evaluation participates.
 * @evidence contracts/common.md#authoring-interface Incoming goals retain their original actor-frame WORLD placement across permitted rootY fitting. Carry times are originalCase=caseSeconds+offsetSeconds, including all entry/check prefixes, and its actor must be this receiver. Full original floor, support, source and native admissions remain the host's responsibility.
 */
export namespace LabReceiving {
  /**
   * Affine clock binding for the original outgoing arms.
   * @evidence contracts/common.md#implementation-and-ownership Holds only an immutable recovery port and its original clock offset; it owns no actor pose, support plan or previous-frame state.
   * @evidence contracts/common.md#authoring-interface offsetSeconds maps the new complete case's zero to the earlier case's seconds. The new zero must be strictly after all source releases; expired actions may supply their terminal clinical guard without extending their contact.
   */
  export interface Carry {
    /** Existing released-arm provider. */ port: LabRecovery;
    /** Original case time at the new exchange's zero. */ offsetSeconds: number;
  }

  /**
   * One already released defensive arm, continuing on the next defense's body.
   * @evidence contracts/common.md#implementation-and-ownership Separates an existing defensive withdrawal from an outgoing strike port. Its exact deadline and own-side sample are fixed before fitting; no foreign incoming event is relabelled as this arm's action.
   * @evidence contracts/common.md#authoring-interface endSeconds uses the current case clock. sample receives the single realized body and authors only its named arm; it must preserve that body's root, original support and the original return deadline.
   */
  export interface Return {
    /** Original receiving arm. */ side: MotionAction.Side;
    /** Original clinical guard deadline in this case clock. */ endSeconds: number;
    /**
     * Continue its actual entry and known rates on the realized body.
     * @evidence contracts/common.md#implementation-and-ownership The provider owns an immutable actual entry and the original guard endpoint, returning only the existing arm's independently clocked request.
     * @evidence contracts/common.md#authoring-interface Placement is actual and body-only; no actor update or original WORLD goal replacement occurs here. Final native checks remain mandatory.
     */
    sample(placement: MotionAction.BodyPlacement): LabArmWriter;
  }

  /**
   * Apply one receiver composition through its existing public actor stages.
   * @evidence contracts/common.md#implementation-and-ownership Validates actor/clock ownership before mutation. Existing external tasks are transformed from requested to realized root coordinates exactly once, while clinical carry follows the same realized body. Expired terminal guards yield only to an explicitly incoming task on that arm.
   * @evidence contracts/common.md#authoring-interface Without carry or a returning arm this preserves ordinary single-stage defense behavior. Original leg tasks pass through the body's existing retained-goal stage; named arm tasks have independent writers. The actor rejects non-leg body tasks before mutation. Callers provide the outer atomic transaction and retain failed native diagnostics.
   */
  export function apply(actor: LabActor, incoming: MotionAction.Sample, seconds: number, carry?: Carry, returning?: Return): void {
    if (!carry && !returning) { actor.apply(incoming); return; }
    if (carry) validate(carry, actor.id, seconds, incoming.effectors);
    const time: number = seconds + (carry?.offsetSeconds ?? 0);
    if (!Number.isFinite(time) || carry && time <= carry.port.releasedSeconds) throw new Error("Receiving carry requires the original released-arm branch");
    if (returning && (!Number.isFinite(returning.endSeconds) || incoming.effectors.some((effector: MotionAction.Effector): boolean => LabArmAnatomy.contains(effector.bone, returning.side) && seconds < returning.endSeconds))) throw new Error("Active defensive return conflicts with the next receiving arm");
    const bodyTasks: MotionAction.Effector[] = incoming.effectors.filter((effector: MotionAction.Effector): boolean => !LabArmAnatomy.contains(effector.bone));
    const placement: MotionAction.BodyPlacement = actor.prepareBody(incoming, bodyTasks);
    let writers: LabArmWriter[] = carry ? carry.port.sampleArms(time, placement, { origin: actor.origin.toArray(), yawRadians: actor.yaw }) : [];
    if (returning) {
      if (carry?.port.actions.some((action: LabRecovery["actions"][number]): boolean => action.side === returning.side && time < action.endSeconds)) throw new Error("Active outgoing and defensive returns share one arm");
      writers = writers.filter((writer: LabArmWriter): boolean => writer.side !== returning.side);
      writers.push(returning.sample(placement));
    }
    for (const side of ["left", "right"] as const) {
      const effectors: MotionAction.Effector[] = incoming.effectors.filter((effector: MotionAction.Effector): boolean => LabArmAnatomy.contains(effector.bone, side));
      if (!effectors.length) continue;
      if (writers.some((writer: LabArmWriter): boolean => writer.side === side)) {
        if (carry?.port.actions.some((action: LabRecovery["actions"][number]): boolean => action.side === side && time < action.endSeconds)) throw new Error(`Active original ${side} recovery conflicts with the incoming defense`);
        writers = writers.filter((writer: LabArmWriter): boolean => writer.side !== side);
      }
      const pose: MotionAction.Sample["pose"] = structuredClone(placement.pose);
      if (!incoming.pose.arms?.[side]) throw new Error("Incoming defense has no authored receiving arm");
      pose.arms ??= { left: {}, right: {} };
      pose.arms[side] = structuredClone(incoming.pose.arms[side]);
      const from: THREE.Quaternion = new THREE.Quaternion(...(incoming.rootRotation ?? [0, 0, 0, 1]));
      const inverse: THREE.Quaternion = new THREE.Quaternion(...(placement.rootRotation ?? [0, 0, 0, 1])).invert();
      const sample: MotionAction.Sample = { ...structuredClone(incoming), pose, rootOffset: [...placement.rootOffset], rootRotation: placement.rootRotation ? [...placement.rootRotation] : undefined, support: structuredClone(placement.support) as MotionAction.Support, effectors: effectors.map((effector: MotionAction.Effector): MotionAction.Effector => ({ ...effector, target: new THREE.Vector3(...effector.target).applyQuaternion(from).add(new THREE.Vector3(...incoming.rootOffset)).sub(new THREE.Vector3(...placement.rootOffset)).applyQuaternion(inverse).toArray() })) };
      const plan: LabFitPlan.Selection = LabFitPlan.select(sample, actor.person.neutral, effectors.map((effector: MotionAction.Effector): string => effector.bone));
      writers.push({ side, sample, channels: plan.channels.filter((channel: AutoMovieHumanRigControls.DegreeChannel): boolean => channel.startsWith(`arms.${side}.`)) });
    }
    actor.applyArms(writers, placement);
    if (actor.sample) actor.sample = { ...structuredClone(incoming), ...actor.sample, elapsed: incoming.elapsed, phase: incoming.phase, progress: incoming.progress };
  }

  /**
   * Continue released arms on a separately owned leg strike and its original WORLD goals.
   * @evidence contracts/common.md#implementation-and-ownership Prepares one body with all unchanged leg effectors, then samples the old arm port once on that realized placement. The actor retains those original WORLD leg tasks through its final arm-only fit, so arm carry cannot erase a strike or sole goal.
   * @evidence contracts/common.md#authoring-interface The actual same-actor kick entry and original recovery clock are explicit. External arm tasks in the incoming leg sample refuse; a prior whole case is never evaluated. Full native leg, ground, support and arm admission remains mandatory.
   */
  export function attack(actor: LabActor, incoming: MotionAction.Sample, seconds: number, carry: Carry): void {
    validate(carry, actor.id, seconds);
    if (incoming.effectors.some((task: MotionAction.Effector): boolean => LabArmAnatomy.contains(task.bone))) throw new Error("Leg and arm carry must have disjoint external task ownership");
    const placement: MotionAction.BodyPlacement = actor.prepareBody(incoming, incoming.effectors);
    actor.applyArms(carry.port.sampleArms(seconds + carry.offsetSeconds, placement, { origin: actor.origin.toArray(), yawRadians: actor.yaw }), placement);
    if (actor.sample) actor.sample = { ...structuredClone(incoming), ...actor.sample, elapsed: incoming.elapsed, phase: incoming.phase, progress: incoming.progress };
  }

  /**
   * Admit immutable lifetime metadata before a receiver can consume it.
   * @evidence contracts/common.md#implementation-and-ownership Checks one or two distinct arm/action owners, finite ordered lifetimes and the receiving actor. Original contact records must name that outgoing action and performer; no metadata creates or relabels an event.
   * @evidence contracts/common.md#authoring-interface The new local zero maps strictly after all original releases. Invalid ports fail before body fitting. A terminal deadline reports original action completion, not an extension of the new exchange.
   */
  export function validate(carry: Carry, actorId: string, seconds: number = 0, effectors: readonly MotionAction.Effector[] = []): void {
    const port: LabRecovery = carry.port;
    if (!port || typeof port.sampleArms !== "function" || port.actorId !== actorId || !Number.isFinite(seconds) || !Number.isFinite(carry.offsetSeconds) || !Number.isFinite(port.releasedSeconds) || !Number.isFinite(port.endSeconds) || carry.offsetSeconds <= port.releasedSeconds || port.releasedSeconds > port.endSeconds || port.actions.length < 1 || port.actions.length > 2 || new Set(port.actions.map((action: LabRecovery["actions"][number]): string => action.actionId)).size !== port.actions.length || new Set(port.actions.map((action: LabRecovery["actions"][number]): MotionAction.Side => action.side)).size !== port.actions.length) throw new Error("Receiving carry has invalid actor, arm ownership or original clock");
    for (const action of port.actions) if (!action.actionId.trim() || !["left", "right"].includes(action.side) || ![action.deliveryStartSeconds, action.releasedSeconds, action.retractionSeconds, action.endSeconds].every(Number.isFinite) || action.deliveryStartSeconds < 0 || action.deliveryStartSeconds > action.releasedSeconds || action.releasedSeconds > action.endSeconds || action.retractionSeconds <= 0 || action.contact && (action.contact.event.actionId !== action.actionId || action.contact.event.actorId !== actorId)) throw new Error("Receiving carry has an invalid original action or contact lifetime");
    if (port.releasedSeconds !== Math.max(...port.actions.map((action: LabRecovery["actions"][number]): number => action.releasedSeconds)) || port.endSeconds !== Math.max(...port.actions.map((action: LabRecovery["actions"][number]): number => action.endSeconds))) throw new Error("Receiving carry aggregate clocks differ from original actions");
    const time: number = carry.offsetSeconds + seconds;
    if (effectors.some((effector: MotionAction.Effector): boolean => port.actions.some((action: LabRecovery["actions"][number]): boolean => LabArmAnatomy.contains(effector.bone, action.side) && time < action.endSeconds))) throw new Error("Active original arm recovery conflicts with the incoming defense");
  }
}
