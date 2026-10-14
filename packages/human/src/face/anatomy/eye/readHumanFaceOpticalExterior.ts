import type { IAutoMovieHumanFaceBasisSurface } from "../../structures/IAutoMovieHumanFaceBasisSurface";
import type { IAutoMovieHumanFaceContactCollider } from "../../structures/IAutoMovieHumanFaceContactCollider";

import type { IAutoMovieMesh } from "@automovie/interface";

import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IHumanFaceOpticalAssembly } from "./structures/IHumanFaceOpticalAssembly";

/**
 * Supply the closed optical exterior that the neighbours of one eye are read
 * against.
 *
 * With independent optics it is the generated hull of that eye in the
 * requested state. Without them it is the registered source globe surface
 * closed by its source collider fan, at the supplied positions. Periocular
 * shells, visible ocular surfaces and the assembly census share this choice
 * so their measurements use the same exterior representation.
 *
 * @evidence contracts/common.md#principled-implementation Independent optics return their exact requested-state hull; legacy optics combine registered live globe incidence with its actual collider closure.
 * @evidence contracts/common.md#clear-and-simple-design One surface-choice owner is shared by tissue, visible-sheet and assembly readers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent legacy source/collider/position ownership returns undefined rather than guessing an analytic proxy.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies generated state selection and registered source closure.
 * @evidence contracts/performance.md#efficient-algorithms Owner lookups scan actual optics/source/collider populations; the legacy branch copies live coordinates and closure incidence.
 * @evidence contracts/performance.md#reuse-equivalent-work Generated collider meshes are shared unchanged; each legacy reading owns a fresh same-source position/incidence copy.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrowed generated hull or owned legacy mesh is returned; lookup temporaries expire without handles or tasks.
 */
export function readHumanFaceOpticalExterior(
  basis: IAutoMovieHumanFaceBasis,
  positions: ReadonlyMap<string, readonly number[]>,
  optics: readonly IHumanFaceOpticalAssembly[] | undefined,
  side: "left" | "right",
  state: "rest" | "performed",
): IAutoMovieMesh | undefined {
  const eye: IHumanFaceOpticalAssembly | undefined = optics?.find((candidate: IHumanFaceOpticalAssembly): boolean  => candidate.side === side);
  if (eye !== undefined)
    return eye.collider[state === "rest" ? "rest" : "posed"];
  const id: string | undefined = basis.periocular?.[side].globe.surface;
  const surface: IAutoMovieHumanFaceBasisSurface | undefined = basis.surfaces.find((candidate: IAutoMovieHumanFaceBasisSurface): boolean  => candidate.id === id);
  const collider: IAutoMovieHumanFaceContactCollider | undefined = basis.contact?.colliders.find(
    (candidate: IAutoMovieHumanFaceContactCollider): boolean  => candidate.surface === id,
  );
  const points: readonly number[] | undefined = id === undefined ? undefined : positions.get(id);
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
