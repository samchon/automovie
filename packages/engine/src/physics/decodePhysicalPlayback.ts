import type { AutoMoviePhysicalPlayback } from "./AutoMoviePhysicalPlayback";
import { AutoMoviePhysicsCache as Cache } from "./AutoMoviePhysicsCache";
import { admitPhysicalPlaybackMetadata } from "./admitPhysicalPlaybackMetadata";
import { freezePhysicalRecord } from "./freezePhysicalRecord";

/** Admit one downloaded/archive byte sequence against the current authored input identity. */
export async function decodePhysicalPlayback(
  source: Uint8Array,
  expectedIdentity: string,
  budget: {
    maximumBytes: number;
    maximumFrames: number;
    maximumSegments: number;
  },
): Promise<{
  bytes: Uint8Array<ArrayBuffer>;
  header: AutoMoviePhysicalPlayback.IHeader;
  offset: number;
}> {
  if (
    ![budget.maximumBytes, budget.maximumFrames, budget.maximumSegments].every(
      (value: number): boolean => Number.isSafeInteger(value) && value > 0,
    ) ||
    source.byteLength > budget.maximumBytes ||
    source.byteLength < 40 ||
    !/^sha256:[0-9a-f]{64}$/u.test(expectedIdentity)
  )
    throw new Error("Invalid physical playback archive or allocation budget");
  const bytes: Uint8Array<ArrayBuffer> = new Uint8Array(source);
  const view: DataView = new DataView(bytes.buffer);
  if (view.getUint32(0, true) !== 0x414d5031)
    throw new Error("Unknown physical playback archive format");
  const length: number = view.getUint32(4, true);
  if (length > bytes.length - 40)
    throw new Error("Truncated physical playback metadata");
  const digest: Uint8Array = new Uint8Array(
    await crypto.subtle.digest("SHA-256", bytes.subarray(0, bytes.length - 32)),
  );
  if (
    digest.some(
      (value: number, index: number): boolean =>
        value !== bytes[bytes.length - 32 + index],
    )
  )
    throw new Error("Damaged physical playback archive");
  const header: AutoMoviePhysicalPlayback.IHeader = JSON.parse(
    new TextDecoder("utf-8", { fatal: true }).decode(
      bytes.subarray(8, 8 + length),
    ),
  );
  if (
    header.format !== 1 ||
    header.protocol !== Cache.protocol ||
    header.identity !== expectedIdentity ||
    !Number.isSafeInteger(header.rate) ||
    header.rate <= 0 ||
    !Number.isFinite(header.duration) ||
    header.duration <= 0 ||
    !Number.isSafeInteger(header.duration * header.rate) ||
    header.duration * header.rate + 1 > budget.maximumFrames ||
    !Array.isArray(header.segments) ||
    !header.segments.length ||
    header.segments.length > budget.maximumSegments ||
    header.segments.some(
      (entry: (typeof header.segments)[number]): boolean =>
        !Array.isArray(entry) ||
        entry.length !== 2 ||
        entry.some(
          (name: string): boolean => typeof name !== "string" || !name.trim(),
        ),
    ) ||
    new Set(
      header.segments.map((entry: (typeof header.segments)[number]): string =>
        JSON.stringify(entry),
      ),
    ).size !== header.segments.length ||
    !Array.isArray(header.contacts) ||
    !header.recovery ||
    typeof header.recovery !== "object"
  )
    throw new Error("Incompatible or malformed physical playback metadata");
  const offset: number = Math.ceil((8 + length) / 8) * 8;
  const count: number =
    (header.duration * header.rate + 1) * header.segments.length;
  if (
    !Number.isSafeInteger(count) ||
    offset + count * (13 * 8) + 32 !== bytes.length
  )
    throw new Error("Truncated or oversized physical playback records");
  for (let index: number = 0; index < count; index++) {
    const cursor: number = offset + index * (13 * 8);
    for (let field: number = 0; field < 13; field++)
      if (!Number.isFinite(view.getFloat64(cursor + field * 8, true)))
        throw new Error("Nonfinite physical playback record");
    if (
      Math.abs(
        Math.hypot(
          ...[3, 4, 5, 6].map((field: number): number =>
            view.getFloat64(cursor + field * 8, true),
          ),
        ) - 1,
      ) > 1e-5
    )
      throw new Error("Invalid physical playback rotation");
  }
  admitPhysicalPlaybackMetadata(header);
  header.recovery = Object.assign(Object.create(null), header.recovery);
  for (const state of Object.values(header.recovery))
    state.offsets = Object.assign(Object.create(null), state.offsets);
  freezePhysicalRecord(header);
  return { bytes, header, offset };
}
