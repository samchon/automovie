import type {
  AutoMovieMotionHumanScheduledInstant,
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanBalanceOption,
} from "@automovie/interface";

import { HumanRefusal } from "./HumanRefusal";

/**
 * The one reader of the balance option (`IAutoMovieMotionHumanBalanceOption`):
 * the shift an action applies, by how much at a film second, and whether
 * the audit judges the body's balance over it. Absent on the params, none:
 * a posed, planted action computes no centre of mass and is not checked
 * against gravity unless its law stages a physical outcome
 * (`IAutoMovieMotionHumanActionLaw.physical`). Given, each field is the
 * caller's where given, else the law's recommendation
 * (`IAutoMovieMotionHumanActionLaw.balance`), and a field neither gives is
 * refused, naming it. Its bounds are events, resolved as the scheduled
 * instants are (`HumanPerformance.instant`). A shift is one closed-form
 * evaluation applied by its weight between its bounds (`weight`), never
 * iterated.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the questions, the default, the resolution, the bounds and the refusal.
 * @evidence contracts/development/design.md#principled-representation One owner of the option's reading, so every law and the audit read it alike.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `shift`, `balanced`, `instant` and `weight` for the laws' balance sites, `judged` for the audit, and the records they read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Absent is none; no field is invented: the caller's or the law's, else refused.
 */
export namespace HumanPhysics {
  /** An action's params as the option reads them: the balance, when given. */
  export interface IBalanced {
    /** The balancing shift; none when absent. */
    balance?: IAutoMovieMotionHumanBalanceOption;
  }

  /** An action's law as the option reads it. */
  export interface ILaw {
    /** Whether the law's content is a staged physical outcome (`IAutoMovieMotionHumanActionLaw.physical`). */
    physical?: boolean;

    /** The law's recommended shift, every field set (`IAutoMovieMotionHumanActionLaw.balance`); none when absent. */
    balance?: IAutoMovieMotionHumanBalanceOption;
  }

  /** An action as the audit reads it, a placed action also carrying its law and params. */
  export interface ISpan extends IAutoMovieMotionHumanAuditMotion.ISpan {
    /** The placed action's law, when the span is one. */
    law?: ILaw;

    /** The placed action's params, when the span is one. */
    params?: IBalanced;
  }

  /** A shift with every field resolved: the caller's or the law's. */
  export interface IShift {
    /** The part moved to keep the centre of mass over the support. */
    by: IAutoMovieMotionHumanBalanceOption.Part;

    /** The share of the full shift applied, 0 to 1. */
    weight: number;

    /** The instant it starts. */
    from: IAutoMovieMotionHumanBalanceOption.IBound;

    /** The instant it ends. */
    to: IAutoMovieMotionHumanBalanceOption.IBound;
  }

  /** The shift an action applies (`shift`), or none. */
  export type Shift = IShift | null;

  /** The resolver of a scheduled instant, film seconds (`HumanPerformance.instant`). */
  export type Instant = (at: AutoMovieMotionHumanScheduledInstant) => number;

  /**
   * The shift an action applies: none when its params give no balance;
   * given, each field the caller's where given, else the law's.
   *
   * @param params The action's params; none when absent.
   * @param law The action's law; it recommends none when absent.
   * @returns The shift, or null for none.
   * @throws {HumanRefusal} When a given balance has a field neither the caller nor the law gives, naming the field.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the resolution and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Each field is the caller's, else the law's recommendation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One presence test, four fields.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing field is refused, never defaulted.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A reading.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh record; retains nothing.
   */
  export function shift(params?: IBalanced, law?: ILaw): Shift {
    const given: IAutoMovieMotionHumanBalanceOption | undefined = params?.balance;
    if (given === undefined) return null;
    const recommended: IAutoMovieMotionHumanBalanceOption = law?.balance ?? {};
    const by: IAutoMovieMotionHumanBalanceOption.Part | undefined = given.by ?? recommended.by;
    const weight: number | undefined = given.weight ?? recommended.weight;
    const from: IAutoMovieMotionHumanBalanceOption.IBound | undefined = given.from ?? recommended.from;
    const to: IAutoMovieMotionHumanBalanceOption.IBound | undefined = given.to ?? recommended.to;
    if (by === undefined) throw missing("by");
    if (weight === undefined) throw missing("weight");
    if (from === undefined) throw missing("from");
    if (to === undefined) throw missing("to");
    return { by, weight, from: { ...from }, to: { ...to } };
  }

