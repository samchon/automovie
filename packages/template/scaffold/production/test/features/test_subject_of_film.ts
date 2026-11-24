import type {
  IAutoMovieFilmOptics,
  IAutoMovieRenderSoftPropFrame,
} from "@automovie/interface";
import type { IAutoMovieDrawScene } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import type { IFilm } from "../../src/IFilm";
import type { IFilmProduction } from "../../src/IFilmProduction";
import { subjectOfFilm } from "../../src/subjectOfFilm";

/**
 * A film becomes its draw subject with every placement passed through: the shot
 * and its shot-local time of `seekShot` unclamped, the film second clamped to
 * the running time, and the soft props read after every placement.
 *
 * Scenarios, on a 15 s film whose production records each call:
 *
 * 1. `seekShot` of shot A at −1/64 s, a shutter sample's handle, during film
 *    second 20 places A at −1/64 s during 15 s, then reads the soft props at 15
 *    s.
 * 2. `seek` and `place` at −1 s place the film at 0 s, each then reading the soft
 *    props at 0 s, and `optics` at 20 s reads the film's optics at 15 s.
 * 3. A film without `seekShot` gives a subject without it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three scenarios and the placements and readings each pins.
 * @evidence contracts/development/testing.md#behavioral-verification Creates the subject through `subjectOfFilm`, the mapping `src/subjects.ts` uses, and asserts the arguments the production receives in order; a clamped shot-local time, an unclamped film second, a dropped soft-prop read after `seekShot` or a stubbed `seekShot` fails.
 * @evidence contracts/development/testing.md#independent-expectations The clamp's ends are zero and the literal 15 s running time, and −1/64 s is exactly representable.
 * @evidence contracts/development/testing.md#distinguishing-cases Shot and film placements, times before zero and past the end, and a film with and without `seekShot`.
 * @evidence contracts/development/testing.md#execution-ownership A unit test with an in-memory film, discovered by test/index.ts; it prepares the physical geometry queries but starts no inspector, browser or render.
 */
export async function test_subject_of_film(): Promise<void> {
  const calls: string[] = [];
  const film: (seekShot: boolean) => IFilm = (seekShot: boolean): IFilm => ({
    durationSeconds: 15,
    fps: 24,
    create: async (): Promise<IFilmProduction> => ({
      scene: new THREE.Scene(),
      camera: new THREE.PerspectiveCamera(),
      seek: (seconds: number): void => {
        calls.push(`seek ${seconds}`);
      },
      ...(seekShot
        ? {
            seekShot: (
              shot: string,
              seconds: number,
              filmSeconds: number,
            ): void => {
              calls.push(`seekShot ${shot} ${seconds} ${filmSeconds}`);
            },
          }
        : {}),
      softPropsAt: (seconds: number): IAutoMovieRenderSoftPropFrame[] => {
        calls.push(`softProps ${seconds}`);
        return [];
      },
      optics: (seconds: number): IAutoMovieFilmOptics => {
        calls.push(`optics ${seconds}`);
        return { ev100: 10, toneMapping: "none" };
      },
      dispose: (): void => {},
    }),
  });
  const subject: IAutoMovieDrawScene = await subjectOfFilm(
    "film",
    film(true),
  ).create();

  // 1. A shot placement.
  await subject.seekShot!("shot:a", -1 / 64, 20);
  TestValidator.equals(
    "seekShot passes the shot-local time unclamped and clamps the film second",
    calls.splice(0),
    [`seekShot shot:a ${-1 / 64} 15`, "softProps 15"],
  );

  // 2. Film placements and a reader.
  await subject.seek(-1);
  subject.place!(-1);
  subject.optics!(20);
  TestValidator.equals(
    "film placements and readers take the clamped film second",
    calls.splice(0),
    ["seek 0", "softProps 0", "seek 0", "softProps 0", "optics 15"],
  );
  subject.dispose();

  // 3. A film without seekShot.
  const bare: IAutoMovieDrawScene = await subjectOfFilm(
    "film",
    film(false),
  ).create();
  TestValidator.equals("no seekShot", bare.seekShot, undefined);
  bare.dispose();
}
