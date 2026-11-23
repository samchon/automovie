import { preparePoseResolution } from "@automovie/engine";

/**
 * The reader a left limb's mirror-image solve reads through: one companion
 * of the operation's own reader, made at its first use and released with
 * it. A left limb is fitted as the right limb of the mirrored pose
 * (`solveHumanLimbFit`), and a reader keeps its forward-kinematics rows by
 * the last pose it read, so one reader shared by a pose and its mirror
 * image recomputed every frame at each turn from one to the other; with a
 * reader each, either keeps the rows of its own pose, and a limb's fit
 * recomputes the limbs fitted since. The frames either reader gives are
 * those of the pose it is asked, whatever it read before. A reader that is
 * not the engine's own (`preparePoseResolution.isNative`) is returned
 * itself, so its owner observes every call it was lent for.
 *
 * @param reader The operation's reader.
 * @returns The companion reader of the mirror image, or `reader` itself when it is not the engine's.
 */
export function mirrorHumanLimbSource(
  reader: ReturnType<typeof preparePoseResolution>,
): ReturnType<typeof preparePoseResolution> {
  if (!preparePoseResolution.isNative(reader)) return reader;
  let companion: ReturnType<typeof preparePoseResolution> | undefined =
    MIRRORS.get(reader);
  if (companion === undefined) {
    companion = preparePoseResolution();
    MIRRORS.set(reader, companion);
  }
  return companion;
}

/** Each operation reader's mirror-image companion, released with the reader. */
const MIRRORS: WeakMap<
  ReturnType<typeof preparePoseResolution>,
  ReturnType<typeof preparePoseResolution>
> = new WeakMap();
