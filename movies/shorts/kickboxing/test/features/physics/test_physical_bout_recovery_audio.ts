import {
  AutoMoviePhysicsCache as Cache,
  type AutoMoviePhysicalPlayback as Playback,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalProfile as P,
  IAutoMovieContactReceipt as Receipt,
} from "@automovie/interface";
import assert from "node:assert/strict";

import { boutCacheInterval } from "../../../src/physics/boutCacheInterval";
import { boutPlaybackFootsteps } from "../../../src/physics/boutPlaybackFootsteps";
import type { FilmPlan } from "../../../src/shots/kickboxing/ring-bout/FilmPlan";
import { AudioMix } from "../../../src/sound/AudioMix";

/**
 * Substep landings retain measured ownership separately from audible confirmation.
 *
 * Scenarios:
 * 1. Two requests on one foot resolve between 120 Hz samples and use the enclosing positive native receipts.
 * 2. Failed and cancelled requests remain silent while their foot stays dynamic.
 * 3. Return starts after a native landing but before its confirmation frame; the cue retains dynamic provenance and the actual landing time.
 * 4. Reactivation permits a later independent recovery, and an absolute archive offset preserves both ownership and confirmation clocks.
 * 5. Exact reconstructed grid times retain their own frame without shifting timestamps.
 *
 * This portable adapter test supplies explicit contact and ownership inputs; it does not qualify native balance or rendered audio.
 */
