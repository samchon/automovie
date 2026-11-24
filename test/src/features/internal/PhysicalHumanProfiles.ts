import type { IAutoMoviePhysicalProfile } from "@automovie/interface";
import fs from "node:fs";
import path from "node:path";

import { repositoryRoot } from "./repositoryRoot";

/**
 * The canonical Human's physical profiles, stored alone so a test reads a
 * profile without building the figure or parsing a recording
 * (`physicalHumanProfiles/<name>.json`, each the profile's JSON).
 *
 * - `m-average`: the profile the balance replay's recordings ran with, its
 *   digest the one they record (`PhysicalBalanceReplay.digest`, `b7233af0`).
 * - `m-tall`: `AutoMovieHumanCanonicalBody.prepare` for the tall man's
 *   parameters (`motionHumanBody("m-tall")`), a second body size with no
 *   recording.
 */
export namespace PhysicalHumanProfiles {
  /** The profiles' folder, under the repository. */
  export const FOLDER: string =
    "test/src/features/internal/physicalHumanProfiles";

  /** The stored people. */
  export type Name = "m-average" | "m-tall";

  /** One stored profile, read. */
  export function load(name: Name): IAutoMoviePhysicalProfile {
    return JSON.parse(
      fs.readFileSync(path.join(repositoryRoot(), FOLDER, `${name}.json`), "utf8"),
    ) as IAutoMoviePhysicalProfile;
  }
}
