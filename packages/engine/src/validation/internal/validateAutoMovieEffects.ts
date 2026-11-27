import {
  IAutoMovieCompiledEffect,
  IAutoMovieCompiledShotSource,
  IAutoMovieDiagnostic,
  IAutoMovieShotContract,
  IAutoMovieShotEffectCue,
  IAutoMovieShotEventContract,
} from "@automovie/interface";

import { AutoMovieEngineText } from "../../text/AutoMovieEngineText";
import { engineDiagnostic } from "./engineDiagnostic";

/*
 * Validate cue ids, intervals, intensities, compiled stream correspondence,
 * event inclusion and same-zone ordering. Each source cue must match its unique
 * materialized stream's envelope and event binding. Event times must be finite
 * and inside the cue's half-open shot interval.
 */
export function validateAutoMovieEffects(
  contract: IAutoMovieShotContract,
  value: IAutoMovieCompiledShotSource,
): IAutoMovieDiagnostic[] {
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
  const streams: Map<string, IAutoMovieCompiledEffect> = new Map(
    value.effects.map(
      (
        effect: IAutoMovieCompiledEffect,
      ): [string, IAutoMovieCompiledEffect] => [effect.id, effect],
    ),
  );
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
      AutoMovieEngineText.compareCodeUnits(left.zone, right.zone) ||
      left.start - right.start ||
      AutoMovieEngineText.compareCodeUnits(left.id, right.id),
  )) {
    const field: string = `effectCue:${cue.id || "(blank)"}`;
    if (ids.has(cue.id)) fail(field, "must have one id unique inside the shot");
    ids.add(cue.id);
    const compiled: IAutoMovieCompiledEffect | undefined = streams.get(cue.id);
    if (compiled === undefined || compiled.zone !== cue.zone)
      fail(
        `${field}.zone`,
        `must reference one current builder-materialized world zone "${cue.zone}"`,
      );
    if (
      compiled !== undefined &&
      (compiled.start !== cue.start ||
        compiled.end !== cue.end ||
        compiled.intensity.from !== cue.intensity.from ||
        compiled.intensity.to !== cue.intensity.to ||
        compiled.event !== cue.event)
    )
      fail(
        `${field}.stream`,
        "must have the same interval, intensity envelope and event as its compiled stream",
      );
    if (
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
        (intensity: number): boolean => intensity < 0 || intensity > 1,
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
    streams.size !== value.effects.length ||
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
}
