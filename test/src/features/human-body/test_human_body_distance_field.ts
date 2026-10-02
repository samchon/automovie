import { measureHumanBodyDistanceField } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

/**
 * The distance field is the exact Euclidean distance between voxel centres to
 * the nearest site, with the nearest site itself on request.
 *
 * The oracle is the definition: for every voxel the minimum over all site
 * voxels of the squared voxel-index distance, computed by brute force.
 *
 * Scenarios:
 * 1. A 7 x 6 x 5 grid with a fixed scatter of six sites: every squared
 *    distance equals the brute-force minimum, and each reported source is a
 *    site whose distance is that minimum (ties may name either site).
 * 2. A site at a corner of a 4 x 3 x 2 grid gives the distance of the far
 *    corner, 3^2 + 2^2 + 1^2 = 14, and a site voxel reports itself at 0.
 * 3. A grid with no site reports the finite stand-in 1e20 everywhere and a
 *    source of -1; without `nearest` no source array is returned.
 */
export const test_human_body_distance_field = (): void => {
  const dimensions = [7, 6, 5] as const;
  const [nx, ny, nz] = dimensions;
  const sites = new Uint8Array(nx * ny * nz);
  const chosen = [
    [0, 0, 0],
    [6, 5, 4],
    [3, 2, 2],
    [1, 5, 0],
    [5, 0, 3],
    [2, 4, 4],
  ];
  for (const [i, j, k] of chosen) sites[i + nx * (j + ny * k)] = 1;
  const field = measureHumanBodyDistanceField({
    dimensions,
    sites,
    nearest: true,
  });
  let exact = true;
  let attained = true;
  for (let k = 0; k < nz; k++)
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) {
        const gap = (site: number[]) =>
          (site[0]! - i) ** 2 + (site[1]! - j) ** 2 + (site[2]! - k) ** 2;
        const least = Math.min(...chosen.map(gap));
        const at = i + nx * (j + ny * k);
        if (field.squared[at] !== least) exact = false;
        const source = field.source![at]!;
        const site = [source % nx, Math.floor(source / nx) % ny, Math.floor(source / (nx * ny))];
        if (sites[source] !== 1 || gap(site) !== least) attained = false;
      }
  TestValidator.predicate("every squared distance is the brute-force minimum", exact);
  TestValidator.predicate("every source is a site attaining that minimum", attained);

  const corner = new Uint8Array(4 * 3 * 2);
  corner[0] = 1;
  const single = measureHumanBodyDistanceField({
    dimensions: [4, 3, 2],
    sites: corner,
    nearest: true,
  });
  TestValidator.equals("the far corner is 14 voxels squared away", single.squared[4 * 3 * 2 - 1], 14);
  TestValidator.equals("a site is at distance zero", single.squared[0], 0);
  TestValidator.equals("a site is its own source", single.source![0], 0);
  TestValidator.equals("the far corner reads the only site", single.source![4 * 3 * 2 - 1], 0);

  const empty = measureHumanBodyDistanceField({
    dimensions: [3, 3, 3],
    sites: new Uint8Array(27),
    nearest: false,
  });
  TestValidator.predicate(
    "no site leaves the finite stand-in everywhere",
    empty.squared.every((value) => value >= 1e20 && Number.isFinite(value)),
  );
  TestValidator.equals("no source array unless asked", empty.source, null);
  const none = measureHumanBodyDistanceField({
    dimensions: [3, 3, 3],
    sites: new Uint8Array(27),
    nearest: true,
  });
  TestValidator.predicate(
    "no site has no source",
    none.source!.every((value) => value === -1),
  );
};
