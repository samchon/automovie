/**
 * One source-authored native boundary and its ordered connector.
 * Both paths address actual host vertices, not projected coordinate aliases.
 * Registration is an authored support convention, not observed histology.
 * @author Samchon
 */
export interface IHumanSourceMaterialBoundary {
  /** Closed boundary's native vertices, without repeating the first vertex. */
  loop: number[];

  /** Actual lower-to-upper native edge path of the plica connector. */
  connector: number[];
}
