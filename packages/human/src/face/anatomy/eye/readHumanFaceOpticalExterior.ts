import type { IAutoMovieMesh } from "@automovie/interface";

import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IHumanFaceOpticalAssembly } from "./structures/IHumanFaceOpticalAssembly";

/**
 * Supply the closed optical exterior that the neighbours of one eye are read
 * against.
 *
 * With independent optics it is the generated hull of that eye in the
 * requested state. Without them it is the registered source globe surface
 * closed by its source collider fan, at the supplied positions. Three owners
 * restated this choice; periocular shells, visible ocular surfaces and the
 * assembly census now ask one function, so they always read the same surface.
 *
 * @evidence contracts/common.md#principled-implementation The exterior is the collider the contact stage itself resolves against, taken from the same record, so measurement and contact agree on the surface.
 * @evidence contracts/common.md#clear-and-simple-design One selection owner replaces three copies of the generated-or-source choice.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing source proxy returns undefined for the caller to refuse; no analytic globe is substituted.
 * @evidence contracts/common.md#meaningful-documentation States both sources of the exterior and why one owner selects it.
 * @evidence contracts/modeling.md#shared-boundaries The optical exterior is the shared boundary every periocular part meets; this is its one read access.
 * @evidence contracts/modeling.md#spatial-conventions Head-frame metres at source precision; consumers round to Float32.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Selects an existing surface.
 * @evidenceExclude contracts/modeling.md#parameter-channels Consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no part; returns a reference surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation Supplies a measuring reference.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The optical profile and source owners hold the anatomical values.
 * @evidenceExclude contracts/anatomy.md#permitted-range Bounds nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no authoring input.
 */
export function readHumanFaceOpticalExterior(
  basis: IAutoMovieHumanFaceBasis,
  positions: ReadonlyMap<string, readonly number[]>,
  optics: readonly IHumanFaceOpticalAssembly[] | undefined,
  side: "left" | "right",
  state: "rest" | "performed",
): IAutoMovieMesh | undefined {
  const eye = optics?.find((candidate) => candidate.side === side);
  if (eye !== undefined)
    return eye.collider[state === "rest" ? "rest" : "posed"];
  const id = basis.periocular?.[side].globe.surface;
  const surface = basis.surfaces.find((candidate) => candidate.id === id);
  const collider = basis.contact?.colliders.find(
    (candidate) => candidate.surface === id,
  );
  const points = id === undefined ? undefined : positions.get(id);
  if (surface === undefined || collider === undefined || points === undefined)
    return undefined;
  return {
    positions: [...points],
    indices: [...surface.indices, ...collider.closure],
    normals: null,
    uvs: null,
    skin: null,
  };
}
