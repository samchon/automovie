import type {
  IAutoMovieCaptureInstant,
  IAutoMovieCaptureSubject,
} from "@automovie/interface";
import { planAutoMovieCaptureFrames } from "@automovie/render";

/**
 * Clock timing rules of the current archetype inspection round.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States native frame sampling, steady-stride boundaries and required source events in subject seconds.
 * @evidence contracts/development/design.md#principled-representation Installed render metadata and numeric seconds represent the clock; the native planner validates finite grid inputs.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The purpose-group expander currently reads all three operations; no new action or biological timing table is introduced.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Source events and native frame planning remain authoritative rather than authored timing snapshots.
 */
export namespace ArchetypeRoundTiming {
  /**
   * Resolve native samples, event windows and explicit endpoints.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Inputs use subject seconds/fps, positive sample rate, numeric events and exact extra seconds.
   * @evidence contracts/development/implementation.md#principled-implementation Render's existing frame planner owns rounding, endpoint identity, event clipping and deduplication.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Plan even samples, then join them with explicit endpoints and event windows.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No absent event or approximate frame grid is fabricated here.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in samples/window frames plus the native planner's sort.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The installed native planner is reused for both stages.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only finite numeric arrays are returned; no scene or resource is owned.
   */
  export function sample(
    meta: IAutoMovieCaptureSubject,
    from: number,
    to: number,
    rate: number,
    events: number[],
    extra: number[],
  ): number[] {
    const times: number[] =
      from === to
        ? []
        : planAutoMovieCaptureFrames({
            durationSeconds: meta.durationSeconds,
            fps: meta.fps,
            sampling: { kind: "even", from, to, rate },
            events: [],
            cuts: [],
            window: 1,
          }).times.map((time: { seconds: number }): number => time.seconds);
    return planAutoMovieCaptureFrames({
      durationSeconds: meta.durationSeconds,
      fps: meta.fps,
      sampling: { kind: "at", seconds: [...times, ...extra] },
      events,
      cuts: [],
      window: 1,
    }).times.map((time: { seconds: number }): number => time.seconds);
  }

  /**
   * Find one complete steady left-fore stride.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Cruise/brake bound steady travel; flying-start subjects without those events use their full duration. Missing complete strides refuse.
   * @evidence contracts/development/implementation.md#principled-implementation Consecutive leftForeOn events inside the steady interval define the stride.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Filter and order landings, then take the first admissible adjacent pair.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No species period or pose snapshot replaces missing clock data.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the event count plus sorting its left-fore landings.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The immutable native description supplies every clock value.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The local event list and pair are plain data with no retained state.
   */
  export function stride(meta: IAutoMovieCaptureSubject): [number, number] {
    const events: readonly IAutoMovieCaptureInstant[] = meta.instants ?? [];
    const start: number =
      events.find(
        (item: IAutoMovieCaptureInstant): boolean => item.label === "cruise",
      )?.seconds ?? 0;
    const stop: number =
      events.find(
        (item: IAutoMovieCaptureInstant): boolean => item.label === "brake",
      )?.seconds ?? meta.durationSeconds;
    const on: number[] = events
      .filter(
        (item: IAutoMovieCaptureInstant): boolean =>
          item.label === "leftForeOn",
      )
      .map((item: IAutoMovieCaptureInstant): number => item.seconds)
      .sort((a: number, b: number): number => a - b);
    for (let k: number = 0; k + 1 < on.length; k++)
      if (on[k]! >= start && on[k + 1]! <= stop && on[k + 1]! > on[k]!)
        return [on[k]!, on[k + 1]!];
    throw new Error(`${meta.name} exposes no complete steady stride`);
  }

  /**
   * Read a required source-owned instant.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Returns the named subject second and refuses an absent event.
   * @evidence contracts/development/implementation.md#principled-implementation The native description owns labels and their subject timebase.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One exact label search.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No fallback second hides missing source evidence.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the event list.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The existing subject metadata is read without resampling.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources No process, scene or retained data is acquired.
   */
  export function event(meta: IAutoMovieCaptureSubject, label: string): number {
    const found: IAutoMovieCaptureInstant | undefined = meta.instants?.find(
      (item: IAutoMovieCaptureInstant): boolean => item.label === label,
    );
    if (found === undefined)
      throw new Error(`${meta.name} has no ${label} event`);
    return found.seconds;
  }
}
