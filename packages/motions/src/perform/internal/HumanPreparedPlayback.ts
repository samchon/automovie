import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPlayback,
  IAutoMovieMotionHumanRefusal,
} from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { PreparedHumanIntervals } from "./PreparedHumanIntervals";

/*
 * The prepared interval index belongs to the attached phase records.
 */
const PHASE_READERS: WeakMap<
  readonly IAutoMovieMotionHumanPlayback.IPhase[],
  (second: number) => IAutoMovieMotionHumanPlayback.IPhase | undefined
> = new WeakMap();

/*
 * Pass a native action's phase evaluators to its display leaf. Public authoring
 * still reads the plan's posture callback. A law supplies its exact event
 * boundaries and owns the mathematics and validity of each evaluator. Display
 * resolves any result that contains authoring alone through its usual stages.
 * An already resolved result can be transferred once to the same leaf. The
 * binding is the plan's own record
 * (`IAutoMovieMotionHumanActionPlan.playback`).
 */
export namespace HumanPreparedPlayback {
  /*
   * The native source follows the common interface contract.
   */
  export type ISource = IAutoMovieMotionHumanPlayback;

  /*
   * The human specialization of a time-local motion evaluator.
   */
  export type IPhase = IAutoMovieMotionHumanPlayback.IPhase;

  /*
   * Human posture data returned from the same leaf evaluation.
   */
  export type ISample = IAutoMovieMotionHumanPlayback.ISample;

  /*
   * The type a binding keeps a body as: it reads only the body's identity, so
   * callers pass their whole body and a test a small record.
   */
  export type IBody = Pick<IAutoMovieMotionHumanBody, "skeleton">;

  /*
   * Bind a copy of the phase records to their native plan.
   * Parameter plan: The plan the phases stand for.
   * Parameter body: The body they were authored for, kept as passed.
   * Parameter source: The phases.
   */
  export function attach(plan: Plan, body: IBody, source: ISource): void {
    const phases: IPhase[] = source.phases.map(
      (phase: IPhase): IPhase => ({ ...phase }),
    );
    PHASE_READERS.set(phases, PreparedHumanIntervals.first(phases));
    plan.playback = {
      body,
      original: plan.posture,
      source: {
        ...source,
        phases,
      },
      ready: source.prepare === undefined,
    };
  }

  /*
   * Bind a composed posture after it replaces the underlying plan's authoring.
   * Preserve the predecessor's optional native setup. A composed posture cannot
   * reuse a fit resolved against the predecessor alone.
   */
  export function rebindPosture(
    plan: Plan,
    predecessor: Plan,
    body: IBody,
  ): Plan {
    const posture: Reader = plan.posture;
    const prepare: ISource["prepare"] = predecessor.playback?.source.prepare;
    attach(plan, body, {
      mode: "posture",
      phases: [
        {
          from: 0,
          to: plan.duration,
          sample: (...args: Parameters<Reader>): ISample => ({
            posture: posture(...args),
          }),
        },
      ],
      ...(prepare === undefined ? {} : { prepare }),
    });
    return plan;
  }

  /*
   * Connect placement's posture wrapper to this exact native authoring.
   * Parameter plan: The placed plan.
   * Parameter original: The reader placement wrapped.
   * Parameter installed: The wrapper placement installed.
   * Parameter where: Where placement put the plan.
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

  /*
   * Run an event-dependent setup once the performance is prepared.
   * Parameter plan: The placed plan.
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

  /*
   * Whether a reader is the plan's bound authoring or its placed wrapper, for a
   * law's unchanged-input interval declaration after placement.
   * Parameter plan: The plan.
   * Parameter reader: The reader.
   * Returns: Whether the plan's playback stands for it.
   */
  export function owns(plan: Plan, reader: Reader): boolean {
    const binding: IAutoMovieMotionHumanPlayback.IBinding | undefined =
      plan.playback;
    return (
      binding !== undefined &&
      (reader === binding.original || reader === binding.located)
    );
  }

  /*
   * Evaluate the active native phase at its actual local second.
   * Parameter plan: The plan.
   * Parameter body: The body read: the phases are read only for the very body they
   * were authored for.
   * Parameter reader: The plan's reader the leaf would call.
   * Parameter bare: Whether the leaf is bare of layers, overlays, holds and stops.
   * Parameter full: Whether the leaf reads the whole pose without a continuation.
   * Parameter args: The posture reader's arguments.
   * Returns: The sample, or none where the phases do not stand for the read.
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
      if (!bare || (!placed && reader !== binding.original) || !full)
        return undefined;
    } else if (!placed || (binding.source.mode === "bare-posture" && !bare))
      return undefined;

    const local: number = args[0];
    const phases: readonly IPhase[] = binding.source.phases;
    const prepared: ((second: number) => IPhase | undefined) | undefined =
      PHASE_READERS.get(phases);
    const phase: IPhase | undefined =
      prepared === undefined
        ? phases.find(
            (entry: IPhase): boolean =>
              local >= entry.from && local <= entry.to,
          )
        : prepared(local);
    if (phase === undefined) return undefined;
    return placed && binding.where !== undefined
      ? AutoMovieMotionHumanRefusal.located(binding.where, (): ISample | undefined =>
          phase.sample(...args),
        )
      : phase.sample(...args);
  }
}

/*
 * The plan a playback is bound to.
 */
type Plan = IAutoMovieMotionHumanActionPlan;

/*
 * The plan's posture reader.
 */
type Reader = Plan["posture"];

/*
 * Where placement put a plan.
 */
type Where = IAutoMovieMotionHumanRefusal.IWhere;
