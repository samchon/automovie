import { fillHumanSourceRegion } from "./fillHumanSourceRegion.ts";
import type { IHumanSourceAuthoredSkin } from "./structures/IHumanSourceAuthoredSkin.ts";
import type { IHumanSourceCompactedTopology } from "./structures/IHumanSourceCompactedTopology.ts";
import type { IHumanSourceExcludedRegionReceipt } from "./structures/IHumanSourceExcludedRegionReceipt.ts";
import type { IHumanSourceSample } from "./structures/IHumanSourceSample.ts";

/**
 * Carry the published source's existing nipple exclusion into its neutral.
 *
 * The published body's extractor filled the nipple-areola region of every
 * sampled state before use. The authored provider path reads its neutral and
 * endpoint differences directly. This stage applies that same original
 * nipple operator to the one root, so both views and derivatives retain the
 * published product exclusion. Vertex count, order, triangles, UV and neck
 * cut are unchanged. It defines no genital fill, restoration, anatomy domain
 * or registration metadata.
 *
 * Endpoint differences use the same original operator where the compiler
 * reads them (`fillHumanSourceExcludedRegions`), because a linear fill of a
 * displacement is the displacement of the filled states.
 *
 * The receipt reports how far each region moved. It does not establish that
 * the filled surface reads as a plain skin; that is a rendered observation.
 */
export function regenerateHumanSourceExcludedRegions(
  sample: IHumanSourceSample,
  root: IHumanSourceCompactedTopology,
  skin: IHumanSourceAuthoredSkin,
): IHumanSourceExcludedRegionReceipt[] {
  const receipts: IHumanSourceExcludedRegionReceipt[] = [];
  for (const [region, prefix, interior, boundary, operator] of [
    [
      "nipple",
      "flatten",
      sample.flattenInterior,
      sample.flattenBoundary,
      sample.flattenOperator,
    ],
  ] as const) {
    const before = Float64Array.from(skin.positions);
    fillHumanSourceRegion(
      interior,
      boundary,
      operator,
      skin.positions,
      root.nativeToSource,
    );
    const vertices = Array.from(
      interior,
      (native) => root.nativeToSource[native],
    ).sort((a, b) => a - b);
    let moved = 0,
      maximum = 0,
      total = 0;
    for (const vertex of vertices) {
      const distance = Math.hypot(
        ...[0, 1, 2].map(
          (axis) =>
            skin.positions[3 * vertex + axis] - before[3 * vertex + axis],
        ),
      );
      if (!Number.isFinite(distance))
        throw new Error(`The ${region} fill produced a nonfinite coordinate.`);
      if (distance !== 0) moved++;
      maximum = Math.max(maximum, distance);
      total += distance;
      for (let axis = 0; axis < 3; axis++)
        root.topology.positions[3 * vertex + axis] =
          skin.positions[3 * vertex + axis];
    }
    receipts.push({
      region,
      operator: [
        `${prefix}-interior.i32`,
        `${prefix}-boundary.i32`,
        `${prefix}-operator.f64`,
      ],
      sourceVertices: vertices,
      moved,
      maximumDisplacementMetres: maximum,
      meanDisplacementMetres:
        vertices.length === 0 ? 0 : total / vertices.length,
    });
  }
  const cut = skin.partition.cut;
  const pick = (samples: Int32Array): Float64Array =>
    Float64Array.from(
      Array.from(samples).flatMap((vertex) =>
        Array.from(skin.positions.subarray(3 * vertex, 3 * vertex + 3)),
      ),
    );
  skin.bodyPositions = pick(cut.p1BodyToG1);
  skin.headPositions = pick(cut.faceToG1);
  return receipts;
}
