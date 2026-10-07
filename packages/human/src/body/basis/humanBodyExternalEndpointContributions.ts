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
 *
 * @evidence contracts/common.md#principled-implementation Reconciles body channels with actual same-generation head source rows rather than requiring invented body deformation.
 * @evidence contracts/common.md#clear-and-simple-design One source population produces the resident endpoint identities used by body admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No empty row, permission flag or unregistered driver substitutes for geometry.
 * @evidence contracts/common.md#meaningful-documentation States source ownership and the separate physical admission responsibility.
 * @evidence contracts/modeling.md#parameter-channels The body remains the signed endpoint gain owner while registered head drivers carry its real contribution.
 * @evidence contracts/modeling.md#shared-boundaries Both partitions must identify the same generation and the supplied body must equal the admitted body.
 * @evidence contracts/modeling.md#spatial-conventions Sparse displacements keep the source's metre coordinates and resident indices.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Reads existing geometry without emitting or modifying it.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Existing surfaces keep their identities.
 * @evidenceExclude contracts/modeling.md#rendered-observation No rendered acceptance is established.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Introduces no anatomical measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range Existing channel bounds remain unchanged.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Converts no personal control.
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
