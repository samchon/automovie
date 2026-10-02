import type { IAutoMovieModel } from "@automovie/interface";

import { areaWeightedNormals } from "../../common/mesh/areaWeightedNormals";
import type { IAutoMovieHumanFaceHair } from "../../face/structures/IAutoMovieHumanFaceHair";
import { keepHumanPersonHairClear } from "./keepHumanPersonHairClear";
import { meshOfHumanPart } from "./meshOfHumanPart";

/**
 * Keep the face's generated hair off the posed body, in place.
 *
 * The parts the face builder generates beside its basis regions (the hair
 * cards) are the parts `isGenerated` names; every other part is left alone.
 * The clearance is the hair document's own, the largest over its layers of the
 * requested free-strip clearance plus half the integration step (the head
 * contact rule of `humanFaceHairContact`, which keeps that much between a
 * curve and the skin), and zero when the document has no layers. Each
 * generated part's positions are replaced with those `keepHumanPersonHairClear`
 * returns, so the caller's meshes carry the cleared hair; a face with no
 * generated part does nothing.
 * A changed card carries new area-weighted normals. A vertex with no incident
 * area retains its old direction because no new surface determines one;
 * untouched cards keep their normal buffers, and absent normals stay absent.
 *
 * @evidence contracts/common.md#principled-implementation The head's contact rule is reused for the body because clearance does not depend on which skin it lies over; changed faces determine new area-weighted directions, while an unused or zero-area vertex retains the admitted direction no new face can replace.
 * @evidence contracts/common.md#clear-and-simple-design One selection, one clearance and one call.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No part is named; generated hair is recognised by being drawn by no region, and the clearance is read from the document.
 * @evidence contracts/common.md#meaningful-documentation The comment states which parts move, where the clearance comes from and what happens with none.
 * @evidence contracts/modeling.md#shared-boundaries The hair and the body meet at one clearance the hair document states.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function moves vertices of existing parts and defines none.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidence contracts/modeling.md#spatial-conventions Positions remain metres in the shared frame and changed normals are unit directions of the resulting posed faces.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value; the clearance is the hair document's.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function defines no input a caller shapes a human form with.
 */
export function clearHumanPersonHair(props: {
  /** The face parts, placed on the head, whose meshes may be replaced. */
  parts: IAutoMovieModel["parts"];
  /** Whether a part id is generated geometry (drawn by no basis region). */
  isGenerated: (id: string) => boolean;
  /** The hair document's layers, or none. */
  layers: readonly Pick<
    IAutoMovieHumanFaceHair["layers"][number],
    "clearance" | "samplingStep"
  >[];
  /** The body's posed skin positions and retained triangles. */
  positions: readonly number[];
  indices: readonly number[];
}): void {
  const generated = props.parts.filter((part) => props.isGenerated(part.id));
  if (generated.length === 0) return;
  const meshes = generated.map(meshOfHumanPart);
  const cleared = keepHumanPersonHairClear({
    positions: props.positions,
    indices: props.indices,
    hair: meshes.map((mesh) => ({
      positions: mesh.positions,
      indices: mesh.indices!,
    })),
    clearance: Math.max(
      0,
      ...props.layers.map((layer) => layer.clearance + layer.samplingStep / 2),
    ),
  });
  meshes.forEach((mesh, at) => {
    const changed = mesh.positions.some((value, vertex) => value !== cleared[at][vertex]);
    mesh.positions = cleared[at];
    if (changed && mesh.normals !== null) {
      const normals = areaWeightedNormals(mesh.positions, mesh.indices!);
      for (let vertex = 0; vertex < normals.length; vertex += 3)
        if (Math.hypot(normals[vertex], normals[vertex + 1], normals[vertex + 2]) === 0)
          normals.splice(vertex, 3, ...mesh.normals.slice(vertex, vertex + 3));
      mesh.normals = normals;
    }
  });
}
