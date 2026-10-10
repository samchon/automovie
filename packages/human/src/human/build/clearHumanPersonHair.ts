import { areaWeightedNormals } from "../../common/mesh/areaWeightedNormals";
import type { IHumanFaceHairContactLayout } from "../../face/anatomy/hair/IHumanFaceHairContactLayout";
import type { IAutoMovieHumanPersonHairClearanceProps } from "../structures/IAutoMovieHumanPersonHairClearanceProps";
import type { IHumanPersonHairContactProps } from "../structures/IHumanPersonHairContactProps";
import { keepHumanPersonHairClear } from "./keepHumanPersonHairClear";
import { meshOfHumanPart } from "./meshOfHumanPart";

/**
 * Keep the face's generated hair off the posed body, in place.
 *
 * `isGenerated` names the actual hair parts emitted by the face producer;
 * every other part is left alone, including other generated geometry.
 * Geometry-owned layouts supply each actual part's stations and its own gap.
 * Attached roots that conflict with that gap refuse without moving their
 * native seat. For legacy ribbon transport only, clearance is the largest over its layers of the
 * requested free-strip clearance plus half the integration step (the head
 * contact rule of `humanFaceHairContact`, which keeps that much between a
 * curve and the skin), and zero when the document has no layers. Each
 * generated part's positions are replaced with those `keepHumanPersonHairClear`
 * returns, so the caller's meshes carry the cleared hair; a face with no
 * generated part does nothing.
 * A changed card carries new area-weighted normals. A vertex with no incident
 * area retains its old direction because no new surface determines one;
 * untouched cards keep their normal buffers, and absent normals stay absent.
 */
export function clearHumanPersonHair(
  props: IAutoMovieHumanPersonHairClearanceProps,
): void {
  const generated = props.parts.filter((part) => props.isGenerated(part.id));
  if (generated.length === 0) return;
  const meshes = generated.map(meshOfHumanPart);
  if (props.contactLayouts !== undefined && generated.some((part) => !props.contactLayouts!.has(part.id)))
    throw new Error("Generated hair lacks its geometry-owned body-contact layout.");
  const input: IHumanPersonHairContactProps = {
    positions: props.positions,
    indices: props.indices,
    hair: meshes.map((mesh, index) => ({
      positions: mesh.positions,
      indices: mesh.indices!,
      layout: props.contactLayouts?.get(generated[index].id),
    })),
    clearance: Math.max(
      0,
      ...props.layers.map((layer) => layer.clearance + layer.samplingStep / 2),
    ),
  };
  if (props.observe !== undefined)
    props.observe(
      Object.freeze({
        positions: Object.freeze([...input.positions]),
        indices: Object.freeze([...input.indices]),
        hair: Object.freeze(
          input.hair.map((mesh) =>
            Object.freeze({
              positions: Object.freeze([...mesh.positions]),
              indices: Object.freeze([...mesh.indices]),
              layout: mesh.layout === undefined ? undefined : freezeHairContactLayout(mesh.layout),
            }),
          ),
        ),
        clearance: input.clearance,
      }),
    );
  const cleared = keepHumanPersonHairClear(input);
  meshes.forEach((mesh, at) => {
    const changed = mesh.positions.some(
      (value, vertex) => value !== cleared[at][vertex],
    );
    mesh.positions = cleared[at];
    if (changed && mesh.normals !== null) {
      const normals = areaWeightedNormals(mesh.positions, mesh.indices!);
      for (let vertex = 0; vertex < normals.length; vertex += 3)
        if (
          Math.hypot(
            normals[vertex],
            normals[vertex + 1],
            normals[vertex + 2],
          ) === 0
        )
          normals.splice(vertex, 3, ...mesh.normals.slice(vertex, vertex + 3));
      mesh.normals = normals;
    }
  });
}

/** A detached layout snapshot cannot change the actual contact input. */
function freezeHairContactLayout(layout: IHumanFaceHairContactLayout): IHumanFaceHairContactLayout {
  const copy = structuredClone(layout);
  for (const curve of copy.curves) {
    Object.freeze(curve.attachment.weights);
    Object.freeze(curve.attachment.supports);
    Object.freeze(curve.attachment);
    for (const station of curve.stations) {
      Object.freeze(station.vertices);
      Object.freeze(station);
    }
    Object.freeze(curve.stations);
    Object.freeze(curve);
  }
  Object.freeze(copy.curves);
  return Object.freeze(copy);
}
