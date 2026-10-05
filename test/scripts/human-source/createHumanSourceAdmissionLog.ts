import type { IHumanSourceAdmissionLog } from "./structures/IHumanSourceAdmissionLog.ts";

/**
 * Start an admission record. An attempt that throws is recorded as refused
 * with the builder's message, so a refusal is evidence rather than a crash.
 */
export function createHumanSourceAdmissionLog(): IHumanSourceAdmissionLog {
  const cases: IHumanSourceAdmissionLog["cases"] = [];
  return {
    cases,
    attempt: (name, run) => {
      const started = Date.now();
      try {
        cases.push({ name, admitted: true, result: run(), milliseconds: Date.now() - started });
      } catch (error) {
        cases.push({ name, admitted: false, result: String(error instanceof Error ? error.message : error), milliseconds: Date.now() - started });
      }
    },
  };
}
