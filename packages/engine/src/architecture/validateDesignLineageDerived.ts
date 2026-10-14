import {
  IAutoMovieDerivedArtifact,
  IAutoMovieDesignAssetCitation,
  IAutoMovieDesignLineage,
  IAutoMovieDesignStamp,
  IAutoMovieDesignVariant,
} from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";
import { appendGraphCycles } from "../validation/appendGraphCycles";
import { collectDeclaredIds } from "../validation/collectDeclaredIds";
import { SHA256_DIGEST_PATTERN } from "../validation/constants/SHA256_DIGEST_PATTERN";
import { validateDeclaredReferences } from "../validation/validateDeclaredReferences";

/**
 * Validate the derived artifacts of one design lineage: their identity, their
 * freshness, and the fairness of every comparison they take part in.
 *
 * Each artifact needs a unique non-blank id that is not a subject's, a
 * non-blank kind, at least one input naming a subject or another artifact once,
 * and lowercase `sha256:` digests for its bytes and its configuration. It is
 * stale, and refused, when its stamp names a revision other than `head`, an
 * unknown variant, a variant based on another revision, or an unknown phase;
 * when an input artifact was stamped differently; when it reads an input
 * subject carrying imported bytes without citing exactly that subject's
 * current digest once; or when it cites bytes of a subject that is not such an
 * input. The input graph must be acyclic. Within one decision, two artifacts
 * of the same kind stamped with that decision's alternatives must share a
 * configuration and a phase, because a comparison shot under two cameras
 * compares the cameras.
 *
 * Findings are pushed to `out` with `<root>.derived[i]` paths, in artifact
 * order and then decision order for the fairness check; nothing throws.
 *
 * @param props.lineage Lineage whose `derived` list is judged.
 * @param props.subjectIds Declared subject ids, which artifact ids must avoid.
 * @param props.phaseIds Declared construction phase ids.
 * @param props.variants Declared variants by id.
 * @param props.root Violation path of the lineage itself.
 * @param props.out Sink that receives the violations.
 *
 * @evidence contracts/common.md#principled-implementation Checks the current head, agreement with upstream artifact stamps and current digest citations for imported subject inputs, then uses the shared graph-cycle check. These recorded identities are the freshness evidence: output bytes are not recomputed, and changing an upstream artifact digest without changing its stamp is not detected here.
 * @evidence contracts/common.md#clear-and-simple-design The derived half of `validateDesignLineage`, separated so the lineage validator stays within one file's size, receiving the id sets and variant index that validator already built instead of recomputing them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No artifact kind, revision or subject is special-cased; staleness is refused rather than warned, and a comparison mismatch is refused rather than normalized.
 * @evidence contracts/common.md#meaningful-documentation The documentation lists every identity, freshness, citation and fairness rule, the path root, the reporting order, and that nothing throws, and each parameter states what it supplies.
 * @evidence contracts/performance.md#efficient-algorithms Scans subjects, artifacts, input links, citations and decision options through maps/sets, adds the shared derivation-cycle traversal and O(D·A) fairness comparisons for D decisions and A artifacts. No bound on decision count is assumed.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Called once per lineage validation and fed the caller's id sets and variant index, so no work is repeated or shared across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The artifact index, subject digest map, per-artifact citation sets and per-decision kind tables are local and released on return, each bounded by its record count; findings go to the caller's collector.
 */
