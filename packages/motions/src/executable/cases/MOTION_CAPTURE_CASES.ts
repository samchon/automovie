import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { galleryCases } from "./galleryCases";

/**
 * Every capture case by name: each factory builds one or more cases, so a
 * sweep or a proficiency fan expands into several outputs from one name.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a factory returns.
 * @evidence contracts/development/design.md#principled-representation A closed table of named pure factories.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the capture harness only.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No case data lives here, only the registry.
 */
export const MOTION_CAPTURE_CASES: Readonly<Record<string, () => IMotionCaptureCase[]>> = {
  gallery: (): IMotionCaptureCase[] => galleryCases().filter((c: IMotionCaptureCase): boolean => c.name === "gallery"),
  bodies: (): IMotionCaptureCase[] => galleryCases().filter((c: IMotionCaptureCase): boolean => c.name === "bodies"),
};
