import { AutoMovieHumanHeadEarContact } from "@automovie/human";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieLoftViewFullSource,
  IAutoMovieViewPart,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * The ordinary angular partition resolves two close native ear crossings and
 * rejects contacts without a sign change.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the ear contact level and branch readers with a physical level chart.
 * @evidence contracts/development/testing.md#independent-expectations Uses analytic cosine-level roots and signs against a zero-lateral scalp.
 * @evidence contracts/development/testing.md#distinguishing-cases A regular sampled crossing, a narrow unsampled pair, tangency and a detached section have different outcomes.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous numerical test of original contact queries without a mesh or private reference.
 * @evidence contracts/development/common.md#meaningful-documentation The analytic input places the close pair entirely between two consecutive grid phases.
 */
export function test_human_head_ear_contact_roots(): void {
  const stations: [number, number] = [0, 1];
  const edge: IAutoMovieViewPart.IOutline = {
    knots: stations.map((station) => ({
      site: `end.${station}`,
      station,
      value: 1,
    })),
  };
  const part: IAutoMovieViewPart = {
    name: "auricle.left",
    axis: { at: (s) => ({ origin: [0, s, 0], u: [1, 0, 0], v: [0, 0, 1] }) },
    stations,
    front: { positive: edge, negative: edge },
    side: { positive: edge, negative: edge },
    fullness: { kind: "shoulder", shoulder: edge },
    order: 8,
    samples: 16,
  };
  const chart = (
    point: IAutoMovieLoftViewFullSource.IReader["point"],
  ): IAutoMovieLoftViewFullSource.IReader => ({
    domain: stations,
    regular: stations,
    point,
    pointAt: (s) => (t) => point(s, t),
    jet: () => {
      throw new Error("The level positioning should read native values");
    },
  });
  const scalp = chart((s, t) => [Math.cos(t), s, 0]);
  const read = (
    clearance: (phase: number) => number,
  ): ReturnType<typeof AutoMovieHumanHeadEarContact.levels> => {
    const ear = chart((s, t): AutoMovieVector3Tuple => [0, s, clearance(t)]);
    return AutoMovieHumanHeadEarContact.levels(part, ear, scalp, 1);
  };
  const step: number = (2 * Math.PI) / part.samples;
  const centre: number = Math.PI + step / 3;
  const halfWidth: number = step / 12;
  const pocket = (t: number): number =>
    Math.cos(halfWidth) - Math.cos(t - centre);
  const half = (t: number): number => t - Math.PI;
  const tangent = (t: number): number => 1 - Math.cos(t - Math.PI);
  const tolerance: number = step / 2 ** 38;
  const narrow = read(pocket);
  const inverted = read((t) => -pocket(t));
  for (const pair of [narrow, inverted])
    TestValidator.predicate(
      "both strict roots are found inside one phase step",
      () =>
        pair.every(
          ({ contactPhases }) =>
            contactPhases.length === 2 &&
            nclose(contactPhases[0]!, centre - halfWidth, tolerance) &&
            nclose(contactPhases[1]!, centre + halfWidth, tolerance),
        ),
    );
  const tiedCentre: number = (3 * step) / 2;
  const tiedPocket = (t: number): number =>
    (t / step - 3 / 2) ** 2 - (halfWidth / step) ** 2;
  TestValidator.predicate(
    "equal nearest phase readings retain one crossing pair",
    () =>
      tiedPocket(step) === tiedPocket(2 * step) &&
      read(tiedPocket).every(
        ({ contactPhases }) =>
          contactPhases.length === 2 &&
          nclose(contactPhases[0]!, tiedCentre - halfWidth, tolerance) &&
          nclose(contactPhases[1]!, tiedCentre + halfWidth, tolerance),
      ),
  );
  TestValidator.predicate(
    "adjacent zero readings need an interior sign witness",
    () =>
      read((t) => (t - step) * (t - 2 * step)).every(
        ({ contactPhases }) =>
          contactPhases.length === 2 &&
          nclose(contactPhases[0]!, step, tolerance) &&
          nclose(contactPhases[1]!, 2 * step, tolerance),
      ),
  );
  TestValidator.predicate(
    "the regular crossing at a sampled angle is counted once",
    () =>
      read(half).every(
        ({ contactPhases }) =>
          contactPhases.length === 1 &&
          nclose(contactPhases[0]!, Math.PI, tolerance),
      ),
  );
  TestValidator.predicate(
    "tangency or an exterior minimum contributes no crossings",
    () =>
      [
        tangent,
        (t: number) => tangent(t) + 1,
        (t: number) => -tangent(t),
      ].every((gap) =>
        read(gap).every(({ contactPhases }) => contactPhases.length === 0),
      ),
  );
  const disconnected = chart((s, t) => [
    0,
    s,
    tangent(t) + (s - 1 / 4) ** 2 * (s - 3 / 4) ** 2 - 1 / 1024,
  ]);
  const levels = AutoMovieHumanHeadEarContact.levels(
    part,
    disconnected,
    scalp,
    1,
  );
  TestValidator.predicate(
    "a real gap between attached intervals remains refused",
    () =>
      levels.some(
        ({ station, contactPhases }) =>
          station === 1 / 2 && contactPhases.length === 0,
      ) &&
      AutoMovieHumanHeadEarContact.observe(
        disconnected,
        scalp,
        1,
        levels,
        part.samples,
      ).refusal !== undefined,
  );
  for (const drop of [0, 1 / 32]) {
    const seam = chart((s, t) => [
      0,
      s,
      (s - 1 / 2) ** 2 - Math.sin(t) / 8 - drop,
    ]);
    const levels = AutoMovieHumanHeadEarContact.levels(part, seam, scalp, 1);
    TestValidator.equals(
      "a zero or inward posterior chart cut remains refused",
      AutoMovieHumanHeadEarContact.observe(seam, scalp, 1, levels, part.samples)
        .refusal,
      "The native posterior phase is not exterior",
    );
  }
}
