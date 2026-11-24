import { HUMAN_CAPTURE_SUBJECTS } from "./HUMAN_CAPTURE_SUBJECTS";
import type { buildHumanSurfaceCapture } from "./buildHumanSurfaceCapture";
import { resolveHumanCaptureSubject } from "./resolveHumanCaptureSubject";

/** Build the selected subject's admitted surface and its curve marks. */
export function buildHumanCaptureFigure(
  name: string,
): ReturnType<typeof buildHumanSurfaceCapture> {
  const { subject, pose } = resolveHumanCaptureSubject(name);
  return HUMAN_CAPTURE_SUBJECTS[subject]!.create(subject, pose);
}
