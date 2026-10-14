import {
  type IAutoMovieFilmPopulationTransitionReceipt,
  type IAutoMoviePopulationTransitionHost,
  type IValidateAutoMoviePopulationTransitionProps,
  createAutoMovieRetainedPilotHost,
  validateAutoMoviePopulationTransition,
} from "@automovie/evidence";
import { TestValidator } from "@nestia/e2e";
import { createHash } from "node:crypto";
import path from "node:path";

import { throwsError } from "../internal/predicates";

/**
 * A reset freezes the passed final pilot before complete-population rewriting.
 *
 * Scenarios:
 * 1. All four reviewed film branches authorize three construction drafts and disabled final.
 * 2. Missing, reordered, or absent reviewed branches and active final refuse the checkpoint.
 * 3. Every construction stage must reset together; retained bodies and tags stay exact.
 * 4. The one-pair library predecessor remains independent of the film final pass.
 * 5. Tab-stop indented evidence examples retain their complete authored bytes
 *    and contribute no live evidence declaration identity.
 * 6. An ordinary tag in an evidence comment remains authored body, while a
 *    pure wrapped evidence reason remains structural metadata.
 *
 * @evidence contracts/testing.md#behavioral-verification Validates reset topology and retained host identities, then checks authored-body and evidence digests so indented examples cannot be stripped or enrolled as live declarations.
 * @evidence contracts/testing.md#independent-expectations Literal reviewed-branch order and synchronized draft/disabled stages follow the reset protocol; Node SHA-256 over independently authored complete or metadata-free text and literal joined declarations pins each digest denominator without using the product projection as its oracle.
 * @evidence contracts/testing.md#distinguishing-cases Keeps malformed branch ladders, active final, partial reset, changed body/tag and library predecessor cases; tab-stop code preserves complete bytes, a mixed ordinary tag remains authored body and changes its identity, and a pure wrapped reason is removed only from body identity.
 * @evidence contracts/testing.md#execution-ownership The named synchronous portable unit owns every injected resident host and refusal callback through actual source functions, with no filesystem, production installation or separate runtime host.
 */
