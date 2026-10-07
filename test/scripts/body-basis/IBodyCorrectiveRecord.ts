import type { IBodyCorrectiveCrossing } from "./IBodyCorrectiveCrossing";

/** What one actual solver visit found and did, without anatomy acceptance. */
export interface IBodyCorrectiveRecord {
  group: string;
  state: string;
  /** Legacy key for the dimensionless joint-path fraction. */
  angle: number;
  /** Shape-path fraction, dimensionless. */
  weight: number;
  outcome: string;
  crossing: IBodyCorrectiveCrossing | null;
  /** Actual elapsed milliseconds. */
  ms: number;
}
