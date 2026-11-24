import type { IAutoMovieCameraFrameEntry } from "@automovie/interface";

/**
 * Whether a camera `frame` entry moves the camera along a path keyed at the
 * delivery frames, so that compiling it needs the delivery frame rate.
 *
 * `push-in`, `orbit` and `truck` always move. `follow` moves when its subject
 * is animated, and holds one framed key for an unsampled subject. `static`
 * holds one key and `whip` turns within its fixed 0.2 s, both at authored
 * instants, so neither needs a rate.
 *
 * @param entry The frame action with its resolved subject.
 * @returns Whether the entry's path is keyed at delivery frames.
 */
export function cameraFrameEntryMoves(
  entry: Pick<IAutoMovieCameraFrameEntry, "action" | "subject">,
): boolean {
  switch (entry.action.move) {
    case "push-in":
    case "orbit":
    case "truck":
      return true;
    case "follow":
      return entry.subject.at !== null;
    case "static":
    case "whip":
      return false;
  }
}
