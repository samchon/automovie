import type { MotionAction } from "../motion/core/MotionAction";
import type { PunchAction } from "../motion/punch/PunchAction";
import type { LabArmWriter } from "./LabArmWriter";
import type { LabRecovery } from "./LabRecovery";

/**
 * Borrow original released punch arms without borrowing a whole actor or its clock.
 * @evidence contracts/common.md#implementation-and-ownership Captures fixed action instances, detached contexts and actual stops once. Only released clinical withdrawal is rebound to a new realized body; external delivery and WORLD dwell refuse. The factory has no actor, solver, renderer or mutable frame history.
 * @evidence contracts/common.md#authoring-interface Original case-local seconds include each entry prefix. One or two disjoint arms retain their individual action/contact deadlines and terminal guards. The consuming frame explicitly owns the current body; this port does not certify physical support or contact.
 */
export namespace LabPunchRecovery {
  /**
   * One original placed action, retaining its own immutable source inputs.
   * @evidence contracts/common.md#implementation-and-ownership The existing instance owns variation and timing; this binding supplies only its original context, actual stop and affine case offset. No completed action is reconstructed.
   * @evidence contracts/common.md#authoring-interface startSeconds is the original action's zero in the case clock. A missing stop denotes a free strike, never a fabricated interception. Borrowed evaluator/support callables belong to the unchanged actor lifetime.
   */
  export interface Binding {
    /** Original frozen reusable action. */ action: PunchAction.Instance;
    /** Its actual original actor geometry and clinical guard. */ context: MotionAction.Context;
    /** Original action zero in the case clock. */ startSeconds: number;
    /** Actual constrained first contact, when one occurred. */ contact?: MotionAction.ContactState;
  }

