import {
  type IScaffoldPublicationReceipt,
  publishFiles,
} from "@automovie/template";
import { TestValidator } from "@nestia/e2e";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * A forced publication replaces a file that another directory also hard-links, as a running ttsc watcher's cache does to a production's AGENTS.md, without changing the other name; a single-link file is still rewritten in place.
 *
 * Scenarios:
 * 1. `AGENTS.md` is hard-linked from a cache directory outside the root. Forced publication completes, `AGENTS.md` holds the new text as a single-link file, and the cache name keeps the old text, so the write never reached another name.
 * 2. `README.md`, named only once, is rewritten in place: same identity, new text.
 * 3. No staging sibling remains in the root.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public `publishFiles` with `force` on a temporary root and observes receipts, file text, link counts and inode identities, catching a refusal of shared files, an in-place write that leaks into the cache name, or a leftover staging file.
 * @evidence contracts/development/testing.md#independent-expectations Expected texts are the literal seeds and inputs; link counts and identities come from `fs.statSync` on the fixture, not from the implementation.
 * @evidence contracts/development/testing.md#distinguishing-cases A shared and a single-link file in the same publication distinguish entry replacement from in-place rewriting; the cache name's unchanged text distinguishes the safe method from truncating the shared inode.
 * @evidence contracts/development/testing.md#execution-ownership A millisecond unit on two fresh `mkdtempSync` directories removed in `finally`; no child process, browser or repository file. Discovered by its `test_` export in `features/template`.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: AGENTS.md is hard-linked from a cache directory outside the root and forced publication replaces it as a single-link file).
 */
export function test_template_scaffold_publication_shared_link(): void {
  const root: string = fs.mkdtempSync(
    path.join(os.tmpdir(), "automovie-scaffold-"),
  );
  const cache: string = fs.mkdtempSync(
    path.join(os.tmpdir(), "automovie-cache-"),
  );
  try {
    const agents: string = path.join(root, "AGENTS.md");
    const readme: string = path.join(root, "README.md");
    const cached: string = path.join(cache, "AGENTS.md");
    fs.writeFileSync(agents, "old agents");
    fs.writeFileSync(readme, "old readme");
    fs.linkSync(agents, cached);
    const readmeIdentity: bigint = fs.statSync(readme, { bigint: true }).ino;
    TestValidator.equals(
      "fixture shares AGENTS.md",
      fs.statSync(agents).nlink,
      2,
    );

    const receipt: IScaffoldPublicationReceipt = publishFiles(
      root,
      { "AGENTS.md": "new agents", "README.md": "new readme" },
      { force: true },
    );
    TestValidator.equals(
      "forced publication completes",
      receipt.status,
      "completed",
    );
    TestValidator.equals(
      "shared file replaced, cache name untouched",
      [
        fs.readFileSync(agents, "utf8"),
        fs.statSync(agents).nlink,
        fs.readFileSync(cached, "utf8"),
        fs.statSync(cached).nlink,
      ],
      ["new agents", 1, "old agents", 1],
    );
    TestValidator.equals(
      "single-link file rewritten in place",
      [
        fs.readFileSync(readme, "utf8"),
        fs.statSync(readme, { bigint: true }).ino,
      ],
      ["new readme", readmeIdentity],
    );
    TestValidator.equals(
      "no staging sibling",
      fs
        .readdirSync(root)
        .filter((name: string): boolean => name.endsWith(".automovie-sync")),
      [],
    );
  } finally {
    fs.rmSync(root, { recursive: true });
    fs.rmSync(cache, { recursive: true });
  }
}
