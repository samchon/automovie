import type { AutoMovieScheduleError } from "@automovie/engine";
import type { IAutoMovieMotionHumanRefusal } from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanHitTrack } from "./HumanHitTrack";

/**
 * The refusal of a schedule error.
 *
 * @param error The resolver's error.
 * @param instance Which occurrence of an action in its performer's chain is
 *   being placed, from 1.
 * @returns The located refusal, or the error itself when it reports laws that
 *   gave an invalid timing or lack a function, which no change to the
 *   composition repairs.
 */
export function HumanScheduleRefusal(
  error: AutoMovieScheduleError,
  instance: (subject: string, capability: string) => number,
): Error {
  const where: Partial<IAutoMovieMotionHumanRefusal.IWhere> =
    error.subject === undefined || error.capability === undefined
      ? {}
      : {
          performer: error.subject,
          act: error.capability,
          instance: instance(error.subject, error.capability),
        };
  const alternatives: IAutoMovieMotionHumanRefusal.IAlternatives = {
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
      // An empty hit track names no instant at all: no strike placed
      // before this action reaches the struck body.
      if (
        error.of?.startsWith(HumanHitTrack.PREFIX) === true &&
        error.alternatives.length === 0
      )
        return new HumanRefusal({
          ...where,
          kind: "participant",
          axis: "hit",
          value: error.of,
          feasible: null,
          reason: `no strike placed before this action reaches ${error.of.slice(HumanHitTrack.PREFIX.length)}, so ${error.of} has no instant yet`,
          fix: "compose the strikers' chains first and this reaction in a chain of its own after them, or aim a strike that reaches the struck body",
        });
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
