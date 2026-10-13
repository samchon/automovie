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
