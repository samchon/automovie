import type { IHumanFixture } from "./IHumanFixture";
import { readFixture } from "./readFixture";

/**
 * A stored person's rig, profile, measure and surfaces, read fresh from
 * `humans/<name>.json` (`IHumanFixture`).
 *
 * The file is recorded once by `recordTestFixtures` from the public Human and
 * engine APIs, so a test reads Human's output as recorded and never prepares a
 * figure. Each call reads the file again and shares nothing with another call,
 * so a test may modify what it receives.
 *
 * @param name The stored person.
 * @returns The person's fixture.
 */
export async function humanFixture(
  name: humanFixture.Name,
): Promise<IHumanFixture> {
  return readFixture<IHumanFixture>(`humans/${name}.json`);
}

/** Companion types and lists of {@link humanFixture}. */
export namespace humanFixture {
  /**
   * The stored people: the average man (1.75 m) and the smallest woman of the
   * sweep (`f-small`, 1.48 m and 38 kg), the two bodies most tests read.
   */
  export type Name = "m-average" | "f-small";

  /** Every stored person, in the order `recordTestFixtures` writes them. */
  export const NAMES: readonly Name[] = ["m-average", "f-small"];
}
