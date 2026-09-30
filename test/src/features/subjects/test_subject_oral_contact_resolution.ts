import { measureAutoMovieMeshClearance } from "@automovie/engine";
import {
  applyPortraitOralContact,
  resolvePortraitOralContact,
  retreatPortraitEnamel,
} from "@automovie/human";
import type { IAutoMovieMesh, IAutoMovieModelPart } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

/**
 * The built face keeps enamel behind the lips and in front of the cavity.
 *
 * Scenarios:
 * 1. Both arches 1 unit in front of a lip plane at Z=0 retreat as rigid bodies
 *    to touch it, and a cavity 0.5 in front of that plane is pushed back to it.
 * 2. A closed mouth has no cavity: only the enamel retreats, and the other
 *    parts are the same objects. An arch already behind the lips, an absent
 *    arch and a face without lips are returned unchanged.
 * 3. The retreat function refuses a negative clearance and moves only Z; a
 *    contact naming the cavity twice refuses while the cavity-less contact
 *    admits two identities.
 */
export const test_subject_oral_contact_resolution = (): void => {
  const mesh = (z: number): IAutoMovieMesh => ({
    positions: [-1, -1, z, 1, -1, z, 0, 1, z],
    indices: [0, 1, 2],
    normals: [0, 0, 1, 0, 0, 1, 0, 0, 1],
    uvs: null,
    skin: null,
  });
  const part = (id: string, z: number): IAutoMovieModelPart => ({
    id,
    name: id,
    material: "skin",
    attachedBone: null,
    transform: null,
    geometry: { type: "mesh", mesh: mesh(z) },
  });
  const zs = (parts: IAutoMovieModelPart[], id: string): number[] => {
    const found = parts.find((one) => one.id === id);
    if (found?.geometry.type !== "mesh") throw new Error("Missing " + id);
    return found.geometry.mesh.positions.filter((_v, i) => i % 3 === 2);
  };
  const open = [
    part("lips", 0),
    part("tooth-upper-arch", 1),
    part("tooth-lower-arch", 1),
    part("oral-cavity", 0.5),
    part("other", 5),
  ];
  const resolved = resolvePortraitOralContact(open);
  TestValidator.predicate(
    "both arches retreat to touch the lips",
    ["tooth-upper-arch", "tooth-lower-arch"].every((id) =>
      zs(resolved, id).every((z) => nclose(z, 0)),
    ),
  );
  TestValidator.predicate(
    "cavity behind the arches",
    zs(resolved, "oral-cavity").every((z) => nclose(z, 0)),
  );
  TestValidator.predicate(
    "other parts retained",
    resolved[0] === open[0] && resolved[4] === open[4],
  );
  const closed = [part("lips", 0), part("tooth-upper-arch", 1)];
  const sealed = resolvePortraitOralContact(closed);
  TestValidator.predicate(
    "closed mouth retreats enamel only",
    zs(sealed, "tooth-upper-arch").every((z) => nclose(z, 0)) &&
      sealed[0] === closed[0],
  );
  const behind = [part("lips", 0), part("tooth-upper-arch", -2)];
  TestValidator.equals(
    "enamel already behind the lips stays",
    zs(resolvePortraitOralContact(behind), "tooth-upper-arch"),
    [-2, -2, -2],
  );
  const lower = resolvePortraitOralContact([
    part("lips", 0),
    part("tooth-lower-arch", 1),
  ]);
  TestValidator.predicate(
    "an absent arch is not required",
    zs(lower, "tooth-lower-arch").every((z) => nclose(z, 0)) &&
      lower.length === 2,
  );
  const faceless = [part("tooth-upper-arch", 1), part("oral-cavity", 0.5)];
  TestValidator.predicate(
    "no lips, no resolution",
    resolvePortraitOralContact(faceless) === faceless,
  );
  const shifted = retreatPortraitEnamel(mesh(0), mesh(1), 0.25);
  TestValidator.predicate(
    "retreat moves Z only",
    nclose(shifted.positions[2], -0.25) &&
      shifted.positions[0] === -1 &&
      shifted.positions[1] === -1 &&
      measureAutoMovieMeshClearance(mesh(0), shifted, "z")[0].minimum >=
        0.25 - 1e-12,
  );
  TestValidator.predicate(
    "negative clearance refuses",
    throwsError(() => retreatPortraitEnamel(mesh(0), mesh(1), -1)),
  );
  const ids = { lips: "lips", enamel: "tooth-upper-arch", clearance: 0 };
  TestValidator.predicate(
    "cavity-less contact admits two identities",
    zs(applyPortraitOralContact(closed, ids), "tooth-upper-arch").every((z) =>
      nclose(z, 0),
    ),
  );
  TestValidator.predicate(
    "the same identity twice refuses",
    throwsError(() =>
      applyPortraitOralContact(closed, { ...ids, enamel: "lips" }),
    ),
  );
  TestValidator.predicate(
    "the cavity may not repeat the lips",
    throwsError(() =>
      applyPortraitOralContact(open, { ...ids, cavity: "lips" }),
    ),
  );
};
