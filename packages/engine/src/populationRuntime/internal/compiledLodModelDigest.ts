import { IAutoMovieModel } from "@automovie/interface";

import { autoMovieRenderDigest } from "../../render/internal/autoMovieRenderDigest";
import { AutoMovieEngineCanonicalJson } from "../../text/AutoMovieEngineCanonicalJson";

/*
 * Content digest for one LOD tier's model group reference.
 *
 * An absent group hashes a marker naming the missing reference. A group that
 * cannot be canonically encoded hashes a distinct marker naming the unencodable
 * reference, rather than letting the encoding refusal discard the complete
 * compiled population. Neither marker certifies model content or validity;
 * callers own admission of their model inventory.
 *
 * The digest is the SHA-256 of canonical JSON v2 computed without a Node
 * built-in, equal to the Node builder's digest of the same canonical bytes.
 * Shared by the compiled formation and instance-set kernels; package-private.
 */
export function compiledLodModelDigest(
  models: ReadonlyMap<string, IAutoMovieModel>,
  id: string,
): string {
  const model: IAutoMovieModel | undefined = models.get(id);
  if (model === undefined)
    return autoMovieRenderDigest(
      AutoMovieEngineCanonicalJson.canonicalize({ id, missing: true }),
    );
  try {
    return autoMovieRenderDigest(
      AutoMovieEngineCanonicalJson.canonicalize(model),
    );
  } catch {
    return autoMovieRenderDigest(
      AutoMovieEngineCanonicalJson.canonicalize({ id, unencodable: true }),
    );
  }
}
