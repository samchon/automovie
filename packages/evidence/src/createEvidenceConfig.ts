import type { IEvidenceClaim, IEvidenceConfig } from "@wrtnlabs/evidence";
import path from "node:path";

import type { IAutoMovieEvidenceConfigProps } from "./IAutoMovieEvidenceConfigProps";
import { createEngineeringClaims } from "./createEngineeringClaims";
import { createProductionConfig } from "./narrative/createProductionConfig";

/**
 * Creates a native Evidence configuration with optional narrative claims.
 *
 * @evidence contracts/common.md#principled-implementation An absolute project location anchors the native engineering defaults and optional narrative selectors; caller-supplied claims are cloned before composition.
 * @evidence contracts/common.md#clear-and-simple-design One options object selects engineering alone or delegates narrative claim composition to createProductionConfig.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The returned object is an ordinary native configuration; this function neither evaluates diagnostics nor grants creative approval.
 * @evidence contracts/common.md#meaningful-documentation The input types explain routes, disabled stage defaults and additional native claims; export this result from evidence.config.ts.
 * @evidence contracts/performance.md#efficient-algorithms Engineering creation clones supplied claims or allocates two defaults; narrative creation additionally discovers current contract files and expands a fixed number of layer families.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call owns fresh option and claim copies; filesystem-dependent narrative composition is not cached across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned configuration; this function retains no registry, native process or open resource.
 */
export function createEvidenceConfig(
  props: IAutoMovieEvidenceConfigProps,
): IEvidenceConfig {
  if (!path.isAbsolute(props.location))
    throw new Error("Evidence location must be an absolute project directory.");
  const claims: IEvidenceClaim[] =
    props.claims === undefined
      ? createEngineeringClaims()
      : structuredClone(props.claims);
  if (props.narrative === undefined) return { severity: "error", claims };

  return createProductionConfig({
    location: props.location,
    mode: props.narrative.mode,
    narrativeScope: structuredClone(
      props.narrative.scope ?? { mode: "complete-work" },
    ),
    construction: {
      settings: "disabled",
      treatments: "disabled",
      scripts: "disabled",
      screenplay: "disabled",
      ...structuredClone(props.narrative.construction ?? {}),
    },
    naturalness: {
      screenplay: "disabled",
      ...structuredClone(props.narrative.naturalness ?? {}),
    },
    supportClaims: claims,
    claims: structuredClone(props.narrative.claims ?? []),
  });
}
