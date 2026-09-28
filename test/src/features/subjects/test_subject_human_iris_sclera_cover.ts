import {
  createHumanFaceIrisPigment,
  decodePortraitPng,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceIrisGlobeFixture } from "../internal/humanFaceIrisGlobeFixture";

/** IEC 61966-2-1 sRGB encoding, written independently of the rule. */
const srgb = (value: number): number =>
  Math.round(
    255 *
      (value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055),
  );

/**
 * A texture iris larger than the anatomical one is covered by sclera.
 * Scenarios:
 * 1. On a 16 mm globe whose texture paints its iris grey to the population
 *    ratio (28.9 degrees), the anatomical limbus is asin(11.71 / 32) = 21.5
 *    degrees: the painted iris between them becomes the white sclera
 *    averaged just outside it, and the stroma inside is the pigment.
 */
export const test_subject_human_iris_sclera_cover = (): void => {
  const brown = { base: [0.05, 0.02, 0.01], variation: [0, 0, 0] };
  const large = humanFaceIrisGlobeFixture({
    radius: 0.016,
    size: 256,
    painted: 28.94,
  });
  const covered = structuredClone(large.materials);
  createHumanFaceIrisPigment(large)({ left: brown, right: brown }, covered);
  const wide = decodePortraitPng(covered[1].baseColorTexture as string);
  const polar = (x: number, y: number) =>
    (Math.hypot((x + 0.5) / 256 - 0.25, (y + 0.5) / 256 - 0.5) / 0.2) * 180;
  const rgb = (image: typeof wide, x: number, y: number) =>
    [...image.rgba.subarray(4 * (y * 256 + x), 4 * (y * 256 + x) + 3)].join();
  const annulus: string[] = [];
  const inner: string[] = [];
  for (let y = 100; y < 156; ++y)
    for (let x = 36; x < 92; ++x) {
      const degrees = polar(x, y);
      if (degrees > 22.5 && degrees < 28) annulus.push(rgb(wide, x, y));
      if (degrees > 12 && degrees < 18) inner.push(rgb(wide, x, y));
    }
  TestValidator.predicate(
    "a larger painted iris is covered by sclera",
    annulus.length > 0 &&
      annulus.every((one) => one === "255,255,255") &&
      inner.length > 0 &&
      inner.every((one) => one === brown.base.map(srgb).join()),
  );
};

/**
 * With no sclera texel outside the painted iris the cover is white.
 * Scenarios:
 * 1. The same globe without its rings from 25 to 35 degrees leaves the
 *    sclera band empty; the painted iris below 24.5 degrees outside the
 *    anatomical limbus becomes white.
 */
export const test_subject_human_iris_sclera_fallback = (): void => {
  const brown = { base: [0.05, 0.02, 0.01], variation: [0, 0, 0] };
  const polar = (x: number, y: number) =>
    (Math.hypot((x + 0.5) / 256 - 0.25, (y + 0.5) / 256 - 0.5) / 0.2) * 180;
  const bare = humanFaceIrisGlobeFixture({
    radius: 0.016,
    size: 256,
    painted: 28.94,
    gap: [29, 32],
  });
  const plain = structuredClone(bare.materials);
  createHumanFaceIrisPigment(bare)({ left: brown, right: brown }, plain);
  const gapped = decodePortraitPng(plain[1].baseColorTexture as string);
  const rgb = (image: typeof gapped, x: number, y: number) =>
    [...image.rgba.subarray(4 * (y * 256 + x), 4 * (y * 256 + x) + 3)].join();
  const fallback: string[] = [];
  // The left-out rings take 25 to 35 degrees; the cover is read below them.
  for (let y = 100; y < 156; ++y)
    for (let x = 36; x < 92; ++x) {
      const degrees = polar(x, y);
      if (degrees > 22.5 && degrees < 24.5) fallback.push(rgb(gapped, x, y));
    }
  TestValidator.predicate(
    "an empty sclera band covers with white",
    fallback.length > 0 && fallback.every((one) => one === "255,255,255"),
  );
};
