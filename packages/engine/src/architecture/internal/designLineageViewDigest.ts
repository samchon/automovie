import {
  IAutoMovieDesignChange,
  IAutoMovieDesignLineage,
  type IAutoMovieDesignLineageViewDigest,
  IAutoMovieDesignPhaseSnapshot,
  IAutoMovieDesignPhaseState,
  IAutoMovieDesignRevision,
  IAutoMovieDesignSubject,
  IAutoMovieDesignVariant,
} from "@automovie/interface";

import { autoMovieRenderDigest } from "../../render/internal/autoMovieRenderDigest";
import { AutoMovieEngineText } from "../../text/AutoMovieEngineText";
import { designLineagePhaseSnapshot } from "./designLineagePhaseSnapshot";
import { designLineageRecord } from "./designLineageRecord";
import { requireDesignVariant } from "./requireDesignVariant";

/*
 * Digest one view of the design: a revision, an alternative, and a phase.
 *
 * This recorded view is a replay handle for derived artifacts. Equal serialized
 * alternative/phase views hash equally; alternative identity and recorded
 * subject digests enter the serialization. The function reads recorded digests
 * rather than asset bytes and makes no collision-free identity guarantee.
 *
 * A null `variant` digests the head revision with no changes applied; a variant
 * digests its own base revision and its changes, ordered by subject and aspect
 * in code-unit order. A null `phase` digests the completed work. Every subject
 * state the phase snapshot reports is included with the subject's own content
 * digest. Returns a `sha256:` digest; an invalid lineage, an undeclared phase,
 * or an unknown variant id throws an `Error`.
 * Parameter lineage: Lineage the view is taken from.
 * Parameter view: Variant id or null for the head, and phase id or null for the
 * completed work.
 * Returns: The view's `sha256:` digest.
 */
export function designLineageViewDigest(
  lineage: IAutoMovieDesignLineage,
  view: IAutoMovieDesignLineageViewDigest.IView,
): string {
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
            AutoMovieEngineText.compareCodeUnits(a.subject, b.subject) ||
            AutoMovieEngineText.compareCodeUnits(a.aspect, b.aspect),
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
    ...applied.map((change: IAutoMovieDesignChange): string =>
      designLineageRecord("apply", change.subject, change.aspect, change.value),
    ),
    ...snapshot.states.map((state: IAutoMovieDesignPhaseState): string =>
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
}
