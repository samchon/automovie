import { resolveAutoMovieMeshPhysicalVertices } from "@automovie/engine/math/resolveAutoMovieMeshPhysicalVertices";
import type { IAutoMovieMesh } from "@automovie/interface";

import type { IAutoMovieHumanPersonSkinPartProps } from "../structures/IAutoMovieHumanPersonSkinPartProps";

/**
 * A partition's skin render part placed on the evaluated person skin.
 *
 * The part must carry the partition builder's actual registration: every
 * render vertex names the canonical sample of the skin vertex it reads, in
 * the partition's own source domain. Each render vertex then takes that skin
 * vertex's posed position and its normal from the one normal field, and the
 * part's correspondence moves from the partition's domain to the person's,
 * so both halves share one physical identity per sample. Other domains (parts
 * the skin does not own) keep theirs. A part without that registration
 * refuses by name.
 */
export function placeHumanPersonSkinPart(
  props: IAutoMovieHumanPersonSkinPartProps,
): IAutoMovieMesh {
  const { mesh, sources, positions, normals, offset, samples, origin, domain } =
    props;
  if (mesh.physicalVertices === undefined)
    throw new Error(
      "Person physical registration needs both actual registered skin halves.",
    );
  resolveAutoMovieMeshPhysicalVertices(mesh);
  sources.forEach((source, vertex) => {
    const reference = mesh.physicalVertices!.vertices[vertex];
    const actual =
      reference === null
        ? undefined
        : mesh.physicalVertices!.sources[reference];
    if (
      samples[source] === undefined ||
      actual === undefined ||
      actual.domain !== origin ||
      actual.id !== samples[source]
    )
      throw new Error(
        "Person physical registration needs the actual admitted canonical skin samples.",
      );
  });
  const out: IAutoMovieMesh = {
    ...mesh,
    positions: mesh.positions.slice(),
    normals: [],
    physicalVertices: {
      sources: mesh.physicalVertices.sources.map((source) => ({
        ...source,
        domain: source.domain === origin ? domain : source.domain,
      })),
      vertices: mesh.physicalVertices.vertices.slice(),
    },
  };
  sources.forEach((source, vertex) => {
    for (let axis = 0; axis < 3; axis++) {
      out.positions[vertex * 3 + axis] = positions[source * 3 + axis];
      out.normals![vertex * 3 + axis] = normals[(source + offset) * 3 + axis];
    }
  });
  return out;
}
