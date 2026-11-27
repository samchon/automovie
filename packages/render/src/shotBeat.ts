/*
 * The beat id a shot id names: the text after a leading `shot:`, or the whole
 * id when it has no such prefix.
 *
 * The interface defines a beat's computed shot as `shot.id = "shot:" + beat`,
 * and an unprefixed id comes from a hand-authored shot that is its own beat.
 * The caption plan and the pose-keypoint plan label their frames with it, so
 * the two sidecars name the same beat for the same frame.
 */
export const shotBeat: (shotId: string) => string = (shotId: string): string =>
  shotId.startsWith("shot:") ? shotId.slice("shot:".length) : shotId;
