import { createHumanBodyAnatomicalInspection } from "../anatomy/articulation/createHumanBodyAnatomicalInspection";
import { createHumanBodyArticularCandidateModel } from "../anatomy/articulation/createHumanBodyArticularCandidateModel";
import { parseHumanBodyBasisDocument } from "../document/parseHumanBodyBasisDocument";
import { exportHumanBody } from "../export/exportHumanBody";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";

import type { ConnectedBodyRequest } from "./ConnectedBodyRequest";
import type { ConnectedBodyResult } from "./ConnectedBodyResult";
import { packConnectedBodyModel } from "./packConnectedBodyModel";

/**
 * Compile a target-sphere inspection worker handler for one source basis. Canonical document parsing and the inspector's assembly snapshot precede target construction; the inspector lazily supplies one neutral reference rig, not an individually registered joint or whole-body exterior.
 *
 * Preview packs the actual candidate model, and explicit export encodes that same kind of candidate with its inspection provenance. Construction and arms-down operations refuse by name. A failed request rejects without returning a substitute model; this handler owns no accepted-display state or cancellation protocol.
 *
 * @evidence contracts/common.md#principled-implementation Admitted radius targets become neutral-reference analytic candidates through the owning inspector and model builder, with preview precision or static export handled at their established boundaries.
 * @evidence contracts/common.md#clear-and-simple-design One request adapter coordinates parsing, candidate inspection and output conversion while the source inspector owns its reference rig and admission snapshot.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported whole-body construction and pose solving refuse; target spheres remain unregistered candidates and no skin is fabricated to make inspection appear complete.
 * @evidence contracts/common.md#meaningful-documentation The prose defines neutral-reference scope, supported operations, preview/export parity and request-failure effects.
 * @evidence contracts/performance.md#efficient-algorithms Compilation follows basis size; each request parses document bytes and builds at most four candidate spheres, followed by source-sized precision checks or glTF encoding. The delegated inspector builds its neutral reference only on first use.
 * @evidence contracts/performance.md#reuse-equivalent-work One inspector and its lazy reference serve the same fixed source basis; request-specific candidate models and export effects are not cached or deduplicated.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned closure retains its inspector and borrowed basis until released; per-request model and output buffers transfer to the caller, with no GPU handle or background worker acquired here.
 *
 */
export function createConnectedBodyAnatomicalRuntime(
  basis: IAutoMovieHumanBodyBasis,
): (request: ConnectedBodyRequest) => Promise<ConnectedBodyResult> {
  const inspect: ReturnType<typeof createHumanBodyAnatomicalInspection> = createHumanBodyAnatomicalInspection(basis);
  return async (
    request: ConnectedBodyRequest,
  ): Promise<ConnectedBodyResult> => {
    if (
      request.operation === "construct" ||
      request.operation === "exportConstruction"
    )
      throw new Error(
        "Articular inspection does not construct a whole-person draft.",
      );
    const document: ReturnType<typeof parseHumanBodyBasisDocument> = parseHumanBodyBasisDocument(
      request.document,
      basis.anatomicalAssembly,
    );
    if (request.operation === "armsDown")
      throw new Error(
        "Articular inspection does not resolve a body arms-down pose.",
      );
    const inspection: ReturnType<typeof inspect> = inspect(document);
    const model: ReturnType<typeof createHumanBodyArticularCandidateModel> = createHumanBodyArticularCandidateModel({
      id: document.id,
      name: document.name,
      inspection,
    });
    if (request.operation === "export") {
      const { glb }: Awaited<ReturnType<typeof exportHumanBody>> = await exportHumanBody(model, inspection);
      return { operation: "export", glb };
    }
    return {
      operation: "preview",
      model: packConnectedBodyModel(model),
      crossings: null,
      anatomy: null,
      anatomicalRequest: inspection,
      extras: {},
    };
  };
}