  /**
   * Bind released own-arm curves to one explicitly realized receiving body.
   * @evidence contracts/common.md#implementation-and-ownership Deeply freezes detached source data, keeps source callbacks borrowed, and enforces distinct arms/one actor. Default sampling reuses the original action; an existing combination sampler can preserve its already authored entry bridge. No WORLD task is transformed after fitting or replaced by achieved geometry.
   * @evidence contracts/common.md#authoring-interface Sampling is strictly after every release. Default sampling supplies the detached original frame separately for unchanged WORLD-terminal validation. Supplied callbacks receive fixed original contexts with the explicit consuming frame and must preserve that source-frame authority themselves, returning clinical retraction/recovery/complete writers only. Complete guards can persist after their original deadlines without making the action or contact active again.
   */
  export function create(bindings: readonly Binding[], compose?: (seconds: number, contexts: readonly MotionAction.Context[], placement: MotionAction.BodyPlacement) => LabArmWriter[]): LabRecovery {
    if (bindings.length < 1 || bindings.length > 2 || new Set(bindings.map((binding: Binding): MotionAction.Side => binding.action.request.side)).size !== bindings.length || new Set(bindings.map((binding: Binding): string => binding.action.request.id)).size !== bindings.length || new Set(bindings.map((binding: Binding): string => binding.action.request.actorId)).size !== 1 || bindings.some((binding: Binding): boolean => !Number.isFinite(binding.startSeconds) || binding.startSeconds < 0 || !binding.action.request.id.trim())) throw new Error("Recovery requires one actor's disjoint original arm clocks");
    for (const binding of bindings) if (binding.contact && (binding.contact.event.actorId !== binding.action.request.actorId || binding.contact.event.targetId !== binding.action.request.targetId || binding.contact.event.actionId !== binding.action.request.id || !Number.isFinite(binding.contact.event.time) || binding.contact.event.time < 0)) throw new Error("Recovery contact must belong to its original action and participants");
    const sources: Binding[] = bindings.map((binding: Binding): Binding => ({ ...binding, context: snapshotContext(binding.context, binding.contact), contact: binding.contact ? freeze(structuredClone(binding.contact)) : undefined }));
    const actions: LabRecovery["actions"] = freeze(sources.map((binding: Binding): LabRecovery["actions"][number] => {
      const release: number = binding.startSeconds + (binding.contact?.event.time ?? binding.action.timing.preparation + binding.action.timing.delivery) + binding.action.timing.contact;
      return { actionId: binding.action.request.id, side: binding.action.request.side, deliveryStartSeconds: binding.startSeconds + binding.action.timing.preparation, releasedSeconds: release, retractionSeconds: binding.action.timing.retraction, endSeconds: binding.contact ? release + binding.action.timing.retraction + binding.action.timing.recovery : binding.startSeconds + binding.action.duration, contact: binding.contact };
    }));
    const releasedSeconds: number = Math.max(...actions.map((action: LabRecovery["actions"][number]): number => action.releasedSeconds));
    const endSeconds: number = Math.max(...actions.map((action: LabRecovery["actions"][number]): number => action.endSeconds));
    if (actions.some((action: LabRecovery["actions"][number]): boolean => ![action.deliveryStartSeconds, action.releasedSeconds, action.retractionSeconds, action.endSeconds].every(Number.isFinite) || action.deliveryStartSeconds < 0 || action.releasedSeconds < action.deliveryStartSeconds || action.endSeconds < action.releasedSeconds || action.retractionSeconds <= 0)) throw new Error("Recovery original phase lifetimes must remain finite and ordered");
    return Object.freeze({ actorId: sources[0]!.action.request.actorId, actions, releasedSeconds, endSeconds, sampleArms: (seconds: number, placement: MotionAction.BodyPlacement, frame: { origin: MotionAction.Vec3; yawRadians: number }): LabArmWriter[] => {
      if (!Number.isFinite(seconds) || seconds <= releasedSeconds) throw new Error("Recovery arms require the original clinical post-release branch");
      if (frame.origin.length !== 3 || !frame.origin.every(Number.isFinite) || !Number.isFinite(frame.yawRadians)) throw new Error("Recovery requires an explicit finite consuming frame");
      const contexts: MotionAction.Context[] = sources.map((source: Binding): MotionAction.Context => ({ ...source.context, frame: structuredClone(frame) }));
      const writers: LabArmWriter[] = compose ? compose(seconds, contexts, placement) : sources.map((source: Binding, index: number): LabArmWriter => ({ side: source.action.request.side, channels: source.action.armChannels, sample: source.action.sample(seconds - source.startSeconds, contexts[index]!, placement, "shared", undefined, source.context.frame) }));
      if (writers.length !== sources.length || new Set(writers.map((writer: LabArmWriter): MotionAction.Side => writer.side)).size !== writers.length || writers.some((writer: LabArmWriter): boolean => !sources.some((source: Binding): boolean => source.action.request.side === writer.side && Number.isFinite(writer.sample.elapsed) && Math.abs(writer.sample.elapsed - (seconds - source.startSeconds)) <= 1e-10) || !["retraction", "recovery", "complete"].includes(writer.sample.phase) || writer.sample.effectors.some((effector: MotionAction.Effector): boolean => effector.role === "strike"))) throw new Error("Recovery cannot carry a changed clock, external strike or WORLD dwell");
      return writers;
    } });
  }

  /** Detach all data while retaining the exact same prepared-body public callables. */
  function snapshotContext(context: MotionAction.Context, contact?: MotionAction.ContactState): MotionAction.Context {
    const { evaluatePose, supportFrame, supportTargets, prepareSupport, ...data }: MotionAction.Context = context;
    return freeze({ ...structuredClone(data), contact: contact ? structuredClone(contact) : undefined, evaluatePose, supportFrame, supportTargets, prepareSupport });
  }

  /** Freeze only owned data; borrowed public evaluator functions are never modified. */
  function freeze<T>(value: T): T {
    if (value && typeof value === "object") { for (const child of Object.values(value)) freeze(child); Object.freeze(value); }
    return value;
  }
}
