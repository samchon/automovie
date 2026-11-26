import { HUMAN_CAPTURE_PEOPLE } from "./HUMAN_CAPTURE_PEOPLE";

/**
 * Read a capture subject's name as the person and the pose it draws: `<person>` is the person in its canonical pose, and `<person>@<pose>` the person in another pose.
 *
 * It throws for a person the package does not define, listing the people it does, and for a pose the person is not drawn in, listing the poses it is.
 *
 * @param name The subject's name, such as `f1`.
 * @returns The person and the pose.
 */
export function resolveHumanCaptureSubject(name: string): {
  person: string;
  pose: string;
} {
  const at: number = name.indexOf("@");
  const person: string = at === -1 ? name : name.slice(0, at);
  const offered: (typeof HUMAN_CAPTURE_PEOPLE)[string] | undefined =
    Object.hasOwn(HUMAN_CAPTURE_PEOPLE, person)
      ? HUMAN_CAPTURE_PEOPLE[person]
      : undefined;
  if (offered === undefined)
    throw new Error(
      `Human defines no person "${person}"; it defines ${Object.keys(HUMAN_CAPTURE_PEOPLE).join(", ")}`,
    );
  const pose: string = at === -1 ? offered.poses[0]! : name.slice(at + 1);
  if (!offered.poses.includes(pose))
    throw new Error(
      `Human person ${person} has no pose "${pose}"; it is drawn in ${offered.poses.join(", ")}`,
    );
  return { person, pose };
}
