import type { IAutoMovieGeneratedManifest } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { planAutoMovieGeneratedPublication } from "../../../../packages/production/src/production/planAutoMovieGeneratedPublication";

import { createGeneratedPublicationReader } from "../internal/createGeneratedPublicationReader";

/**
 * Only removed and changed owned members enter the candidate write closure.
 *
 * Scenarios:
 * 1. A retired member is staged first, changed and missing members retain map
 *    order, a retained member is omitted, and a changed manifest comes last.
 * 2. Planned member bytes remain unchanged after the caller edits its buffer.
 * 3. A first publication with no old manifest stages an empty ownership record.
 * 4. Missing and empty resident ownership bytes both differ from new bytes.
 *
 * @evidence contracts/testing.md#behavioral-verification Plans generated publication through the real policy and injected byte-reader port, asserting ordered retirement/replacement/manifest writes, skipped retained data, exact read calls and detached changed bytes after caller mutation.
 * @evidence contracts/testing.md#independent-expectations Prior membership minus candidate keys retires only the named member; literal candidate/resident bytes determine changed and retained entries, and manifest-last ordering follows publication ownership. Mutating candidate2 to99 must not change the staged copy2.
 * @evidence contracts/testing.md#distinguishing-cases Retired, changed, retained and absent members contrast with null/empty first manifests and a mutated candidate buffer; reader failures and identical generation are separate companion tests. Planning does not prove transaction rollback or physical publication.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_production_generated_publication_changes executes portable synchronous planning with the existing declared reader capability and actual module, without creating files, starting a process or replacing globals.
 */
export function test_production_generated_publication_changes(): void {
  const serializedManifest: string = "new admitted ownership bytes\n";
  const previous: IAutoMovieGeneratedManifest = {
    version: 1,
    builder: { packageVersion: "unit", protocolVersion: "1" },
    inputFingerprint: "sha256:input",
    files: ["retired", "retained"].map((path: string): IAutoMovieGeneratedManifest["files"][number] => ({
      path,
      owner: "builder",
      digest: "sha256:member",
      sourceTargets: ["model:ship"],
    })),
  };
  const changed: Uint8Array = new Uint8Array([2]);
  const world: ReturnType<typeof createGeneratedPublicationReader> = createGeneratedPublicationReader({
    previous,
    files: new Map([
      ["changed", changed],
      ["retained", new Uint8Array([7])],
      ["missing", new Uint8Array([3])],
    ]),
    resident: new Map([
      ["changed", new Uint8Array([1])],
      ["retained", new Uint8Array([7])],
    ]),
    serializedManifest,
    manifest: Buffer.from("old admitted ownership bytes\n", "utf8"),
  });
  const writes: ReturnType<typeof planAutoMovieGeneratedPublication> = planAutoMovieGeneratedPublication(world);
  TestValidator.equals(
    "only changed closure is staged in publication order",
    writes.map(({ path, content }: typeof writes[number]): { path: string; content: number[] | string | null } => ({
      path,
      content: content instanceof Uint8Array ? Array.from(content) : content,
    })),
    [
      { path: "generated:retired", content: null },
      { path: "generated:changed", content: [2] },
      { path: "generated:missing", content: [3] },
      { path: "state:generated-manifest", content: serializedManifest },
    ],
  );
  changed[0] = 99;
  const staged: typeof writes[number]["content"] = writes[1]!.content;
  if (!(staged instanceof Uint8Array))
    throw new Error("The changed member must stage its byte buffer.");
  TestValidator.equals(
    "staged bytes own their copy",
    Array.from(staged),
    [2],
  );
  TestValidator.equals("missing members are never read", world.calls, [
    "resolve:retired",
    "resolve:changed",
    "exists:generated:changed",
    "read:changed",
    "resolve:retained",
    "exists:generated:retained",
    "read:retained",
    "resolve:missing",
    "exists:generated:missing",
    "manifest",
  ]);
  for (const manifest of [null, new Uint8Array()]) {
    const first: ReturnType<typeof createGeneratedPublicationReader> = createGeneratedPublicationReader({
      previous: null,
      files: new Map(),
      resident: new Map(),
      serializedManifest,
      manifest,
    });
    TestValidator.equals(
      "missing or empty ownership needs publication",
      planAutoMovieGeneratedPublication(first),
      [{ path: "state:generated-manifest", content: serializedManifest }],
    );
    TestValidator.equals(
      "empty first generation reads only ownership",
      first.calls,
      ["manifest"],
    );
  }
}
