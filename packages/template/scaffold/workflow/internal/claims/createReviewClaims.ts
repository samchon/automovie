import type {
  IEvidenceClaim,
  IEvidenceMarkdownReference,
} from "@wrtnlabs/evidence";
import fs from "node:fs";
import path from "node:path";

import type { AuthoredLayer } from "../../AuthoredLayer";
import type { AuthoredPass } from "../../AuthoredPass";
import type { IProductionConfigProps } from "../../IProductionConfigProps";
import type { ProductionStage } from "../../ProductionStage";
import { hasNaturalness } from "../hasNaturalness";
import { ownClaim } from "../ownClaim";
import { createLineageReference } from "../references/createLineageReference";
import { createSharedReference } from "../references/createSharedReference";
import { PACKAGE_DOCS_ROOT } from "../utilities/PACKAGE_DOCS_ROOT";
import { createUnitFiles } from "../utilities/createUnitFiles";
import { passRoot } from "../utilities/passRoot";
import { resolveConstruction } from "../utilities/resolveConstruction";

/**
 * Creates the claims that record the evidence-stage reviews in the graph.
 *
 * A reviewer writes one review file per authored file and one review H2 per
 * authored H2, in a tree under `docs/review/<pass>/<layer>/round-<N>` that
 * mirrors the authored layer. Each review round has its own folder; the claims
 * read only the highest round of the layer, and earlier rounds stay as
 * history. Each review H2 cites the one authored H2 it read and keeps a current
 * review of it, so an authored change expires exactly the reviews it touched
 * and the graph shows which unit to read again. Each review H2 also answers
 * the review principles for itself. One verdict file per layer answers the
 * review obligations once, because they compare the whole population.
 *
 * No claim binds the review files to the authored files one to one, because
 * the H2 bijection already leaves no authored H2 without a review.
 *
 * Review claims are active only while the reviewed pass is in `evidence`.
 * A package whose installed contract predates the review family, or whose
 * reviewer has not yet written a round folder under
 * `docs/review/<pass>/<layer>`, has no review claims for that pass.
 */
export function createReviewClaims(
  props: IProductionConfigProps,
  layer: AuthoredLayer,
): IEvidenceClaim[] {
  const passes: [AuthoredPass, ProductionStage][] = [
    ["draft", resolveConstruction(props.construction[layer])[0]],
    ...(hasNaturalness(layer)
      ? [["final", props.naturalness[layer]] as [AuthoredPass, ProductionStage]]
      : []),
  ];
  const principles: boolean = installed(props.location, "principles/review.md");
  const obligations: boolean = installed(
    props.location,
    "obligations/review.md",
  );
  if (!principles && !obligations) return [];
  const files: string[] = createUnitFiles(layer, props.narrativeScope);

  return passes.flatMap(
    ([pass, stage]: [AuthoredPass, ProductionStage]): IEvidenceClaim[] => {
      // The reviewer opens the tree by writing its first file. A package that has
      // not been reviewed yet has no root to read, and an unreadable root would
      // make the author's own build incomplete before any review exists.
      const round: string | null = latestRound(
        path.join(props.location, PACKAGE_DOCS_ROOT, "review", pass, layer),
      );
      if (round === null) return [];
      const disabled: boolean = stage === "disabled";
      const root: string = `${PACKAGE_DOCS_ROOT}/review/${pass}/${layer}/${round}`;
      // Naturalness approval stays with the working text, even after promotion.
      const inside: string[] = files.map((file: string): string =>
        file.slice(layer.length + 1),
      );
      const lineage: IEvidenceMarkdownReference = {
        ...(createLineageReference(
          files,
          "h2",
          pass,
          true,
        ) as IEvidenceMarkdownReference),
        root: `${passRoot(pass)}/${layer}`,
        files: inside,
      };
      const where: "construction" | "naturalness" =
        pass === "draft" ? "construction" : "naturalness";
      const owner: {
        readonly layer: AuthoredLayer;
        readonly pass: "construction" | "naturalness";
      } = { layer, pass: where } as const;
      return [
        ownClaim(
          {
            name: `${layer} ${where} review H2 units keep a current review of their ${pass} H2`,
            type: "markdown",
            root,
            files: inside,
            symbol: "h2",
            disabled,
            reference: [
              lineage,
              ...(principles
                ? [
                    createSharedReference({
                      location: props.location,
                      file: "principles/review.md",
                      checklist: true,
                      exclusion: false,
                    }),
                  ]
                : []),
            ],
          },
          { ...owner, kind: "review" },
        ),
        ...(obligations
          ? [
              ownClaim(
                {
                  name: `${layer} ${where} verdict answers each review obligation once`,
                  type: "markdown",
                  root,
                  files: ["verdict/index.md"],
                  symbol: "file",
                  disabled,
                  reference: {
                    ...createSharedReference({
                      location: props.location,
                      file: "obligations/review.md",
                      checklist: false,
                      exclusion: false,
                    }),
                    uniqueEvidence: true,
                  },
                } satisfies IEvidenceClaim,
                { ...owner, kind: "verdict" },
              ),
            ]
          : []),
      ];
    },
  );
}

/**
 * Returns the review round folder with the highest number, such as `round-2`, or
 * `null` when the pass has no round folder yet.
 */
function latestRound(directory: string): string | null {
  if (!fs.existsSync(directory)) return null;
  let latest: string | null = null;
  let number: number = 0;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const match: RegExpMatchArray | null = /^round-(\d+)$/.exec(entry.name);
    if (!entry.isDirectory() || match === null) continue;
    if (Number(match[1]) > number) {
      number = Number(match[1]);
      latest = entry.name;
    }
  }
  return latest;
}

/** Reports whether one review-family document is installed. */
function installed(location: string, file: string): boolean {
  return fs.existsSync(
    path.join(
      location,
      ".agents",
      "skills",
      "contracts",
      "story",
      "shared",
      ...file.split("/"),
    ),
  );
}
