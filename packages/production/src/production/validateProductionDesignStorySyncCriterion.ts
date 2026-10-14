import type { IAutoMovieProductionDesignGraph } from "./IAutoMovieProductionDesignGraph";
import { validateProductionDesignInvalid } from "./validateProductionDesignInvalid";
import { validateProductionDesignMissing } from "./validateProductionDesignMissing";
import { IAutoMovieDiagnostic, IAutoMovieAcceptanceScenario, IAutoMovieShotContract, IAutoMovieShotEventContract, IAutoMovieShotStoryTime } from "@automovie/interface";
import { autoMovieStoryInterval } from "@automovie/engine";

/**
 * Check film ownership, story-clock and event addressability before mapping finite positive-rate pins.
 *
 * @evidence contracts/common.md#principled-implementation Complete mapped event windows have minimum attainable spread max(0, latest opening minus earliest closing); an inclusive tolerance below that spread is unsatisfiable. Missing or unusable dependencies suppress derived infeasibility without repairing them.
 * @evidence contracts/common.md#clear-and-simple-design Acceptance dispatch delegates cross-shot window feasibility here; the engine owns affine story mapping and runtime realized-event comparison remains a later gate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation Defines film ownership, duplicate/address/pin refusals, seconds and inclusive tolerance, plus suppression when a dependency is unusable; findings append without changing windows, pins or the criterion.
 * @evidence contracts/performance.md#efficient-algorithms E addressed events scan their shots' event arrays and retain O(E) mapped windows and address keys; extrema scan complete usable windows. The retained array-spread extrema also depend on the runtime argument limit, without an event-count cap.
 * @evidence contracts/performance.md#reuse-equivalent-work Each resolved shot/event/pin supplies one mapped window, and that retained window population supplies both extrema; duplicate keys share only current membership and no earlier feasibility result is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Address keys, mapped windows and extrema arrays are input-sized locals without an event cap; appended findings remain in the caller's array. No realized event, native handle or task is retained here.
 */
export const validateProductionDesignStorySyncCriterion: (diagnostics: IAutoMovieDiagnostic[], graph: IAutoMovieProductionDesignGraph, acceptance: IAutoMovieAcceptanceScenario, criterion: Extract<IAutoMovieAcceptanceScenario["criterion"], { kind: "story-sync"; }>, target: string, file: string) => void = (
  diagnostics: IAutoMovieDiagnostic[],
  graph: IAutoMovieProductionDesignGraph,
  acceptance: IAutoMovieAcceptanceScenario,
  criterion: Extract<
    IAutoMovieAcceptanceScenario["criterion"],
    { kind: "story-sync" }
  >,
  target: string,
  file: string,
): void => {
  const id: string = acceptance.id;
  if (acceptance.target.kind !== "film")
    validateProductionDesignInvalid(
      diagnostics,
      "design-target-invalid",
      target,
      file,
      `Acceptance "${id}" compares events across shots, so no single shot owns it. Change ${id}.target to the film, or state a shot-local event criterion instead.`,
    );
  if (graph.production !== null && graph.production.storyClock === undefined)
    validateProductionDesignInvalid(
      diagnostics,
      "design-story-clock-absent",
      target,
      file,
      `Acceptance "${id}" measures story time the production does not keep. Add storyClock to the tracked production design record, or remove ${id}.`,
    );
  const toleranceUsable: boolean =
    Number.isFinite(criterion.toleranceSeconds) &&
    criterion.toleranceSeconds >= 0;
  if (toleranceUsable === false)
    validateProductionDesignInvalid(
      diagnostics,
      "design-range-invalid",
      target,
      file,
      `criterion.toleranceSeconds must be a finite value of zero or above. Fix ${id}.criterion in the tracked acceptance record.`,
    );
  if (criterion.events.length < 2) {
    validateProductionDesignInvalid(
      diagnostics,
      "design-collection-cardinality-invalid",
      target,
      file,
      `Acceptance "${id}" must name at least two events; nothing is simultaneous on its own. Fix ${id}.criterion.events in the tracked acceptance record.`,
    );
    return;
  }
  const seen: Set<string> = new Set<string>();
  const windows: Array<{ from: number; to: number }> = [];
  for (const entry of criterion.events) {
    const key: string = `${entry.shot}\u0000${entry.event}`;
    if (seen.has(key))
      validateProductionDesignInvalid(
        diagnostics,
        "design-duplicate-id",
        target,
        file,
        `Event "${entry.event}" of shot "${entry.shot}" appears twice in ${id}.criterion.events. An event is always simultaneous with itself; name each addressed event once.`,
      );
    seen.add(key);
    const shot: IAutoMovieShotContract | undefined = graph.shots.get(entry.shot);
    if (shot === undefined) {
      validateProductionDesignMissing(
        diagnostics,
        target,
        file,
        `shot "${entry.shot}"`,
        `Create or correct the shot contract record for "${entry.shot}" or change ${id}.criterion.events`,
      );
      continue;
    }
    const event: IAutoMovieShotEventContract | undefined = shot.events.find((candidate: IAutoMovieShotEventContract): boolean => candidate.id === entry.event);
    if (event === undefined) {
      validateProductionDesignMissing(
        diagnostics,
        target,
        file,
        `event "${entry.event}" in shot "${entry.shot}"`,
        `add that event to ${entry.shot}.events or change ${id}.criterion.events`,
      );
      continue;
    }
    const pin: IAutoMovieShotStoryTime | undefined = shot.storyTime;
    if (pin === undefined) {
      validateProductionDesignInvalid(
        diagnostics,
        "design-story-pin-missing",
        target,
        file,
        `Shot "${entry.shot}" carries no story-clock pin, so event "${entry.event}" has no story time to compare. Add storyTime to the tracked shot contract record for "${entry.shot}", or drop it from ${id}.criterion.events.`,
      );
      continue;
    }
    // An unusable pin is already diagnosed on its own shot. Mapping a window
    // through it would produce a second, derived complaint about a number the
    // author has yet to fix, so the reachability question waits for a pin that
    // can answer it.
    if (
      Number.isFinite(pin.originSeconds) === false ||
      (pin.rate !== undefined &&
        (Number.isFinite(pin.rate) === false || pin.rate <= 0))
    )
      continue;
    windows.push(autoMovieStoryInterval(pin, event.window));
  }
  if (
    toleranceUsable === false ||
    windows.length !== criterion.events.length ||
    windows.some(
      (window: { from: number; to: number; }): boolean =>
        Number.isFinite(window.from) === false ||
        Number.isFinite(window.to) === false ||
        window.from > window.to,
    )
  )
    return;
  // Every realized time is confined to its own mapped window, so the closest
  // the events can possibly be placed is the latest window opening minus the
  // earliest window closing. Nothing below zero: overlapping windows can always
  // coincide exactly.
  const latestOpening: number = Math.max(...windows.map((window: { from: number; to: number; }): number => window.from));
  const earliestClosing: number = Math.min(...windows.map((window: { from: number; to: number; }): number => window.to));
  const closest: number = Math.max(0, latestOpening - earliestClosing);
  if (closest > criterion.toleranceSeconds)
    validateProductionDesignInvalid(
      diagnostics,
      "design-story-sync-unsatisfiable",
      target,
      file,
      `Acceptance "${id}" claims simultaneity within ${criterion.toleranceSeconds}s, but the declared event windows cannot come closer than ${closest}s on the story clock, so no source could ever satisfy it. Widen the windows, repin a shot, or raise ${id}.criterion.toleranceSeconds.`,
    );
};
