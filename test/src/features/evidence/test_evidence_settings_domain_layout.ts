import {
  createSettingsFiles,
  readSettingsFiles,
  validateSettingsOutline,
} from "@automovie/evidence/internal";
// Internal helpers, which the package no longer exports.
import { TestValidator } from "@nestia/e2e";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Narrative evidence reads the scaffold's settings layout,
 * `docs/body/settings/<domain>/<subject>.md`, in domain order, validates its
 * outline against it, and still reads numbered and flat layouts.
 *
 * Scenarios:
 *
 * 1. Domain folders read in the scaffold's order (world, cast, props, sets),
 *    alphabetically within a domain, ignoring `outline`, and the evidence
 *    selector `createSettingsFiles` admits each of those files but not the
 *    outline.
 * 2. An outline whose H3 anchors follow that order and whose titles equal the
 *    files' H1s validates; one with two entries swapped is refused.
 * 3. An unknown domain folder, a numbered file in a domain folder, and a mix of
 *    domain and numbered folders are refused.
 * 4. Numbered folders and flat files still read as before.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds real settings trees on disk and observes the reader's returned order and the outline validator's acceptance or refusal, so the layout contract is checked through the files the graph actually reads.
 * @evidence contracts/development/testing.md#independent-expectations The expected order is written from the scaffold's documented domain list and alphabetical file names, not computed by the reader.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts a valid and a reordered outline, valid and invalid folder and file names, a mixed layout, and the retained numbered and flat layouts.
 * @evidence contracts/development/testing.md#execution-ownership The unit creates and removes its own temporary directories and starts no process.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Domain folders read in the scaffold's order (world, cast, props, sets),).
 */
export function test_evidence_settings_domain_layout(): void {
  const root: string = fs.mkdtempSync(path.join(os.tmpdir(), "settings-"));
  try {
    const write = (file: string, text: string): void => {
      fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
      fs.writeFileSync(path.join(root, file), text);
    };
    const settings: string = path.join(root, "docs/body/settings");
    write("docs/body/settings/sets/court.md", "# Court\n");
    write("docs/body/settings/cast/harry.md", "# Harry\n");
    write("docs/body/settings/cast/carina.md", "# Carina\n");
    write("docs/body/settings/world/work.md", "# Work\n");
    write("docs/body/settings/props/wand.md", "# Wand\n");
    const order: string[] = [
      "world/work.md",
      "cast/carina.md",
      "cast/harry.md",
      "props/wand.md",
      "sets/court.md",
    ];

    // 1. Domain order, alphabetical within a domain.
    write(
      "docs/body/settings/outline/index.md",
      "# Outline\n\n## World\n\n### Work {#world--work}\n\n## People and things\n\n### Carina {#cast--carina}\n\n### Harry {#cast--harry}\n\n### Wand {#props--wand}\n\n### Court {#sets--court}\n",
    );
    TestValidator.equals(
      "domain reading order",
      readSettingsFiles(settings),
      order,
    );

    // 1b. The evidence selector admits every canon file the reader returns, and not the outline.
    const selects = (file: string): boolean =>
      createSettingsFiles().some((glob: string): boolean =>
        path.posix.matchesGlob(file, glob),
      );
    for (const file of order)
      TestValidator.equals(
        `selector admits ${file}`,
        selects(`settings/${file}`),
        true,
      );
    TestValidator.equals(
      "selector leaves the outline out",
      selects("settings/outline/index.md"),
      false,
    );

    // 2. Outline validation.
    validateSettingsOutline(root);
    write(
      "docs/body/settings/outline/index.md",
      "# Outline\n\n## World\n\n### Work {#world--work}\n\n## People\n\n### Harry {#cast--harry}\n\n### Carina {#cast--carina}\n\n### Wand {#props--wand}\n\n### Court {#sets--court}\n",
    );
    TestValidator.error("a reordered outline is refused", (): void =>
      validateSettingsOutline(root),
    );

    // 3. Refusals.
    write("docs/body/settings/villains/draco.md", "# Draco\n");
    TestValidator.error("an unknown domain is refused", (): string[] =>
      readSettingsFiles(settings),
    );
    fs.rmSync(path.join(settings, "villains"), { recursive: true });
    write("docs/body/settings/cast/001-ron.md", "# Ron\n");
    TestValidator.error(
      "a numbered file in a domain folder is refused",
      (): string[] => readSettingsFiles(settings),
    );
    fs.rmSync(path.join(settings, "cast/001-ron.md"));
    write("docs/body/settings/001-people/001-ron.md", "# Ron\n");
    TestValidator.error(
      "domain and numbered folders cannot mix",
      (): string[] => readSettingsFiles(settings),
    );

    // 4. Numbered and flat layouts are retained.
    const numbered: string = path.join(root, "numbered");
    fs.mkdirSync(path.join(numbered, "002-places"), { recursive: true });
    fs.mkdirSync(path.join(numbered, "001-people"), { recursive: true });
    fs.writeFileSync(
      path.join(numbered, "002-places/001-court.md"),
      "# Court\n",
    );
    fs.writeFileSync(
      path.join(numbered, "001-people/002-harry.md"),
      "# Harry\n",
    );
    fs.writeFileSync(
      path.join(numbered, "001-people/001-carina.md"),
      "# Carina\n",
    );
    TestValidator.equals("numbered order", readSettingsFiles(numbered), [
      "001-people/001-carina.md",
      "001-people/002-harry.md",
      "002-places/001-court.md",
    ]);
    const flat: string = path.join(root, "flat");
    fs.mkdirSync(flat);
    fs.writeFileSync(path.join(flat, "b.md"), "# B\n");
    fs.writeFileSync(path.join(flat, "a.md"), "# A\n");
    TestValidator.equals("flat order", readSettingsFiles(flat), [
      "a.md",
      "b.md",
    ]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}
