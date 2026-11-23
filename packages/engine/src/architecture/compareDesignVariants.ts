import {
  IAutoMovieDesignChange,
  IAutoMovieDesignComparison,
  IAutoMovieDesignDifference,
  IAutoMovieDesignLineage,
  IAutoMovieDesignSubject,
} from "@automovie/interface";

import { compareCodeUnits } from "../text/compareCodeUnits";
import { designLineageRecord } from "./designLineageRecord";
import { requireDesignVariant } from "./requireDesignVariant";

/**
 * Compare two alternatives of a lineage the caller has already validated.
 *
 * This is the comparison {@link designLineageCompare} and
 * {@link designLineageDecisionComparisons} answer with after their own single
 * validation, so a decision with many options validates once rather than once
 * per pair. It assumes a valid lineage: a change keyed twice on one subject and
 * aspect is a contradiction validation refuses, and here the later change would
 * win.
 *
 * Variants on different base revisions, or an unknown variant id, throw an
 * `Error`. A difference whose `left` or `right` is null means that alternative
 * leaves the aspect at the base revision. Differences are ordered by subject
 * and then aspect in UTF-16 code-unit order, and `common` lists, in the same
 * order, every lineage subject neither alternative changes.
 *
 * @param lineage A lineage `validateDesignLineage` accepts.
 * @param left Id of the variant reported on the `left` side.
 * @param right Id of the variant reported on the `right` side.
 * @returns The shared revision, both ids, the untouched subjects, and every
 *   differing (subject, aspect) pair.
 */
export const compareDesignVariants: (
  lineage: IAutoMovieDesignLineage,
  left: string,
  right: string,
) => IAutoMovieDesignComparison = (
  lineage: IAutoMovieDesignLineage,
  left: string,
  right: string,
): IAutoMovieDesignComparison => {
  const first: IAutoMovieDesignLineage["variants"][number] =
    requireDesignVariant(lineage, left);
  const second: IAutoMovieDesignLineage["variants"][number] =
    requireDesignVariant(lineage, right);
  if (first.base !== second.base)
    throw new Error(
      `design lineage "${lineage.id}" cannot compare variant "${left}" of revision "${first.base}" with variant "${right}" of revision "${second.base}"`,
    );
  const leftValues: Map<string, IAutoMovieDesignChange> = keyed(first.changes);
  const rightValues: Map<string, IAutoMovieDesignChange> = keyed(
    second.changes,
  );
  const differences: IAutoMovieDesignDifference[] = [];
  for (const key of new Set([...leftValues.keys(), ...rightValues.keys()])) {
    const leftChange: IAutoMovieDesignChange | undefined = leftValues.get(key);
    const rightChange: IAutoMovieDesignChange | undefined =
      rightValues.get(key);
    const leftValue: string | null =
      leftChange === undefined ? null : leftChange.value;
    const rightValue: string | null =
      rightChange === undefined ? null : rightChange.value;
    if (leftValue === rightValue) continue;
    const sample: IAutoMovieDesignChange = (leftChange ?? rightChange)!;
    differences.push({
      subject: sample.subject,
      aspect: sample.aspect,
      left: leftValue,
      right: rightValue,
    });
  }
  differences.sort(
    (a: IAutoMovieDesignDifference, b: IAutoMovieDesignDifference): number =>
      compareCodeUnits(a.subject, b.subject) ||
      compareCodeUnits(a.aspect, b.aspect),
  );
  const touched: Set<string> = new Set(
    [...first.changes, ...second.changes].map(
      (change: IAutoMovieDesignChange): string => change.subject,
    ),
  );
  return {
    revision: first.base,
    left,
    right,
    common: lineage.subjects
      .map((subject: IAutoMovieDesignSubject): string => subject.id)
      .filter((id: string): boolean => !touched.has(id))
      .sort(compareCodeUnits),
    differences,
  };
};

/** One variant's changes keyed by subject and aspect. */
const keyed: (
  changes: readonly IAutoMovieDesignChange[],
) => Map<string, IAutoMovieDesignChange> = (
  changes: readonly IAutoMovieDesignChange[],
): Map<string, IAutoMovieDesignChange> =>
  new Map(
    changes.map(
      (change: IAutoMovieDesignChange): [string, IAutoMovieDesignChange] => [
        designLineageRecord(change.subject, change.aspect),
        change,
      ],
    ),
  );
