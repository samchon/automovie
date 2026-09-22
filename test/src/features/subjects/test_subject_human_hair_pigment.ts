import {
  createPortraitHairMaterial,
  createPortraitHairTexture,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";
import { PNG } from "pngjs";

import { throwsError } from "../internal/predicates";

/**
 * A greying head is an admixture of white and pigmented fibres, not one faded
 * colour, and the unpigmented fibre is the thicker one. Painting the pigment
 * black makes the switch readable: a pigmented fibre writes zero, an
 * unpigmented one keeps its shade. Scenarios:
 * 1. A finish without a greying proportion, or with a zero one, keeps the
 *    texture and the colour the population had before the mixture existed.
 * 2. No greying paints every fibre pigmented and full greying paints none of
 *    them, with no fibre part way between; full greying also covers more of
 *    the raster, since an unpigmented fibre is 67.68 against 57.41
 *    micrometres thick.
 * 3. A proportion in between paints both, and more of it leaves more fibres
 *    unpigmented.
 * 4. A greying finish becomes its own unpigmented fibre, which the pigment is
 *    then a multiplier of.
 * 5. A proportion outside the unit interval and a pigment outside the unit
 *    cube refuse.
 */
export const test_subject_human_hair_pigment = (): void => {
  const decode = (uri: string) =>
    PNG.sync.read(Buffer.from(uri.slice(22), "base64"));
  const fibres = 16;
  const finish = {
    id: "hair",
    name: "hair",
    baseColor: { r: 0.2, g: 0.1, b: 0.05, a: 1, hex: null },
    roughness: 0.7,
    metallic: 0,
    opacity: 1,
    emissive: null,
    baseColorTexture: null,
    doubleSided: true,
  };
  const shape = {
    seed: 7,
    fibres,
    coverage: 1,
    fibreNormalScale: 0,
    fibreShadeStrength: 1,
  };
  // Half coverage leaves a gap between neighbouring fibres, so the thicker
  // unpigmented fibre shows in the painted area instead of overlapping into it.
  const paint = (grey: number, pigment: number[] = [0, 0, 0]) =>
    decode(
      createPortraitHairTexture(7, fibres, 0.5, undefined, 1, {
        pigment,
        grey,
      }),
    );
  TestValidator.equals(
    "a finish without greying keeps the population's own texture",
    createPortraitHairMaterial(finish, shape).baseColorTexture,
    createPortraitHairTexture(7, fibres, 1),
  );
  TestValidator.equals(
    "a zero proportion keeps it too",
    createPortraitHairMaterial(finish, { ...shape, grey: 0 }).baseColorTexture,
    createPortraitHairTexture(7, fibres, 1),
  );
  const read = (texture: PNG) => {
    const row = Math.floor(texture.height / 2);
    let covered = 0,
      unpigmented = 0,
      pigmented = 0,
      runs = 0,
      last = "";
    for (let at = 3; at < texture.data.length; at += 4)
      covered += texture.data[at];
    for (let x = 0; x < texture.width; x++) {
      const at = (row * texture.width + x) * 4;
      if (texture.data[at + 3] === 0) {
        last = "";
        continue;
      }
      const side = texture.data[at] === 0 ? "pigmented" : "unpigmented";
      if (side === "unpigmented") unpigmented++;
      else pigmented++;
      if (side === "unpigmented" && side !== last) runs++;
      last = side;
    }
    return { covered, unpigmented, pigmented, runs };
  };
  const none = read(paint(0)),
    all = read(paint(1));
  TestValidator.predicate(
    "the switch has two sides and nothing between them",
    none.unpigmented === 0 &&
      none.pigmented > 0 &&
      all.pigmented === 0 &&
      all.unpigmented > 0,
  );
  TestValidator.predicate(
    "an unpigmented fibre is the thicker one",
    all.covered > none.covered * 1.1,
  );
  const half = read(paint(0.5));
  TestValidator.predicate(
    "a proportion in between paints both",
    half.unpigmented > 0 && half.pigmented > 0,
  );
  TestValidator.predicate(
    "more greying leaves more fibres unpigmented",
    read(paint(0.25)).runs < half.runs && half.runs < read(paint(0.75)).runs,
  );
  TestValidator.equals(
    "an ungreyed finish keeps its authored colour",
    createPortraitHairMaterial(finish, shape).baseColor,
    finish.baseColor,
  );
  TestValidator.equals(
    "a greying finish becomes its unpigmented fibre",
    createPortraitHairMaterial(finish, { ...shape, grey: 0.4 }).baseColor,
    { r: 1, g: 1, b: 1, a: 1, hex: null },
  );
  for (const grey of [-0.1, 1.1, Number.NaN])
    TestValidator.predicate(
      "a greying proportion outside the unit interval refuses",
      throwsError(
        () => createPortraitHairMaterial(finish, { ...shape, grey }),
        "greying proportion",
      ),
    );
  for (const pigment of [
    [1.2, 0, 0],
    [0, -0.1, 0],
    [0, 0],
  ] as number[][])
    TestValidator.predicate(
      "a pigment outside the unit cube refuses",
      throwsError(() => paint(0.5, pigment), "fibre mixture"),
    );
};
