import type { IEvidenceClaim } from "@wrtnlabs/evidence";
import fs from "node:fs";
import path from "node:path";

import type { IProductionConfigProps } from "../../IProductionConfigProps";
import { createSharedReference } from "../references/createSharedReference";
import { createUnitFiles } from "../utilities/createUnitFiles";
import { passRoot } from "../utilities/passRoot";
import { resolveConstruction } from "../utilities/resolveConstruction";
import { validateSettingsOutline } from "../validateSettingsOutline";

/**
 * Selects the outline's own respondents and the canon-to-entry bijection.
 *
 * The two installed outline contracts opt a package into this topology. A
 * legacy installation keeps its optional, stage-free part coverage until an
 * explicit contract migration. The part principles and the arrangement obligations
 * follow `construction.index` (the settings stage when omitted) and the
 * file-to-entry claim follows the settings stage. Activating either stage
 * validates the layout.
 *
 * Three claims answer three different questions, so none reads another's
 * population. Each outline part H2 answers every part principle for itself, the
 * outline file answers each arrangement obligation once, and every settings
 * file cites exactly one outline entry, so a missing, duplicated or invented
 * file fails the build. The general canon claims never read `index.md`,
 * and the outline never answers a canon principle.
 *
 * @param completeSubmission explicitly requests layout validation even while
 *   both stages are `disabled`.
 */
export function createOutlineClaims(
  props: IProductionConfigProps,
  completeSubmission: boolean = false,
): IEvidenceClaim[] {
  const outline: string = "settings/outline/index.md";
  const installed: (family: string) => boolean = (family: string): boolean =>
    fs.existsSync(
      path.join(
        props.location,
        ".agents/skills/contracts/story/shared",
        family,
        "index.md",
      ),
    );
  const principle: boolean = installed("principles");
  if (principle !== installed("obligations"))
    throw new Error("Settings outline contracts must be installed as a pair.");

  if (principle === false) {
    if (!fs.existsSync(path.join(props.location, passRoot("draft"), outline)))
      return [];
    return [
      {
        name: "each settings file belongs to exactly one part of the outline",
        type: "markdown",
        root: passRoot("draft"),
        files: createUnitFiles("settings", props.narrativeScope),
        symbol: "file",
        reference: {
          type: "markdown",
          root: passRoot("draft"),
          files: [outline],
          symbol: "h2",
          singleEvidencePerSymbol: true,
          noEvidenceExclude: true,
        },
      },
    ];
  }

  const disabled: boolean =
    resolveConstruction(props.construction.settings)[0] === "disabled";
  // The outline's own claims follow `construction.index`, falling back to settings.
  const outlineDisabled: boolean =
    props.construction.index === undefined
      ? disabled
      : props.construction.index === "disabled";
  if (disabled === false || outlineDisabled === false || completeSubmission)
    validateSettingsOutline(props.location);
  return [
    {
      name: "settings outline parts answer their own principle checklist",
      type: "markdown",
      root: passRoot("draft"),
      files: [outline],
      symbol: "h2",
      disabled: outlineDisabled,
      reference: createSharedReference({
        location: props.location,
        file: "principles/index.md",
        checklist: true,
        exclusion: false,
      }),
    },
    {
      name: "settings outline answers each arrangement obligation once",
      type: "markdown",
      root: passRoot("draft"),
      files: [outline],
      symbol: "file",
      disabled: outlineDisabled,
      reference: {
        ...createSharedReference({
          location: props.location,
          file: "obligations/index.md",
          checklist: false,
          exclusion: false,
        }),
        uniqueEvidence: true,
      },
    },
    {
      name: "each settings file corresponds to exactly one outline entry",
      type: "markdown",
      root: passRoot("draft"),
      files: createUnitFiles("settings", props.narrativeScope),
      symbol: "file",
      disabled,
      reference: {
        type: "markdown",
        root: passRoot("draft"),
        files: [outline],
        symbol: "h3",
        singleEvidencePerSymbol: true,
        uniqueEvidence: true,
        noEvidenceExclude: true,
      },
    },
  ];
}
