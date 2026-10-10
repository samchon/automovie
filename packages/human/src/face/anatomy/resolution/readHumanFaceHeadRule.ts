import type { IAutoMovieHumanHeadSkin } from "../../../common/measure/IAutoMovieHumanHeadSkin";
import type { IHumanFaceMeasurementContext } from "./IHumanFaceMeasurementContext";
import type { IHumanFaceMeasurementGap } from "./IHumanFaceMeasurementGap";
import { readHumanFaceHeadSkin } from "./readHumanFaceHeadSkin";

/**
 * Run a shared head instrument on the build's final skin, in its stated unit: the
 * skin and its named points and areas come from `readHumanFaceHeadSkin`, so a
 * name the basis does not declare returns its gap before `read` runs, and
 * `read` returns the instrument's unit on the shared `IAutoMovieHumanHeadSkin` record. A
 * reading the instrument refuses (an empty search, an extreme that only its
 * search bound sets) is returned as a gap with the instrument's own reason.
 * A non-finite converted reading is unavailable, never a measured value.
 * `scale` converts the instrument's unit to the measurement's: 1000 (the
 * default) for metres to millimetres, 1e6 for square metres to square
 * millimetres, 1 for an instrument that already returns degrees.
 *
 * @author Samchon
 */
export function readHumanFaceHeadRule(
  context: IHumanFaceMeasurementContext,
  landmarks: readonly string[],
  regions: readonly string[],
  read: (head: IAutoMovieHumanHeadSkin) => number,
  scale: number = 1000,
): number | IHumanFaceMeasurementGap {
  const head = readHumanFaceHeadSkin(context, landmarks, regions);
  if ("reason" in head) return head;
  try {
    const value = read(head) * scale;
    return Number.isFinite(value)
      ? value
      : {
          reason: `The head instrument on ${head.id} has no finite reading in the requested unit.`,
        };
  } catch (error) {
    return { reason: error instanceof Error ? error.message : String(error) };
  }
}
