import { HUMAN_CAPTURE_SUBJECTS } from "./HUMAN_CAPTURE_SUBJECTS";

/**
 * Resolve a subject in its canonical pose or select a named pose with
 * <subject>@<pose>. An unknown subject or pose throws with the available
 * choices.
 */
export function resolveHumanCaptureSubject(name: string): {
  subject: string;
  pose: string;
} {
  const at: number = name.indexOf("@");
  const subject: string = at === -1 ? name : name.slice(0, at);
  const offered: (typeof HUMAN_CAPTURE_SUBJECTS)[string] | undefined =
    Object.hasOwn(HUMAN_CAPTURE_SUBJECTS, subject)
      ? HUMAN_CAPTURE_SUBJECTS[subject]
      : undefined;
  if (offered === undefined)
    throw new Error(
      `Unknown Human capture subject "${subject}". Available: ${Object.keys(HUMAN_CAPTURE_SUBJECTS).join(", ")}`,
    );
  const pose: string = at === -1 ? offered.poses[0] : name.slice(at + 1);
  if (!offered.poses.includes(pose))
    throw new Error(
      `Unknown pose "${pose}" for ${subject}. Available: ${offered.poses.join(", ")}`,
    );
  return { subject, pose };
}