export const validateDesignLineageDerived: (props: {
  lineage: IAutoMovieDesignLineage;
  subjectIds: ReadonlySet<string>;
  phaseIds: ReadonlySet<string>;
  variants: ReadonlyMap<string, IAutoMovieDesignVariant>;
  root: string;
  out: ViolationCollector;
}) => void = (props: {
  lineage: IAutoMovieDesignLineage;
  subjectIds: ReadonlySet<string>;
  phaseIds: ReadonlySet<string>;
  variants: ReadonlyMap<string, IAutoMovieDesignVariant>;
  root: string;
  out: ViolationCollector;
}): void => {
  const {
    lineage,
    subjectIds,
    phaseIds,
    variants,
    root,
    out,
  }: Parameters<typeof validateDesignLineageDerived>[0] = props;
  const derivedIds: Set<string> = collectDeclaredIds(
    lineage.derived,
    `${root}.derived`,
    "derived artifact",
    out,
  );
  const stampable: Set<string> = new Set([...subjectIds, ...derivedIds]);
  const derivedById: Map<string, IAutoMovieDerivedArtifact> = new Map(
    lineage.derived.map(
      (
        artifact: IAutoMovieDerivedArtifact,
      ): [string, IAutoMovieDerivedArtifact] => [artifact.id, artifact],
    ),
  );
  const subjectBytes: Map<string, string> = new Map();
  for (const subject of lineage.subjects)
    if (subject.digest !== null) subjectBytes.set(subject.id, subject.digest);

  lineage.derived.forEach(
    (artifact: IAutoMovieDerivedArtifact, index: number): void => {
      const path: string = `${root}.derived[${index}]`;
      if (subjectIds.has(artifact.id))
        out.push(
          "type",
          `${path}.id`,
          `derived artifact id "${artifact.id}" collides with a declared subject identity`,
          artifact.id,
        );
      out.nonEmpty(`${path}.kind`, artifact.kind, "derived artifact kind");
      if (artifact.inputs.length === 0)
        out.push(
          "range",
          `${path}.inputs`,
          "a derived artifact must cite at least one input identity",
          artifact.inputs,
        );
      validateDeclaredReferences(
        artifact.inputs,
        stampable,
        `${path}.inputs`,
        "lineage identity",
        out,
      );
      if (!SHA256_DIGEST_PATTERN.test(artifact.digest))
        out.push(
          "type",
          `${path}.digest`,
          `derived artifact digest must be a lowercase "sha256:" hex digest, but was ${String(artifact.digest)}`,
          artifact.digest,
        );
      if (!SHA256_DIGEST_PATTERN.test(artifact.stamp.configuration))
        out.push(
          "type",
          `${path}.stamp.configuration`,
          `derived artifact configuration digest must be a lowercase "sha256:" hex digest, but was ${String(artifact.stamp.configuration)}`,
          artifact.stamp.configuration,
        );
      if (artifact.stamp.revision !== lineage.head)
        out.push(
          "type",
          `${path}.stamp.revision`,
          `derived artifact "${artifact.id}" is stale: it stamps revision "${artifact.stamp.revision}" while the work is on "${lineage.head}"`,
          artifact.stamp.revision,
        );
      if (artifact.stamp.variant !== null) {
        const variant: IAutoMovieDesignVariant | undefined = variants.get(
          artifact.stamp.variant,
        );
        if (variant === undefined)
          out.push(
            "type",
            `${path}.stamp.variant`,
            `derived artifact variant "${artifact.stamp.variant}" does not resolve`,
            artifact.stamp.variant,
          );
        else if (variant.base !== artifact.stamp.revision)
          out.push(
            "type",
            `${path}.stamp.variant`,
            `derived artifact "${artifact.id}" applies variant "${variant.id}" of revision "${variant.base}" to revision "${artifact.stamp.revision}"`,
            artifact.stamp.variant,
          );
      }
      if (artifact.stamp.phase !== null && !phaseIds.has(artifact.stamp.phase))
        out.push(
          "type",
          `${path}.stamp.phase`,
          `derived artifact phase "${artifact.stamp.phase}" does not resolve`,
          artifact.stamp.phase,
        );
      artifact.inputs.forEach((input: string, inputIndex: number): void => {
        const upstream: IAutoMovieDerivedArtifact | undefined =
          derivedById.get(input);
        if (
          upstream !== undefined &&
          !sameStamp(upstream.stamp, artifact.stamp)
        )
          out.push(
            "type",
            `${path}.inputs[${inputIndex}]`,
            `derived artifact "${artifact.id}" is stale against input "${input}", which was computed under a different revision, variant, phase, or configuration`,
            input,
          );
      });
      appendCitationDefects(artifact, subjectBytes, path, out);
    },
  );
  appendGraphCycles(
    lineage.derived.map(
      (
        artifact: IAutoMovieDerivedArtifact,
        index: number,
      ): { id: string; links: string[]; path: string; value: unknown } => ({
        id: artifact.id,
        links: artifact.inputs,
        path: `${root}.derived[${index}].inputs`,
        value: artifact.inputs,
      }),
    ),
    "derived artifact graph must be acyclic",
    out,
  );

  for (const decision of lineage.decisions) {
    const options: Set<string> = new Set(decision.options);
    const seen: Map<string, { configuration: string; phase: string | null }> =
      new Map();
    lineage.derived.forEach(
      (artifact: IAutoMovieDerivedArtifact, artifactIndex: number): void => {
        if (
          artifact.stamp.variant === null ||
          !options.has(artifact.stamp.variant)
        )
          return;
        const previous:
          | { configuration: string; phase: string | null }
          | undefined = seen.get(artifact.kind);
        if (previous === undefined)
          seen.set(artifact.kind, {
            configuration: artifact.stamp.configuration,
            phase: artifact.stamp.phase,
          });
        else if (
          previous.configuration !== artifact.stamp.configuration ||
          previous.phase !== artifact.stamp.phase
        )
          out.push(
            "type",
            `${root}.derived[${artifactIndex}].stamp`,
            `derived artifact "${artifact.id}" compares alternatives of decision "${decision.id}" under a different configuration or phase than another "${artifact.kind}" artifact of the same decision`,
            artifact.stamp,
          );
      },
    );
  }
};

