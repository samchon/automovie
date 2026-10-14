import type { createAutoMovieSignedMeshQuery } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";

/**
 * What `humanFaceHairContact` builds one curve's contact from.
 *
 * The layer supplies the sampling step and requested clearance; the root and length scale the rounding allowance; the query is the closed collider the contact reads. Positions and lengths are head-frame metres.
 *
 * @evidence contracts/common.md#principled-implementation The closed host query, root and length share head-frame metres with samplingStep, clearance and optional shaft diameter for one rounding scale.
 * @evidence contracts/common.md#clear-and-simple-design Pick exposes only the admitted layer quantities contact needs, keeping hairstyle direction and gather policy outside the collider rule.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Optional physical calibre is a supported terminal-shaft difference; no consumer branch or surrogate closed surface is added by this input contract.
 * @evidence contracts/common.md#meaningful-documentation The members explain the root/length rounding scale, sampling and surface-gap inputs, optional physical diameter and closed signed reader.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This contact-source record chooses no spatial index; the supplied signed query already owns collider acceleration and per-read work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The query reference binds contact reuse to one closed host instance, while root/length scale a separate per-curve clearance rule.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller retains the supplied collider query and admitted layer subset; this argument contract acquires no worker or file handle.
 *
 * @author Samchon
 */
export interface IHumanFaceHairContactSource {
  /** Sampling step, requested surface gap and optional physical shaft diameter of the admitted layer. */
  layer: Pick<IAutoMovieHumanFaceHair.Layer, "samplingStep" | "clearance" | "terminalShaftDiameter">;

  /** The curve's root, scaling the rounding allowance. */
  root: IAutoMovieVector3;

  /** The curve's metric length, scaling the rounding allowance. */
  length: number;

  /** Signed query of the closed host collider. */
  query: ReturnType<typeof createAutoMovieSignedMeshQuery>;
}
