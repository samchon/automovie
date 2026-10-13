import {
  AutoMovieContentDigest,
  IAutoMovieDesignChange,
  IAutoMovieDesignLineage,
  IAutoMovieDesignVariant,
} from "@automovie/interface";

import { autoMovieRenderDigest } from "../render/autoMovieRenderDigest";
import { compareCodeUnits } from "../text/compareCodeUnits";
import { designLineagePhaseSnapshot } from "./designLineagePhaseSnapshot";

/**
 * Digest one view of the design: a revision, an alternative, and a phase.
 *
 * This is the replay handle every derived artifact should have been produced
 * against. Two runs of the same alternative at the same phase digest
 * identically, two alternatives of the same revision digest differently, and a
 * texture whose bytes changed moves the digest even though not one line of the
 * design moved, because a subject's own content digest is part of the view.
 *
 * A null `variant` digests the head revision with no changes applied; a
 * variant digests its own base revision and changes. A null `phase` digests
 * the completed work. Returns a `sha256:` digest; an invalid lineage, an
 * undeclared phase, or an unknown variant id throws an `Error`.
 *
 * @param lineage Lineage the view is taken from.
 * @param view Variant id or null for the head, and phase id or null for the completed work.
 * @evidence contracts/common.md#principled-implementation Serializes a view header, the variant's changes sorted by (subject, aspect) and every phase state with the subject's content digest as length-prefixed records, then hashes them with SHA-256; the revision lookups use non-null assertions that hold because the snapshot validated head and variant bases first.
 * @evidence contracts/common.md#clear-and-simple-design Presence comes from `designLineagePhaseSnapshot`, so the digest and any phased consumer read one answer; `record` and `requireVariant` are private copies of the helpers in `designLineageCompare`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An absent subject digest is serialized as the empty string, a defined encoding the length prefix keeps distinct from any real digest; no variant or phase is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States what the digest identifies, the head and completed-work meanings of the two nulls, the digest format, and the refusals.
 * @evidence contracts/performance.md#cost-and-resources One snapshot including validation, a linear revision lookup, an O(C log C) sort of the variant's C changes and a hash linear in the serialized text; nothing is cached, so each view of one lineage revalidates it, and only the digest string is returned.
 */
export const designLineageViewDigest = (
  lineage: IAutoMovieDesignLineage,
  view: { variant: string | null; phase: string | null },
): AutoMovieContentDigest => {
  const snapshot = designLineagePhaseSnapshot(lineage, view.phase);
  const variant =
    view.variant === null ? null : requireVariant(lineage, view.variant);
  const revision =
    variant === null
      ? lineage.revisions.find((candidate) => candidate.id === lineage.head)!
      : lineage.revisions.find((candidate) => candidate.id === variant.base)!;
  const digests = new Map(
    lineage.subjects.map(
      (subject) => [subject.id, subject.digest ?? ""] as const,
    ),
  );
  const applied: IAutoMovieDesignChange[] =
    variant === null ? [] : [...variant.changes];
  applied.sort(
    (a, b) =>
      compareCodeUnits(a.subject, b.subject) ||
      compareCodeUnits(a.aspect, b.aspect),
  );
  const lines: string[] = [
    record(
      "view",
      lineage.id,
      revision.id,
      revision.digest,
      variant === null ? "" : variant.id,
      view.phase ?? "",
    ),
    ...applied.map((change) =>
      record("apply", change.subject, change.aspect, change.value),
    ),
    ...snapshot.states.map((state) =>
      record(
        "state",
        state.subject,
        state.graph,
        state.role,
        state.presence,
        digests.get(state.subject)!,
      ),
    ),
  ];
  return autoMovieRenderDigest(lines.join("\n"));
};

const requireVariant = (
  lineage: IAutoMovieDesignLineage,
  variant: string,
): IAutoMovieDesignVariant => {
  const found = lineage.variants.find((entry) => entry.id === variant);
  if (found === undefined)
    throw new Error(
      `design lineage "${lineage.id}" has no design variant "${variant}"`,
    );
  return found;
};

/** Length-prefix every field so no authored text can forge a separator. */
const record = (...fields: readonly string[]): string =>
  fields.map((field) => `${field.length}:${field}`).join("|");
