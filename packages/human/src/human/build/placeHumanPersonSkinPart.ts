import { resolveAutoMovieMeshPhysicalVertices } from "@automovie/engine/math/resolveAutoMovieMeshPhysicalVertices";
import type { IAutoMovieMesh } from "@automovie/interface";

import type { IAutoMovieHumanPersonSkinPartProps } from "../structures/IAutoMovieHumanPersonSkinPartProps";

/**
 * A partition's skin render part placed on the evaluated person skin.
 *
 * Every supplied render source must match its actual physical canonical sample in the partition's origin domain. Scatter final posed skin positions and one shared normal field (offset measured in vertices), then copy/rebase origin metadata to the person domain. Other domains remain unchanged. Missing or mismatched registration refuses.
 *
 * Positions use common person-frame metres and normals are dimensionless. Input mesh alias metadata is engine-admitted before placement; complete source/coordinate/normal populations and performed output validity are upstream/downstream consumer premises, not fully checked again here. Returned positions/normals/physical metadata are owned; untouched geometry attributes remain borrowed.
 *
 * @evidence contracts/common.md#principled-implementation Exact per-render source identity admits origin correspondence before final skin/common-normal scattering and person-instance physical rebase.
 * @evidence contracts/common.md#clear-and-simple-design This adapter owns indexed scatter and domain conversion; performed skin evaluation and final model admission retain their owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing/mismatched physical registration refuses without a positional weld; complete field populations and final output validity remain explicit consumer premises.
 * @evidence contracts/common.md#meaningful-documentation Prose states metre/dimensionless units, vertex normal offset, ownership and the actual before-versus-after admission boundary.
 * @evidence contracts/performance.md#efficient-algorithms Input alias admission pays its actual source population; source checks/scatter are O(render vertices), and metadata copy/rebase is O(source records) without a geometric search.
 * @evidence contracts/performance.md#reuse-equivalent-work The existing source-corner table and shared normal field serve all emitted vertices; topology/UVs are reused rather than independently rebuilt.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The result owns changed coordinates/normals and copied physical arrays, borrowing other attributes; local checks retain no source field, task or cache after return.
 */
export function placeHumanPersonSkinPart(
  props: IAutoMovieHumanPersonSkinPartProps,
): IAutoMovieMesh {
  const {
    mesh,
    sources,
    positions,
    normals,
    offset,
    samples,
    origin,
    domain,
  }: IAutoMovieHumanPersonSkinPartProps = props;
  if (mesh.physicalVertices === undefined)
    throw new Error(
      "Person physical registration needs both actual registered skin halves.",
    );
  resolveAutoMovieMeshPhysicalVertices(mesh);
  sources.forEach((source: number, vertex: number): void => {
    const reference: number | null = mesh.physicalVertices!.vertices[vertex];
    const actual:
      | NonNullable<IAutoMovieMesh["physicalVertices"]>["sources"][number]
      | undefined =
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
      sources: mesh.physicalVertices.sources.map(
        (
          source: NonNullable<
            IAutoMovieMesh["physicalVertices"]
          >["sources"][number],
        ): NonNullable<
          IAutoMovieMesh["physicalVertices"]
        >["sources"][number] => ({
          ...source,
          domain: source.domain === origin ? domain : source.domain,
        }),
      ),
      vertices: mesh.physicalVertices.vertices.slice(),
    },
  };
  sources.forEach((source: number, vertex: number): void => {
    for (let axis: number = 0; axis < 3; axis++) {
      out.positions[vertex * 3 + axis] = positions[source * 3 + axis];
      out.normals![vertex * 3 + axis] = normals[(source + offset) * 3 + axis];
    }
  });
  return out;
}
