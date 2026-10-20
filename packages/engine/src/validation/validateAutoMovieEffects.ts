import {
  IAutoMovieCompiledEffect,
  IAutoMovieCompiledShotSource,
  IAutoMovieDiagnostic,
  IAutoMovieShotContract,
  IAutoMovieShotEffectCue,
  IAutoMovieShotEventContract,
} from "@automovie/interface";

import { compareCodeUnits } from "../text/compareCodeUnits";
import { engineDiagnostic } from "./engineDiagnostic";

/**
 * Validate cue ids, intervals, intensities, compiled stream correspondence, event inclusion and same-zone ordering.
 *
 * @evidence contracts/common.md#principled-implementation Validate cue ids, intervals, intensities, compiled stream correspondence, event inclusion and same-zone ordering.
 * @evidence contracts/common.md#clear-and-simple-design Shot-local maps index events/samples while deterministic zone/start/id sorting exposes interval checks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The 128-cue policy reports excess without truncating; stream existence is metadata admission, not provider simulation.
 * @evidence contracts/common.md#meaningful-documentation Diagnostic field addresses identify source cues and preserve half-open event membership.
 * @evidence contracts/performance.md#efficient-algorithms C sorting costs O(C log C); repeated compiled-effect find costs O(CF), plus event/sample indexing and id text.
 * @evidence contracts/performance.md#reuse-equivalent-work Event/sample maps are request-local; prior-zone records are shared only within this validation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Maps, sorted wrappers and diagnostics grow with the supplied shot; only diagnostics return and no native stream is created.
 */
export const validateAutoMovieEffects: (
  contract: IAutoMovieShotContract,
  value: IAutoMovieCompiledShotSource,
) => IAutoMovieDiagnostic[] = (
  contract: IAutoMovieShotContract,
  value: IAutoMovieCompiledShotSource,
): IAutoMovieDiagnostic[] => {
  const diagnostics: IAutoMovieDiagnostic[] = [];
  const fail: (field: string, expectation: string) => void = (
    field: string,
    expectation: string,
  ): void => {
    diagnostics.push(engineDiagnostic(contract.id, field, expectation));
  };
  const cues: IAutoMovieShotEffectCue[] = value.effectCues ?? [];
  if (cues.length > 128)
    fail("effectCues", "must contain at most 128 bounded zone activations");
  const ids: Set<string> = new Set<string>();
  const priorByZone: Map<string, IAutoMovieShotEffectCue> = new Map<
    string,
    (typeof cues)[number]
  >();
  const events: Map<string, IAutoMovieShotEventContract> = new Map(
    contract.events.map(
      (
        event: IAutoMovieShotEventContract,
      ): [string, IAutoMovieShotEventContract] => [event.id, event],
    ),
  );
  const samples: Map<string, number> = new Map(
    value.eventSamples.map(
      (sample: { id: string; time: number }): [string, number] => [
        sample.id,
        sample.time,
      ],
    ),
  );
  for (const cue of [...cues].sort(
    (left: IAutoMovieShotEffectCue, right: IAutoMovieShotEffectCue): number =>
      compareCodeUnits(left.zone, right.zone) ||
      left.start - right.start ||
      compareCodeUnits(left.id, right.id),
  )) {
    const field: string = `effectCue:${cue.id || "(blank)"}`;
    if (cue.id.trim().length === 0 || ids.has(cue.id))
      fail(field, "must have one non-blank id unique inside the shot");
    ids.add(cue.id);
    const compiled: IAutoMovieCompiledEffect | undefined = value.effects.find(
      (effect: IAutoMovieCompiledEffect): boolean => effect.id === cue.id,
    );
    if (compiled === undefined || compiled.zone !== cue.zone)
      fail(
        `${field}.zone`,
        `must reference one current builder-materialized world zone "${cue.zone}"`,
      );
    if (
      Number.isFinite(cue.start) === false ||
      Number.isFinite(cue.end) === false ||
      cue.start < 0 ||
      cue.end <= cue.start ||
      cue.end > contract.durationSeconds
    )
      fail(
        `${field}.time`,
        `must be one positive interval inside 0..${contract.durationSeconds}s`,
      );
    if (
      [cue.intensity.from, cue.intensity.to].some(
        (intensity: number): boolean =>
          Number.isFinite(intensity) === false ||
          intensity < 0 ||
          intensity > 1,
      )
    )
      fail(`${field}.intensity`, "must stay inside the bounded 0..1 envelope");
    if (cue.event !== undefined) {
      const event: IAutoMovieShotEventContract | undefined = events.get(
        cue.event,
      );
      const sample: number | undefined = samples.get(cue.event);
      if (
        event === undefined ||
        sample === undefined ||
        sample < cue.start ||
        sample >= cue.end
      )
        fail(
          `${field}.event`,
          `must name one compiled event realized inside [${cue.start}, ${cue.end})`,
        );
    }
    const prior: IAutoMovieShotEffectCue | undefined = priorByZone.get(
      cue.zone,
    );
    if (prior !== undefined && cue.start < prior.end)
      fail(
        `${field}.start`,
        `must not overlap prior zone cue "${prior.id}" ending at ${prior.end}s`,
      );
    priorByZone.set(cue.zone, cue);
  }
  if (
    value.effects.length !== cues.length ||
    value.effects.some(
      (effect: IAutoMovieCompiledEffect): boolean =>
        ids.has(effect.id) === false,
    )
  )
    fail(
      "effects",
      "must contain exactly one builder-owned stream for every source cue",
    );
  return diagnostics;
};
