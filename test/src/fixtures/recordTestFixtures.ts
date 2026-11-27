
import { AutoMovieEngineKinematics } from "@automovie/engine";
import { AutoMovieHumanCanonicalBody } from "@automovie/human";
import type { IAutoMovieHumanCanonicalBody } from "@automovie/interface";
import fs from "node:fs";
import path from "node:path";

import type { IHumanFixture } from "../features/internal/fixtures/IHumanFixture";
import { humanFixture } from "../features/internal/fixtures/humanFixture";
import { humanFixtureBody } from "../features/internal/fixtures/humanFixtureBody";
import { readFixture } from "../features/internal/fixtures/readFixture";
import type { IMotionHumanPerson } from "../features/internal/people/IMotionHumanPerson";
import { MOTION_HUMAN_PEOPLE } from "../features/internal/people/MOTION_HUMAN_PEOPLE";
import { repositoryRoot } from "../features/internal/repositoryRoot";

/** The measure and surfaces the engine derives from a rig and profile. */
type IDerived = Pick<IHumanFixture, "measure" | "surfaces">;

/**
 * Record the stored test fixtures: run on demand with `pnpm --filter
 * @automovie/test fixtures`, never by a test.
 *
 * For each person of `humanFixture.NAMES`, the typed Human parameters and mass
 * (`MOTION_HUMAN_PEOPLE`) are prepared by the public
 * `AutoMovieHumanCanonicalBody.prepare`, and the rig, the profile and their
 * measure and surfaces (`AutoMovieEngineKinematics.measureAutoMovieHumanoidBodyWithSurfaces`) are
 * written to `humans/<name>.json`. Each file is one line of JSON, which the
 * formatter leaves alone, and is replaced whole. The run prints each file's
 * size, the time each person took to prepare and the time `humanFixtureBody`
 * takes to build a body from the stored data.
 */
async function main(): Promise<void> {
  for (const name of humanFixture.NAMES) {
    const person: IMotionHumanPerson = MOTION_HUMAN_PEOPLE[name];
    const started: number = performance.now();
    const prepared: IAutoMovieHumanCanonicalBody.IBody =
      AutoMovieHumanCanonicalBody.prepare(person.params, {
        mass: person.mass,
        id: name,
      });
    const derived: IDerived = AutoMovieEngineKinematics.measureAutoMovieHumanoidBodyWithSurfaces(
      prepared.skeleton,
      prepared.profile,
    );
    const fixture: IHumanFixture = {
      name,
      mass: person.mass,
      skeleton: prepared.skeleton,
      profile: prepared.profile,
      measure: derived.measure,
      surfaces: derived.surfaces,
    };
    const text: string = JSON.stringify(fixture);
    const file: string = path.join(
      repositoryRoot(),
      readFixture.FOLDER,
      `humans/${name}.json`,
    );
    await fs.promises.mkdir(path.dirname(file), { recursive: true });
    await fs.promises.writeFile(file, text, "utf8");
    console.log(
      `humans/${name}.json: ${text.length.toLocaleString()} bytes, built in ${(performance.now() - started).toFixed(0)} ms`,
    );

    // What a test pays for a whole body built from the stored data instead.
    const building: number = performance.now();
    await humanFixtureBody(name);
    console.log(
      `humanFixtureBody("${name}"): ${(performance.now() - building).toFixed(0)} ms`,
    );
  }
}

main().catch((error: unknown): void => {
  console.error(error);
  process.exit(1);
});