  /**
   * Whether an action applies a shift: one resolves and its weight is above 0.
   *
   * @param params The action's params; none when absent.
   * @param law The action's law; it recommends none when absent.
   * @returns Whether a balancing shift applies.
   * @throws {HumanRefusal} As `shift` does.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the condition.
   * @evidence contracts/development/implementation.md#principled-implementation The resolved shift and its weight; a weight of 0 shifts nothing.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One resolution, one comparison.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Absent is none.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A reading.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function balanced(params?: IBalanced, law?: ILaw): boolean {
    const resolved: Shift = shift(params, law);
    return resolved !== null && resolved.weight > 0;
  }

  /**
   * A bound as the scheduled instants name theirs: the event of the action
   * or cue it names, this action's when it names none.
   *
   * @param bound The bound.
   * @param own This action's id (`IAutoMovieMotionHumanSegment.id`).
   * @returns The scheduled instant the performance resolves.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the mapping and its default.
   * @evidence contracts/development/implementation.md#principled-implementation The same representation the layers and cue tracks resolve, so one resolver reads every instant.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No share of a duration names an instant.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A reading.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh record; retains nothing.
   */
  export function instant(
    bound: IAutoMovieMotionHumanBalanceOption.IBound,
    own: string,
  ): AutoMovieMotionHumanScheduledInstant {
    return {
      of: bound.of ?? own,
      event: bound.event,
      ...(bound.index === undefined ? {} : { index: bound.index }),
      ...(bound.offset === undefined ? {} : { offset: bound.offset }),
    };
  }

  /**
   * The share of the full balancing shift applied at a film second: the
   * shift's weight between its two resolved bounds, 0 outside them or where
   * no shift applies. The shift is one closed-form evaluation scaled by
   * this, never iterated.
   *
   * @param resolved The action's shift (`shift`).
   * @param seconds Film seconds.
   * @param own This action's id, for bounds that name no action.
   * @param resolve The scheduled-instant resolver (`HumanPerformance.instant`).
   * @returns The weight applied there, 0 to 1.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The shift's own weight between its event-named bounds, resolved by the performance's one instant resolver.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two instants, one comparison.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No ramp of its own: the shift's terms alone.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two instant resolutions a call.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A reading.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function weight(resolved: Shift, seconds: number, own: string, resolve: Instant): number {
    if (resolved === null) return 0;
    const from: number = resolve(instant(resolved.from, own));
    const to: number = resolve(instant(resolved.to, own));
    return from <= seconds && seconds <= to ? resolved.weight : 0;
  }

  /**
   * Whether the audit judges the body's balance over an action: the span
   * says so (`IAutoMovieMotionHumanAuditMotion.ISpan.physical`), or, for a
   * placed action read as a span, its law stages a physical outcome or it
   * applies a shift.
   *
   * @param span The action as the audit reads it.
   * @returns Whether its balance is judged.
   * @throws {HumanRefusal} As `shift` does.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the three sources and their order.
   * @evidence contracts/development/implementation.md#principled-implementation A span's own flag first; a placed action carries its law and params, read by the same option.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One flag, one law field, one resolution.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing else turns the check on; a planted, posed action is not judged.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A reading.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function judged(span: ISpan): boolean {
    if (span.physical !== undefined) return span.physical;
    return span.law?.physical === true || balanced(span.params, span.law);
  }

  /** The refusal of a balance missing a field neither the caller nor the law gives. */
  function missing(field: string): HumanRefusal {
    return new HumanRefusal({
      kind: "parameter",
      axis: `balance.${field}`,
      value: undefined,
      feasible: null,
      reason: `the balance needs its ${field}, and the law recommends none`,
      fix: `give balance.${field}, or leave the balance out`,
    });
  }
}
