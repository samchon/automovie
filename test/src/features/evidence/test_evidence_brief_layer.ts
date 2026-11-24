import { createEvidenceConfig } from "@automovie/evidence";
import { createBriefFiles } from "@automovie/evidence/internal";
import { TestValidator } from "@nestia/e2e";
import type { IEvidenceClaim, IEvidenceConfig } from "@wrtnlabs/evidence";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * The short route's brief is canon like settings: its own unit, population and discovery claims, cited by the short screenplay, which alone realizes the instructions.
 *
 * Scenarios:
 * 1. A short production with brief decisions in `docs/body/brief/sets/ring.md` and `docs/body/brief/cast/carina.md` and one screenplay scene file builds a configuration whose brief unit claim selects `createBriefFiles`, carries no upstream reference, whose screenplay coverage claim references both brief files and no settings file, and whose instruction relation binds the screenplay and not the brief.
 * 2. The brief selector admits both domain files and not a top-level `brief/ring.md`, which the canon reader refuses as a mixed layout.
 * 3. The brief stage is optional: omitted, the brief claims are disabled; an active brief stage outside the short route is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds a real production tree on disk and reads the claims the public configuration factory returns, so the brief layer is checked through the graph a production actually runs.
 * @evidence contracts/development/testing.md#independent-expectations The expected brief paths, the absence of settings and upstream references and the screenplay-only instruction relation are written from the short route's documented layout and its minimal brief, not taken from the factory's output.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts enabled and omitted brief stages, the short and long routes, and domain versus top-level brief files.
 * @evidence contracts/development/testing.md#execution-ownership The unit creates and removes its own temporary directory and starts no process.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A short production with brief decisions in `docs/body/brief/sets/ring.md` and `docs/body/brief/cast/carina.md` and one screenplay scene file builds a configuration whose brief unit claim selects `createBriefFiles`, carries no upstream reference, whose screenplay coverage claim references both brief files and no settings file, and whose instruction relation binds the screenplay and not the brief.).
 */
export function test_evidence_brief_layer(): void {
  const root: string = fs.mkdtempSync(path.join(os.tmpdir(), "brief-"));
  try {
    const write = (file: string, text: string): void => {
      fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
      fs.writeFileSync(path.join(root, file), text);
    };
    write("docs/body/brief/sets/ring.md", "# Ring\n\n## Landmarks\n");
    write("docs/body/brief/cast/carina.md", "# Carina\n\n## Temper\n");
    write(
      "docs/body/screenplay/duel/001-opening.md",
      "# Opening\n\n## Approach {#s01}\n",
    );
    write(
      "docs/instructions/commission.md",
      "# Commission\n\n## Length {#length}\n\nThree minutes.\n",
    );

    // 1. Brief claims and the screenplay's brief coverage.
    const config: IEvidenceConfig = createEvidenceConfig({
      location: root,
      narrative: {
        mode: "short",
        construction: { brief: "evidence", screenplay: "evidence" },
      },
    });
    const claims: IEvidenceClaim[] = config.claims;
    const unit: IEvidenceClaim | undefined = claims.find(
      (claim: IEvidenceClaim): boolean =>
        claim.name === "brief H2 units answer their principle checklists",
    );
    TestValidator.predicate("brief unit claim exists", unit !== undefined);
    TestValidator.equals(
      "brief unit claim selects the brief files",
      unit?.files,
      createBriefFiles(),
    );
    TestValidator.equals("brief unit claim is active", unit?.disabled, false);
    const references: string = JSON.stringify(unit?.reference);
    TestValidator.predicate(
      "brief answers the brief principles",
      references.includes("principles/brief.md"),
    );
    TestValidator.predicate(
      "brief carries no upstream or narrative duty",
      !references.includes("upstream/") &&
        !references.includes("narratives.md"),
    );
    const coverage: IEvidenceClaim | undefined = claims.find(
      (claim: IEvidenceClaim): boolean =>
        claim.name === "screenplay H2 consumers cite their brief dependencies",
    );
    const cited: string = JSON.stringify(coverage?.reference);
    TestValidator.predicate(
      "screenplay cites the place decision",
      cited.includes("brief/sets/ring.md"),
    );
    TestValidator.predicate(
      "screenplay cites the cast decision",
      cited.includes("brief/cast/carina.md"),
    );
    TestValidator.predicate(
      "no settings canon on the short route",
      !JSON.stringify(claims).includes('"settings/'),
    );
    const realizes = (layer: string): boolean =>
      claims.some(
        (claim: IEvidenceClaim): boolean =>
          claim.name === `the ${layer} canon realizes every user instruction`,
      );
    TestValidator.predicate(
      "the screenplay alone realizes the instructions",
      realizes("screenplay") && !realizes("brief"),
    );

    // 2. Selector admits domain files, not a top-level file.
    const selects = (file: string): boolean =>
      createBriefFiles().some((glob: string): boolean =>
        path.posix.matchesGlob(file, glob),
      );
    TestValidator.equals(
      "admits sets/ring.md",
      selects("brief/sets/ring.md"),
      true,
    );
    TestValidator.equals(
      "admits cast/carina.md",
      selects("brief/cast/carina.md"),
      true,
    );
    TestValidator.equals(
      "leaves a top-level file out",
      selects("brief/ring.md"),
      false,
    );

    // 3. Optional stage and route boundary.
    const omitted: IEvidenceConfig = createEvidenceConfig({
      location: root,
      narrative: { mode: "short", construction: { screenplay: "evidence" } },
    });
    TestValidator.equals(
      "an omitted brief stage is disabled",
      omitted.claims.find(
        (claim: IEvidenceClaim): boolean =>
          claim.name === "brief H2 units answer their principle checklists",
      )?.disabled,
      true,
    );
    TestValidator.error(
      "brief outside the short route is refused",
      (): IEvidenceConfig =>
        createEvidenceConfig({
          location: root,
          narrative: { mode: "long", construction: { brief: "evidence" } },
        }),
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}
