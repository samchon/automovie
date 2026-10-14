import type { IAutoMovieHumanBodyExteriorReference } from "../anatomy/surface/IAutoMovieHumanBodyExteriorReference";
import { createHumanBodyExteriorTargetBuilder } from "../anatomy/surface/createHumanBodyExteriorTargetBuilder";
import { parseHumanBodyBasisDocument } from "../document/parseHumanBodyBasisDocument";
import { exportHumanBody } from "../export/exportHumanBody";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";

import type { ConnectedBodyRequest } from "./ConnectedBodyRequest";
import type { ConnectedBodyResult } from "./ConnectedBodyResult";
import { packConnectedBodyModel } from "./packConnectedBodyModel";

/**
 * Compile the source-conditioned exterior worker handler. Constructor registration selects source incidence authority; when omitted, the loaded basis's partition presence supplies the existing default. Numerical requests cannot replace this source registration.
 *
 * The owning builder clones its source, admits bound targets, builds actual exterior geometry and reads its instruments again at output precision. Preview packs that candidate and explicit export encodes it with source part identity. Construction and arms-down operations refuse. Source-rest registration metadata does not itself refuse general document motion or ground placement; readback uses performed skin with retained shaped rest landmarks, so changed-frame requests retain the builder's stated measurement limitation and candidate-only qualification.
 *
 * Canonical parsing also reads the supplied basis's anatomical assembly on every request. Keep that borrowed source context unchanged so it remains equivalent to the builder's constructor snapshot.
 *
 * @evidence contracts/common.md#principled-implementation Source registration precedes the builder's admitted target solving and emitted-skin readback, after which the established Float32 or export boundary observes the actual candidate.
 * @evidence contracts/common.md#clear-and-simple-design This adapter selects constructor source authority and routes operations; target interpretation, topology and numerical fulfillment remain with the exterior builder.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Registration is not taken from numerical input, no source ordinal is copied into the adapter, and candidate output is not upgraded to clinical skin qualification.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies default incidence selection, fixed source ownership, supported operations and candidate-only output.
 * @evidence contracts/performance.md#efficient-algorithms Source compilation clones basis-sized data once; each request parses its document, builds current skin and performs the owning instrument/precision checks, then packs or encodes output-sized geometry.
 * @evidence contracts/performance.md#reuse-equivalent-work The closure reuses the compiled builder and its owned source snapshot while canonical parsing rereads the unchanged borrowed assembly; different documents require fresh numerical readback and export remains an explicit effect.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The builder snapshot and borrowed basis live with the returned closure; per-request geometry and reply buffers become caller-owned or collectible on rejection, with no GPU handle or disposal task created here.
 */
export function createConnectedBodyExteriorRuntime(
  basis: IAutoMovieHumanBodyBasis,
  source?: IAutoMovieHumanBodyExteriorReference,
): (request: ConnectedBodyRequest) => Promise<ConnectedBodyResult> {
  const reference: IAutoMovieHumanBodyExteriorReference = source ?? {
    basis: basis.id,
    evaluation: "source-rest",
    incidence: basis.surfaces.every(
      (surface: IAutoMovieHumanBodyBasis["surfaces"][number]): boolean => surface.sourcePartition === undefined,
    )
      ? "native-indexed"
      : "source-partition",
  };
  const build: ReturnType<typeof createHumanBodyExteriorTargetBuilder> = createHumanBodyExteriorTargetBuilder({ basis, reference });
  return async (
    request: ConnectedBodyRequest,
  ): Promise<ConnectedBodyResult> => {
    if (
      request.operation === "construct" ||
      request.operation === "exportConstruction"
    )
      throw new Error(
        "Exterior inspection does not construct a whole-person draft.",
      );
    const document: ReturnType<typeof parseHumanBodyBasisDocument> = parseHumanBodyBasisDocument(
      request.document,
      basis.anatomicalAssembly,
    );
    if (request.operation === "armsDown")
      throw new Error(
        "Source-conditioned exterior inspection does not resolve an arms-down pose.",
      );
    const built: ReturnType<typeof build> = build(document);
    if (request.operation === "export") {
      const { glb }: Awaited<ReturnType<typeof exportHumanBody>> = await exportHumanBody(built.model, undefined, {
        sourcePartIdentity: true,
      });
      return { operation: "export", glb };
    }
    return {
      operation: "preview",
      model: packConnectedBodyModel(built.model),
      crossings: null,
      anatomy: null,
      exteriorCandidate: built.exterior,
      extras: {},
    };
  };
}
