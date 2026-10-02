import type { IAutoMovieGeneratedManifest } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import path from "node:path";

import { createGeneratedPublicationReader } from "../internal/createGeneratedPublicationReader";
import { loadSourceModule } from "../internal/loadSourceModule";

const { planAutoMovieGeneratedPublication } = loadSourceModule<{
  planAutoMovieGeneratedPublication(
    props: ReturnType<typeof createGeneratedPublicationReader>,
  ): Array<{ path: string; content: Uint8Array | string | null }>;
}>(path.resolve(__dirname, "../../../../packages/production/src/production/planAutoMovieGeneratedPublication.ts"));

/**
 * Only removed and changed owned members enter the candidate write closure.
 *
 * Scenarios:
 * 1. A retired member is staged first, changed and missing members retain map
 *    order, a retained member is omitted, and a changed manifest comes last.
 * 2. Planned member bytes remain unchanged after the caller edits its buffer.
 * 3. A first publication with no old manifest stages an empty ownership record.
 * 4. Missing and empty resident ownership bytes both differ from new bytes.
 */
export const test_production_generated_publication_changes = (): void => {
  const serializedManifest = "new admitted ownership bytes\n";
  const previous: IAutoMovieGeneratedManifest = {
    version: 1,
    builder: { packageVersion: "unit", protocolVersion: "1" },
    inputFingerprint: "sha256:input",
    files: ["retired", "retained"].map((path) => ({ path, owner: "builder", digest: "sha256:member", sourceTargets: ["model:ship"] })),
  };
  const changed = new Uint8Array([2]);
  const world = createGeneratedPublicationReader({
    previous,
    files: new Map([["changed", changed], ["retained", new Uint8Array([7])], ["missing", new Uint8Array([3])]]),
    resident: new Map([["changed", new Uint8Array([1])], ["retained", new Uint8Array([7])]]),
    serializedManifest,
    manifest: Buffer.from("old admitted ownership bytes\n", "utf8"),
  });
  const writes = planAutoMovieGeneratedPublication(world);
  TestValidator.equals("only changed closure is staged in publication order", writes.map(({ path, content }) => ({ path, content: content instanceof Uint8Array ? Array.from(content) : content })), [
    { path: "generated:retired", content: null },
    { path: "generated:changed", content: [2] },
    { path: "generated:missing", content: [3] },
    { path: "state:generated-manifest", content: serializedManifest },
  ]);
  changed[0] = 99;
  TestValidator.equals("staged bytes own their copy", Array.from(writes[1]!.content as Uint8Array), [2]);
  TestValidator.equals("missing members are never read", world.calls, [
    "resolve:retired", "resolve:changed", "exists:generated:changed", "read:changed",
    "resolve:retained", "exists:generated:retained", "read:retained",
    "resolve:missing", "exists:generated:missing", "manifest",
  ]);
  for (const manifest of [null, new Uint8Array()]) {
    const first = createGeneratedPublicationReader({ previous: null, files: new Map(), resident: new Map(), serializedManifest, manifest });
    TestValidator.equals("missing or empty ownership needs publication", planAutoMovieGeneratedPublication(first), [{ path: "state:generated-manifest", content: serializedManifest }]);
    TestValidator.equals("empty first generation reads only ownership", first.calls, ["manifest"]);
  }
};
