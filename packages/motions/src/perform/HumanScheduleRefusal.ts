import type { AutoMovieScheduleError } from "@automovie/engine";

import { HumanRefusal } from "../law/HumanRefusal";

/**
 * A composition the engine's schedule resolver could not place, as the
 * refusal its author repairs from.
 *
 * The resolver knows anchors, events and cue tracks but not performers and
 * actions, so it throws its own error with those as fields. The performance
 * owns what they mean to an author: a missing anchor is an action composed
 * too late or never anchored, a missing event is a misspelt instant, a
 * duplicate anchor is two actions under one id.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is converted, why the performance owns the conversion and what each error means to an author.
 * @evidence contracts/development/design.md#principled-representation One function from the engine's closed error codes to the refusal classes of `HumanRefusal.Kind`.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function, read by `HumanPerformance` where it resolves the schedule.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The fields are read, never the message; an error that reports a defective law instead of a composition is returned as it is.
 */
export namespace HumanScheduleRefusal {
  /**
   * The refusal of a schedule error.
   *
   * @param error The resolver's error.
   * @param instance Which occurrence of an action in its performer's chain is being placed, from 1.
   * @returns The located refusal, or the error itself when it reports laws that gave an invalid timing or lack a function, which no change to the composition repairs.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the result and which errors pass through.
   * @evidence contracts/development/implementation.md#principled-implementation Each code maps to the refusal class repaired at the same place: a missing anchor is a missing participant, a wrong event, index or duplicate id is a parameter, a cut outside the span is a cut.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One switch over the code, each arm one refusal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A duplicate anchor lists no alternatives, because the ids in use are exactly what the new one must differ from; they are named in the reason instead.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function of(
    error: AutoMovieScheduleError,
    instance: (subject: string, capability: string) => number,
  ): Error {
    const where: Partial<HumanRefusal.IWhere> =
      error.subject === undefined || error.capability === undefined
        ? {}
        : {
            performer: error.subject,
            act: error.capability,
            instance: instance(error.subject, error.capability),
          };
    const alternatives: HumanRefusal.IAlternatives = {
      kind: "alternatives",
      values: error.alternatives,
    };
    switch (error.code) {
      case "anchor":
        return new HumanRefusal({
          ...where,
          kind: "participant",
          axis: "of",
          value: error.value,
          feasible: alternatives,
          reason: `nothing is anchored ${error.value} earlier in the composition, and no cue track has that name`,
          fix: `give the action this one waits for the anchor ${error.value} and compose it earlier, or name one of the anchors and cue tracks listed`,
        });
      case "event":
        return new HumanRefusal({
          ...where,
          kind: "parameter",
          axis: "event",
          value: error.value,
          feasible: alternatives,
          reason:
            error.value === ""
              ? `${error.of} is a cue track, so an instant of it must be named`
              : `${error.of ?? error.capability ?? "the action"} has no instant named ${error.value}`,
          fix: "name one of the instants listed",
        });
      case "index":
        return new HumanRefusal({
          ...where,
          kind: "parameter",
          axis: "index",
          value: error.value,
          feasible: {
            kind: "range",
            minimum: 0,
            maximum: error.alternatives.length - 1,
            unit: "",
            whole: true,
          },
          reason: `${error.of} has ${error.alternatives.length} instants of that name, counted from 0`,
          fix: "name an occurrence the anchor or track has",
        });
      case "duplicate":
        return new HumanRefusal({
          ...where,
          kind: "parameter",
          axis: "anchor",
          value: error.value,
          reason: `the anchor ${error.value} is already taken by an earlier action or a cue track (in use: ${error.alternatives.join(", ")})`,
          fix: "give every anchored action an id of its own, different from every cue track's name",
        });
      case "share":
        return new HumanRefusal({
          ...where,
          kind: "cut",
          axis: "until",
          value: error.value,
          feasible: { kind: "range", minimum: 0, maximum: 1, unit: "" },
          reason: `the cut falls at share ${Number(error.value).toFixed(3)} of the action${
            error.of === undefined ? "" : `, where ${error.of} has its instant`
          }, outside the action's own span`,
          fix: "cut on an instant that falls while the action runs, or give a share from 0 to 1",
        });
      case "timing":
      case "law":
        return error;
    }
  }
}
