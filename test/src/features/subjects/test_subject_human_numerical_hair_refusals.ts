import {
  type IAutoMovieHumanFaceHair,
  assertHumanFaceHair,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { createNumericalHairFixture } from "../internal/createNumericalHairFixture";
import { throwsError } from "../internal/predicates";

/**
 * Each numerical refusal differs from a valid complete profile in one field.
 * Scenarios:
 * 1. Population, seed, metric dimensions, finite vectors and angular ranges refuse.
 * 2. Optional parting and Gaussian envelopes enforce their own metric conditions.
 * 3. Curl sampling, taper and independent appearance values refuse at either side.
 * 4. Repeated identities, ninth layers and per-lock/combined budgets refuse;
 *    a zero-count layer still cannot carry an unrepresentable sampling request.
 */
export const test_subject_human_numerical_hair_refusals = (): void => {
  const edits: ((layer: IAutoMovieHumanFaceHair.Layer) => void)[] = [
    (l) => {
      l.id = " ";
    },
    (l) => {
      l.surface = "";
    },
    (l) => {
      l.domain = "\t";
    },
    (l) => {
      l.count = 0.5;
    },
    (l) => {
      l.count = -1;
    },
    (l) => {
      l.count = 1025;
    },
    (l) => {
      l.seed = 0.5;
    },
    (l) => {
      l.seed = -1;
    },
    (l) => {
      l.seed = 0x100000000;
    },
    (l) => {
      l.hairline.front = -0.1;
    },
    (l) => {
      l.hairline.back = Math.PI + 0.1;
    },
    (l) => {
      l.lengthAxes[0] = 0;
    },
    (l) => {
      l.lengthAxes[1] = Infinity;
    },
    (l) => {
      l.lengthVariation = -0.1;
    },
    (l) => {
      l.lengthVariation = 1.1;
    },
    (l) => {
      l.width = 0;
    },
    (l) => {
      l.width = 0.041;
    },
    (l) => {
      l.samplingStep = 0;
    },
    (l) => {
      l.samplingStep = 0.006;
    },
    (l) => {
      l.clearance = -0.1;
    },
    (l) => {
      l.clearance = Infinity;
    },
    (l) => {
      l.flow = [0, 0, 0];
    },
    (l) => {
      l.flow[0] = NaN;
    },
    (l) => {
      l.lift.strength = -1;
    },
    (l) => {
      l.lift.reach = 0;
    },
    (l) => {
      l.curl.angle = -0.1;
    },
    (l) => {
      l.curl.angle = Math.PI / 2;
    },
    (l) => {
      l.curl.angle = NaN;
    },
    (l) => {
      l.curl.wavelength = 0;
    },
    (l) => {
      l.curl.wavelength = 0.015;
    },
    (l) => {
      l.curl.reach = 0;
    },
    (l) => {
      l.taper.tipWidth = 0.04;
    },
    (l) => {
      l.taper.tipWidth = 1.1;
    },
    (l) => {
      l.taper.start = -0.1;
    },
    (l) => {
      l.taper.start = 0.96;
    },
    (l) => {
      l.finish.color[0] = -0.1;
    },
    (l) => {
      l.finish.color[1] = 1.1;
    },
    (l) => {
      l.finish.roughness = NaN;
    },
    (l) => {
      l.finish.fibres = 1.5;
    },
    (l) => {
      l.finish.fibres = 0;
    },
    (l) => {
      l.finish.fibres = 33;
    },
    (l) => {
      l.finish.coverage = 0.09;
    },
    (l) => {
      l.finish.normal = 1.1;
    },
    (l) => {
      l.finish.shade = -0.1;
    },
  ];
  for (const edit of edits) {
    const input = createNumericalHairFixture();
    assertHumanFaceHair(input);
    edit(input.layers[0]);
    TestValidator.predicate(
      "one-field numerical refusal",
      throwsError(() => assertHumanFaceHair(input)),
    );
  }
  const partEdits: ((
    part: NonNullable<IAutoMovieHumanFaceHair.Layer["part"]>,
  ) => void)[] = [
    (p) => {
      p.normal = [0, 0, 0];
    },
    (p) => {
      p.offset = Infinity;
    },
    (p) => {
      p.transitionWidth = 0;
    },
    (p) => {
      p.bias[0] = NaN;
    },
    (p) => {
      p.strength = -1;
    },
    (p) => {
      p.reach = 0;
    },
    (p) => {
      p.region!.center[0] = NaN;
    },
    (p) => {
      p.region!.spread[0] = Infinity;
    },
    (p) => {
      p.region!.spread[0] = 0;
    },
  ];
  for (const edit of partEdits) {
    const input = createNumericalHairFixture();
    input.layers[0].part = {
      normal: [1, 0, 0],
      offset: 0,
      transitionWidth: 0.002,
      bias: [0, 0, -1],
      strength: 1,
      reach: 0.02,
      region: { center: [0, 0, 0], spread: [1, 1, 1] },
    };
    assertHumanFaceHair(input);
    edit(input.layers[0].part);
    TestValidator.predicate(
      "parting field refusal",
      throwsError(() => assertHumanFaceHair(input)),
    );
  }
  const duplicate = createNumericalHairFixture();
  duplicate.layers.push(structuredClone(duplicate.layers[0]));
  TestValidator.predicate(
    "duplicate layer",
    throwsError(() => assertHumanFaceHair(duplicate)),
  );
  const ninth = {
    layers: Array.from({ length: 9 }, (_, at) => ({
      ...createNumericalHairFixture().layers[0],
      id: String(at),
    })),
  };
  TestValidator.predicate(
    "layer population",
    throwsError(() => assertHumanFaceHair(ninth)),
  );
  for (const [count, step, length] of [
    [0, 1e-320, 0.05],
    [0, 1e-8, 0.05],
    [1024, 0.0001, 0.1],
  ]) {
    const input = createNumericalHairFixture();
    input.layers[0].count = count;
    input.layers[0].samplingStep = step;
    input.layers[0].lengthAxes.fill(length);
    TestValidator.predicate(
      "combined construction budget",
      throwsError(() => assertHumanFaceHair(input), "budget"),
    );
  }
};
