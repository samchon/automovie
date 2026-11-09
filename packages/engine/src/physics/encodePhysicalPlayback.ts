import type { AutoMoviePhysicalPlayback } from "./AutoMoviePhysicalPlayback";
import { AutoMoviePhysicsCache as Cache } from "./AutoMoviePhysicsCache";

/**
 * Pack a complete cache once on a build machine; checkpoints remain with the producer.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Pack a complete cache once on a build machine; checkpoints remain with the producer) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Pack a complete cache once on a build machine; checkpoints remain with the producer) directly over its typed inputs (`cache`, `maximumBytes`) as nested iteration of depth 3 (flatMap over Object.entries( cache.frames[0]!.bod; map over Object.keys(bones); for-of over cache.frames), delegating to `Number.isSafeInteger`, `Object.entries( cache.frames[0]!.bodies, ).f`, `Object.entries`, `Object.keys(bones).map`, `Object.keys`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (5 throw sites). Beyond structural 0, 1 and 2 the body uses the literals 8, 13, 32, 1095585841, 4, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One async operation of 84 lines and 18 top-level statements that reuses `Number.isSafeInteger`, `Object.entries( cache.frames[0]!.bodies, ).f`, `Object.entries`, `Object.keys(bones).map`, `Object.keys` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 1 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `cache`, `maximumBytes`; the dominant cost is nested iteration of depth 3 (flatMap over Object.entries( cache.frames[0]!.bod; map over Object.keys(bones); for-of over cache.frames), performed once per call with 12 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Awaits 1 call per invocation and shares no result or in-flight work between invocations: equivalence of effectful calls is not decided here, so every call repeats its effects.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The body awaits asynchronous work; it retains nothing after it settles beyond its result, and any handle it opens is owned and released by the call or by its callees.
 */
export async function encodePhysicalPlayback(
  cache: Cache,
  maximumBytes: number,
): Promise<Uint8Array<ArrayBuffer>> {
  const frames: number = cache.duration * cache.rate + 1;
  if (
    !Number.isSafeInteger(frames) ||
    frames < 2 ||
    cache.frames.length !== frames
  )
    throw new Error("Cannot export incomplete physical performance");
  const segments: [string, string][] = Object.entries(
    cache.frames[0]!.bodies,
  ).flatMap(
    ([body, bones]: [string, Record<string, Cache.ISegment>]): [
      string,
      string,
    ][] =>
      Object.keys(bones).map((bone: string): [string, string] => [body, bone]),
  );
  if (!segments.length)
    throw new Error("Physical playback needs at least one segment");
  const header: AutoMoviePhysicalPlayback.IHeader = {
    format: 1,
    protocol: Cache.protocol,
    identity: cache.identity,
    duration: cache.duration,
    rate: cache.rate,
    segments,
    contacts: cache.contacts,
    recovery: cache.recovery,
    ownership: cache.ownership,
    supportWrenches: cache.supportWrenches,
  };
  const metadata: Uint8Array = new TextEncoder().encode(JSON.stringify(header));
  const offset: number = Math.ceil((8 + metadata.length) / 8) * 8;
  const length: number = offset + frames * segments.length * (13 * 8) + 32;
  if (
    !Number.isSafeInteger(maximumBytes) ||
    maximumBytes <= 0 ||
    !Number.isSafeInteger(length) ||
    length > maximumBytes
  )
    throw new Error("Physical playback export byte budget exceeded");
  const bytes: Uint8Array<ArrayBuffer> = new Uint8Array(length);
  const view: DataView = new DataView(bytes.buffer);
  view.setUint32(0, 0x414d5031, true);
  view.setUint32(4, metadata.length, true);
  bytes.set(metadata, 8);
  let cursor: number = offset;
  for (const frame of cache.frames)
    for (const [body, bone] of segments) {
      const state: Cache.ISegment | undefined = frame.bodies[body]?.[bone];
      if (!state) throw new Error(`Incomplete physical frame: ${body}/${bone}`);
      const values: number[] = [
        state.position.x,
        state.position.y,
        state.position.z,
        state.rotation.x,
        state.rotation.y,
        state.rotation.z,
        state.rotation.w,
        state.velocity.x,
        state.velocity.y,
        state.velocity.z,
        state.angularVelocity.x,
        state.angularVelocity.y,
        state.angularVelocity.z,
      ];
      for (const value of values) {
        if (!Number.isFinite(value))
          throw new Error("Nonfinite physical playback state");
        view.setFloat64(cursor, value, true);
        cursor += 8;
      }
    }
  bytes.set(
    new Uint8Array(
      await crypto.subtle.digest(
        "SHA-256",
        bytes.subarray(0, bytes.length - 32),
      ),
    ),
    bytes.length - 32,
  );
  return bytes;
}
