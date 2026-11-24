import type {
  IAutoMoviePhysicalProfile,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
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
 * - `m-average.stand.json`: the average man's fitted public Stand, world poses
 *   by bone: `HumanChain.subject(id).stand({ hold: 1, sway: 0 })` read halfway
 *   from its settling to its end and fitted by `fitHumanPhysicalStandingPose`
 *   (floor 0, 32 iterations, tolerance 0.000025), as
 *   `test_physical_authored_locomotion` fitted it.
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

  /**
   * A stored person's fitted public Stand, world poses by bone
   * (`physicalHumanProfiles/<name>.stand.json`).
   */
  export function stand(name: Name): Record<string, IAutoMovieRigidTransform> {
    return JSON.parse(
      fs.readFileSync(
        path.join(repositoryRoot(), FOLDER, `${name}.stand.json`),
        "utf8",
      ),
    ) as Record<string, IAutoMovieRigidTransform>;
  }
}
