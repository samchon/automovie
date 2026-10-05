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
 *
 * @evidence contracts/common.md#principled-implementation Positions and normals are read through the registered sample of each render vertex, so the emitted halves meet at one value.
 * @evidence contracts/common.md#clear-and-simple-design Check the registration, copy, move the domain, write positions and normals.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unregistered or mismatched part refuses; no vertex is matched by position.
 * @evidence contracts/common.md#meaningful-documentation States what is checked, what each vertex takes and the refusal.
 * @evidence contracts/modeling.md#spatial-conventions Posed metres and unit normals of the person frame.
 * @evidence contracts/modeling.md#shared-boundaries A shared sample reads the same position and normal on both halves and one physical identity.
 * @evidence contracts/modeling.md#emitted-geometry Emits the part's own triangles with its positions and normals replaced.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The part keeps its own identity.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function converts no input.
 */
export function placeHumanPersonSkinPart(props: IAutoMovieHumanPersonSkinPartProps): IAutoMovieMesh {
  const { mesh, sources, positions, normals, offset, samples, origin, domain } = props;
  if (mesh.physicalVertices === undefined)
    throw new Error("Person physical registration needs both actual registered skin halves.");
  resolveAutoMovieMeshPhysicalVertices(mesh);
  sources.forEach((source, vertex) => {
    const reference = mesh.physicalVertices!.vertices[vertex];
    const actual = reference === null ? undefined : mesh.physicalVertices!.sources[reference];
    if (samples[source] === undefined || actual === undefined || actual.domain !== origin || actual.id !== samples[source])
      throw new Error("Person physical registration needs the actual admitted canonical skin samples.");
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
