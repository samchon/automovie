import type { IAutoMovieFingerprintField } from "./IAutoMovieFingerprintField";
import type { IAutoMovieProductionEvidence } from "@automovie/evidence";
import { IAutoMovieBuildProjectInput } from "@automovie/interface";
import { AutoMovieProductionProject } from "./AutoMovieProductionProject";
import { normalizeAutoMovieSource } from "./contentIdentity";
import { inspectAutoMovieDerivedArtifacts } from "./derivedArtifacts";
import { FILM_SOURCE_PATH } from "./productionFilmAssembly";
import { contentFingerprintFields } from "./contentFingerprintFields";
import { productionBuildInputFingerprint } from "./productionBuildInputFingerprint";
import { authoringEvidenceFingerprintFields } from "./authoringEvidenceFingerprintFields";

/**
 * Reobserve the timed builder's selected design, source, owner and content identity.
 *
 * Design scope records not-inspected source fields and omits content/derivation reads. Other scopes reread every selected shot module and the fixed film entry, normalize source bytes, then read content and derivation fields. Any source read/normalization failure is currently encoded as absent; inventory failure becomes unsafe, and an outer failure returns null.
 *
 * @evidence contracts/common.md#principled-implementation The composer matches the timed builder's field categories and owner-edge projection without executing authored source. Fenced project reads and derivation inspection own admission; sequential observations are not an atomic filesystem snapshot and per-source errors are not individually classified here.
 * @evidence contracts/common.md#clear-and-simple-design The scope branches keep design-only work separate from source/content obligations, while the common fingerprint composer owns their deterministic encoding.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The absent source marker conflates missing, unsafe and malformed-source failures; it is identity input, not a safe absence certificate. Derived findings remain fingerprint fields rather than successful compilation, and null does not invent a digest after incomplete observation.
 * @evidence contracts/common.md#meaningful-documentation States scope omissions, selected source traversal, source failure conflation, unsafe inventory, null refusal and non-atomic observation limits.
 * @evidence contracts/performance.md#efficient-algorithms Cost includes graph canonicalization, all selected source normalization/reads, declared content bytes, full derivation inspection and field hashing. Shared module paths selected by multiple contracts are reread per role; this implementation has no local deduplication, and input sizes are not capped.
 * @evidence contracts/performance.md#reuse-equivalent-work The reader shares the builder's projection policy but recomputes mutable inputs; it owns no retained status. Repeated source paths are not reused within this traversal, a remaining cost rather than an asserted reuse guarantee.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Local fields can hold complete normalized/read byte populations until hashing returns, with no imposed byte limit. Project/derivation readers own descriptor cleanup and no authored execution or background task starts.
 */
export function currentAutoMovieProductionBuildInputFingerprintWithEvidence(
  project: AutoMovieProductionProject,
  scope: IAutoMovieBuildProjectInput["scope"],
  authoringEvidence: IAutoMovieProductionEvidence | undefined
): string | null {
  try {
    const graph: ReturnType<AutoMovieProductionProject["graph"]> = project.graph();
    const sourceFields: IAutoMovieFingerprintField[] = [
      ...authoringEvidenceFingerprintFields(authoringEvidence),
    ];
    for (const [id, contract] of graph.shots) {
      if (scope === "design") {
        sourceFields.push({
          role: `source:${id}`,
          kind: "not-inspected",
          payload: new Uint8Array(),
        });
        continue;
      }
      try {
        sourceFields.push({
          role: `source:${id}`,
          kind: "typescript",
          payload: normalizeAutoMovieSource(
            project.readSource(contract.source.module),
          ),
        });
      } catch {
        sourceFields.push({
          role: `source:${id}`,
          kind: "absent",
          payload: new Uint8Array(),
        });
      }
    }
    if (scope === "design")
      sourceFields.push({
        role: "source:film",
        kind: "not-inspected",
        payload: new Uint8Array(),
      });
    else
      try {
        sourceFields.push({
          role: "source:film",
          kind: "typescript",
          payload: normalizeAutoMovieSource(
            project.readSource(FILM_SOURCE_PATH),
          ),
        });
      } catch {
        sourceFields.push({
          role: "source:film",
          kind: "absent",
          payload: new Uint8Array(),
        });
      }
    const contentFields: IAutoMovieFingerprintField[] = [];
    if (scope !== "design")
      try {
        contentFields.push(
          ...contentFingerprintFields(project.contentInputs()),
        );
      } catch {
        contentFields.push({
          role: "content:inventory",
          kind: "unsafe",
          payload: new Uint8Array(),
        });
      }
    if (scope !== "design")
      contentFields.push(
        ...inspectAutoMovieDerivedArtifacts({
          root: project.root,
          manifestPath: project.manifest().derivedArtifactManifest,
        }).fingerprintFields,
      );
    return productionBuildInputFingerprint(
      project.productionId,
      graph,
      sourceFields,
      contentFields,
    );
  } catch {
    return null;
  }
}
