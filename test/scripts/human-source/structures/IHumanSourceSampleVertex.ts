/**
 * A source sample of the generation's subdivided skin: an original base-mesh
 * vertex keeps its index as its sample.
 *
 * @author Samchon
 */
export interface IHumanSourceSampleVertex {
  /** Discriminator. */
  kind: "source-sample";

  /** Source sample index. */
  sample: number;
}
