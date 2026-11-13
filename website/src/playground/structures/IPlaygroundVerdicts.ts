/**
 * The physical bounds a performance breaks, as the package's `HumanVerdicts`
 * reports them.
 */
export interface IPlaygroundVerdicts {
  /** Whether every bound holds. */
  clean: boolean;

  /** The package's one-line description of the whole report. */
  text: string;

  /** The bounds that do not hold. */
  findings: IPlaygroundVerdicts.IFinding[];
}
export namespace IPlaygroundVerdicts {
  /** One bound that does not hold. */
  export interface IFinding {
    /** The bound's name. */
    check: string;

    /** The performer, or `a+b` for a bound between two. */
    subject: string;

    /** The action the reading lies in; empty when it lies in none. */
    act: string;

    /** Which occurrence of that action, from 1; 0 when `act` is empty. */
    instance: number;

    /** The reading. */
    value: number;

    /** The limit it exceeds. */
    limit: number;

    /** The film second of the reading. */
    seconds: number;

    /** What the reading is of. */
    where: string;
  }
}
