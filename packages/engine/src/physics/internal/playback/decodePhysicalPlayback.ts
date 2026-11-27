import type {
  IAutoMovieDecodePhysicalPlayback,
  IAutoMoviePhysicalPlayback,
} from "@automovie/interface";

import { AutoMoviePhysicsCache as Cache } from "../../AutoMoviePhysicsCache";
import { admitPhysicalPlaybackMetadata } from "../admitPhysicalPlaybackMetadata";

/*
 * Admit one downloaded/archive byte sequence against the current authored input
 * identity.
 */
export async function decodePhysicalPlayback(
  source: Uint8Array,
  expectedIdentity: string,
  budget: IAutoMovieDecodePhysicalPlayback.IBudget,
): Promise<IAutoMovieDecodePhysicalPlayback.IResult> {
  if (
    budget.maximumBytes <= 0 ||
    budget.maximumFrames <= 0 ||
    budget.maximumSegments <= 0 ||
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
  const header: IAutoMoviePhysicalPlayback.IHeader = JSON.parse(
    new TextDecoder("utf-8", { fatal: true }).decode(
      bytes.subarray(8, 8 + length),
    ),
  );
  if (
    header.format !== 1 ||
    header.protocol !== Cache.protocol ||
    header.identity !== expectedIdentity ||
    header.rate <= 0 ||
    header.duration <= 0 ||
    Math.round(header.duration * header.rate) + 1 > budget.maximumFrames ||
    !header.segments.length ||
    header.segments.length > budget.maximumSegments ||
    header.segments.some((entry: (typeof header.segments)[number]): boolean =>
      entry.some((name: string): boolean => !name.trim()),
    ) ||
    new Set(
      header.segments.map((entry: (typeof header.segments)[number]): string =>
        JSON.stringify(entry),
      ),
    ).size !== header.segments.length
  )
    throw new Error("Incompatible or malformed physical playback metadata");
  const offset: number = Math.ceil((8 + length) / 8) * 8;
  const count: number =
    (Math.round(header.duration * header.rate) + 1) * header.segments.length;
  if (offset + count * (13 * 8) + 32 !== bytes.length)
    throw new Error("Truncated or oversized physical playback records");
  for (let index: number = 0; index < count; index++) {
    const cursor: number = offset + index * (13 * 8);

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
  return { bytes, header, offset };
}
