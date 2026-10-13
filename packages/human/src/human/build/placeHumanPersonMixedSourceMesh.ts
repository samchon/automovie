import { resolveAutoMovieMeshPhysicalVertices } from "@automovie/engine/math/resolveAutoMovieMeshPhysicalVertices";
import { interpolateAutoMovieTrianglePoint } from "@automovie/engine/math/interpolateAutoMovieTrianglePoint";
import type { IAutoMovieMesh } from "@automovie/interface";

import { areaWeightedNormals } from "../../common/mesh/areaWeightedNormals";
import type { IAutoMovieHumanPersonMixedSourceMeshProps } from "../structures/IAutoMovieHumanPersonMixedSourceMeshProps";
import { moveHumanMeshRigidly } from "./moveHumanMeshRigidly";

/**
 * Place a generated part's skin boundary on the actual one-skin person.
 *
 * Begin with rigid head carry, then replace native skin aliases with final weighted skin coordinates and material seats with their exact registered three canonical parents in original corner order. The engine admits represented nonnegative unit-sum enclosure without renormalization. Native and material domains rebase to one person instance while retaining their distinction. Missing registrations/samples refuse before returning a result.
 *
 * Current positions use common person-frame metres. Replaced meshes rebuild independent area-weighted normals; shared physical identity does not unify shading domains. Unchanged attributes remain borrowed while moved coordinates and copied metadata are owned. Exact represented seating and alias admission establish neither biological tissue mechanics nor global collision or current visual acceptance.
 *
 * @evidence contracts/common.md#principled-implementation Exact native sample IDs and geometry-owned material-parent receipts replace only registered seats on actual final skin; the shared engine preserves represented triangle arithmetic and final physical alias admission.
 * @evidence contracts/common.md#clear-and-simple-design Rigid carry, represented seating, normal rebuilding and alias admission retain shared owners while this adapter routes native/material domains.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source-rest substitution or equal-position weld supplies an attachment; absent registered parents refuse and physical lip identity does not imply shared soft-sheet shading or clinical contact.
 * @evidence contracts/common.md#meaningful-documentation Prose states current metre frame, original parent order, represented weight policy, rebased namespaces and changed versus borrowed buffers.
 * @evidence contracts/performance.md#efficient-algorithms Rigid mapping and source scan are linear in vertex/source populations; each material seat performs three map lookups and fixed arithmetic, followed by O(V+T) normals and actual alias admission.
 * @evidence contracts/performance.md#reuse-equivalent-work Compiled canonical-sample and attachment maps serve all seats, and one rigidly carried mesh supplies the unchanged generated interior positions before exact replacements.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned mesh owns moved coordinates, copied source metadata and rebuilt normals while borrowing untouched attributes; parent/seat temporaries retain no cache or running task.
 */
export function placeHumanPersonMixedSourceMesh(
  props: IAutoMovieHumanPersonMixedSourceMeshProps,
): IAutoMovieMesh {
  const { mesh, head, samples, positions, origin, domain }: IAutoMovieHumanPersonMixedSourceMeshProps = props;
  const output: IAutoMovieMesh = moveHumanMeshRigidly(mesh, head);
  const physical: IAutoMovieMesh["physicalVertices"] = output.physicalVertices;
  const materialDomain: string = origin + ":material-skin";
  const attachments: ReturnType<NonNullable<IAutoMovieHumanPersonMixedSourceMeshProps["materialAttachments"]>["get"]> = props.materialAttachments?.get(materialDomain);
  if (
    physical === undefined ||
    !physical.sources.some((source: NonNullable<IAutoMovieMesh["physicalVertices"]>["sources"][number]): boolean => source.domain === origin || source.domain === materialDomain)
  )
    return output;
  for (let vertex: number = 0; vertex < physical.vertices.length; vertex++) {
    const reference: number | null = physical.vertices[vertex];
    const source: typeof physical.sources[number] | undefined = reference === null ? undefined : physical.sources[reference];
    if (source === undefined) continue;
    if (source.domain === materialDomain) {
      const attachment: ReturnType<NonNullable<typeof attachments>["get"]> = attachments?.get(source.id);
      if (attachment === undefined || attachment.surface !== props.surface ||
          attachment.identity.trim() === "")
        throw new Error("Generated person material attachment needs its exact registered skin parents: " + source.id);
      const parents: Parameters<typeof interpolateAutoMovieTrianglePoint>[0][number][] = attachment.parents.map((parent: number): Parameters<typeof interpolateAutoMovieTrianglePoint>[0][number] => {
        const sample: number | undefined = samples.get(parent);
        if (sample === undefined || sample * 3 + 2 >= positions.length)
          throw new Error("Generated person material attachment lacks a canonical skin parent: " + parent);
        return { x: positions[sample * 3], y: positions[sample * 3 + 1], z: positions[sample * 3 + 2] };
      });
      const point: ReturnType<typeof interpolateAutoMovieTrianglePoint> = interpolateAutoMovieTrianglePoint(parents, attachment.weights);
      output.positions.splice(vertex * 3, 3, point.x, point.y, point.z);
      continue;
    }
    if (source.domain !== origin) continue;
    const sample: number | undefined = samples.get(source.id);
    if (sample === undefined || sample * 3 + 2 >= positions.length)
      throw new Error(
        "Generated person attachment needs its actual canonical skin sample: " +
          source.id +
          ".",
      );
    for (let axis: number = 0; axis < 3; axis++) {
      const value: number = positions[sample * 3 + axis];
      if (!Number.isFinite(value))
        throw new Error(
          "Generated person attachment has a nonfinite actual skin sample: " +
            source.id +
            ".",
        );
      output.positions[vertex * 3 + axis] = value;
    }
  }
  physical.sources = physical.sources.map((source: typeof physical.sources[number]): typeof physical.sources[number] => ({
    ...source,
    domain: source.domain === origin ? domain :
      source.domain === materialDomain ? domain + ":material-skin" : source.domain,
  }));
  const indices: number[] =
    output.indices ??
    Array.from({ length: output.positions.length / 3 }, (_: unknown, vertex: number): number => vertex);
  output.normals = areaWeightedNormals(output.positions, indices);
  resolveAutoMovieMeshPhysicalVertices(output);
  return output;
}