export function test_evidence_film_reset_checkpoint(): void {
  const hosts: IAutoMoviePopulationTransitionHost[] = [
    {
      path: "docs/treatments/001-opening.md",
      source:
        "# Opening\n\n## Arrival {#arrival}\n\nThe visitor enters.\n<!--\n@evidence settings/world.md#entrance The visitor uses the established entrance.\n-->\n",
    },
  ];
  const receipt: IAutoMovieFilmPopulationTransitionReceipt = {
    version: 1,
    kind: "film",
    productionLocation: path.resolve("production"),
    owner: "pilot-author",
    pilotScope: { mode: "first-pilot", partitionGroup: "001-arrival" },
    reviewedBranches: [
      "treatments",
      "scripts",
      "screenplays",
      "screenplayNaturalness",
    ],
    retainedHosts: hosts.map(createAutoMovieRetainedPilotHost),
  };
  const props: IValidateAutoMoviePopulationTransitionProps = {
    kind: "film",
    productionLocation: receipt.productionLocation,
    owner: receipt.owner,
    receipt,
    stages: {
      treatments: "draft",
      scripts: "draft",
      screenplays: "draft",
      screenplayNaturalness: "disabled",
    },
    hosts,
  };
  validateAutoMoviePopulationTransition(props);
  for (const branches of [
    undefined,
    [],
    ["treatments", "scripts", "screenplays"],
    ["scripts", "treatments", "screenplays", "screenplayNaturalness"],
    ["treatments", "scripts", "screenplays", "screenplayNaturalness", "shots"],
  ])
    TestValidator.predicate(
      "the predecessor is the exact complete reviewed ladder",
      throwsError((): void =>
        validateAutoMoviePopulationTransition({
          ...props,
          receipt: {
            ...receipt,
            reviewedBranches:
              branches as unknown as IAutoMovieFilmPopulationTransitionReceipt["reviewedBranches"],
          },
        }),
      ),
    );
  for (const stage of ["draft", "evidence", "review"])
    TestValidator.predicate(
      "final remains withdrawn throughout the reset checkpoint",
      throwsError((): void =>
        validateAutoMoviePopulationTransition({
          ...props,
          stages: { ...props.stages, screenplayNaturalness: stage },
        }),
      ),
    );
  for (const branch of ["treatments", "scripts", "screenplays"])
    for (const stage of ["disabled", "evidence", "review"])
      TestValidator.predicate(
        "all construction branches reset to draft together",
        throwsError((): void =>
          validateAutoMoviePopulationTransition({
            ...props,
            stages: { ...props.stages, [branch]: stage },
          }),
        ),
      );
  for (const source of [
    hosts[0].source.replace("visitor enters", "visitor leaves"),
    hosts[0].source.replace(
      "uses the established",
      "leaves through the established",
    ),
  ])
    TestValidator.predicate(
      "checkpoint forbids body or evidence rewriting",
      throwsError((): void =>
        validateAutoMoviePopulationTransition({
          ...props,
          hosts: [{ ...hosts[0], source }],
        }),
      ),
    );
  validateAutoMoviePopulationTransition(props);
  const libraryHosts: IAutoMoviePopulationTransitionHost[] = [
    {
      path: "docs/models/asset.md",
      source: "## Asset {#asset}\n\nA bounded solid.\n",
    },
  ];
  validateAutoMoviePopulationTransition({
    ...props,
    kind: "library",
    receipt: {
      version: 1,
      kind: "library",
      productionLocation: receipt.productionLocation,
      owner: receipt.owner,
      pilotScope: { mode: "first-pilot" },
      reviewedPairs: [{ design: "models", source: "modelSources" }],
      retainedHosts: libraryHosts.map(createAutoMovieRetainedPilotHost),
    },
    stages: { models: "draft", modelSources: "draft" },
    hosts: libraryHosts,
  });
  for (const indentation of ["\t", " \t", "  \t", "   \t", "    "]) {
    const source: string = `# Opening\n\n## Arrival {#arrival}\n\n${indentation}<!-- @evidence settings/world.md#entrance Code example. -->\n`;
    const host: IAutoMoviePopulationTransitionHost = { path: "docs/treatments/001-opening.md", source };
    TestValidator.equals("indented evidence examples retain complete authored identity", createAutoMovieRetainedPilotHost(host), {
      path: host.path,
      bodySha256: createHash("sha256").update(source, "utf8").digest("hex"),
      evidenceTagSha256: createHash("sha256").update("", "utf8").digest("hex"),
    });
  }
  const prefix: string = "# Opening\n\n## Arrival {#arrival}\n\n";
  const declaration: string = "@evidence settings/world.md#entrance Established entrance.";
  const mixed: string = `${prefix}<!--\n${declaration}\n@todo Preserve this authored reminder.\n-->\n`;
  const mixedHost: IAutoMoviePopulationTransitionHost = { path: hosts[0]!.path, source: mixed };
  const mixedIdentity: ReturnType<typeof createAutoMovieRetainedPilotHost> = createAutoMovieRetainedPilotHost(mixedHost);
  TestValidator.equals("ordinary tags stay in authored body but not evidence declaration text", mixedIdentity, {
    path: mixedHost.path,
    bodySha256: createHash("sha256").update(mixed, "utf8").digest("hex"),
    evidenceTagSha256: createHash("sha256").update(declaration, "utf8").digest("hex"),
  });
  const changedReminder: string = mixed.replace("this authored reminder", "a changed authored reminder");
  const changedIdentity: ReturnType<typeof createAutoMovieRetainedPilotHost> = createAutoMovieRetainedPilotHost({ ...mixedHost, source: changedReminder });
  TestValidator.predicate("an ordinary-tag edit changes retained body identity", changedIdentity.bodySha256 !== mixedIdentity.bodySha256);
  TestValidator.equals("an ordinary-tag edit leaves evidence identity unchanged", changedIdentity.evidenceTagSha256, mixedIdentity.evidenceTagSha256);
  const wrapped: string = `${prefix}<!--\n${declaration}\nWrapped reason.\n-->\n`;
  TestValidator.equals("pure wrapped evidence remains removable structural metadata", createAutoMovieRetainedPilotHost({ ...mixedHost, source: wrapped }), {
    path: mixedHost.path,
    bodySha256: createHash("sha256").update(`${prefix}\n`, "utf8").digest("hex"),
    evidenceTagSha256: createHash("sha256").update(`${declaration} Wrapped reason.`, "utf8").digest("hex"),
  });
}
