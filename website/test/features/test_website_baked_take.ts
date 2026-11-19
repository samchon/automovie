import { TestValidator } from "@nestia/e2e";

import { BakedTake } from "../../src/baked/BakedTake";
import type { IPlaygroundRefusal } from "../../src/playground/structures/IPlaygroundRefusal";
import { SCENES } from "../../src/scenes/SCENES";
import type { IScene } from "../../src/scenes/structures/IScene";
import { TakeCompute } from "../../src/takes/package/TakeCompute";
import type { ITake } from "../../src/takes/structures/ITake";

/**
 * A baked take reads back as exactly the take that was written, so a page
 * that plays a baked take plays the performance the worker would compute.
 *
 * Scenarios:
 * 1. The dance circle's take, encoded and decoded, has the same header and every track value equal, and its bytes start with the format's magic.
 * 2. A value that swings across the 16-bit range between frames, as a quaternion component does when its sign flips, reads back exactly, since the stored differences wrap.
 * 3. Bytes that do not start with the magic are refused.
 */
export function test_website_baked_take(): void {
  // 1. A computed take round trips.
  const made: ITake | IPlaygroundRefusal = TakeCompute.take(
    SCENES.find((s: IScene): boolean => s.id === "dance-circle")!.composition!,
    4,
  );
  if (!("track" in made))
    throw new Error(`The dance circle was refused: ${made.message}`);
  const bytes: Uint8Array = BakedTake.encode(made);
  TestValidator.equals(
    "the magic",
    String.fromCharCode(...bytes.subarray(0, 4)),
    "AMT1",
  );
  const read: ITake = BakedTake.decode(bytes);
  TestValidator.equals(
    "the header",
    { ...read, track: { ...read.track, values: [] } },
    {
      ...made,
      track: { ...made.track, values: [] },
    },
  );
  TestValidator.predicate(
    "every value",
    read.track.values.length === made.track.values.length &&
      read.track.values.every(
        (v: number, i: number): boolean => v === made.track.values[i],
      ),
  );

  // 2. Differences across the whole 16-bit range wrap and restore.
  const swing: ITake = {
    ...made,
    track: {
      ...made.track,
      frames: 3,
      orders: [["hips"]],
      values: Int16Array.from([
        ...[32767, -32767, 0, 0, 0, 0, 32767],
        ...[-32767, 32767, 0, 0, 0, 0, -32767],
        ...[32767, -32767, 1, -1, 2, -2, 0],
      ]),
    },
  };
  TestValidator.equals(
    "a sign flip of a full component",
    [...BakedTake.decode(BakedTake.encode(swing)).track.values],
    [...swing.track.values],
  );

  // 3. Foreign bytes are refused.
  TestValidator.error(
    "bytes without the magic",
    (): ITake => BakedTake.decode(new Uint8Array([1, 2, 3, 4, 0, 0, 0, 0])),
  );
}
