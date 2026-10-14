import type { IHumanCaptureCamera } from "./IHumanCaptureCamera.js";

/**
 * Recorded view angles with optional perspective framing in displayed metres.
 * The consumer owns defaults for omitted distance, target and field of view.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Required recorded yaw/pitch and optional distance/target/fov preserve exactly which framing was supplied; admitHumanCaptureCameraPose checks finite supported ranges and copies a supplied target before use.
 * @evidence contracts/common.md#clear-and-simple-design The partial framing record reuses angular/field meanings from IHumanCaptureCamera while leaving missing numerical defaults with the actual capture consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Omitted distance/target are not invented measurements. Consumers must state their framing conventions rather than treating missing record data as matched photographic provenance.
 * @evidence contracts/common.md#meaningful-documentation The comment and fields distinguish recorded angles from optional framing and fix metre/Y-up meanings; the admission owner documents supported angular boundaries.
 * @evidence contracts/performance.md#efficient-algorithms This fixed-size data record adds no algorithm; admission examines at most its scalar fields and three target coordinates.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared base-field meanings prevent duplicate conventions, but matching partial records do not establish equivalent captures when defaults or source/model differ.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The record retains only scalars and an optional tuple, no native camera or renderer. Admission's copied target transfers to the caller with ordinary data lifetime.
 */
export interface IHumanCaptureCameraPose extends Pick<
  IHumanCaptureCamera,
  "yaw" | "pitch" | "fov"
> {
  /** Positive eye-to-target distance in displayed metres, when recorded. */
  distance?: number;

  /** Finite target position in the displayed Y-up metre frame, when recorded. */
  target?: [number, number, number];
}
