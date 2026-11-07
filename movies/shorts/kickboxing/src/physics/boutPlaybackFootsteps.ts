import {
  type AutoMoviePhysicsCache as Cache,
  type AutoMoviePhysicalPlayback as Playback,
  physicalShapeBounds,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalProfile as P,
  IAutoMovieContactReceipt as Receipt,
} from "@automovie/interface";

import type { FilmPlan } from "../shots/kickboxing/ring-bout/FilmPlan";
import { BoutPhysicalSettings as Settings } from "./BoutPhysicalSettings";
import { boutCacheInterval } from "./boutCacheInterval";
import { boutFootfallObservations } from "./boutFootfallObservations";

/** Derive audible arrivals from actual airborne feet and floor observations. Recovery uses confirmed controller landings; failed/cancelled requests and nominal reservation ends cannot supply a sound. Ownership belongs to the measured arrival, while audio may await its enclosing confirmation frame. A new arrival requires an observed airborne sample after prior native contact; multiple contacts inside one unsampled flight interval cannot establish another footstep. */
export function boutPlaybackFootsteps(input: {
  profiles: Readonly<Record<FilmPlan.ActorId, P>>;
  contacts: readonly Receipt[];
  recovery: Playback["recovery"];
  at: (seconds: number) => Cache.IFrame;
  startSeconds: number;
  duration: number;
  rate: number;
  mode: "simulated" | "kinematic";
  /** Authoritative native ownership on the local cache clock, including contact release and return. */ ownership?: (
    actor: FilmPlan.ActorId,
    bone: string,
    localSeconds: number,
  ) => "authored" | "return" | "dynamic";
  /** Actual transitions distinguish a new activation from a stale recovery attempt. Requires the same authoritative sampler. */ ownershipEvents?: readonly Cache.IOwnership[];
}): FilmPlan.Event[] {
  if (input.ownershipEvents && !input.ownership)
    throw new Error(
      "Footfall ownership transitions require the authoritative sampler",
    );
  const events: FilmPlan.Event[] = [];
  for (const actor of ["a", "b", "referee"] as const)
    for (const side of ["left", "right"] as const) {
      const bones: string[] = [
        `${side}Foot`,
        `${side}Subtalar`,
        `${side}Midfoot`,
      ];
      const observed: ReturnType<typeof boutFootfallObservations> =
        boutFootfallObservations(
          input.contacts,
          actor,
          bones,
          input.startSeconds,
          input.rate,
        );
      const nativeSeconds: number[] = [...observed.positive.values()]
        .flat()
        .map(
          (entry: { seconds: number; receipt: string }): number =>
            entry.seconds,
        );
      const state: Playback["recovery"][string] | undefined =
        input.recovery[actor];
      const usedRecoveries: Set<number> = new Set();
      const transitions: readonly Cache.IOwnership[] =
        input.ownershipEvents?.filter(
          (event: Cache.IOwnership): boolean =>
            event.body === actor && event.bone === `${side}Midfoot`,
        ) ?? [];
      /** Ownership is sampled at an actual observation, never inferred from a recovery record. */
      const owner: (local: number) => Cache.IOwnership["kind"] = (
        local: number,
      ): Cache.IOwnership["kind"] =>
        input.ownership?.(actor, `${side}Midfoot`, local) ??
        (input.mode === "kinematic" ? "authored" : "dynamic");
      /** The latest actual request remains authoritative until a recorded handback. */
      const recoveryAt: (
        local: number,
      ) => NonNullable<typeof state>["steps"][number] | undefined = (
        local: number,
      ): NonNullable<typeof state>["steps"][number] | undefined =>
        [...(state?.steps ?? [])]
          .reverse()
          .find(
            (step: NonNullable<typeof state>["steps"][number]): boolean =>
              step.bone === `${side}Midfoot` && step.start <= local,
          );
      /** A new ownership epoch or controller handoff ends an old physical request. */
      const handedBack: (
        step: NonNullable<typeof state>["steps"][number],
        local: number,
      ) => boolean = (
        step: NonNullable<typeof state>["steps"][number],
        local: number,
      ): boolean =>
        owner(local) !== "dynamic" ||
        transitions.some(
          (event: Cache.IOwnership): boolean =>
            event.seconds > step.start &&
            event.seconds <= local &&
            event.kind !== "dynamic",
        ) ||
        state?.handoffs?.some(
          (
            handoff: NonNullable<NonNullable<typeof state>["handoffs"]>[number],
          ): boolean =>
            handoff.bone === step.bone &&
            handoff.seconds >= step.start &&
            handoff.seconds <= local,
        ) === true;
      /** A later Return must not relabel an earlier cancelled dynamic measurement. */
      const ordinaryNative: (entry: {
        seconds: number;
        receipt: string;
      }) => boolean = (entry: {
        seconds: number;
        receipt: string;
      }): boolean => {
        const local: number = entry.seconds - input.startSeconds;
        const step: ReturnType<typeof recoveryAt> = recoveryAt(local);
        return owner(local) === "dynamic" && (!step || handedBack(step, local));
      };
      for (const provenance of ["solver", "geometric"] as const) {
        const samples: Set<number> = observed.samples[provenance];
        const times: number[] = [...samples]
          .filter(
            (frame: number): boolean =>
              frame >= 0 && frame <= Math.round(input.duration * input.rate),
          )
          .sort((a: number, b: number): number => a - b);
        let previous: number = 0;
        for (const frame of times) {
          if (frame <= previous + 1) {
            previous = frame;
            continue;
          }
          const departure: number = previous;
          previous = frame;
          const local: number = frame / input.rate;
          const seconds: number = input.startSeconds + local;
          const measured: { seconds: number; receipt: string } | undefined =
            observed.positive.get(frame)?.find(ordinaryNative);
          const geometric: { seconds: number; receipt: string } | undefined =
            observed.geometry
              .get(frame)
              ?.find(
                (entry: { seconds: number; receipt: string }): boolean =>
                  owner(entry.seconds - input.startSeconds) !== "dynamic",
              );
          let recovery: ReturnType<typeof recoveryAt> = recoveryAt(local);
          const landing:
            | NonNullable<NonNullable<typeof state>["landings"]>[number]
            | undefined =
            recovery?.resolved?.status === "landed"
              ? state?.landings?.find(
                  (
                    entry: NonNullable<
                      NonNullable<typeof state>["landings"]
                    >[number],
                  ): boolean =>
                    entry.bone === recovery!.bone &&
                    entry.seconds >= recovery!.start &&
                    entry.seconds === recovery!.resolved!.seconds,
                )
              : undefined;
          const confirmed: number | undefined = landing
            ? boutCacheInterval(landing.seconds, 0, input.rate)
            : undefined;
          const nativeRecovery: boolean =
            !!recovery &&
            !!landing &&
            confirmed !== undefined &&
            confirmed >= frame &&
            observed.samples.solver.has(confirmed) &&
            owner(recovery.start) === "dynamic" &&
            owner(landing.seconds) === "dynamic" &&
            !transitions.some(
              (event: Cache.IOwnership): boolean =>
                event.seconds > recovery!.start &&
                event.seconds <= landing.seconds &&
                event.kind !== "dynamic",
            );
          let audible: number = seconds;
          let contactSeconds: number = seconds;
          let ownershipSeconds: number = seconds;
          let ownership: Cache.IOwnership["kind"] = owner(local);
          let recoverySeconds: number | undefined;
          if (nativeRecovery) {
            if (provenance !== "solver" || usedRecoveries.has(recovery!.start))
              continue;
            ownership = "dynamic";
            ownershipSeconds = input.startSeconds + landing!.seconds;
            audible = input.startSeconds + confirmed! / input.rate;
            recoverySeconds = ownershipSeconds;
            contactSeconds = Math.min(seconds, ownershipSeconds);
          } else {
            const measuredLocal: number =
              provenance === "geometric" && geometric
                ? geometric.seconds - input.startSeconds
                : local;
            recovery = recoveryAt(measuredLocal);
            const handed: boolean =
              !!recovery && handedBack(recovery, measuredLocal);
            if (handed) recovery = undefined;
            if (recovery) continue;
            if (provenance === "solver") {
              if (!measured) continue;
              ownership = "dynamic";
              contactSeconds = measured.seconds;
              ownershipSeconds = measured.seconds;
            } else {
              if (!geometric) continue;
              ownership = owner(measuredLocal);
              contactSeconds = geometric.seconds;
              ownershipSeconds = geometric.seconds;
            }
          }

          // A prior measured native contact ends flight, even if its recovery was cancelled.
          // A later geometric arrival therefore needs a new observed airborne sample.
          const priorNative: number =
            provenance === "geometric"
              ? nativeSeconds.reduce(
                  (latest: number, value: number): number =>
                    value <= ownershipSeconds
                      ? Math.max(latest, value - input.startSeconds)
                      : latest,
                  -Infinity,
                )
              : -Infinity;
          let airborne: boolean = false;
          for (
            let probe: number = departure + 1;
            probe < frame && !airborne;
            probe++
          ) {
            if (probe / input.rate <= priorNative) continue;
            const actual: Record<string, Cache.ISegment> = input.at(
              input.startSeconds + probe / input.rate,
            ).bodies[actor]!;
            const minimum: number = Math.min(
              ...input.profiles[actor].segments
                .filter((segment: P.ISegment): boolean =>
                  bones.includes(segment.bone),
                )
                .flatMap((segment: P.ISegment): number[] =>
                  segment.shapes.map(
                    (shape: P.IShape): number =>
                      physicalShapeBounds(actual[segment.bone]!, shape).min.y,
                  ),
                ),
            );
            airborne = minimum > Settings.floor + Settings.contactTolerance;
          }
          const receiptIds: string[] =
            provenance === "solver"
              ? [
                  ...new Set(
                    (
                      observed.positive.get(
                        boutCacheInterval(
                          audible,
                          input.startSeconds,
                          input.rate,
                        ),
                      ) ?? []
                    )
                      .filter(
                        (entry: {
                          seconds: number;
                          receipt: string;
                        }): boolean => nativeRecovery || ordinaryNative(entry),
                      )
                      .map(
                        (entry: { seconds: number; receipt: string }): string =>
                          entry.receipt,
                      ),
                  ),
                ]
              : [
                  ...new Set(
                    (observed.geometry.get(frame) ?? [])
                      .filter(
                        (entry: {
                          seconds: number;
                          receipt: string;
                        }): boolean => entry.seconds === ownershipSeconds,
                      )
                      .map(
                        (entry: { seconds: number; receipt: string }): string =>
                          entry.receipt,
                      ),
                  ),
                ];
          if (airborne && receiptIds.length) {
            if (nativeRecovery) usedRecoveries.add(recovery!.start);
            events.push({
              id: `step:${actor}:${side}:floor:${audible.toFixed(6)}`,
              seconds: audible,
              kind: "step",
              actorId: actor,
              footfall: {
                source: provenance,
                ownership,
                ownershipSeconds,
                bone: `${side}Midfoot`,
                contactSeconds,
                confirmedSeconds: audible,
                receiptIds,
                ...(recoverySeconds === undefined ? {} : { recoverySeconds }),
              },
            });
          }
        }
      }
    }
  return events.sort(
    (a: FilmPlan.Event, b: FilmPlan.Event): number =>
      a.seconds - b.seconds || a.id.localeCompare(b.id),
  );
}
