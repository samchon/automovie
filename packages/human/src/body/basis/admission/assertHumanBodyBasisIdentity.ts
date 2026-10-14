import type { IAutoMovieHumanBodyBasis } from "../../structures/IAutoMovieHumanBodyBasis";
import { assertHumanBodyUniqueIds } from "./assertHumanBodyUniqueIds";

/**
 * Admit the immutable basis revision and the distinct record-safe names of its channels, landmarks, surfaces, materials and material regions. Cross-population endpoint residency follows shape and surface admission.
 *
 * @evidence contracts/common.md#principled-implementation Each immutable identity population passes the shared blank/duplicate/prototype-key guard before relationship admission.
 * @evidence contracts/common.md#clear-and-simple-design One identity stage covers basis, channel, landmark, surface, material and region names while endpoint residency stays with later shape/surface owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Stable IDs are admitted as authored names without inferred aliases or insertion-order-dependent duplicate ownership.
 * @evidence contracts/common.md#meaningful-documentation The prose defines immutable record-safe identity scope and separates cross-population endpoint correspondence.
 * @evidence contracts/performance.md#efficient-algorithms Full scans cost O(C+L+S+M+R) identifiers and temporary arrays/sets; every independent population needs its own uniqueness check.
 * @evidence contracts/performance.md#reuse-equivalent-work All populations reuse one guard implementation; no admission result is cached across mutable basis inputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Mapped ID arrays and guard sets are synchronous temporaries released after success or failure without changing the basis.
 */
export function assertHumanBodyBasisIdentity(
  basis: IAutoMovieHumanBodyBasis,
): void {
  assertHumanBodyUniqueIds([basis.id], "identities");
  assertHumanBodyUniqueIds(
    basis.channels.map(
      (channel: IAutoMovieHumanBodyBasis["channels"][number]): string =>
        channel.id,
    ),
    "channel identities",
  );
  assertHumanBodyUniqueIds(basis.landmarks.ids, "landmark identities");
  assertHumanBodyUniqueIds(
    basis.surfaces.map(
      (surface: IAutoMovieHumanBodyBasis["surfaces"][number]): string =>
        surface.id,
    ),
    "surface identities",
  );
  assertHumanBodyUniqueIds(
    basis.materials.map(
      (material: IAutoMovieHumanBodyBasis["materials"][number]): string =>
        material.id,
    ),
    "material identities",
  );
  assertHumanBodyUniqueIds(
    basis.surfaces.flatMap(
      (surface: IAutoMovieHumanBodyBasis["surfaces"][number]): string[] =>
        surface.regions.map(
          (
            region: IAutoMovieHumanBodyBasis["surfaces"][number]["regions"][number],
          ): string => region.id,
        ),
    ),
    "region identities",
  );
}
