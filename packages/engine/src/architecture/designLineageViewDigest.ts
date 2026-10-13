import {
  IAutoMovieDesignChange,
  IAutoMovieDesignLineage,
  IAutoMovieDesignPhaseSnapshot,
  IAutoMovieDesignPhaseState,
  IAutoMovieDesignRevision,
  IAutoMovieDesignSubject,
  IAutoMovieDesignVariant,
} from "@automovie/interface";

import { autoMovieRenderDigest } from "../render/autoMovieRenderDigest";
import { compareCodeUnits } from "../text/compareCodeUnits";
import { designLineagePhaseSnapshot } from "./designLineagePhaseSnapshot";
import { designLineageRecord } from "./designLineageRecord";
import { requireDesignVariant } from "./requireDesignVariant";

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
 * variant digests its own base revision and its changes, ordered by subject and
 * aspect in code-unit order. A null `phase` digests the completed work. Every
 * subject state the phase snapshot reports is included with the subject's own
 * content digest. Returns a `sha256:` digest; an invalid lineage, an
 * undeclared phase, or an unknown variant id throws an `Error`.
 *
 * @param lineage Lineage the view is taken from.
 * @param view Variant id or null for the head, and phase id or null for the completed work.
 * @returns The view's `sha256:` digest.
 *
 * @evidence contracts/common.md#principled-implementation The view is serialized as injective `designLineageRecord` lines (the revision and its digest, the code-unit-sorted applied changes, and the snapshot's sorted states with each subject's content digest) and hashed by `autoMovieRenderDigest`, so equal views digest equally and any change to revision, variant, phase or subject bytes moves it. Validation, done by the snapshot first, guarantees the head and base revisions resolve.
 * @evidence contracts/common.md#clear-and-simple-design Presence comes from `designLineagePhaseSnapshot`, which also validates, the variant lookup from `requireDesignVariant`, and the line encoding from `designLineageRecord`, so this function owns only which facts form a view.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no lineage, variant or phase; a null variant is the head revision for every lineage rather than a default for one caller.
 * @evidence contracts/common.md#meaningful-documentation States what the digest is a handle for, which differences move it, the meaning of a null variant and a null phase, the change order, the included subject digests, the format, and every refusal.
 * @evidence contracts/performance.md#efficient-algorithms One snapshot including one validation, one subject-digest index, and sorting the variant's C changes, so O(N + C log C) over the lineage's records.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Digests one view per call from the caller's mutable record; a cached digest could not prove the lineage or subject bytes unchanged.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds the snapshot, index and lines only for the call and returns one digest string.
 */
export const designLineageViewDigest: (lineage: IAutoMovieDesignLineage, view: { variant : string | null ; phase : string | null }) => string = (
  lineage: IAutoMovieDesignLineage,
  view: { variant: string | null; phase: string | null },
): string => {
  const snapshot: IAutoMovieDesignPhaseSnapshot = designLineagePhaseSnapshot(
    lineage,
    view.phase,
  );
  const variant: IAutoMovieDesignVariant | null =
    view.variant === null ? null : requireDesignVariant(lineage, view.variant);
  const revisionId: string = variant === null ? lineage.head : variant.base;
  const revision: IAutoMovieDesignRevision = lineage.revisions.find(
    (candidate: IAutoMovieDesignRevision): boolean =>
      candidate.id === revisionId,
  )!;
  const digests: Map<string, string> = new Map(
    lineage.subjects.map(
      (subject: IAutoMovieDesignSubject): [string, string] => [
        subject.id,
        subject.digest ?? "",
      ],
    ),
  );
  const applied: IAutoMovieDesignChange[] =
    variant === null
      ? []
      : [...variant.changes].sort(
          (a: IAutoMovieDesignChange, b: IAutoMovieDesignChange): number =>
            compareCodeUnits(a.subject, b.subject) ||
            compareCodeUnits(a.aspect, b.aspect),
        );
  const lines: string[] = [
    designLineageRecord(
      "view",
      lineage.id,
      revision.id,
      revision.digest,
      variant === null ? "" : variant.id,
      view.phase ?? "",
    ),
    ...applied.map(
      (change: IAutoMovieDesignChange): string =>
        designLineageRecord("apply", change.subject, change.aspect, change.value),
    ),
    ...snapshot.states.map(
      (state: IAutoMovieDesignPhaseState): string =>
        designLineageRecord(
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
