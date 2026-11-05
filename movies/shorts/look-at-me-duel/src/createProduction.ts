import { createDuelScene } from "./createDuelScene";

/**
 * Connect the authored Human scene to the same Viewer and Render consumer.
 *
 * @evidence contracts/common.md#implementation-and-ownership The production scene owns court, actors, actual public Human solving and exact-time placement; Viewer owns display and Render capture. The current scene reports its implemented interval and solver diagnostics rather than treating the 60-second target clock as completed motion.
 * @evidence contracts/common.md#authoring-interface Returns scene, portrait camera, asynchronous preparation, finite-second seek, inspection, copied raw-frame diagnosis and resource disposal. Playback and export call the same prepared seek. The caller retires this production once; a requested duration does not enlarge its reported implemented interval.
 */
export function createProduction(implementedUntil: 48 | 60 = 60): ReturnType<typeof createDuelScene> {
  return createDuelScene(implementedUntil);
}
