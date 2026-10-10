/** Host source and loopback bindings for its isolated numerical sessions. @author Samchon */
export interface ICreateHumanViewerNodeServiceProps {
  /** Origin of this resident viewer's unchanged digest-checked data routes. */
  origin: string;

  /** Directory containing the maintained Node numerical entry. */
  directory: string;

  /** Current source identity, reread rather than stored across an edit. */
  revision: () => string;

  /** Actual code/config membership and byte witnesses. */
  inputs: () => Record<string, string>;
}
