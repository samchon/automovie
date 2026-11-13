import { TestValidator } from "@nestia/e2e";

import { SceneTrack } from "../../src/scenes/SceneTrack";

/**
 * A baked track keeps every placement to the precision it states, and reading between frames moves smoothly from one to the next.
 *
 * Scenarios:
 * 1. Two frames of two groups encode and read back at each frame within half a millimetre and a quaternion component's quantum; a quaternion stored with w below zero reads back as the same rotation.
 * 2. Halfway between two frames, a position is the mean of the two, and a rotation is the halfway turn about its axis: a 90 degree turn about +Y reads 45 degrees.
 * 3. A second before the film or after it holds the first or the last frame.
 * 4. A frame that gives a group other entries than its order, and a position beyond what a track holds, are refused.
 */
export function test_website_scene_track(): void {
  const turn = (degrees: number): [number, number, number, number] => {
    const half: number = (degrees * Math.PI) / 360;
    return [0, Math.sin(half), 0, Math.cos(half)];
  };
  const orders: string[][] = [["hips", "head"], ["frame"]];
  const frames: SceneTrack.IPlacement[][][] = [
    [
      [
        { bone: "hips", position: [0, 1, 0], rotation: turn(0) },
        { bone: "head", position: [0.1, 1.7, -0.02], rotation: turn(10) },
      ],
      [{ bone: "frame", position: [2, 0, 3], rotation: [0, -0, -0, -1] }],
    ],
    [
      [
        { bone: "hips", position: [1, 1, 0], rotation: turn(90) },
        { bone: "head", position: [1.1, 1.7, -0.02], rotation: turn(100) },
      ],
      [{ bone: "frame", position: [2, 0, 3.5], rotation: turn(0) }],
    ],
  ];
  const track: SceneTrack.ITrack = {
    fps: 12,
    frames: 2,
    orders,
    values: SceneTrack.encode(frames, orders),
  };
  const close = (a: number[], b: number[], tolerance: number): boolean =>
    a.every((v: number, i: number): boolean => Math.abs(v - b[i]!) <= tolerance);
  const same = (a: number[], b: number[]): boolean =>
    close(a, b, 1e-4) || close(a, b.map((v: number): number => -v), 1e-4);

  // 1. Each frame reads back.
  for (const [k, frame] of frames.entries()) {
    const read: SceneTrack.IPlacement[][] = SceneTrack.sample(track, k / 12);
    frame.forEach((group: SceneTrack.IPlacement[], g: number): void =>
      group.forEach((p: SceneTrack.IPlacement, i: number): void => {
        const back: SceneTrack.IPlacement = read[g]![i]!;
        TestValidator.predicate(`frame ${k} ${p.bone} position`, close(back.position, p.position, 5e-4));
        TestValidator.predicate(`frame ${k} ${p.bone} rotation`, same(back.rotation, p.rotation));
      }),
    );
  }

  // 2. Halfway.
  const half: SceneTrack.IPlacement[][] = SceneTrack.sample(track, 0.5 / 12);
  TestValidator.predicate("the hips halfway", close(half[0]![0]!.position, [0.5, 1, 0], 5e-4));
  TestValidator.predicate("the hips turn 45 degrees", same(half[0]![0]!.rotation, turn(45)));

  // 3. Held at the ends.
  TestValidator.predicate("before the film", close(SceneTrack.sample(track, -3)[0]![0]!.position, [0, 1, 0], 5e-4));
  TestValidator.predicate("after the film", close(SceneTrack.sample(track, 9)[0]![0]!.position, [1, 1, 0], 5e-4));

  // 4. Refusals.
  const refused = (call: () => void): boolean => {
    try {
      call();
      return false;
    } catch {
      return true;
    }
  };
  TestValidator.predicate(
    "a group with other entries than its order",
    refused((): void => {
      SceneTrack.encode([[frames[0]![0]!.slice(1), frames[0]![1]!]], orders);
    }),
  );
  TestValidator.predicate(
    "a position beyond the track",
    refused((): void => {
      SceneTrack.encode([[[{ bone: "frame", position: [40, 0, 0], rotation: turn(0) }]]], [["frame"]]);
    }),
  );
}
