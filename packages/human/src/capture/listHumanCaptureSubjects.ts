import { HUMAN_CAPTURE_PEOPLE } from "./HUMAN_CAPTURE_PEOPLE";

/**
 * The names of every capture subject the package offers: each person in its canonical pose under the person's name, such as `f1`, then each of its other poses as `<person>@<pose>`.
 *
 * @returns The names in the people's order, then their poses' order.
 */
export function listHumanCaptureSubjects(): string[] {
  return Object.entries(HUMAN_CAPTURE_PEOPLE).flatMap(
    ([person, offered]: [
      string,
      (typeof HUMAN_CAPTURE_PEOPLE)[string],
    ]): string[] =>
      offered.poses.map((pose: string, index: number): string =>
        index === 0 ? person : `${person}@${pose}`,
      ),
  );
}
