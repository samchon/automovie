import { HUMAN_CAPTURE_SUBJECTS } from "./HUMAN_CAPTURE_SUBJECTS";

/**
 * List each subject in its canonical pose, then each additional pose as
 * <subject>@<pose>.
 */
export function listHumanCaptureSubjects(): string[] {
  return Object.entries(HUMAN_CAPTURE_SUBJECTS).flatMap(
    ([subject, offered]): string[] =>
      offered.poses.map((pose: string, index: number): string =>
        index === 0 ? subject : `${subject}@${pose}`,
      ),
  );
}
