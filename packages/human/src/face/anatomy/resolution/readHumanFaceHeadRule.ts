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
 * @evidence contracts/common.md#principled-implementation Face measurements call the shared head instruments; the face adds no second definition.
 * @evidence contracts/common.md#clear-and-simple-design One adapter call and one instrument call.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing names and refused readings return their reasons; nothing is substituted.
 * @evidence contracts/common.md#meaningful-documentation States the adapter, the unit change and both kinds of gap.
 * @evidence contracts/modeling.md#spatial-conventions The explicit scale converts metres to millimetres, square metres to square millimetres, or preserves degrees.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Each instrument cites its definition.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The reader names no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The reader is not a channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The reader emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The reader builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation Measurements report what it reads.
 * @evidenceExclude contracts/anatomy.md#permitted-range The reader bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The reader is not an input.
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
    return Number.isFinite(value) ? value : { reason: `The head instrument on ${head.id} has no finite reading in the requested unit.` };
  } catch (error) {
    return { reason: error instanceof Error ? error.message : String(error) };
  }
}
