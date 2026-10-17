import type { IAutoMovieModel } from "../../../../packages/interface/src/model/IAutoMovieModel.ts";
import type { EngineViewerInput } from "../viewer/EngineViewerInput.ts";
import type { faceTypes } from "./faceTypes.ts";

/**
 * Assemble the actual engine meshes as distinct generated model parts for the repository viewer. The source commit identifies the generating dependency snapshot; each input hash identifies saved observations. Independent contact sheets keep their engine-assigned physical domains.
 *
 * @evidence contracts/common.md#principled-implementation Model parts consume only tessellateAutoMovieCurveGrid64 results and actual construction from the same invocation.
 * @evidence contracts/common.md#clear-and-simple-design This operation publishes an interface model and provenance; geometry remains owned by the engine.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No externally tessellated or reference mesh is wrapped as an engine result, and no missing region receives a fallback part.
 * @evidence contracts/common.md#meaningful-documentation States generated origin, distinct sheet topology, metre construction and generating-snapshot identity.
 * @evidence contracts/performance.md#efficient-algorithms P model parts and L construction lines are collected in O(P+L); mesh buffers are referenced without another tessellation or clone.
 * @evidence contracts/performance.md#reuse-equivalent-work The actual engine mesh and construction arrays are shared with the diagnostic artifact.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned model references own no handles or cache; input patch arrays remain reachable only through this result and caller artifacts.
 */
export function faceEngineModel(
  patches: faceTypes.Result[],
  inputHashes: Record<string, string>,
  sourceCommit: string,
): EngineViewerInput {
  if (!patches.length || !/^[a-f0-9]{40}$/.test(sourceCommit))
    throw new Error(
      "Actual engine patches and frozen generating commit required",
    );
  const model: IAutoMovieModel = {
    id: "reference-face-candidate",
    name: "Regional curve-family reconstruction",
    origin: "generated",
    skeleton: null,
    body: null,
    asset: null,
    materials: [],
    parts: patches.map(
      (patch: faceTypes.Result): IAutoMovieModel["parts"][number] => ({
        id: patch.id,
        name: patch.id,
        geometry: { type: "mesh", mesh: patch.engine.mesh },
        material: null,
        attachedBone: null,
        transform: null,
      }),
    ),
  };
  return {
    schema: "human-reference-engine-model-v1",
    model,
    construction: {
      units: "m",
      lines: patches.flatMap(
        (
          patch: faceTypes.Result,
        ): faceTypes.Result["engine"]["construction"]["lines"] =>
          patch.engine.construction.lines,
      ),
    },
    provenance: {
      inputKeys: Object.keys(inputHashes),
      inputHashes,
      engineOperators: [
        "IAutoMovieCurve64.Cubic",
        "AutoMovieBernsteinSubdivision64.restrict",
        "AutoMoviePchipField64",
        "AutoMovieBernsteinGrid64.hermite",
        "AutoMovieBernsteinGrid64.gridValue",
        "AutoMovieBernstein64.value",
        "tessellateAutoMovieCurveGrid64",
      ],
      sourceCommit,
    },
    counts: {
      vertices: patches.reduce(
        (sum: number, patch: faceTypes.Result): number =>
          sum + patch.engine.counts.vertices,
        0,
      ),
      triangles: patches.reduce(
        (sum: number, patch: faceTypes.Result): number =>
          sum + patch.engine.counts.triangles,
        0,
      ),
    },
  };
}
