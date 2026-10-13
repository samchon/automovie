import { IAutoMovieStage } from "@automovie/interface";

/**
 * Create the existing duel stage with actors 0.7 metres apart, one node-tracking camera and one directional light. Metres/degrees and all camera/light values remain the original conventional engine fixture; the final partial spread supports actual gate cases.
 */
export function makeStagingWrite(
  partial: Partial<IAutoMovieStage> = {}
): IAutoMovieStage {
  return ({
  scene: { id: "scene-duel", name: "duel at dawn" },
  plan: "A faces B at 0.7 m; camera side-on covers both; sun from the east.",
  actors: [
    { node: "knightA", position: { x: 0, y: 0, z: 0 }, facingDeg: 0 },
    { node: "knightB", position: { x: 0, y: 0, z: 0.7 }, facingDeg: 180 },
  ],
  cameras: [
    {
      node: "cam-main",
      position: { x: 2, y: 1.5, z: 0.35 },
      lookAt: { kind: "node", node: "knightA" },
      fovDeg: 40,
      near: 0.1,
      far: 1000,
      depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
    },
  ],
  lights: [
    {
      node: "sun",
      role: "sun",
      direction: { x: -1, y: -1, z: 0 },
      intensity: 1,
    },
  ],
  ...partial,
});
}
