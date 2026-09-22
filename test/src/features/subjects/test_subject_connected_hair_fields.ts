import { connectedHairFields } from "@automovie/playground/src/human/connectedHairFields";
import { TestValidator } from "@nestia/e2e";

import { createNumericalHairFixture } from "../internal/createNumericalHairFixture";
import { nclose } from "../internal/predicates";

/**
 * Fine controls each own one canonical scalar, with no implicit unit conversion
 * in the descriptor's read/write operations. UI scaling is explicit metadata.
 * Scenarios:
 * 1. Every scalar has its documented canonical path and metre/degree display scale.
 * 2. A write changes only that path and returns the same scalar on readback.
 * 3. Optional guide, part and region fields disappear when their structures
 *    are absent.
 */
export const test_subject_connected_hair_fields = (): void => {
  const layer = createNumericalHairFixture().layers[0];
  layer.part = {
    normal: [1, 0, 0],
    offset: 0,
    transitionWidth: 0.004,
    bias: [0, 0, -1],
    strength: 1,
    reach: 0.05,
    region: { center: [0, 0, 0], spread: [0.1, 0.1, 0.1] },
  };
  layer.guides = { fraction: 0.125, neighbours: 4, clump: 0.2 };
  const expected: { id: string; path: (string | number)[]; scale: number }[] =
    [];
  const add = (id: string, path: (string | number)[], scale = 1): void => {
    expected.push({ id, path, scale });
  };
  for (const key of ["count", "seed", "lengthVariation"]) add(key, [key]);
  for (const key of ["width", "samplingStep", "clearance"])
    add(key, [key], 1000);
  for (const key of ["front", "left", "right", "back"])
    add(`hairline-${key}`, ["hairline", key], 180 / Math.PI);
  for (let at = 0; at < 6; at++) add(`length-${at}`, ["lengthAxes", at], 1000);
  for (let at = 0; at < 3; at++) {
    add(`flow-${at}`, ["flow", at]);
    add(`colour-${at}`, ["finish", "color", at]);
    for (const key of ["normal", "bias"])
      add(`part-${key}-${at}`, ["part", key, at]);
    for (const key of ["center", "spread"])
      add(`part-region-${key}-${at}`, ["part", "region", key, at], 1000);
  }
  add("lift-strength", ["lift", "strength"]);
  add("lift-reach", ["lift", "reach"], 1000);
  add("curl-angle", ["curl", "angle"], 180 / Math.PI);
  for (const key of ["wavelength", "reach"])
    add(`curl-${key}`, ["curl", key], 1000);
  for (const key of ["tipWidth", "start"]) add(`taper-${key}`, ["taper", key]);
  for (const key of ["roughness", "fibres", "coverage", "normal", "shade"])
    add(`finish-${key}`, ["finish", key]);
  for (const key of ["offset", "transitionWidth", "reach"])
    add(`part-${key}`, ["part", key], 1000);
  add("part-strength", ["part", "strength"]);
  add("guides-fraction", ["guides", "fraction"]);
  add("guides-neighbours", ["guides", "neighbours"]);
  add("guides-clump", ["guides", "clump"]);
  const fields = connectedHairFields(layer);
  TestValidator.equals(
    "complete fine controls",
    fields.length,
    expected.length,
  );
  for (const { id, path, scale } of expected) {
    const field = fields.find((item) => item.id === id)!;
    const input = structuredClone(layer),
      target = structuredClone(layer);
    let owner = target as unknown as Record<string | number, unknown>;
    for (const key of path.slice(0, -1)) owner = owner[key] as typeof owner;
    const key = path[path.length - 1];
    TestValidator.predicate(
      "canonical read and display scale",
      nclose(field.read(input), owner[key] as number) &&
        nclose(field.scale, scale),
    );
    owner[key] = 0.123;
    field.write(input, 0.123);
    TestValidator.equals("one owned canonical coordinate", input, target);
    TestValidator.predicate(
      "scalar readback",
      nclose(field.read(input), 0.123),
    );
  }
  delete layer.part.region;
  TestValidator.equals(
    "regional controls require a region",
    connectedHairFields(layer).some((field) =>
      field.id.startsWith("part-region-"),
    ),
    false,
  );
  delete layer.part;
  TestValidator.equals(
    "part controls require a part",
    connectedHairFields(layer).some((field) => field.id.startsWith("part-")),
    false,
  );
  delete layer.guides;
  TestValidator.equals(
    "guide controls require a guide hierarchy",
    connectedHairFields(layer).some((field) => field.id.startsWith("guides-")),
    false,
  );
};
