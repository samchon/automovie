import { HUMAN_CAPTURE_PEOPLE } from "./HUMAN_CAPTURE_PEOPLE";

/** Lists every person and pose offered for Human capture. */
export namespace AutoMovieHumanCaptureSubjects {
  /** The person names and supported poses in their authored order. */
  export type IOutput = string[];

  /**
   * The names of every capture subject the package offers: each person in its canonical pose under the person's name, such as `f1`, then each of its other poses as `<person>@<pose>`.
   *
   * @returns The names in the people's order, then their poses' order.
   */
  export function list(): IOutput {
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
}
