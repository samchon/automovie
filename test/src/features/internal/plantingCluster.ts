import type { IAutoMoviePlantingCluster } from "@automovie/interface";

/** Build the original six-member seeded atrium-bed placement design, including its spacing/attempt and scale/yaw ranges. Nested override values remain borrowed and placement/admission belong to the actual engine consumers rather than this source-data constructor. */
export const plantingCluster: (
  overrides?: Partial<IAutoMoviePlantingCluster>,
) => IAutoMoviePlantingCluster = (
  overrides: Partial<IAutoMoviePlantingCluster> = {},
): IAutoMoviePlantingCluster => ({
  id: "atrium-bed",
  domain: "fern",
  count: 6,
  anchor: { x: 0, y: 0, z: 0 },
  extent: { x: 2, z: 2 },
  seed: 4_242,
  minSpacing: 0.5,
  attempts: 16,
  scale: {
    min: { x: 0.75, y: 0.5, z: 0.75 },
    max: { x: 1.25, y: 1.5, z: 1.25 },
  },
  yawJitter: 1,
  ...overrides,
});
