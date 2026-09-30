import { areaWeightedNormals } from "../../common/mesh/areaWeightedNormals";
import type { IControlMesh } from "../mesh/structures/IControlMesh";
import { IPortraitFinalSurface } from "./structures/IPortraitFinalSurface";
import { IPortraitFinalSurfaceHost } from "./structures/IPortraitFinalSurfaceHost";

/**
 * Collect final component surfaces before applying any of their positions.
 * Every provider reads the same deeply immutable snapshot, so reordering two
 * independent parts cannot make one fit against the other's edited surface.
 * Each returned proposal is copied before the next provider runs. Matching
 * requests may share an attachment; incompatible ownership of one vertex is
 * refused instead of selecting a winner by component order.
 *
 * This operation preserves vertex/triangle/material identities and leaves
 * normals to the assembler's one common recomputation afterward. Empty providers
 * or empty proposals retain the original mesh. It owns composition and numeric
 * admission, while each part owns its section geometry and boundary derivatives.
 *
 * @evidence contracts/common.md#principled-implementation Every provider reads one frozen snapshot of the refined surface and returns proposals that are collected before any is applied, so the result cannot depend on provider order; matching proposals for one vertex may share it and incompatible ones refuse instead of choosing a winner.
 * @evidence contracts/common.md#clear-and-simple-design Snapshot, collect, validate, apply; topology, groups and normals are left to their owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No provider is special-cased and no conflict is resolved by order.
 * @evidence contracts/common.md#meaningful-documentation States the immutability of the snapshot, the ownership rule and what is preserved.
 * @evidence contracts/modeling.md#shared-boundaries Providers propose positions for shared resident vertices, and an incompatible proposal for the same vertex refuses, so component parts meeting at one vertex agree on it.
 * @evidence contracts/modeling.md#spatial-conventions Positions stay in construction millimetres; nothing is converted.
 * @evidenceExclude contracts/anatomy.md#anatomical-source applyPortraitFinalSurfaces carries no anatomical value, range, proportion, landmark or tissue behaviour.
 * @evidenceExclude contracts/anatomy.md#permitted-range applyPortraitFinalSurfaces admits, bounds and combines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority applyPortraitFinalSurfaces defines no input through which a caller shapes a human form.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping applyPortraitFinalSurfaces is a computation over existing data and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels applyPortraitFinalSurfaces defines and consumes no parameter channel of a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry applyPortraitFinalSurfaces emits no primitive.
 * @evidenceExclude contracts/modeling.md#rendered-observation applyPortraitFinalSurfaces owns no part, group or joint that a viewer displays; the parts built with it are observed by their owners.
 */
export function applyPortraitFinalSurfaces(
  mesh: IControlMesh,
  surfaces: readonly { id: string; propose: IPortraitFinalSurface }[],
): IControlMesh {
  if (surfaces.length === 0) return mesh;
  if (
    surfaces.some((surface) => surface.id.trim().length === 0) ||
    new Set(surfaces.map((surface) => surface.id)).size !== surfaces.length
  )
    throw new Error("Final surface providers need unique nonempty identities.");
  const host: IPortraitFinalSurfaceHost = Object.freeze({
    positions: Object.freeze(
      mesh.positions.map((point) => Object.freeze([...point])),
    ),
    indices: Object.freeze([...mesh.indices]),
    groups: Object.freeze([...mesh.groups]),
    normals: Object.freeze(
      areaWeightedNormals(mesh.positions.flat(), mesh.indices),
    ),
  });
  const proposals = surfaces.map((surface) => ({
    id: surface.id,
    vertices: surface
      .propose(host)
      .map(({ vertex, target }) => ({ vertex, target: [...target] })),
  }));
  const targets = new Map<number, { owner: string; point: number[] }>();
  for (const proposal of proposals)
    for (const { vertex, target } of proposal.vertices) {
      if (
        !Number.isInteger(vertex) ||
        vertex < 0 ||
        vertex >= mesh.positions.length ||
        target.length !== 3 ||
        !target.every(Number.isFinite)
      )
        throw new Error(
          "A final surface proposal needs a resident vertex and finite XYZ.",
        );
      const previous = targets.get(vertex);
      if (
        previous !== undefined &&
        previous.point.some((value, axis) => value !== target[axis])
      )
        throw new Error(
          `Incompatible final surface ownership at vertex ${vertex}: ${previous.owner}/${proposal.id}.`,
        );
      targets.set(vertex, { owner: proposal.id, point: target });
    }
  if (targets.size === 0) return mesh;
  return {
    ...mesh,
    positions: mesh.positions.map(
      (point, id) => targets.get(id)?.point ?? [...point],
    ),
    indices: mesh.indices,
    groups: mesh.groups,
  };
}
