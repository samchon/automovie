import type { IAutoMovieSkeleton } from "@automovie/interface";

/**
 * Return the existing explicit source rig with hips, chest and head; this fixture states the adoption decision rather than inferring a rig.
 */
export function test12MotionSkeleton(): IAutoMovieSkeleton {
  return {
    id: "source-rig",
    bones: [
      {
        bone: "hips",
        parent: null,
        rest: {
          translation: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        },
        constraint: null,
      },
      {
        bone: "chest",
        parent: "hips",
        rest: {
          translation: { x: 0, y: -1.25, z: 0 },
          rotation: { x: 0, y: 0, z: 1, w: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
        constraint: {
          flexion: { min: -10, max: 45 },
          abduction: null,
          twist: { min: -20, max: 20 },
          swingDeg: 60,
        },
      },
      {
        bone: "head",
        parent: "chest",
        rest: {
          translation: { x: 0, y: 1, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        },
        constraint: {
          flexion: null,
          abduction: { min: -20, max: 20 },
          twist: null,
          swingDeg: 30,
        },
      },
    ],
  };
}
