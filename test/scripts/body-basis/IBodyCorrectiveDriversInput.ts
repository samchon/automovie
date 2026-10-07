import type { IBodyCorrectiveState } from "./IBodyCorrectiveState";
import type { IBodyCorrectiveAxis } from "./IBodyCorrectiveAxis";
import type { readBodyCorrectiveShoulderMotion } from "./readBodyCorrectiveShoulderMotion";

/** Conditional driver authority for one actual solver visit. */
export interface IBodyCorrectiveDriversInput {
  state: IBodyCorrectiveState;
  macros: ReadonlySet<string>;
  axes: readonly IBodyCorrectiveAxis[];
  shoulderMotion: ReturnType<typeof readBodyCorrectiveShoulderMotion>;
  /** Joint-path onset and full fractions. */
  onset: number;
  full: number;
  /** Shape-path onset and full fractions. */
  from: number;
  to: number;
}
