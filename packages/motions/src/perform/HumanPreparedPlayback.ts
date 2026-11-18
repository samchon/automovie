import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPlayback,
  IAutoMovieMotionHumanRefusal,
  IAutoMovieMotionHumanResolveHumanPosture,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanLimbIncumbent } from "../posture/HumanLimbIncumbent";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";

type Plan = IAutoMovieMotionHumanActionPlan;
type Reader = Plan["posture"];
type Seeded = IAutoMovieMotionHumanResolveHumanPosture.ISeeded;
type Where = IAutoMovieMotionHumanRefusal.IWhere;

interface IBinding {
  readonly body: IAutoMovieMotionHumanBody;
  readonly source: IAutoMovieMotionHumanPlayback;
  readonly original: Reader;
  located?: Reader;
  where?: Where;
  ready: boolean;
}

/** Private plan ownership. Entries hold evaluators and phase data, never query results. */
const bindings: WeakMap<Plan, IBinding> = new WeakMap();

/**
 * Pass a native action's phase evaluators to its display leaf. Public
 * authoring still reads the plan's posture callback. A law supplies its exact
 * event boundaries and owns the mathematics and validity of each evaluator.
 * Display resolves any result that contains authoring alone through its usual
 * stages. An already resolved result can be transferred once to the same leaf.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines ownership, local seconds, endpoint order, ordinary fallback and one-read transfer.
 * @evidence contracts/development/design.md#principled-representation A native action binds its body and exact authoring callback to its ordered event windows. The sample carries the current authoring and only the same evaluation's optional fit.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Stretch binds its material-hold writer. Working-seat riding binds its existing same-query transfer. Placement records the installed refusal wrapper and the display consumes either from the same boundary.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Foreign plans and replaced readers have no admitted binding. No claim is inferred from pose equality, no solver threshold changes and no sampled answer enters the registry.
 */
export namespace HumanPreparedPlayback {
  /** The native source follows the common interface contract. */
  export type ISource = IAutoMovieMotionHumanPlayback;

  /** The human specialization of a time-local motion evaluator. */
  export type IPhase = IAutoMovieMotionHumanPlayback.IPhase;

  /** Human posture data returned from the same leaf evaluation. */
  export type ISample = IAutoMovieMotionHumanPlayback.ISample;

  /** Own copies of the phase records in the lifetime of their original native plan. */
  export function attach(
    plan: Plan,
    body: IAutoMovieMotionHumanBody,
    source: ISource,
  ): void {
    bindings.set(plan, {
      body,
      original: plan.posture,
      source: {
        ...source,
        phases: source.phases.map((phase: IPhase): IPhase => ({ ...phase })),
      },
      ready: source.prepare === undefined,
    });
  }

  /** Connect placement's existing posture wrapper to this exact native authoring. */
  export function locate(
    plan: Plan,
    original: Reader,
    installed: Reader,
    where: Where,
  ): void {
    const binding: IBinding | undefined = bindings.get(plan);
    if (binding?.original !== original) return;
    binding.located = installed;
    binding.where = where;
  }

  /** Enable an event-dependent evaluator after the whole placement has settled. */
  export function prepare(plan: Plan): void {
    const binding: IBinding | undefined = bindings.get(plan);
    if (binding === undefined || binding.ready || plan.posture !== binding.located)
      return;
    binding.source.prepare?.();
    binding.ready = true;
  }

  /** Invalidate a placement-dependent setup when placement-owned state changes. */
  export function forget(plan: Plan): void {
    const binding: IBinding | undefined = bindings.get(plan);
    if (binding?.source.prepare !== undefined) binding.ready = false;
  }

  /** Used by a law's unchanged-input interval declaration after placement. */
  export function owns(plan: Plan, reader: Reader): boolean {
    const binding: IBinding | undefined = bindings.get(plan);
    return binding !== undefined &&
      (reader === binding.original || reader === binding.located);
  }

  /**
   * Evaluate the active native phase at its actual local second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Covers original and placed readers, the restricted fitted route, gaps, and located refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The matching body, exact original/placed callback and native full observation admit the corresponding phase. The first containing interval gives its exact endpoint meaning.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Look up the binding, check the source requirements, select one interval, and locate any native refusal before propagating it.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No unknown callback is inspected beyond the already-read identity, and no phase outside the requested instant is evaluated.
   * @evidence contracts/development/implementation.md#efficient-algorithms A constant-time weak lookup and one scan over the law's bounded phase list; evaluate at most one writer.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the action's own phase evaluator; the law establishes exactly which work its phase can share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Phase records and writers release with the plan. A current sample is borrowed only through its leaf.
   */
  export function read(
    plan: Plan,
    body: IAutoMovieMotionHumanBody,
    reader: Reader,
    bare: boolean,
    full: boolean,
    incumbents: Seeded["seeds"] | undefined,
    ...args: Parameters<Reader>
  ): ISample | undefined {
    const binding: IBinding | undefined = bindings.get(plan);
    if (binding === undefined || !binding.ready || binding.body !== body) return undefined;
    const placed: boolean = reader === binding.located;
    if (binding.source.mode === "fitted") {
      if (
        !bare ||
        (!placed && reader !== binding.original) ||
        !full ||
        !prepareHumanPoseResolution.isNativeSource(args[2])
      ) return undefined;
    } else if (!placed || (binding.source.mode === "bare-posture" && !bare))
      return undefined;

    const local: number = args[0];
    const phase: IPhase | undefined = binding.source.phases.find(
      (entry: IPhase): boolean => local >= entry.from && local <= entry.to,
    );
    if (phase === undefined) return undefined;
    try {
      return binding.source.mode === "fitted" && incumbents !== undefined
        ? HumanLimbIncumbent.within(
            { body, seeds: incumbents },
            (): ISample | undefined => phase.sample(...args),
          )
        : phase.sample(...args);
    } catch (error) {
      throw error instanceof HumanRefusal && placed && binding.where !== undefined
        ? error.locate(binding.where)
        : error;
    }
  }
}
