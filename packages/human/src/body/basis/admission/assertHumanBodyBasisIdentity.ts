import type { IAutoMovieHumanBodyBasis } from "../../structures/IAutoMovieHumanBodyBasis";
import { assertHumanBodyUniqueIds } from "./assertHumanBodyUniqueIds";

/**
 * Admit the immutable basis revision and the distinct record-safe names of
 * its channels, landmarks, surfaces, materials and material regions.
 * Cross-population endpoint residency follows shape and surface admission.
 */
export function assertHumanBodyBasisIdentity(basis: IAutoMovieHumanBodyBasis): void {
  assertHumanBodyUniqueIds([basis.id], "identities");
  assertHumanBodyUniqueIds(
    basis.channels.map((channel) => channel.id),
    "channel identities",
  );
  assertHumanBodyUniqueIds(basis.landmarks.ids, "landmark identities");
  assertHumanBodyUniqueIds(
    basis.surfaces.map((surface) => surface.id),
    "surface identities",
  );
  assertHumanBodyUniqueIds(
    basis.materials.map((material) => material.id),
    "material identities",
  );
  assertHumanBodyUniqueIds(
    basis.surfaces.flatMap((surface) =>
      surface.regions.map((region) => region.id),
    ),
    "region identities",
  );
}
