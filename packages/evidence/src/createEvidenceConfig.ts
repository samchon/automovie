import type { IEvidenceClaim, IEvidenceConfig } from "@wrtnlabs/evidence";
import fs from "node:fs";
import path from "node:path";

import type { IAutoMovieEvidenceConfigProps } from "./IAutoMovieEvidenceConfigProps";
import { createDevelopmentContractClaims } from "./createDevelopmentContractClaims";
import { createEngineeringClaims } from "./createEngineeringClaims";
import { createResearchClaims } from "./createResearchClaims";
import { assertProductionContractLayout } from "./internal/assertProductionContractLayout";
import { createReferenceRoot } from "./internal/createReferenceRoot";
import { resolveSkillsDirectory } from "./internal/resolveSkillsDirectory";
import { createProductionConfig } from "./narrative/createProductionConfig";

/**
 * Creates a native Evidence configuration with optional narrative claims.
 *
 * The shared skills tree is resolved once: its absolute directory goes to the
 * narrative factories, which keep production-owned work and language contracts
 * under `<location>/docs/contracts`, and its root relative to `location` goes to the default
 * engineering, development and research claims. Caller-supplied `claims` are
 * added after the defaults as written, so they name their own root.
 *
 * @evidence contracts/development/implementation.md#principled-implementation An absolute project location and a resolved absolute shared skills tree anchor the native engineering defaults and optional narrative selectors; native Evidence resolves the relative root against the configuration directory, the location, and caller-supplied claims are cloned before composition.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One options object selects engineering alone, engineering whose code realizes every instruction section when narrative mode is none and `docs/instructions` exists, or delegates narrative claim composition to createProductionConfig; resolveSkillsDirectory and createReferenceRoot own the shared-tree default, validation and spelling.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The returned object is an ordinary native configuration; this function neither evaluates diagnostics nor grants creative approval, an omitted skills tree yields exactly the standalone roots, and assertProductionContractLayout refuses a production still keeping its own contracts in the retired skills location rather than letting their duties vanish.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two legacy-layout existence probes precede work, and mode none adds one instruction-directory probe; engineering creation allocates fixed defaults and clones supplied claims after them; narrative creation additionally discovers current contract files and expands a fixed number of layer families.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The shared tree is resolved once per call and reused by every factory; the layout guard repeats its two probes inside a narrative build so createProductionConfig called directly stays guarded; each call owns fresh option and claim copies, and filesystem-dependent narrative composition is not cached across calls.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the returned configuration; this function retains no registry, native process or open resource.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states how the shared tree reaches each factory and that supplied claims keep their own root; the input types explain routes, disabled stage defaults and additional native claims.
 */
export function createEvidenceConfig(
  props: IAutoMovieEvidenceConfigProps,
): IEvidenceConfig {
  if (!path.isAbsolute(props.location))
    throw new Error(
      "Evidence location must be an absolute project directory, such as import.meta.dirname.",
    );
  assertProductionContractLayout(props.location);
  const skills: string = resolveSkillsDirectory(props);
  const root: string = createReferenceRoot(props.location, skills);

  const claims: IEvidenceClaim[] = [
    ...createEngineeringClaims({ skills: root }),
    ...structuredClone(props.claims ?? []),
  ];
  claims.push(
    ...createDevelopmentContractClaims({
      ...props.development,
      skills: root,
      instructions:
        props.narrative?.mode === "none" &&
        fs.existsSync(path.join(props.location, "docs", "instructions")),
    }),
  );
  if (props.research === "evidence")
    claims.push(...createResearchClaims({ skills: root }));
  if (props.narrative === undefined) return { severity: "error", claims };

  // Mode none adds only the caller's narrative claims; there is no layer to build.
  if (props.narrative.mode === "none")
    return {
      severity: "error",
      claims: [...claims, ...structuredClone(props.narrative.claims ?? [])],
    };

  return createProductionConfig({
    location: props.location,
    skills,
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
    supportClaims: claims,
    claims: structuredClone(props.narrative.claims ?? []),
  });
}
