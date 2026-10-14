import { IAutoMovieProductionRegistryManifest, type IAutoMovieGeneratedManifest, type IAutoMovieGeneratedFile } from "@automovie/interface";
import typia from "typia";
import { AutoMovieProductionProject } from "./AutoMovieProductionProject";
import { digestAutoMovieBytes } from "./contentIdentity";
import { parseAutoMovieStructuredJson } from "./duplicateAwareJson";

/**
 * Read the generated target registry authenticated by current generated ownership.
 *
 * The generated manifest must name manifests/compile.json; its fenced bytes must match the recorded digest, duplicate-aware JSON parsing must succeed, and the exact schema must agree with production id and input fingerprint. This authenticates the resident registry against generated ownership, not a fresh source evaluation; capture and repaint callers separately check build status.
 *
 * @evidence contracts/common.md#principled-implementation Digest equality binds exact registry bytes to generated ownership, followed by duplicate-aware parsing and typia exact validation. The project supplies fenced reads and an admitted manifest; missing, malformed or mismatched records refuse.
 * @evidence contracts/common.md#clear-and-simple-design One reader owns registry admission for capture, turntable and repaint consumers; source-currentness decisions remain with their build-status owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The compile.json path is the supported compiler registry address, not a fixture exception. No missing record is substituted, source freshness invented or failed read converted into repair.
 * @evidence contracts/common.md#meaningful-documentation States the ownership digest and exact-schema gates, production/input agreement and source-currentness limitation; writable builder publication supplies the absent registry.
 * @evidence contracts/performance.md#efficient-algorithms The manifest entry search is O(G) for G generated members; hashing, parsing and schema validation process the complete registry byte and record population. No registry byte-size cap is imposed here.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call rereads and authenticates current registry bytes; capture/repaint completion checks repeat this because a prior observation cannot prove unchanged ownership.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Parsed registry records transfer to the caller; temporary read/parse bytes are call-local. Project readers own file-handle cleanup, and this reader retains no cross-call cache or running task.
 */
export function readAutoMovieProductionRegistry(
  project: AutoMovieProductionProject
): IAutoMovieProductionRegistryManifest {
  const generated: IAutoMovieGeneratedManifest | null = project.generatedManifest();
  if (generated === null)
    throw new Error(
      "Evidence requires a current builder registry. Publish current source through AutoMovieProductionBuilder.build first.",
    );
  const entry: IAutoMovieGeneratedFile | undefined = generated.files.find(
    (file: IAutoMovieGeneratedFile): boolean => file.path === "manifests/compile.json",
  );
  if (entry === undefined)
    throw new Error(
      "Current generated ownership has no evidence target registry. Recompile with the installed AutoMovie package.",
    );
  const bytes: Uint8Array = project.readGeneratedFile("manifests/compile.json");
  if (digestAutoMovieBytes(bytes) !== entry.digest)
    throw new Error(
      "Compiler target registry bytes differ from generated ownership. Recompile before producing evidence.",
    );
  const validation: typia.IValidation<IAutoMovieProductionRegistryManifest> = typia.validateEquals<IAutoMovieProductionRegistryManifest>(
    parseAutoMovieStructuredJson({ record: "target-registry", bytes }),
  );
  if (
    validation.success === false ||
    validation.data.productionId !== project.productionId ||
    validation.data.inputFingerprint !== generated.inputFingerprint
  )
    throw new Error(
      "Compiler target registry is malformed or stale for the active production. Recompile before producing evidence.",
    );
  return validation.data;
}
