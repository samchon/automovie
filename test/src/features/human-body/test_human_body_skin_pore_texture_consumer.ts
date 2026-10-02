import {
  type IAutoMovieHumanBodySkinDetail,
  createHumanBodySkinDetailTexture,
  decodePng,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * The actual texture producer consumes the population, rather than merely
 * exposing a corrected helper. Positive-depth zero density produces a flat
 * normal, while 22 and 25 give distinct fields; the old square grid gave both
 * exactly the same 25 centres. The analytic 64-texel table resolves the dimples
 * so the consumer assertion does not depend on an unresolved tiny feature.
 *
 * Scenarios:
 * 1. Zero density with positive dimple depth produces flat RGBA normals.
 * 2. Density 22 and 25 produce distinct actual PNG fields, where the old
 *    square population rounded both to the same 25 centres.
 * 3. A negative density refuses through the actual texture consumer.
 */
export const test_human_body_skin_pore_texture_consumer = (): void => {
  const table: IAutoMovieHumanBodySkinDetail = {
    seed: 1, pixels: 64, tileMillimetres: 10, lines: [],
    pores: { perSquareCentimetre: 0, radiusMicrometres: 300, depthMicrometres: 30 },
    age: [[0, 1]],
  };
  const flat = decodePng(createHumanBodySkinDetailTexture(table));
  TestValidator.predicate("zero density consumes no positive-depth dimple",
    Array.from({ length: 64 * 64 }, (_, i) => i).every((i) =>
      flat.rgba[i * 4] === 128 && flat.rgba[i * 4 + 1] === 128 &&
      flat.rgba[i * 4 + 2] === 255 && flat.rgba[i * 4 + 3] === 255));
  const texture = (density: number) => createHumanBodySkinDetailTexture({
    ...table, pores: { ...table.pores, perSquareCentimetre: density },
  });
  TestValidator.predicate("distinct authored densities produce distinct consumed fields",
    texture(22) !== texture(25));
  TestValidator.predicate("actual consumer admits statistical units before rendering",
    throwsError(() => texture(-1), "nonnegative density"));
};
