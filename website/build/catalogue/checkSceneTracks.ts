import { strict as assert } from "node:assert";

import { BakedTake } from "../../src/baked/BakedTake";
import { SceneTrack } from "../../src/scenes/SceneTrack";
import type { ITake } from "../../src/takes/structures/ITake";

/** Verify exact storage and playback for local and high-altitude takes. */
export function checkSceneTracks(): void {
  const orders: string[][] = [["frame"]];
  for (const y of [4.917, 4090.917]) {
    const frames: SceneTrack.IPlacement[][][] = [y, y - 0.816].map(
      (height: number): SceneTrack.IPlacement[][] => [
        [{ bone: "frame", position: [0, height, 0], rotation: [0, 0, 0, 1] }],
      ],
    );
    const track: SceneTrack.ITrack = {
      fps: 12,
      frames: 2,
      orders,
      values: SceneTrack.encode(frames, orders),
    };
    const take: ITake = {
      duration: 1 / 12,
      track,
      reflection: [],
      figures: [],
      props: ["prop"],
      timeline: { duration: 1 / 12, tracks: [] },
    };
    const bytes: Uint8Array = BakedTake.encode(take);
    assert.equal(
      String.fromCharCode(...bytes.subarray(0, 4)),
      y > 32 ? "AMT2" : "AMT1",
    );
    const read: ITake = BakedTake.decode(bytes);
    assert.deepEqual(read.track.values, track.values);
    for (const [time, expected] of [
      [0, y],
      [1 / 24, y - 0.408],
      [1 / 12, y - 0.816],
    ] as const) {
      const placement: SceneTrack.IPlacement = SceneTrack.sample(
        read.track,
        time,
      )[0]![0]!;
      assert(Math.abs(placement.position[1] - expected) <= 0.0005);
      assert.deepEqual(placement.rotation, [0, 0, 0, 1]);
    }
  }
}
