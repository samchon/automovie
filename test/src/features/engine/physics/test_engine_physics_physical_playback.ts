import {
  AutoMovieEnginePhysicalPlayback,
  AutoMovieEnginePhysicsCache,
  AutoMovieEngineQuaternion,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalPlayback,
  IAutoMoviePhysicalSegmentState,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieEnginePhysicalPlayback.encode`, `decode` and `at` read every body's every
 * segment back as the live cache reads it, at any seek order.
 *
 * Fixture: a cache at 4 Hz over 0.5 s of two bodies that carry the same two
 * bone names, every field of every segment in every frame a distinct value
 * (seed 1 + frame + 10 body + 100 segment), each segment dynamic from 0.
 *
 * Scenarios:
 *
 * 1. Seeks at 0, 0.1, 0.25, 0.4 and 0.5 (on and between frames) equal the cache's,
 *    in time order.
 * 2. The same seeks reversed equal them too.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies playback of every body and segment field at frame ticks and between them, independent of seek order.
 * @evidence contracts/development/testing.md#behavioral-verification Encodes and decodes a typed two-body cache whose reused bone names carry distinct per-frame values, then seeks in both directions.
 * @evidence contracts/development/testing.md#independent-expectations Fixture seed values vary by frame, body and segment. Each archived read must exactly equal the corresponding live read at 0, 0.1, 0.25, 0.4 and 0.5 s.
 */
export async function test_engine_physics_physical_playback(): Promise<void> {
  const rate: number = 4;
  const duration: number = 0.5;
  const bodies: string[] = ["first", "second"];
  const bones: string[] = ["trunk", "limb"];
  const state = (seed: number): IAutoMoviePhysicalSegmentState => ({
    position: { x: seed, y: seed + 0.25, z: seed + 0.5 },
    rotation: AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, seed),
    velocity: { x: -seed, y: -seed - 0.25, z: -seed - 0.5 },
    angularVelocity: { x: seed / 7, y: seed / 11, z: seed / 13 },
  });
  const cache: AutoMovieEnginePhysicsCache = new AutoMovieEnginePhysicsCache(
    `sha256:${"a".repeat(64)}`,
    rate,
    duration,
  );
  for (let frame: number = 0; frame <= duration * rate; frame++)
    cache.frames.push({
      seconds: frame / rate,
      bodies: Object.fromEntries(
        bodies.map((body: string, b: number) => [
          body,
          Object.fromEntries(
            bones.map((bone: string, s: number) => [
              bone,
              state(1 + frame + 10 * b + 100 * s),
            ]),
          ),
        ]),
      ),
    });
  for (const body of bodies)
    for (const bone of bones)
      cache.ownership.push({ body, bone, seconds: 0, kind: "dynamic" });
  const bytes: number = 1 << 16;
  const reader: IAutoMoviePhysicalPlayback =
    await AutoMovieEnginePhysicalPlayback.decode(
      await AutoMovieEnginePhysicalPlayback.encode(cache, bytes),
      cache.identity,
      {
        maximumBytes: bytes,
        maximumFrames: duration * rate + 1,
        maximumSegments: bodies.length * bones.length,
      },
    );
  const seeks: number[] = [0, 0.1, 0.25, 0.4, 0.5];
  for (const [order, seconds] of [
    ["in time", seeks],
    ["out of time", [...seeks].reverse()],
  ] satisfies [string, number[]][])
    TestValidator.equals(
      order,
      JSON.stringify(seconds.map((t: number) => reader.at(t))),
      JSON.stringify(seconds.map((t: number) => cache.at(t))),
    );
}
