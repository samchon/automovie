import { AutoMovieEngineKinematics } from "@automovie/engine";

/*
 * The reader a left limb's mirror-image solve reads through: a fresh reader of
 * its own. A left limb is fitted as the right limb of the mirrored pose
 * (`solveHumanLimbFit`), and a reader keeps its forward-kinematics rows by the
 * last pose it read, so one reader shared by a pose and its mirror image
 * recomputed every frame at each turn from one to the other; the mirror image's
 * own reader keeps the rows of its own pose while the solve lasts. The frames
 * either reader gives are those of the pose it is asked, whatever it read
 * before. A reader that is not the engine's own
 * (`AutoMovieEngineKinematics.preparePoseResolution.isNative`) is returned itself, so its owner observes
 * every call it was lent for.
 * Parameter reader: The operation's reader.
 * Returns: A fresh reader for the mirror image, or `reader` itself when it is
 * not the engine's.
 */
export function mirrorHumanLimbSource(
  _reader: ReturnType<typeof AutoMovieEngineKinematics.preparePoseResolution>,
): ReturnType<typeof AutoMovieEngineKinematics.preparePoseResolution> {
  return AutoMovieEngineKinematics.preparePoseResolution();
}
