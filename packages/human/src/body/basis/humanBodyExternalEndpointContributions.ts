import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyEndpointSource } from "../structures/IAutoMovieHumanBodyEndpointSource";
import { assertSparseRows } from "./assertSparseRows";
import { equalHumanBodySourceValue } from "./equalHumanBodySourceValue";

/**
 * Read actual head contributions of a common-root body's endpoint owners.
 * Standalone bodies retain their own resident requirement. A person supplies
 * its actual external geometry, with this exact body and source partition;
 * declared drivers count only when a real head surface or landmark has valid
 * nonzero rows. This does not admit those surfaces' contact or appearance.
 */
export function humanBodyExternalEndpointContributions(
  basis: IAutoMovieHumanBodyBasis,
  source: IAutoMovieHumanBodyEndpointSource,
): Set<string> {
  if (!equalHumanBodySourceValue(basis, source.body))
    throw new Error(
      "External endpoint source must contain the exact admitted body basis.",
    );
  const bodySkin = basis.surfaces.find(
    (surface) => surface.sourcePartition !== undefined,
  );
  if (
    source.partition.generation !== source.generation ||
    bodySkin?.sourcePartition?.generation !== source.generation
  )
    throw new Error(
      "External endpoint contributions need both actual same-generation source partitions.",
    );
  const endpoints = new Set(
    basis.channels.flatMap((channel) =>
      channel.negative === null
        ? [channel.positive]
        : [channel.positive, channel.negative],
    ),
  );
  for (const corrective of basis.correctives ?? [])
    endpoints.add(corrective.target);
  const resident = new Set<string>();
  const positionsRead = new Set<number[]>();
  for (const driver of source.drivers) {
    if (
      !endpoints.has(driver.endpoint) ||
      driver.channel.trim() === "" ||
      driver.positive !== driver.endpoint
    )
      throw new Error(
        "External contribution needs its actual body endpoint and head driver: " +
          driver.endpoint,
      );
    for (const contribution of source.contributions[driver.endpoint] ?? []) {
      if (contribution.id.trim() === "")
        throw new Error(
          "External endpoint contribution needs its actual source member identity.",
        );
      if (!positionsRead.has(contribution.positions)) {
        if (
          contribution.positions.length === 0 ||
          contribution.positions.length % 3 !== 0 ||
          !contribution.positions.every(Number.isFinite)
        )
          throw new Error(
            "External endpoint contribution needs actual finite XYZ source geometry.",
          );
        positionsRead.add(contribution.positions);
      }
      assertSparseRows(
        contribution.rows,
        contribution.positions.length / 3,
        "external source " + contribution.id + " " + driver.endpoint,
      );
      resident.add(driver.endpoint);
    }
  }
  return resident;
}
