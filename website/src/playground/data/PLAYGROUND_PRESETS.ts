import type { IPlaygroundComposition } from "../structures/IPlaygroundComposition";

/**
 * The compositions the preset picker offers. The first one is what the page
 * opens with when its address carries none.
 */
export const PLAYGROUND_PRESETS: readonly PLAYGROUND_PRESETS.IPreset[] = [
  {
    label: "Walk, then stand",
    composition: {
      version: 1,
      seed: "playground",
      performers: [
        {
          subject: "a",
          body: "m1",
          x: 0,
          z: 0,
          yaw: 0,
          proficiency: "trained",
          actions: [
            { name: "walk", params: { to: { x: 0, y: 0, z: 3 } } },
            { name: "stand", params: { seconds: 1 } },
          ],
        },
      ],
      mutuals: [],
    },
  },
  {
    label: "Two people walk towards each other",
    composition: {
      version: 1,
      seed: "playground",
      performers: [
        {
          subject: "a",
          body: "m1",
          x: 0,
          z: 0,
          yaw: 0,
          proficiency: "trained",
          actions: [
            { name: "walk", params: { to: { x: 0, y: 0, z: 1.6 } } },
            { name: "stand", params: { seconds: 1 } },
          ],
        },
        {
          subject: "b",
          body: "m1",
          x: 0,
          z: 4,
          yaw: 180,
          proficiency: "trained",
          actions: [
            { name: "walk", params: { to: { x: 0, y: 0, z: 2.4 } } },
            { name: "stand", params: { seconds: 1 } },
          ],
        },
      ],
      mutuals: [],
    },
  },
];
export namespace PLAYGROUND_PRESETS {
  /** One preset. */
  export interface IPreset {
    /** What the picker shows. */
    label: string;

    /** The composition it loads. */
    composition: IPlaygroundComposition;
  }
}
