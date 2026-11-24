import {
  AutoMoviePhysicsCache,
  AutoMoviePhysicalPlayback as Playback,
  Quaternion,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalFrame,
  IAutoMoviePhysicalPlayback,
  IAutoMoviePhysicalSegmentState,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** Cached intervals per second; two intervals make the film. */
const RATE: number = 4;
const DURATION: number = 0.5;

/** The bodies and the bones each carries, the same names in both. */
const BODIES: readonly string[] = ["first", "second"];
const BONES: readonly string[] = ["trunk", "limb"];

/** Archive budget. */
const BYTES: number = 1 << 16;

/**
 * A decoded archive of several bodies, each with several segments, reads back
 * every segment's own state at every seek, in time order and out of it
 * (`AutoMoviePhysicalPlayback.encode`, `.decode`, `.at`).
 *
 * Two bodies with the same two bone names, every field of every segment in
 * every frame a different value.
 *
 * Scenarios:
 *
 * 1. Seeks at every cached instant and between them, in increasing time, equal the
 *    live cache's reads at the same instants.
 * 2. The same seeks out of order equal them too.
 */
export async function test_unit_engine_physics_physical_playback_bodies(): Promise<void> {
  const cache: AutoMoviePhysicsCache = new AutoMoviePhysicsCache(
    `sha256:${"a".repeat(64)}`,
    RATE,
    DURATION,
  );
  for (let frame: number = 0; frame <= DURATION * RATE; frame++)
    cache.frames.push({
      seconds: frame / RATE,
      bodies: Object.fromEntries(
        BODIES.map(
          (
            body: string,
            b: number,
          ): [string, Record<string, IAutoMoviePhysicalSegmentState>] => [
            body,
            Object.fromEntries(
              BONES.map(
                (
                  bone: string,
                  s: number,
                ): [string, IAutoMoviePhysicalSegmentState] => [
                  bone,
                  state(1 + frame + 10 * b + 100 * s),
                ],
              ),
            ),
          ],
        ),
      ),
    });
  // An archive admits each segment's motion authority from its start.
  for (const body of BODIES)
    for (const bone of BONES)
      cache.ownership.push({ body, bone, seconds: 0, kind: "dynamic" });
  const reader: IAutoMoviePhysicalPlayback = await Playback.decode(
    await Playback.encode(cache, BYTES),
    cache.identity,
    {
      maximumBytes: BYTES,
      maximumFrames: DURATION * RATE + 1,
      maximumSegments: BODIES.length * BONES.length,
    },
  );
  const seeks: number[] = [0, 0.1, 0.25, 0.4, 0.5];
  const read = (seconds: readonly number[]) => ({
    archive: seconds.map(
      (at: number): IAutoMoviePhysicalFrame => reader.at(at),
    ),
    cache: seconds.map((at: number): IAutoMoviePhysicalFrame => cache.at(at)),
  });
  for (const [order, seconds] of [
    ["in time", seeks],
    ["out of time", [...seeks].reverse()],
  ] as const) {
    const frames = read(seconds);
    TestValidator.equals(
      `seeks ${order}`,
      JSON.stringify(frames.archive),
      JSON.stringify(frames.cache),
    );
  }
}

/** A segment state whose every field differs from every other state's. */
function state(seed: number): IAutoMoviePhysicalSegmentState {
  return {
    position: { x: seed, y: seed + 0.25, z: seed + 0.5 },
    rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, seed),
    velocity: { x: -seed, y: -seed - 0.25, z: -seed - 0.5 },
    angularVelocity: { x: seed / 7, y: seed / 11, z: seed / 13 },
  };
}
