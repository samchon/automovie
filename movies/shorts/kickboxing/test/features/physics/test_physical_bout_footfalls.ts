import type {
  AutoMoviePhysicsCache as Cache,
  AutoMoviePhysicalPlayback as Playback,
} from "@automovie/engine";
import type { IAutoMovieContactReceipt as Receipt } from "@automovie/interface";
import assert from "node:assert/strict";

import type { BoutFootsteps } from "../../../src/motion/footwork/BoutFootsteps";
import { boutPlaybackFootsteps } from "../../../src/physics/boutPlaybackFootsteps";
import { FilmEvents } from "../../../src/runtime/FilmEvents";
import type { FilmPlan } from "../../../src/shots/kickboxing/ring-bout/FilmPlan";
import { AudioMix } from "../../../src/sound/AudioMix";
import { BoutFootfallFixtures } from "../../internal/BoutFootfallFixtures";

/**
 * The audio adapter follows actual airborne-to-floor arrivals and contact provenance.
 *
 * Scenarios:
 * 1. A positive native sample moves the nominal step to actual contact; jitter, zero impulse and aggregate-only episodes remain silent.
 * 2. Landed recovery requests use their confirmation; failed and cancelled dynamic requests cannot supply a cue.
 * 3. Authored arrivals retain geometric provenance and cannot masquerade as dynamic impulses in AudioMix.
 * 4. An absolute archive offset preserves confirmation time; busy-only reservations emit no footsteps.
 *
 * Explicit geometry/contact records exercise portable audio semantics. Ownership transitions and non-grid recovery confirmations have separate tests; none qualifies native balance or rendered listening.
 */
export function test_physical_bout_footfalls(): void {
  const {
    input,
    step,
    receipt,
    recovery,
    geometric,
  }: ReturnType<typeof BoutFootfallFixtures.create> =
    BoutFootfallFixtures.create();
  assert.deepEqual(
    boutPlaybackFootsteps(input).map(
      (event: FilmPlan.Event): number => event.seconds,
    ),
    [0.5],
    "a late physical landing replaces the nominal end",
  );
  assert.deepEqual(
    boutPlaybackFootsteps({ ...input, at: (): Cache.IFrame => input.at(0) }),
    [],
    "contact jitter without an airborne foot is silent",
  );
  assert.deepEqual(
    boutPlaybackFootsteps({ ...input, recovery: { a: recovery } }).map(
      (event: FilmPlan.Event): number => event.seconds,
    ),
    [0.6],
    "a recovery cue uses its actual confirmed arrival",
  );
  for (const status of ["failed", "cancelled"] as const)
    assert.deepEqual(
      boutPlaybackFootsteps({
        ...input,
        recovery: {
          a: {
            ...recovery,
            steps: recovery.steps.map(
              (
                entry: Playback["recovery"][string]["steps"][number],
              ): Playback["recovery"][string]["steps"][number] => ({
                ...entry,
                resolved: { seconds: 0.6, status },
              }),
            ),
            landings: [],
          },
        },
      }),
      [],
    );
  assert.deepEqual(
    boutPlaybackFootsteps({
      ...input,
      contacts: [
        {
          ...receipt,
          samples: receipt.samples!.map(
            (
              sample: NonNullable<Receipt["samples"]>[number],
            ): NonNullable<Receipt["samples"]>[number] => ({
              ...sample,
              impulse: 0,
            }),
          ),
        },
      ],
    }),
    [],
    "zero impulse cannot establish a physical landing",
  );
  assert.deepEqual(
    boutPlaybackFootsteps({
      ...input,
      contacts: [{ ...receipt, samples: undefined }],
    }),
    [],
    "an episode aggregate cannot establish a positive impulse at every cache frame",
  );
  assert.deepEqual(
    boutPlaybackFootsteps({
      ...input,
      contacts: [
        { ...receipt, seconds: 0, endSeconds: 0, samples: undefined },
        {
          ...receipt,
          id: "instantaneous-native",
          seconds: 0.5,
          endSeconds: 0.5,
          samples: undefined,
        },
      ],
    }).map((event: FilmPlan.Event): number => event.seconds),
    [0.5],
  );
  const authored: FilmPlan.Event[] = boutPlaybackFootsteps({
    ...input,
    contacts: geometric,
    ownership: (): "authored" => "authored",
  });
  assert.deepEqual(
    authored.map((event: FilmPlan.Event): number => event.seconds),
    [0.5],
    "hybrid authored supports retain actual geometric footfalls",
  );
  assert.equal(authored[0]!.footfall?.source, "geometric");
  assert.equal(authored[0]!.footfall?.ownership, "authored");
  assert.deepEqual(authored[0]!.footfall?.receiptIds, ["geometric-landing"]);
  assert.deepEqual(
    AudioMix.build(authored, [])[0]!.footfall,
    authored[0]!.footfall,
  );
  assert.deepEqual(
    boutPlaybackFootsteps({ ...input, contacts: geometric }),
    [],
    "geometric arrival cannot stand in for a dynamic foot impulse",
  );
  assert.throws(
    (): AudioMix.Cue[] =>
      AudioMix.build(
        [
          {
            ...authored[0]!,
            footfall: { ...authored[0]!.footfall!, ownership: "dynamic" },
          },
        ],
        [],
      ),
    /Invalid footfall provenance/,
  );
  const shifted: Receipt = {
    ...receipt,
    seconds: 5,
    endSeconds: 6,
    samples: receipt.samples!.map(
      (
        sample: NonNullable<Receipt["samples"]>[number],
      ): NonNullable<Receipt["samples"]>[number] => ({
        ...sample,
        seconds: sample.seconds + 5,
      }),
    ),
  };
  assert.deepEqual(
    boutPlaybackFootsteps({
      ...input,
      contacts: [shifted],
      recovery: { a: recovery },
      startSeconds: 5,
      at: (seconds: number): Cache.IFrame => input.at(seconds - 5),
    }).map((event: FilmPlan.Event): number => event.seconds),
    [5.6],
  );
  const busy: Pick<BoutFootsteps, "steps"> = {
    steps: [{ ...step, kind: "busy" }],
  };
  assert.ok(
    FilmEvents.build({
      steps: { a: busy, b: { steps: [] }, referee: { steps: [] } },
    }).every((event: FilmPlan.Event): boolean => event.kind !== "step"),
    "reservations alone do not emit authored footfalls",
  );
}
