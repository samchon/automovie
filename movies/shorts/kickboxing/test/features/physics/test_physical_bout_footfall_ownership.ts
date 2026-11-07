import {
  AutoMoviePhysicsCache as Cache,
  type AutoMoviePhysicalPlayback as Playback,
} from "@automovie/engine";
import type { IAutoMovieContactReceipt as Receipt } from "@automovie/interface";
import assert from "node:assert/strict";

import { boutPlaybackFootsteps } from "../../../src/physics/boutPlaybackFootsteps";
import type { FilmPlan } from "../../../src/shots/kickboxing/ring-bout/FilmPlan";
import { AudioMix } from "../../../src/sound/AudioMix";
import { BoutFootfallFixtures } from "../../internal/BoutFootfallFixtures";

/**
 * Actual observation times select authoritative ownership independently of audible frames.
 *
 * Scenarios:
 * 1. A Return arrival retains geometric provenance through AudioMix despite a stale cancelled request.
 * 2. A cancelled dynamic contact remains silent; another observed flight permits a later real Return arrival.
 * 3. A non-grid geometric start precedes reactivation in the same cache bin and retains its measured Return owner.
 * 4. Reactivation admits a new positive native arrival, while an equal-time Return follows the exact public sampler without creating a native impulse.
 *
 * This portable test supplies explicit contact/pose inputs to the actual Cache ownership sampler. It makes no native-simulation or sub-sample flight claim.
 */
export function test_physical_bout_footfall_ownership(): void {
  const {
    input,
    receipt,
    recovery,
    geometric,
  }: ReturnType<typeof BoutFootfallFixtures.create> =
    BoutFootfallFixtures.create();
  const authority: Cache = new Cache(`sha256:${"2".repeat(64)}`, 10, 1);
  for (const body of ["a", "b", "referee"])
    authority.ownership.push({
      body,
      bone: "leftMidfoot",
      seconds: 0,
      kind: "dynamic",
    });
  authority.ownership.push(
    { body: "a", bone: "leftMidfoot", seconds: 0.45, kind: "return" },
    { body: "a", bone: "leftMidfoot", seconds: 0.7, kind: "authored" },
  );
  const ownership: NonNullable<typeof input.ownership> = (
    actor: FilmPlan.ActorId,
    bone: string,
    seconds: number,
  ): Cache.IOwnership["kind"] => authority.ownershipAt(actor, bone, seconds);
  const returning: FilmPlan.Event[] = boutPlaybackFootsteps({
    ...input,
    contacts: geometric,
    ownership,
    ownershipEvents: authority.ownership,
  });
  assert.equal(returning[0]!.footfall?.ownership, "return");
  assert.deepEqual(
    AudioMix.build(returning, [])[0]!.footfall,
    returning[0]!.footfall,
  );
  const cancelled: Playback["recovery"][string] = {
    ...recovery,
    steps: recovery.steps.map(
      (
        entry: Playback["recovery"][string]["steps"][number],
      ): Playback["recovery"][string]["steps"][number] => ({
        ...entry,
        resolved: { seconds: 0.3, status: "cancelled" },
      }),
    ),
    landings: [],
  };
  const cancelledReturn: FilmPlan.Event[] = boutPlaybackFootsteps({
    ...input,
    contacts: geometric,
    recovery: { a: cancelled },
    ownership,
    ownershipEvents: authority.ownership,
  });
  assert.equal(cancelledReturn[0]!.footfall?.source, "geometric");
  assert.equal(
    cancelledReturn[0]!.footfall?.ownership,
    "return",
    "a stale cancelled request cannot override the actual Return owner",
  );
  const cancelledContact: Receipt = {
    ...receipt,
    impulse: 3,
    endSeconds: 0.3,
    samples: [
      receipt.samples![0]!,
      receipt.samples![1]!,
      { ...receipt.samples![2]!, seconds: 0.3 },
    ],
  };
  const separateArrivals: FilmPlan.Event[] = boutPlaybackFootsteps({
    ...input,
    contacts: [
      cancelledContact,
      ...geometric,
      {
        ...geometric[1]!,
        id: "cancelled-dynamic-arrival",
        seconds: 0.3,
        endSeconds: 0.3,
      },
    ],
    recovery: { a: cancelled },
    at: (seconds: number): Cache.IFrame =>
      seconds === 0.3 ? input.at(0) : input.at(seconds),
    ownership,
    ownershipEvents: authority.ownership,
  });
  assert.deepEqual(
    separateArrivals.map((event: FilmPlan.Event): number => event.seconds),
    [0.5],
    "the cancelled dynamic contact stays silent and a new airborne-to-floor Return arrival remains audible",
  );
  assert.equal(separateArrivals[0]!.footfall?.source, "geometric");
  authority.ownership.pop();
  authority.ownership.push({
    body: "a",
    bone: "leftMidfoot",
    seconds: 0.48,
    kind: "dynamic",
  });
  const nonGrid: Receipt[] = [
    geometric[0]!,
    { ...geometric[1]!, seconds: 0.46 },
  ];
  const nonGridEvents: FilmPlan.Event[] = boutPlaybackFootsteps({
    ...input,
    contacts: nonGrid,
    recovery: { a: cancelled },
    ownership,
    ownershipEvents: authority.ownership,
  });
  assert.equal(nonGridEvents[0]!.seconds, 0.5);
  assert.equal(nonGridEvents[0]!.footfall?.ownershipSeconds, 0.46);
  assert.equal(
    nonGridEvents[0]!.footfall?.ownership,
    "return",
    "the actual episode start precedes reactivation inside the same cache bin",
  );
  const reactivated: FilmPlan.Event[] = boutPlaybackFootsteps({
    ...input,
    contacts: [receipt, ...geometric],
    recovery: { a: cancelled },
    ownership,
    ownershipEvents: authority.ownership,
  });
  assert.equal(
    reactivated[0]!.footfall?.source,
    "solver",
    "recorded reactivation takes precedence over the authored frame policy",
  );
  authority.ownership.push({
    body: "a",
    bone: "leftMidfoot",
    seconds: 0.5,
    kind: "return",
  });
  const equalTime: FilmPlan.Event[] = boutPlaybackFootsteps({
    ...input,
    contacts: geometric,
    recovery: {
      a: {
        ...cancelled,
        steps: cancelled.steps.map(
          (
            entry: (typeof cancelled.steps)[number],
          ): (typeof cancelled.steps)[number] => ({
            ...entry,
            resolved: { seconds: 0.5, status: "landed" },
          }),
        ),
        landings: [
          { bone: "leftMidfoot", seconds: 0.5, position: { x: 0, y: 0, z: 0 } },
        ],
      },
    },
    ownership,
    ownershipEvents: authority.ownership,
  });
  assert.equal(equalTime[0]!.footfall?.ownership, "return");
  assert.equal(
    equalTime[0]!.footfall?.source,
    "geometric",
    "equal-time metadata cannot turn a geometric arrival into a native impulse",
  );
}
