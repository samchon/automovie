import { fileURLToPath } from "node:url";

import type { ReferenceManifest } from "../io/ReferenceManifest.ts";
import { freezeInputs } from "../io/freezeInputs.ts";
import { readManifest } from "../io/readManifest.ts";
import { sha256 } from "../io/sha256.ts";
import { writeArtifact } from "../io/writeArtifact.ts";
import type { HandRegion } from "./HandRegion.ts";
import { observeHands } from "./observeHands.ts";

/**
 * Runs manifest-bound hand observation into a caller-owned immutable output root.
 * Required options are --manifest and --output; --spacing-mm controls numerical
 * sampling resolution. Each output root is a distinct research revision.
 *
 * @evidence contracts/common.md#principled-implementation Freezes verified private input bytes before observation and publishes immutable artifacts only after complete computation.
 * @evidence contracts/common.md#clear-and-simple-design The entrypoint owns CLI admission and publication; observeHands owns anatomical frame and station observations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no private reference paths or identity catalogue and does not overwrite an existing different result.
 * @evidence contracts/common.md#meaningful-documentation Names required options, explicit output ownership and the sampling parameter's numerical meaning.
 * @evidence contracts/performance.md#efficient-algorithms Parses a fixed small option list and performs one source operation; input freezing adds one complete byte copy and hash pass per declared file.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares the frozen manifest and one observed identity between both immutable hand artifacts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Synchronous IO closes its handles on return; output files are caller-owned persistent research artifacts and no viewer or background process is started.
 */
export function main(arguments_: string[]): void {
  const options: Map<string, string> = new Map();
  for (let i: number = 0; i < arguments_.length; i += 2) {
    const name: string = arguments_[i];
    const value: string | undefined = arguments_[i + 1];
    if (
      !["--manifest", "--output", "--spacing-mm"].includes(name) ||
      value === undefined ||
      options.has(name)
    )
      throw new Error(
        "Hands expects unique --manifest, --output and optional --spacing-mm option/value pairs",
      );
    options.set(name, value);
  }
  const manifestPath: string | undefined = options.get("--manifest");
  const output: string | undefined = options.get("--output");
  if (!manifestPath || !output)
    throw new Error("Hands requires --manifest and --output absolute paths");
  const frozen: { path: string; sha256: string } = freezeInputs(
    manifestPath,
    `${output}/inputs`,
  );
  const manifest: ReferenceManifest = readManifest(frozen.path);
  const producerSha256: string = sha256(fileURLToPath(import.meta.url));
  const regions: HandRegion[] = observeHands(
    manifest,
    producerSha256,
    Number(options.get("--spacing-mm") ?? "0.8"),
  );
  const published: { path: string; sha256: string }[] = [];
  for (const region of regions)
    published.push(writeArtifact(output, `${region.region}.json`, region));
  const record: { path: string; sha256: string } = writeArtifact(
    output,
    "hands-publication.json",
    {
      inputManifest: frozen,
      producer: {
        file: "tools/human-reference/src/hands/main.ts",
        sha256: producerSha256,
      },
      artifacts: published,
      limits: [
        "Regional observations do not certify fitted generating skin.",
        "Source helpers and compiler snapshot must accompany visual qualification; the entrypoint hash alone does not identify the whole source tree.",
      ],
    },
  );
  console.log(JSON.stringify(record));
}

main(process.argv.slice(2));
