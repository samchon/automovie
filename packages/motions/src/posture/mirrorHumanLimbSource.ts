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
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the companion is for, why a reader per pose image helps, that frames never depend on it and the foreign-reader case.
 * @evidence contracts/development/implementation.md#principled-implementation A reader's cached rows are a function of the last pose it read; two images read alternately through one reader invalidate each other's rows, two readers keep their own.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One weak lookup and, at first use, one fresh engine reader.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No frame, pose or fit is stored; the companion computes every frame from the pose it is given.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per call; a reader pair keeps both images' rows instead of recomputing them at every switch.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The companion is keyed by the operation's own reader, so it lives exactly as long as the operation that made it.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One companion per live engine reader, in a weak map released with the reader.
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
