import type { IAutoMovieMesh, IAutoMovieModelPart } from "@automovie/interface";

import { areaWeightedNormals } from "../../common/mesh/areaWeightedNormals";
import type { IHumanFaceHairContactLayout } from "../../face/anatomy/hair/IHumanFaceHairContactLayout";
import type { IAutoMovieHumanPersonHairClearanceProps } from "../structures/IAutoMovieHumanPersonHairClearanceProps";
import type { IHumanPersonHairContactProps } from "../structures/IHumanPersonHairContactProps";
import { keepHumanPersonHairClear } from "./keepHumanPersonHairClear";
import { meshOfHumanPart } from "./meshOfHumanPart";

/**
 * Keep the face's generated hair off the posed body, in place.
 *
 * `isGenerated` names the actual hair parts emitted by the face producer; every other part is left alone, including other generated geometry. Geometry-owned layouts supply each actual part's stations and its own gap. Attached roots that conflict with that gap refuse without moving their native seat. For legacy ribbon transport only, clearance is the largest over its layers of the requested free-strip clearance plus half the integration step (the head contact rule of `humanFaceHairContact`, which keeps that much between a curve and the skin), and zero when the document has no layers. Each generated part's positions are replaced with those `keepHumanPersonHairClear` returns, so the caller's meshes carry the cleared hair; a face with no generated part does nothing.
 *
 * A changed card carries new area-weighted normals. A vertex with no incident area retains its old direction because no new surface determines one; untouched cards keep their normal buffers, and absent normals stay absent.
 *
 * All geometry and gaps use the shared posed metre frame. The existing two-pass station translation checks sampled vertices against the open body surface; it preserves station width/calibre but not centreline length or full-face clearance, and establishes no collision-free or biological contact result. The optional observer sees a detached frozen pre-contact snapshot and may still have external side effects through its own captured references.
 *
 * @evidence contracts/common.md#principled-implementation Actual emitted membership selects hair, per-part geometry layouts define stations/gaps, and the body-contact owner translates whole non-root stations before changed-mesh area normals are regenerated.
 * @evidence contracts/common.md#clear-and-simple-design The wrapper owns membership, optional observation and in-place mesh publication; open-body contact queries and station translation remain with the contact owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing supplied layouts or body-conflicting attached roots refuse; two sampled passes do not certify complete face clearance, fixed arc length or biological hair contact, and absent-area old normals remain a shading convention.
 * @evidence contracts/common.md#meaningful-documentation Prose states metre frame, emitted membership, layout versus legacy gap, in-place positions/normals and sampled-contact/observer limitations.
 * @evidence contracts/performance.md#efficient-algorithms Membership is O(P) plus predicate cost; optional observation copies actual body/hair/layout populations, contact includes full-body query construction and two station passes, and changed normal rebuilding is O(V+T) per hair mesh.
 * @evidence contracts/performance.md#reuse-equivalent-work One body-contact input/query serves the selected hair parts; unchanged cards retain existing normals and the observer consumes one pre-contact snapshot without duplicating geometry construction.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Contact arrays and optional copied snapshot are call-local unless retained by the observer; meshes receive owned cleared positions and no wrapper cache, timer or task survives.
 */
export function clearHumanPersonHair(
  props: IAutoMovieHumanPersonHairClearanceProps,
): void {
  const generated: IAutoMovieModelPart[] = props.parts.filter((part: IAutoMovieModelPart): boolean => props.isGenerated(part.id));
  if (generated.length === 0) return;
  const meshes: IAutoMovieMesh[] = generated.map(meshOfHumanPart);
  if (props.contactLayouts !== undefined && generated.some((part: IAutoMovieModelPart): boolean => !props.contactLayouts!.has(part.id)))
    throw new Error("Generated hair lacks its geometry-owned body-contact layout.");
  const input: IHumanPersonHairContactProps = {
    positions: props.positions,
    indices: props.indices,
    hair: meshes.map((mesh: IAutoMovieMesh, index: number): IHumanPersonHairContactProps["hair"][number] => ({
      positions: mesh.positions,
      indices: mesh.indices!,
      layout: props.contactLayouts?.get(generated[index].id),
    })),
    clearance: Math.max(
      0,
      ...props.layers.map((layer: IAutoMovieHumanPersonHairClearanceProps["layers"][number]): number => layer.clearance + layer.samplingStep / 2),
    ),
  };
  if (props.observe !== undefined)
    props.observe(
      Object.freeze({
        positions: Object.freeze([...input.positions]),
        indices: Object.freeze([...input.indices]),
        hair: Object.freeze(
          input.hair.map((mesh: IHumanPersonHairContactProps["hair"][number]): IHumanPersonHairContactProps["hair"][number] =>
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
  const cleared: number[][] = keepHumanPersonHairClear(input);
  meshes.forEach((mesh: IAutoMovieMesh, at: number): void => {
    const changed: boolean = mesh.positions.some(
      (value: number, vertex: number): boolean => value !== cleared[at][vertex],
    );
    mesh.positions = cleared[at];
    if (changed && mesh.normals !== null) {
      const normals: number[] = areaWeightedNormals(mesh.positions, mesh.indices!);
      for (let vertex: number = 0; vertex < normals.length; vertex += 3)
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

/**
 * Detach and deeply freeze one pre-contact layout observation without touching geometry-owned station/attachment records. The observer may retain the copy; independently captured caller operands are outside this snapshot's isolation.
 *
 * Structured cloning detaches attachment and station arrays, then freezing every nested record/array prevents mutation through the delivered layout. This snapshot helper separates optional observation ownership from the body-contact operand and solver. It reflects actual supplied layouts and does not fabricate successful contact; freezing this value does not prevent independently captured external side effects.
 *
 * Clone and freeze cost follows actual curve/station/vertex/support populations with one traversal of each nested array. Each observation captures the current pre-contact layout; effectful observer delivery and changed geometry are not memoized here. Only the cloned layout escapes to its caller, which controls retention; no original contact state or task is held by this helper.
 */
function freezeHairContactLayout(layout: IHumanFaceHairContactLayout): IHumanFaceHairContactLayout {
  const copy: IHumanFaceHairContactLayout = structuredClone(layout);
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
