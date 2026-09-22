import { Vector3 } from "@automovie/engine";
import {
  createHumanFaceBasisBuilder,
  createHumanFaceScalpTint,
  humanFaceHairlineBoundary,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { numericalHairBasisFixture } from "../internal/numericalHairBasisFixture";
import { nclose } from "../internal/predicates";

/**
 * The scalp under hair takes the hair's colour by a shared rule.
 * Scenarios:
 * 1. With the hairline at the equator's far side every domain vertex of the
 *    analytic ball is fully covered and multiplied toward the hair colour,
 *    which for a greying layer is the mixture its unpigmented fibres make and
 *    for an ungreyed one is the pigment itself;
 *    the bottom vertex outside the domain keeps its skin.
 * 2. A front hairline just past the equator covers the front vertex half,
 *    by the smooth ramp across the 20 mm transition zone; one short of the
 *    equator leaves it bare; the boundary blends the four angles by the
 *    squared horizontal components.
 * 3. A root region far from a vertex removes its tint, an empty layer tints
 *    nothing, and a skin darker than the hair is left as it is.
 * 4. The builder applies the gains as vertex colours of the resident
 *    surface only when the document has hair.
 */
export const test_subject_human_scalp_tint = (): void => {
  const { basis, document } = numericalHairBasisFixture();
  const tint = createHumanFaceScalpTint(basis);
  const skin = basis.materials[0].baseColor;
  // What stands over the scalp is the mixture, so a greying layer lifts its
  // pigment toward white by its own unpigmented proportion.
  const finish = document.hair!.layers[0].finish;
  const hair = finish.color.map(
    (value) => value + (1 - value) * (finish.grey ?? 0),
  );
  const full = [skin.r, skin.g, skin.b].map((value, at) =>
    Math.min(1, hair[at] / value),
  );
  const gains = tint(document.hair, basis.materials).get("head")!;
  const vertex = (index: number) => gains.slice(3 * index, 3 * index + 3);
  TestValidator.predicate(
    "domain vertices take the hair colour, the bottom keeps its skin",
    [0, 1, 2, 4, 5].every((index) =>
      vertex(index).every((value, at) => nclose(value, full[at])),
    ) && vertex(3).every((value) => value === 1),
  );
  const ungreyed = structuredClone(document.hair!);
  delete ungreyed.layers[0].finish.grey;
  const pigmented = tint(ungreyed, basis.materials).get("head")!;
  TestValidator.predicate(
    "without greying the scalp takes the pigment itself",
    [0, 1, 2].every((at) =>
      nclose(
        pigmented[at],
        Math.min(1, finish.color[at] / [skin.r, skin.g, skin.b][at]),
      ),
    ) && pigmented[0] < full[0],
  );
  const front = structuredClone(document.hair!);
  // The fixture's crown vertex stands 100 mm from the chart origin, so half of
  // the 10 mm transition zone is 0.05 radians of slack at that distance.
  front.layers[0].hairline.front = Math.PI / 2 + 0.05;
  const half = tint(front, basis.materials).get("head")!;
  const expected = 0.5 * 0.5 * (3 - 2 * 0.5);
  TestValidator.predicate(
    "half the transition covers half",
    [0, 1, 2].every((at) =>
      nclose(half[3 * 4 + at], 1 + (full[at] - 1) * expected),
    ),
  );
  front.layers[0].hairline.front = Math.PI / 2 - 0.05;
  const bare = tint(front, basis.materials).get("head")!;
  TestValidator.predicate(
    "outside the hairline stays bare",
    [0, 1, 2].every((at) => bare[3 * 4 + at] === 1) &&
      [0, 1, 2].every((at) => nclose(bare[3 * 1 + at], full[at])),
  );
  TestValidator.predicate(
    "the boundary blends the four angles",
    nclose(
      humanFaceHairlineBoundary(Vector3.create(1, 0, 1), {
        front: 1,
        back: 2,
        left: 3,
        right: 4,
      }),
      0.5 * 3 + 0.5 * 1,
    ) &&
      nclose(
        humanFaceHairlineBoundary(Vector3.create(0, 1, 0), {
          front: 1,
          back: 2,
          left: 3,
          right: 4,
        }),
        1,
      ),
  );
  const regional = structuredClone(document.hair!);
  regional.layers[0].rootRegion = {
    center: [0, 0.1, 0],
    spread: [0.01, 0.01, 0.01],
  };
  const localized = tint(regional, basis.materials).get("head")!;
  TestValidator.predicate(
    "a root region tints only where it grows",
    [0, 1, 2].every((at) => nclose(localized[3 * 2 + at], full[at])) &&
      [0, 1, 2].every((at) => nclose(localized[3 * 4 + at], 1)),
  );
  const empty = structuredClone(document.hair!);
  empty.layers[0].count = 0;
  TestValidator.equals(
    "an empty layer tints nothing",
    tint(empty, basis.materials).size,
    0,
  );
  const dark = structuredClone(basis.materials);
  dark[0].baseColor = { ...dark[0].baseColor, r: 0.05, g: 0.02, b: 0.01 };
  TestValidator.predicate(
    "a skin darker than the hair is left as it is",
    tint(document.hair, dark)
      .get("head")!
      .every((value) => value === 1),
  );
  TestValidator.equals("no hair, no tint", tint(null, basis.materials).size, 0);
  const build = createHumanFaceBasisBuilder(basis);
  const colours = (hairless: boolean) => {
    const part = build({
      ...document,
      hair: hairless ? null : document.hair,
    }).parts.find((one) => one.id === "skin")!.geometry;
    return part.type === "mesh" ? part.mesh.colors : undefined;
  };
  TestValidator.predicate(
    "the builder colours the scalp only under hair",
    colours(true) === undefined &&
      colours(false) !== undefined &&
      colours(false)!.some((value) => value < 1),
  );
};
