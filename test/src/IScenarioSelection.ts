/**
 * An admitted command-line request retains include and exclude terms in their original occurrence order, including duplicates; an empty include list means all discovered basenames before exclusions.
 *
 * @author Samchon
 */
export interface IScenarioSelection {
  /** Ordered nonblank include substrings matched against discovered module basenames. */
  include: string[];

  /** Ordered nonblank exclude substrings, each required to match some discovered module basename. */
  exclude: string[];
}
