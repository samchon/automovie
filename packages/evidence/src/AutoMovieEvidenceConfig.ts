import type { IEvidenceClaim, IEvidenceConfig } from "@wrtnlabs/evidence";
import fs from "node:fs";
import path from "node:path";

import type { IAutoMovieEvidenceConfigProps } from "./IAutoMovieEvidenceConfigProps";
import { createDevelopmentContractClaims } from "./createDevelopmentContractClaims";
import { createEngineeringClaims } from "./createEngineeringClaims";
import { createResearchClaims } from "./createResearchClaims";
import { assertFilmCatalogLayout } from "./internal/assertFilmCatalogLayout";
import { assertProductionContractLayout } from "./internal/assertProductionContractLayout";
import { createReferenceRoot } from "./internal/createReferenceRoot";
import { hasMatchingFile } from "./internal/hasMatchingFile";
import { resolveSkillsDirectory } from "./internal/resolveSkillsDirectory";
import { createProductionConfig } from "./narrative/createProductionConfig";

/** Owns configuration assembly for an AutoMovie production. */
export namespace AutoMovieEvidenceConfig {
  /**
   * Creates a native Evidence configuration with optional narrative claims.
   *
   * Resolve the shared skills tree once. The absolute directory goes to the
   * narrative factories, which keep production-owned work and language
   * contracts under `<location>/docs/contracts`, and its root relative to
   * `location` goes to the default engineering, development and research
   * claims. Caller-supplied `claims` are added after the defaults as written,
   * so they name their own root. A short narrative includes its studies by
   * default once one exists. Catalog selection checks the three catalog inputs
   * before building claims. Ordinary film composition can be checked directly
   * against the screenplay. On a story route the production's entity types cite
   * their subject records.
   *
   * @param props Absolute production location and optional contract selection.
   * @returns Native Evidence configuration for the selected production
   *   contracts.
   * @throws If the production path or required contract layout is invalid.
   */
  export function create(
    props: IAutoMovieEvidenceConfigProps,
  ): IEvidenceConfig {
    if (!path.isAbsolute(props.location))
      throw new Error(
        "Evidence location must be an absolute project directory, such as import.meta.dirname.",
      );
    assertProductionContractLayout(props.location);
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
          props.narrative?.mode === "none" &&
          fs.existsSync(path.join(props.location, "docs", "instructions")),
      }),
    );
    if (
      (props.development?.entities === "evidence" ||
        props.development?.composition === "evidence") &&
      (props.narrative?.mode === "short" || props.narrative?.mode === "long")
    ) {
      const layer: string =
        props.narrative.mode === "short" ? "brief" : "settings";
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
        props.narrative?.mode === "short" &&
        hasMatchingFile(props.location, "docs/research/**/*.md", [
          "docs/research/index.md",
        ]))
    )
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
}
