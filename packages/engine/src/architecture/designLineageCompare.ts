import {
  IAutoMovieDesignComparison,
  IAutoMovieDesignDifference,
  IAutoMovieDesignLineage,
  IAutoMovieDesignVariant,
} from "@automovie/interface";

import { compareCodeUnits } from "../text/compareCodeUnits";
import { validateDesignLineage } from "./validateDesignLineage";

/**
 * Compare two alternatives on the revision they share.
 *
 * Every difference names one subject id both schemes carry, which is the proof
 * that comparing alternatives did not fork the building. Alternatives on
 * different base revisions are refused rather than compared, because the
 * differences would then mix the two schemes with everything the revision
 * changed underneath them.
 *
 * A difference whose `left` or `right` is null means that alternative leaves
 * the aspect at the base revision. Differences are ordered by subject and then
 * aspect in UTF-16 code-unit order, and `common` lists, in the same order,
 * every lineage subject neither alternative changes. The lineage is validated
 * first, and an invalid lineage, an unknown variant id, or two variants on
 * different base revisions throws an `Error`.
 *
 * @param lineage Lineage holding both alternatives.
 * @param left Id of the variant reported on the `left` side.
 * @param right Id of the variant reported on the `right` side.
 * @returns The shared revision, both ids, the untouched subjects, and every differing (subject, aspect) pair.
 */
export const designLineageCompare = (
  lineage: IAutoMovieDesignLineage,
  left: string,
  right: string,
): IAutoMovieDesignComparison => {
  requireValidLineage(lineage);
  const first = requireVariant(lineage, left);
  const second = requireVariant(lineage, right);
  if (first.base !== second.base)
    throw new Error(
      `design lineage "${lineage.id}" cannot compare variant "${left}" of revision "${first.base}" with variant "${right}" of revision "${second.base}"`,
    );
  const leftValues = new Map(
    first.changes.map(
      (change) => [record(change.subject, change.aspect), change] as const,
    ),
  );
  const rightValues = new Map(
    second.changes.map(
      (change) => [record(change.subject, change.aspect), change] as const,
    ),
  );
  const differences: IAutoMovieDesignDifference[] = [];
  for (const key of new Set([...leftValues.keys(), ...rightValues.keys()])) {
    const leftChange = leftValues.get(key);
    const rightChange = rightValues.get(key);
    const leftValue = leftChange === undefined ? null : leftChange.value;
    const rightValue = rightChange === undefined ? null : rightChange.value;
    if (leftValue === rightValue) continue;
    const sample = (leftChange ?? rightChange)!;
    differences.push({
      subject: sample.subject,
      aspect: sample.aspect,
      left: leftValue,
      right: rightValue,
    });
  }
  differences.sort(
    (a, b) =>
      compareCodeUnits(a.subject, b.subject) ||
      compareCodeUnits(a.aspect, b.aspect),
  );
  const touched = new Set(
    [...first.changes, ...second.changes].map((change) => change.subject),
  );
  return {
    revision: first.base,
    left,
    right,
    common: lineage.subjects
      .map((subject) => subject.id)
      .filter((id) => !touched.has(id))
      .sort(compareCodeUnits),
    differences,
  };
};

const requireValidLineage = (lineage: IAutoMovieDesignLineage): void => {
  const validated = validateDesignLineage({ lineage });
  if (validated.success === false) {
    const first = validated.violations[0]!;
    throw new Error(
      `design lineage "${lineage.id}" is invalid at ${first.path}: ${first.expected}`,
    );
  }
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
