import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyEndpointSource } from "../structures/IAutoMovieHumanBodyEndpointSource";
import { assertSparseRows } from "./assertSparseRows";
import { equalHumanBodySourceValue } from "./equalHumanBodySourceValue";

/**
 * Read actual head contributions of a common-root body's endpoint owners. Standalone bodies retain their own resident requirement. A person supplies its actual external geometry, with this exact body and source partition; declared drivers count only when a real head surface or landmark has valid nonzero rows. This does not admit those surfaces' contact or appearance.
 *
 * @evidence contracts/common.md#principled-implementation Exact admitted body equivalence and same-generation source partitions establish the contribution authority; only a recognized actual endpoint with finite geometry and admitted nonzero sparse rows becomes resident.
 * @evidence contracts/common.md#clear-and-simple-design Body/partition admission precedes one driver/contribution traversal that returns a set for the basis endpoint-residency owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names alone do not satisfy residency: mismatched body/generation, empty member identity, invalid geometry or invalid sparse rows refuse, while returned endpoints make no contact or appearance acceptance claim.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes standalone resident requirements, real external head contributions and the exact shared-source boundary.
 * @evidence contracts/performance.md#efficient-algorithms Exact body comparison and endpoint collection precede driver/row traversal; finite position arrays are scanned once per distinct array identity, so shared contribution geometry avoids repeated coordinate passes.
 * @evidence contracts/performance.md#reuse-equivalent-work A call-local position-identity set reuses finite-geometry admission, and existing exact-source/sparse-row owners share their semantics with the standalone basis boundary.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only endpoint strings in the returned set escape; the coordinate-reference set and admission temporaries expire after return, retaining no head geometry cache, handle or task.
 */
export function humanBodyExternalEndpointContributions(
  basis: IAutoMovieHumanBodyBasis,
  source: IAutoMovieHumanBodyEndpointSource,
): Set<string> {
  if (!equalHumanBodySourceValue(basis, source.body))
    throw new Error(
      "External endpoint source must contain the exact admitted body basis.",
    );
  const bodySkin: IAutoMovieHumanBodyBasis["surfaces"][number] | undefined = basis.surfaces.find(
    (surface: IAutoMovieHumanBodyBasis["surfaces"][number]): boolean => surface.sourcePartition !== undefined,
  );
  if (
    source.partition.generation !== source.generation ||
    bodySkin?.sourcePartition?.generation !== source.generation
  )
    throw new Error(
      "External endpoint contributions need both actual same-generation source partitions.",
    );
  const endpoints: Set<string> = new Set(
    basis.channels.flatMap((channel: IAutoMovieHumanBodyBasis["channels"][number]): string[] =>
      channel.negative === null
        ? [channel.positive]
        : [channel.positive, channel.negative],
    ),
  );
  for (const corrective of basis.correctives ?? [])
    endpoints.add(corrective.target);
  const resident: Set<string> = new Set<string>();
  const positionsRead: Set<number[]> = new Set<number[]>();
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
