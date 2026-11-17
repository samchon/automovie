import type {
  IAutoMovieCaptureInstant,
  IAutoMovieCaptureSubject,
} from "@automovie/interface";
import { planAutoMovieCaptureFrames } from "@automovie/render";

import { ArchetypeRoundPlan as Round } from "./ArchetypeRoundPlan";
import { ArchetypeRoundTiming } from "./ArchetypeRoundTiming";

/**
 * Resolve the reviewed archetype purpose groups into actual time/pass requests.
 *
 * @param props The admitted plan, its groups, cached actual-subject reader and shared failure collector.
 * @returns Draft requests, ordinary reused cells and the four explicit fresh-session comparisons.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the finite 28-purpose inspection scope, actual clock/event inputs, native time normalization, duplicate-cell reuse, existing restart-anchor job separation and failure collection.
 * @evidence contracts/development/implementation.md#principled-implementation Purpose recipes read actual subject durations and instants; native frame planning owns rounding and event windows. A steady stride uses consecutive leftForeOn events inside cruise/brake, and source depart/stop events set the three towing branches. The source plan supplies static identities and finite allowances.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One expansion dispatch serves the existing purpose groups; timing, request admission and source-field readers stay separate. Source preparation and lifetime remain with the injected reader.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No neutral replacement, guessed missing event or dropped required frame repairs unavailable evidence. Millisecond filename collisions split requests rather than discard distinct instants; authored inspection choices remain review content.
 * @evidence contracts/development/implementation.md#efficient-algorithms Expansion stores the finite requested cells and scans only the actual event lists. Cell identity deduplication uses one Set; rare filename collisions distribute cells into separate native jobs without changing their count.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Actual subject preparation is reused through get; ordinary identical cells reuse the original evidence while explicit fresh-session comparisons retain their requested repeated draw.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The function owns plain request arrays and a finite identity set for this call. It borrows actual scenes through get and opens no renderer, process, file or handle.
 */
