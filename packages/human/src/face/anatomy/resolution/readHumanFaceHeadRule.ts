import type { IAutoMovieHumanHeadSkin } from "../../../common/measure/IAutoMovieHumanHeadSkin";
import type { IHumanFaceMeasurementContext } from "./IHumanFaceMeasurementContext";
import type { IHumanFaceMeasurementGap } from "./IHumanFaceMeasurementGap";
import { readHumanFaceHeadSkin } from "./readHumanFaceHeadSkin";

/**
 * Run a shared head instrument on the build's final skin, in its stated unit: the skin and its named points and areas come from `readHumanFaceHeadSkin`, so a name the basis does not declare returns its gap before `read` runs, and `read` returns the instrument's unit on the shared `IAutoMovieHumanHeadSkin` record. A reading the instrument refuses (an empty search, an extreme that only its search bound sets) is returned as a gap with the instrument's own reason. A non-finite converted reading is unavailable, never a measured value. `scale` converts the instrument's unit to the measurement's: 1000 (the default) for metres to millimetres, 1e6 for square metres to square millimetres, 1 for an instrument that already returns degrees.
 *
 * @evidence contracts/common.md#principled-implementation Qualified final head skin reaches a supplied shared instrument, whose converted finite reading or refusal becomes value/gap.
 * @evidence contracts/common.md#clear-and-simple-design Named registration and unit conversion are separated from the instrument's actual numerical method.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonfinite values and thrown instrument values become explicit gaps rather than successful zeros or clinical assertions.
 * @evidence contracts/common.md#meaningful-documentation Default scale converts metres to millimetres; caller scale can preserve degrees or convert square metres.
 * @evidence contracts/performance.md#efficient-algorithms Current-skin copying plus supplied instrument work dominate; the wrapper adds fixed conversion/error handling.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared skin qualification and concrete instrument are reused rather than another face-specific formula.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The synchronous call retains no callback/context beyond its result and temporary copied skin buffers are collectible.
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
  const head: IAutoMovieHumanHeadSkin | IHumanFaceMeasurementGap =
    readHumanFaceHeadSkin(context, landmarks, regions);
  if ("reason" in head) return head;
  try {
    const value: number = read(head) * scale;
    return Number.isFinite(value)
      ? value
      : {
          reason: `The head instrument on ${head.id} has no finite reading in the requested unit.`,
        };
  } catch (error) {
    return { reason: error instanceof Error ? error.message : String(error) };
  }
}
