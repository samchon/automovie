import type { IEvidenceClaim, IEvidenceConfig } from "@wrtnlabs/evidence";
import fs from "node:fs";
import path from "node:path";

import { createDevelopmentContractClaims } from "../development/claims/createDevelopmentContractClaims";
import { assertFilmCatalogLayout } from "../internal/assertFilmCatalogLayout";
import { assertProductionContractLayout } from "../internal/assertProductionContractLayout";
import { createReferenceRoot } from "../internal/createReferenceRoot";
import { hasMatchingFile } from "../internal/hasMatchingFile";
import { resolveSkillsDirectory } from "../internal/resolveSkillsDirectory";
import { assertNarrativeScope } from "../narrative/internal/assertNarrativeScope";
import { createProductionConfig } from "../narrative/internal/createProductionConfig";
import type { IAutoMovieEvidenceConfigProps } from "./IAutoMovieEvidenceConfigProps";
import { createEngineeringClaims } from "./claims/createEngineeringClaims";
import { createResearchClaims } from "./claims/createResearchClaims";

/** Builds the native Evidence configuration for an AutoMovie production. */
export namespace AutoMovieEvidenceConfig {
  /**
   * Assembles the selected production claims without running the checks.
   *
   * Engineering claims apply by default. Enable narrative, development or
   * research checks through their options. The short route includes research
   * when it has a study beyond the index, unless research is disabled.
   *
   * Bundled contracts resolve under the shared skills directory. Local work and
   * language contracts resolve under `docs/contracts` in the production.
   * Additional claims keep their supplied roots and are copied into the
   * result.
   *
   * @param props Absolute production location and optional contract selection.
   * @returns Native Evidence configuration for the selected production
   *   contracts.
   * @throws If the path, required contract layout, narrative scope or stage
   *   selection is invalid.
   */
  export function create(
    props: IAutoMovieEvidenceConfigProps,
  ): IEvidenceConfig {
    if (!path.isAbsolute(props.location))
      throw new Error(
        "Evidence location must be an absolute project directory, such as import.meta.dirname.",
      );
    assertProductionContractLayout(props.location);
    const narrative: IAutoMovieEvidenceConfigProps["narrative"] =
      props.narrative;
    if (narrative?.scope !== undefined)
      assertNarrativeScope(narrative.scope, narrative.mode);
    const catalog: boolean =
      (props.development?.catalog === "evidence" ||
        (props.development?.catalog === undefined &&
          props.development?.composition === "evidence")) &&
      assertFilmCatalogLayout(
        props.location,
        props.development?.catalog === "evidence",
      );
    const skills: string = resolveSkillsDirectory(props);
    const root: string = createReferenceRoot(props.location, skills);

    const claims: IEvidenceClaim[] = [
      ...createEngineeringClaims({ skills: root }),
      ...structuredClone(props.claims ?? []),
    ];
    claims.push(
      ...createDevelopmentContractClaims({
        ...props.development,
        catalog: catalog ? "evidence" : "disabled",
        skills: root,
        instructions:
          narrative?.mode === "none" &&
          fs.existsSync(path.join(props.location, "docs", "instructions")),
      }),
    );
    if (
      (props.development?.entities === "evidence" ||
        props.development?.composition === "evidence") &&
      (narrative?.mode === "short" || narrative?.mode === "long")
    ) {
      const layer: string = narrative.mode === "short" ? "brief" : "settings";
      const subjects: string[] = ["cast", "crowds", "props", "sets"].map(
        (domain: string): string => `docs/body/${layer}/${domain}/*.md`,
      );
      if (hasMatchingFile(props.location, subjects, []))
        claims.push({
          name: `production entities cite ${layer} subjects`,
          type: "typescript",
          files: ["src/entities/**/*.ts"],
          symbol: "type",
          reference: { type: "markdown", files: subjects, symbol: "file" },
        });
    }
    if (
      props.research === "evidence" ||
      (props.research === undefined &&
        narrative?.mode === "short" &&
        hasMatchingFile(props.location, "docs/research/**/*.md", [
          "docs/research/index.md",
        ]))
    )
      claims.push(...createResearchClaims({ skills: root }));
    if (narrative === undefined) return { severity: "error", claims };

    // Mode none adds only the caller's narrative claims; there is no layer to build.
    if (narrative.mode === "none")
      return {
        severity: "error",
        claims: [...claims, ...structuredClone(narrative.claims ?? [])],
      };

    return createProductionConfig({
      location: props.location,
      skills,
      mode: narrative.mode,
      narrativeScope: structuredClone(
        narrative.scope ?? { mode: "complete-work" },
      ),
      construction: {
        settings: "disabled",
        treatments: "disabled",
        scripts: "disabled",
        screenplay: "disabled",
        ...structuredClone(narrative.construction ?? {}),
      },
      supportClaims: claims,
      claims: structuredClone(narrative.claims ?? []),
    });
  }
}
