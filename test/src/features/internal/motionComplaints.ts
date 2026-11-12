import { TestValidator } from "@nestia/e2e";

/**
 * The complaints of a swept test, gathered so that one run names every cell
 * of the sweep that fails instead of stopping at the first.
 *
 * A test over bodies, sides, seeds and parameters checks the same
 * specification in every cell. `TestValidator` throws at the first failure,
 * which would hide the other cells, so a swept test records each failed
 * expectation with its cell and its measured numbers here and asserts once,
 * at its end, that nothing was recorded.
 *
 * @returns The gatherer.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States why failures are gathered and when the one assertion is made.
 * @evidence contracts/development/implementation.md#principled-implementation Each expectation is recorded with its label when it does not hold; the final assertion compares the record with the empty list, so its message lists every failed cell.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One list and four small closures over it.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A refusal that does not throw is recorded like any other failure; nothing is swallowed.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work per expectation.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A recorder coordinates no work.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The list lives as long as the test holds the gatherer.
 */
export function motionComplaints(): motionComplaints.IGatherer {
  const list: string[] = [];
  return {
    list,
    check: (label: string, holds: boolean): void => {
      if (!holds) list.push(label);
    },
    equals: (label: string, actual: unknown, expected: unknown): void => {
      const a: string = JSON.stringify(actual);
      const e: string = JSON.stringify(expected);
      if (a !== e) list.push(`${label}: got ${a}, expected ${e}`);
    },
    refuses: (label: string, task: () => unknown): void => {
      try {
        task();
      } catch {
        return;
      }
      list.push(`${label}: did not throw`);
    },
    assert: (title: string): void => {
      TestValidator.equals(title, list, []);
    },
  };
}

/** Companion types of {@link motionComplaints}. */
export namespace motionComplaints {
  /**
   * A gatherer of failed expectations.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states what it records.
   * @evidence contracts/development/design.md#principled-representation The record and the three kinds of expectation a swept test makes, with the one assertion over the record.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five members, all used by the swept motion tests.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A failure is its label with its numbers, not a count.
   */
  export interface IGatherer {
    /** Every failed expectation so far. */
    list: string[];

    /** Records the label when the condition does not hold. */
    check: (label: string, holds: boolean) => void;

    /** Records the label with both values when they differ as JSON. */
    equals: (label: string, actual: unknown, expected: unknown) => void;

    /** Records the label when the task does not throw. */
    refuses: (label: string, task: () => unknown) => void;

    /** Asserts that nothing was recorded. */
    assert: (title: string) => void;
  }
}
