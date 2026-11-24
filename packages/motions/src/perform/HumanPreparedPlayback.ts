import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPlayback,
  IAutoMovieMotionHumanRefusal,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";

/** The plan a playback is bound to. */
type Plan = IAutoMovieMotionHumanActionPlan;

/** The plan's posture reader. */
type Reader = Plan["posture"];

/** Where placement put a plan. */
type Where = IAutoMovieMotionHumanRefusal.IWhere;

/**
 * Pass a native action's phase evaluators to its display leaf. Public authoring
 * still reads the plan's posture callback. A law supplies its exact event
 * boundaries and owns the mathematics and validity of each evaluator. Display
 * resolves any result that contains authoring alone through its usual stages.
 * An already resolved result can be transferred once to the same leaf. The
 * binding is the plan's own record
 * (`IAutoMovieMotionHumanActionPlan.playback`).
 */
export namespace HumanPreparedPlayback {
  /** The native source follows the common interface contract. */
  export type ISource = IAutoMovieMotionHumanPlayback;

  /** The human specialization of a time-local motion evaluator. */
  export type IPhase = IAutoMovieMotionHumanPlayback.IPhase;

  /** Human posture data returned from the same leaf evaluation. */
  export type ISample = IAutoMovieMotionHumanPlayback.ISample;

  /**
   * The type a binding keeps a body as: it reads only the body's identity, so
   * callers pass their whole body and a test a small record.
   */
  export type IBody = Pick<IAutoMovieMotionHumanBody, "skeleton">;

  /**
   * Bind a copy of the phase records to their native plan.
   *
   * @param plan The plan the phases stand for.
   * @param body The body they were authored for, kept as passed.
   * @param source The phases.
   */
  export function attach(plan: Plan, body: IBody, source: ISource): void {
    plan.playback = {
      body,
      original: plan.posture,
      source: {
        ...source,
        phases: source.phases.map((phase: IPhase): IPhase => ({ ...phase })),
      },
      ready: source.prepare === undefined,
    };
  }

  /**
   * Connect placement's posture wrapper to this exact native authoring.
   *
   * @param plan The placed plan.
   * @param original The reader placement wrapped.
   * @param installed The wrapper placement installed.
   * @param where Where placement put the plan.
   */
  export function locate(
    plan: Plan,
    original: Reader,
    installed: Reader,
    where: Where,
  ): void {
    const binding: IAutoMovieMotionHumanPlayback.IBinding | undefined =
      plan.playback;
    if (binding?.original !== original) return;
    binding.located = installed;
    binding.where = where;
  }

  /**
   * Run an event-dependent setup once the performance is prepared.
   *
   * @param plan The placed plan.
   */
  export function prepare(plan: Plan): void {
    const binding: IAutoMovieMotionHumanPlayback.IBinding | undefined =
      plan.playback;
    if (
      binding === undefined ||
      binding.ready ||
      plan.posture !== binding.located
    )
      return;
    binding.source.prepare?.();
    binding.ready = true;
  }

  /**
   * Whether a reader is the plan's bound authoring or its placed wrapper, for a
   * law's unchanged-input interval declaration after placement.
   *
   * @param plan The plan.
   * @param reader The reader.
   * @returns Whether the plan's playback stands for it.
   */
  export function owns(plan: Plan, reader: Reader): boolean {
    const binding: IAutoMovieMotionHumanPlayback.IBinding | undefined =
      plan.playback;
    return (
      binding !== undefined &&
      (reader === binding.original || reader === binding.located)
    );
  }

  /**
   * Evaluate the active native phase at its actual local second.
   *
   * @param plan The plan.
   * @param body The body read: the phases are read only for the very body they
   *   were authored for.
   * @param reader The plan's reader the leaf would call.
   * @param bare Whether the leaf is bare of layers, overlays, holds and stops.
   * @param full Whether the leaf reads the whole pose without a continuation.
   * @param args The posture reader's arguments.
   * @returns The sample, or none where the phases do not stand for the read.
   */
  export function read(
    plan: Plan,
    body: IBody,
    reader: Reader,
    bare: boolean,
    full: boolean,
    ...args: Parameters<Reader>
  ): ISample | undefined {
    const binding: IAutoMovieMotionHumanPlayback.IBinding | undefined =
      plan.playback;
    if (binding === undefined || !binding.ready || binding.body !== body)
      return undefined;
    const placed: boolean = reader === binding.located;
    if (binding.source.mode === "fitted") {
      if (
        !bare ||
        (!placed && reader !== binding.original) ||
        !full ||
        !prepareHumanPoseResolution.isNativeSource(args[2])
      )
        return undefined;
    } else if (!placed || (binding.source.mode === "bare-posture" && !bare))
      return undefined;

    const local: number = args[0];
    const phase: IPhase | undefined = binding.source.phases.find(
      (entry: IPhase): boolean => local >= entry.from && local <= entry.to,
    );
    if (phase === undefined) return undefined;
    return placed && binding.where !== undefined
      ? HumanRefusal.located(binding.where, (): ISample | undefined =>
          phase.sample(...args),
        )
      : phase.sample(...args);
  }
}
