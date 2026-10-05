import type { IHumanSourceAdmissionCase } from "./IHumanSourceAdmissionCase.ts";

/**
 * The admission run's record: every attempt in order, and the one way to add
 * an attempt, which times it and keeps a refusal's message as its result.
 *
 * @author Samchon
 */
export interface IHumanSourceAdmissionLog {
  /** Attempts in the order they ran. */
  cases: IHumanSourceAdmissionCase[];

  /** Run one attempt and record whether the builder admitted it. */
  attempt: (name: string, run: () => string) => void;
}