export async function materializeArchetypeRoundGroups(props: {
  plan: Record<string, unknown>;
  groups: readonly Record<string, unknown>[];
  get: (name: string) => Promise<Round.IPrepared>;
  failures: Round.IFailure[];
}): Promise<{
  drafts: Round.IDraft[];
  reused: { group: string; cell: string }[];
  comparisons: { repeatGroup: string; originalCell: string }[];
}> {
  const plan: Record<string, unknown> = props.plan;
  const get: typeof props.get = props.get;
  const failures: Round.IFailure[] = props.failures;
  const drafts: Round.IDraft[] = [];
  const reused: { group: string; cell: string }[] = [];
  const comparisons: { repeatGroup: string; originalCell: string }[] = [];
  const seen: Set<string> = new Set();
  for (const group of props.groups) {
    const id: string = Round.text(group.id);
    const before: number = drafts.reduce(
      (sum: number, item: Round.IDraft): number =>
        sum + (item.group === id ? item.seconds.length : 0),
      0,
    );
    await attempt(id, async (): Promise<void> => {
      await expand(group);
      const count: number =
        drafts.reduce(
          (sum: number, item: Round.IDraft): number =>
            sum + (item.group === id ? item.seconds.length : 0),
          0,
        ) - before;
      if (count > Round.number(group.maximumCells))
        throw new Error(
          `${count} cells exceed purpose allowance ${String(group.maximumCells)}`,
        );
    });
  }
  return { drafts, reused, comparisons };

  /** Expand only the reviewed purpose recipes; no generic recipe language is introduced. */
  async function expand(g: Record<string, unknown>): Promise<void> {
    const id: string = Round.text(g.id);
    if (id === "gait-anchors" || id === "representative-full-gait-cycles") {
      for (const input of Round.list(plan.motionConsumers)) {
        const item: Record<string, unknown> = Round.object(input);
        const name: string = Round.text(item.subject);
        if (id !== "gait-anchors" && !Round.strings(g.consumers).includes(name))
          continue;
        await attempt(`${id}/${name}`, async (): Promise<void> => {
          const meta: IAutoMovieCaptureSubject = (await get(name)).metadata;
          const pair: [number, number] = ArchetypeRoundTiming.stride(meta);
          const times: number[] =
            id === "gait-anchors"
              ? [
                  pair[0],
                  Math.round(((pair[0] + pair[1]) / 2) * meta.fps) / meta.fps,
                ]
              : ArchetypeRoundTiming.sample(
                  meta,
                  pair[0],
                  pair[1],
                  name === "ride-dog-gallop" ? 10 : 5,
                  (meta.instants ?? [])
                    .filter(
                      (event: IAutoMovieCaptureInstant): boolean =>
                        event.label.endsWith("On") &&
                        event.seconds >= pair[0] &&
                        event.seconds <= pair[1],
                    )
                    .map(
                      (event: IAutoMovieCaptureInstant): number =>
                        event.seconds,
                    ),
                  [pair[1]],
                );
          await add(
            g,
            name,
            Round.text(item.member),
            times,
            ["right"],
            id === "gait-anchors"
              ? triplet(
                  name.startsWith("ride-equipped-") ? "equipment" : "animal",
                )
              : ["rigOverlay"],
          );
        });
      }
      return;
    }
    if (id.startsWith("rest-")) {
      for (const input of Round.list(Round.object(plan.subjects).rest)) {
        const item: Record<string, unknown> = Round.object(input);
        const name: string = Round.text(item.subject);
        await attempt(`${id}/${name}`, async (): Promise<void> => {
          const meta: IAutoMovieCaptureSubject = (await get(name)).metadata;
          const times: number[] =
            id === "rest-side-complete"
              ? ArchetypeRoundTiming.sample(
                  meta,
                  0,
                  meta.durationSeconds,
                  5,
                  [
                    0,
                    ...(meta.instants ?? []).map(
                      (event: IAutoMovieCaptureInstant): number =>
                        event.seconds,
                    ),
                  ],
                  [meta.durationSeconds],
                )
              : Round.numbers(g.atSeconds);
          const views: string[] =
            id === "rest-fresh-session-comparison"
              ? ["right"]
              : Round.strings(g.views);
          await add(g, name, Round.text(item.member), times, views, passes(g));
        });
      }
      return;
    }
    if (id === "equipment-bearing-closeups") {
      for (const input of Round.list(g.regions)) {
        const item: Record<string, unknown> = Round.object(input);
        await attempt(
          `${id}/${Round.text(item.member)}/${Round.text(item.focus)}`,
          async (): Promise<void> => {
            await add(
              g,
              Round.text(g.subject),
              Round.text(item.member),
              Round.numbers(g.atSeconds),
              [`${Round.text(item.view)}@focus=${Round.text(item.focus)}`],
              passes(g),
            );
          },
        );
      }
      return;
    }
    if (id === "siege-mechanism-events") {
      for (const name of Round.strings(g.consumers)) {
        await attempt(`${id}/${name}`, async (): Promise<void> => {
          const meta: IAutoMovieCaptureSubject = (await get(name)).metadata;
          const release: number = ArchetypeRoundTiming.event(
            meta,
            "projectile-release",
          );
          const member: string = name
            .replace("siege-", "")
            .replace("-throw", "-arm");
          await add(
            g,
            name,
            member,
            [
              ArchetypeRoundTiming.event(meta, "pin-release"),
              release,
              ArchetypeRoundTiming.event(meta, "arm-track-end"),
            ],
            ["right"],
            triplet("nonanimal"),
          );
          const frame: number = release * meta.fps;
          const before: number =
            (Number.isInteger(frame) ? frame - 1 : Math.floor(frame)) /
            meta.fps;
          const after: number =
            (Number.isInteger(frame) ? frame + 1 : Math.ceil(frame)) / meta.fps;
          await add(
            g,
            name,
            member,
            [before, after],
            ["right"],
            ["geometryOverlay"],
          );
        });
      }
      return;
    }
    if (id === "rowing-representative-cycle") {
      for (const name of Round.strings(g.consumers)) {
        await attempt(`${id}/${name}`, async (): Promise<void> => {
          const meta: IAutoMovieCaptureSubject = (await get(name)).metadata;
          const end: number = ArchetypeRoundTiming.event(meta, "catch1");
          const anchors: number[] = [0, end / 2, end];
          await add(
            g,
            name,
            "rowboat",
            anchors,
            ["right"],
            triplet("nonanimal"),
          );
          if (name.endsWith("-sea"))
            await add(
              g,
              name,
              "rowboat",
              ArchetypeRoundTiming.sample(meta, 0, end, 5, [0, end], [end]),
              ["right"],
              ["geometryOverlay"],
            );
        });
      }
      return;
    }
    if (id === "towing-coupling") {
      for (const input of Round.list(g.branches)) {
        const branch: Record<string, unknown> = Round.object(input);
        const name: string = Round.text(branch.subject);
        await attempt(`${id}/${name}`, async (): Promise<void> => {
          const meta: IAutoMovieCaptureSubject = (await get(name)).metadata;
          const start: number = ArchetypeRoundTiming.event(meta, "depart");
          const end: number = ArchetypeRoundTiming.event(meta, "stop");
          const member: string = Round.text(branch.member);
          await add(
            g,
            name,
            member,
            [(start + end) / 2],
            ["right"],
            triplet("nonanimal"),
          );
          await add(
            g,
            name,
            member,
            [start, end],
            [`three-quarter@focus=set/${member}`],
            ["surface"],
          );
        });
      }
      return;
    }
    const names: string[] =
      g.members === undefined
        ? g.membersRef === undefined
          ? [""]
          : Round.strings(reference(Round.text(g.membersRef)))
        : Round.strings(g.members);
    for (const member of names)
      await attempt(`${id}/${member}`, async (): Promise<void> => {
        await add(
          g,
          Round.text(g.subject),
          member || (g.member === undefined ? "" : Round.text(g.member)),
          Round.numbers(g.atSeconds),
          Round.strings(g.views),
          passes(g),
        );
      });
    if (id === "actual-cannon-release")
      await add(
        g,
        Round.text(g.subject),
        Round.text(g.member),
        Round.numbers(Round.object(g.closeup).atSeconds),
        ["right@ortho@focus=set/field-gun-and-shot/affordance/cannon/muzzle"],
        triplet("nonanimal"),
      );
  }

  /** Finish every independent consumer in the round before refusing the manifest. */
  async function attempt(
    group: string,
    operation: () => Promise<void>,
  ): Promise<void> {
    try {
      await operation();
    } catch (error) {
      failures.push({ group, cause: Round.describe(error) });
    }
  }

  /** Append supported native requests and reuse identical non-restart evidence cells. */
  async function add(
    g: Record<string, unknown>,
    name: string,
    member: string,
    times: number[],
    views: string[],
    passIds: string[],
  ): Promise<void> {
    const meta: IAutoMovieCaptureSubject = (await get(name)).metadata;
    const actual: number[] = planAutoMovieCaptureFrames({
      durationSeconds: meta.durationSeconds,
      fps: meta.fps,
      sampling: { kind: "at", seconds: times },
      events: [],
      cuts: [],
      window: 0,
    }).times.map((time: { seconds: number }): number => time.seconds);
    for (const written of views)
      for (const pass of passIds) {
        const view: string =
          written === "right" || written === "three-quarter"
            ? `${written}@ortho@focus=set/${member}`
            : written.replaceAll("{member}", member);
        const seconds: number[] = [];
        for (const time of actual) {
          if (!Number.isFinite(time) || time < 0 || time > meta.durationSeconds)
            throw new Error(`${name} cannot supply ${time}s`);
          const cell: string = JSON.stringify([name, member, view, pass, time]);
          const repeat: boolean =
            Round.text(g.id) === "rest-fresh-session-comparison";
          if (repeat) {
            if (!seen.has(cell))
              throw new Error(
                `Fresh-session comparison lacks its original ${cell}`,
              );
            comparisons.push({
              repeatGroup: Round.text(g.id),
              originalCell: cell,
            });
          }
          if (!repeat && seen.has(cell))
            reused.push({ group: Round.text(g.id), cell });
          else {
            seen.add(cell);
            seconds.push(time);
          }
        }

        // Existing restart anchors form the same two-time job as their repeat.
        // All other original cells remain; native millisecond collisions split
        // into further jobs without dropping an exact instant.
        const buckets: number[][] = [];
        const restartTimes: number[] = Round.numbers(
          Round.object(plan.restartComparison).atSeconds,
        );
        const batches: number[][] =
          Round.text(g.id) === "rest-side-complete"
            ? [
                seconds.filter((time: number): boolean =>
                  restartTimes.includes(time),
                ),
                seconds.filter(
                  (time: number): boolean => !restartTimes.includes(time),
                ),
              ]
            : [seconds];
        for (const batch of batches) {
          const firstBucket: number = buckets.length;
          for (const time of batch) {
            let bucket: number[] | undefined = buckets.find(
              (values: number[], index: number): boolean =>
                index >= firstBucket &&
                values.every(
                  (value: number): boolean =>
                    value.toFixed(3) !== time.toFixed(3),
                ),
            );
            if (bucket === undefined) {
              bucket = [];
              buckets.push(bucket);
            }
            bucket.push(time);
          }
        }
        for (const bucket of buckets)
          drafts.push({
            group: Round.text(g.id),
            subject: name,
            member,
            view,
            pass,
            seconds: bucket,
          });
      }
  }

  /** Existing plan pass identities are resolved once, without interpreting prose as a command. */
  function passes(g: Record<string, unknown>): string[] {
    return g.triplet === undefined
      ? Round.strings(g.passIds)
      : triplet(Round.text(g.triplet));
  }

  /** Match the reviewed plan's surface/overlay/alone recipe list. */
  function triplet(name: string): string[] {
    return Round.strings(Round.object(plan.triplets)[name]);
  }

  /** Resolve the plan's existing static-member references only. */
  function reference(written: string): unknown {
    let value: unknown = plan;
    for (const name of written.split(".")) value = Round.object(value)[name];
    return value;
  }
}