/** Report every imported input read without citing its current bytes once. */
const appendCitationDefects: (
  artifact: IAutoMovieDerivedArtifact,
  subjectBytes: ReadonlyMap<string, string>,
  path: string,
  out: ViolationCollector,
) => void = (
  artifact: IAutoMovieDerivedArtifact,
  subjectBytes: ReadonlyMap<string, string>,
  path: string,
  out: ViolationCollector,
): void => {
  const importedInputs: Set<string> = new Set(
    artifact.inputs.filter((input: string): boolean => subjectBytes.has(input)),
  );
  const cited: Set<string> = new Set();
  artifact.assets.forEach(
    (citation: IAutoMovieDesignAssetCitation, citationIndex: number): void => {
      const citationPath: string = `${path}.assets[${citationIndex}]`;
      const current: string | undefined = subjectBytes.get(citation.subject);
      if (!importedInputs.has(citation.subject))
        out.push(
          "type",
          `${citationPath}.subject`,
          `derived artifact "${artifact.id}" cites bytes for "${citation.subject}", which is not one of its inputs carrying imported bytes`,
          citation.subject,
        );
      else if (cited.has(citation.subject))
        out.push(
          "type",
          `${citationPath}.subject`,
          `derived artifact "${artifact.id}" cites the bytes of "${citation.subject}" twice`,
          citation.subject,
        );
      else if (citation.digest !== current)
        out.push(
          "type",
          `${citationPath}.digest`,
          `derived artifact "${artifact.id}" is stale against imported input "${citation.subject}": it was computed from ${citation.digest} while that identity now carries ${String(current)}`,
          citation.digest,
        );
      cited.add(citation.subject);
    },
  );
  // In input order, like every other per-artifact complaint; the set was filled
  // from `artifact.inputs`, so iterating it keeps that order.
  for (const input of importedInputs)
    if (!cited.has(input))
      out.push(
        "type",
        `${path}.assets`,
        `derived artifact "${artifact.id}" reads imported input "${input}" without citing the bytes it read`,
        artifact.assets,
      );
};

/** Whether two stamps name the same revision, variant, phase and configuration. */
const sameStamp: (
  a: IAutoMovieDesignStamp,
  b: IAutoMovieDesignStamp,
) => boolean = (a: IAutoMovieDesignStamp, b: IAutoMovieDesignStamp): boolean =>
  a.revision === b.revision &&
  a.variant === b.variant &&
  a.phase === b.phase &&
  a.configuration === b.configuration;
