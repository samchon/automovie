import {
  AutoMovieGuidePass,
  type IAutoMovieProductionRenderLayersForPass,
} from "@automovie/interface";

/*
 * The layers one render pass draws for one film frame.
 *
 * Beauty is alpha-composited, so the `beauty` pass gets every layer with its
 * weight. A structural guide pass carries classifications or geometric fields,
 * where linearly blending pixels invents values no layer holds, so it gets only
 * the heaviest layer, with weight `1`; on an exact tie the later layer wins,
 * which is the incoming shot because `sampleProductionRenderFrame` lists the
 * outgoing layer first. Every result is a deep copy, so a caller mutating it
 * cannot alter the frame another pass reads. A guide pass over an empty layer
 * list throws a `TypeError`; a sampled film frame always has at least one.
 * Parameter frame: The sampled film frame, layers in outgoing-then-incoming order.
 * Parameter pass: The render pass being drawn.
 * Returns: New layers for the pass: all of them for beauty, one otherwise.
 */
export function productionRenderLayersForPass<Layer extends { weight: number }>(
  frame: IAutoMovieProductionRenderLayersForPass.IFrame<Layer>,
  pass: AutoMovieGuidePass,
): Array<Omit<Layer, "weight"> & { weight: number }> {
  if (pass === "beauty")
    return frame.layers.map((layer: Layer): Layer => structuredClone(layer));
  const selected: Layer = frame.layers.reduce(
    (held: Layer, candidate: Layer): Layer =>
      candidate.weight >= held.weight ? candidate : held,
  );
  return [{ ...structuredClone(selected), weight: 1 }];
}