export function test_physical_bout_recovery_audio(): void {
  const rotation: P.ITransform["rotation"] = { x: 0, y: 0, z: 0, w: 1 };
  const profile: P = {
    id: "recovery-audio-unit",
    mass: 1,
    centerOfMass: { x: 0, y: 0.05, z: 0 },
    joints: [],
    materials: [
      { id: "sole", friction: 0, restitution: 0, compliance: 0, damping: 0 },
    ],
    provenance: "Synthetic foot and contact ledger for non-grid timing",
    segments: [
      {
        bone: "leftMidfoot",
        mass: 1,
        neutral: { position: { x: 0, y: 0.05, z: 0 }, rotation },
        centerOfMass: { x: 0, y: 0, z: 0 },
        inertia: { x: 0.001, y: 0.001, z: 0.001 },
        inertiaRotation: rotation,
        shapes: [
          {
            id: "sole",
            material: "sole",
            kind: "sphere",
            radius: 0.05,
            transform: { position: { x: 0, y: 0, z: 0 }, rotation },
          },
        ],
      },
    ],
  };
  const resolved: number[] = [5197 / 3840, 7117 / 3840];
  const arrival: number[] = [163 / 120, 223 / 120];
  const recovery: Playback["recovery"][string] = {
    last: "supported",
    offsets: {},
    steps: resolved.map(
      (
        seconds: number,
        index: number,
      ): Playback["recovery"][string]["steps"][number] => ({
        bone: "leftMidfoot",
        kind: "swing",
        start: index === 0 ? 1.1 : 1.65,
        end: index === 0 ? 1.3 : 1.8,
        from: { point: [0, 0], yaw: 0, pitch: 0, clearance: 0 },
        to: { point: [0.1, 0], yaw: 0, pitch: 0, clearance: 0 },
        resolved: { seconds, status: "landed" },
      }),
    ),
    landings: resolved.map(
      (
        seconds: number,
      ): NonNullable<Playback["recovery"][string]["landings"]>[number] => ({
        bone: "leftMidfoot",
        seconds,
        position: { x: 0.1, y: 0, z: 0 },
      }),
    ),
  };
  const at: (seconds: number) => Cache.IFrame = (
    seconds: number,
  ): Cache.IFrame => {
    const foot: Cache.ISegment = {
      position: {
        x: 0,
        y:
          (seconds > 1 && seconds < arrival[0]!) ||
          (seconds > 1.6 && seconds < arrival[1]!)
            ? 0.15
            : 0.05,
        z: 0,
      },
      rotation,
      velocity: { x: 0, y: 0, z: 0 },
      angularVelocity: { x: 0, y: 0, z: 0 },
    };
    return {
      seconds,
      bodies: {
        a: { leftMidfoot: foot },
        b: { leftMidfoot: foot },
        referee: { leftMidfoot: foot },
      },
    };
  };
  const receipt: Receipt = {
    id: "non-grid-positive-floor",
    source: "solver",
    seconds: 0,
    endSeconds: 2,
    a: { body: "a", bone: "leftMidfoot", shape: "sole", material: "sole" },
    b: { body: "floor", bone: "floor", shape: "floor", material: "floor" },
    point: { x: 0, y: 0, z: 0 },
    normal: { x: 0, y: -1, z: 0 },
    impulse: 7,
    separation: 0,
    compression: 0,
    samples: [0, 1, arrival[0]!, 1.5, 1.6, arrival[1]!, 2].map(
      (seconds: number): NonNullable<Receipt["samples"]>[number] => ({
        seconds,
        duration: 1 / 120,
        impulse: 1,
        separation: 0,
        compression: 0,
        point: { x: 0, y: 0, z: 0 },
        normal: { x: 0, y: -1, z: 0 },
      }),
    ),
  };
  const input: Parameters<typeof boutPlaybackFootsteps>[0] = {
    profiles: { a: profile, b: profile, referee: profile },
    contacts: [receipt],
    recovery: { a: recovery },
    at,
    startSeconds: 0,
    duration: 2,
    rate: 120,
    mode: "simulated",
  };
  const events: FilmPlan.Event[] = boutPlaybackFootsteps(input);
  assert.deepEqual(
    events.map((event: FilmPlan.Event): number => event.seconds),
    arrival,
  );
  assert.deepEqual(
    events.map(
      (event: FilmPlan.Event): number | undefined =>
        event.footfall?.recoverySeconds,
    ),
    resolved,
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
                step: (typeof recovery.steps)[number],
              ): (typeof recovery.steps)[number] => ({
                ...step,
                resolved: { seconds: step.resolved!.seconds, status },
              }),
            ),
            landings: [],
          },
        },
      }),
      [],
    );
  const authority: Cache = new Cache(`sha256:${"3".repeat(64)}`, 120, 2);
  for (const body of ["a", "b", "referee"])
    authority.ownership.push({
      body,
      bone: "leftMidfoot",
      seconds: 0,
      kind: "dynamic",
    });
  authority.ownership.push(
    { body: "a", bone: "leftMidfoot", seconds: 325 / 240, kind: "return" },
    { body: "a", bone: "leftMidfoot", seconds: 1.65, kind: "dynamic" },
  );
  const ownership: NonNullable<typeof input.ownership> = (
    actor: FilmPlan.ActorId,
    bone: string,
    seconds: number,
  ): Cache.IOwnership["kind"] => authority.ownershipAt(actor, bone, seconds);
  assert.equal(ownership("a", "leftMidfoot", resolved[0]!), "dynamic");
  assert.equal(ownership("a", "leftMidfoot", arrival[0]!), "return");
  const transitionEvents: FilmPlan.Event[] = boutPlaybackFootsteps({
    ...input,
    ownership,
    ownershipEvents: authority.ownership,
  });
  assert.deepEqual(
    transitionEvents.map((event: FilmPlan.Event): number => event.seconds),
    arrival,
  );
  assert.deepEqual(
    transitionEvents.map(
      (event: FilmPlan.Event): number | undefined =>
        event.footfall?.ownershipSeconds,
    ),
    resolved,
  );
  assert.ok(
    transitionEvents.every(
      (event: FilmPlan.Event): boolean =>
        event.footfall?.source === "solver" &&
        event.footfall.ownership === "dynamic",
    ),
  );
  assert.deepEqual(
    AudioMix.build(transitionEvents, []).map(
      (cue: AudioMix.Cue): FilmPlan.Event["footfall"] => cue.footfall,
    ),
    transitionEvents.map(
      (event: FilmPlan.Event): FilmPlan.Event["footfall"] => event.footfall,
    ),
  );
  const geometry: Receipt[] = [
    {
      ...receipt,
      id: "geometry-before",
      source: "geometric",
      impulse: null,
      samples: undefined,
      endSeconds: 1,
    },
    {
      ...receipt,
      id: "geometry-first-return",
      source: "geometric",
      impulse: null,
      samples: undefined,
      seconds: arrival[0]!,
      endSeconds: 1.6,
    },
    {
      ...receipt,
      id: "geometry-second-landing",
      source: "geometric",
      impulse: null,
      samples: undefined,
      seconds: arrival[1]!,
    },
  ];
  const combined: FilmPlan.Event[] = boutPlaybackFootsteps({
    ...input,
    contacts: [receipt, ...geometry],
    ownership,
    ownershipEvents: authority.ownership,
  });
  assert.deepEqual(
    combined,
    transitionEvents,
    "the Return frame cannot relabel or duplicate the preceding confirmed native landing",
  );
  const offset: number = 149;
  const shifted: Receipt = {
    ...receipt,
    seconds: offset,
    endSeconds: offset + 2,
    samples: receipt.samples!.map(
      (
        sample: NonNullable<Receipt["samples"]>[number],
      ): NonNullable<Receipt["samples"]>[number] => ({
        ...sample,
        seconds: sample.seconds + offset,
      }),
    ),
  };
  assert.deepEqual(
    boutPlaybackFootsteps({
      ...input,
      contacts: [shifted],
      startSeconds: offset,
      at: (seconds: number): Cache.IFrame => at(seconds - offset),
    }).map((event: FilmPlan.Event): number => event.seconds),
    arrival.map((seconds: number): number => seconds + offset),
  );
  const shiftedTransitions: FilmPlan.Event[] = boutPlaybackFootsteps({
    ...input,
    contacts: [shifted],
    ownership,
    ownershipEvents: authority.ownership,
    startSeconds: offset,
    at: (seconds: number): Cache.IFrame => at(seconds - offset),
  });
  assert.deepEqual(
    shiftedTransitions.map((event: FilmPlan.Event): number => event.seconds),
    arrival.map((seconds: number): number => seconds + offset),
  );
  assert.deepEqual(
    shiftedTransitions.map(
      (event: FilmPlan.Event): number | undefined =>
        event.footfall?.ownershipSeconds,
    ),
    resolved.map((seconds: number): number => seconds + offset),
  );
  assert.equal(boutCacheInterval(offset + 223 / 120, offset, 120), 223);
}
