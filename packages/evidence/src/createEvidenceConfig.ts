import type { IEvidenceClaim, IEvidenceConfig } from "@wrtnlabs/evidence";
import path from "node:path";

import type { IAutoMovieEvidenceConfigProps } from "./IAutoMovieEvidenceConfigProps";
import type { IAutoMovieNarrativeClaim } from "./IAutoMovieNarrativeClaim";
import { createEngineeringClaims } from "./createEngineeringClaims";
import { createProductionConfig } from "./narrative/createProductionConfig";
import { resolveProductionGateRuntime } from "./narrative/resolveProductionGateRuntime";

/**
 * Creates engineering evidence, adding narrative only when explicitly requested.
 *
 * The returned native config can be exported directly from evidence.config.ts.
 * Stages and runtime ownership are captured at creation; do not mutate returned
 * narrative claims after submission. Custom claims replace the engineering
 * defaults, which createEngineeringClaims can supply when extending them.
 *
 * @evidence contracts/common.md#principled-implementation An explicit narrative option selects the factory lifecycle; otherwise fresh native engineering claims suffice. Absolute location anchors contracts, complete-work and disabled stages are defaults, and actual implementation/compiler identity comes from the runtime resolver.
 * @evidence contracts/common.md#clear-and-simple-design The facade translates author choices once into the existing graph factory; every named work record generates both its claim and its matching owner without independent name arrays.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No file presence, fixture name, synthetic runtime label, or downstream diagnostic grants creative completion; the native graph retains its original duties.
 * @evidence contracts/common.md#meaningful-documentation The comment states opt-in, export usage, engineering replacement/extension and mutation boundaries; input types document stages and ownership.
 * @evidence contracts/performance.md#efficient-algorithms Engineering-only creation clones the supplied claim graph or allocates two defaults. Narrative creation additionally maps each work claim once and delegates source/contract discovery and runtime hashing to their owners; it avoids graph construction entirely for ordinary coding.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call captures current author choices and contract/runtime inputs; mutable configurations are not reused across calls. Default claim objects are fresh, and the narrative owner binds its exact returned config.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Local cloned claims become caller-owned config data. The underlying factory retains config provenance weakly; this facade acquires no handles or background tasks.
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

  const work: IAutoMovieNarrativeClaim[] = structuredClone(
    props.narrative.claims ?? [],
  );
  return createProductionConfig({
    lifecycle: "independent-evidence-v1",
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
    gate: {
      ...resolveProductionGateRuntime(props.location),
      claimScopes: work.map(
        (
          entry: IAutoMovieNarrativeClaim,
        ): {
          name: string;
          layer: IAutoMovieNarrativeClaim["layer"];
          pass: IAutoMovieNarrativeClaim["pass"];
        } => ({ name: entry.claim.name, layer: entry.layer, pass: entry.pass }),
      ),
    },
    supportClaims: claims,
    claims: work.map(
      (entry: IAutoMovieNarrativeClaim): IEvidenceClaim => entry.claim,
    ),
  });
}
