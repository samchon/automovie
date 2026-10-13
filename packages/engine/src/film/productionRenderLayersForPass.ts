import { AutoMovieGuidePass } from "@automovie/interface";

/**
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
 *
 * @param frame The sampled film frame, layers in outgoing-then-incoming order.
 * @param pass The render pass being drawn.
 * @returns New layers for the pass: all of them for beauty, one otherwise.
 *
 * @evidence contracts/common.md#principled-implementation Beauty composites by weight because colour is linear in the blend, while a guide pass selects the argmax-weight layer because labels and geometric fields are not; the `>=` fold makes the later layer win ties, which relies on the frame sampler's outgoing-then-incoming order.
 * @evidence contracts/common.md#clear-and-simple-design One pass-to-layers rule shared by the viewer's frame renderer, the production render job and the semantic mask evidence, so the frame drawn and the frame checked select the same shot.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every guide pass follows the same selection; nothing is special-cased by pass, shot or transition kind.
 * @evidence contracts/common.md#meaningful-documentation States the beauty rule, the guide-pass rule and why blending is wrong there, the tie rule and the ordering it relies on, the deep copy and why, and the empty-list failure.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the layer count, at most two for a dissolve: one fold for the argmax and one clone per returned layer, with no intermediate copy of the list.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure selection for one frame and one pass that coordinates no work across calls; copies are deliberate so passes never share a mutable layer.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the caller owns the returned copies, at most the frame's layer count.
 */
export const productionRenderLayersForPass = <Layer extends { weight: number }>(
  frame: { layers: readonly Layer[] },
  pass: AutoMovieGuidePass,
): Array<Omit<Layer, "weight"> & { weight: number }> => {
  if (pass === "beauty")
    return frame.layers.map((layer: Layer): Layer => structuredClone(layer));
  const selected: Layer = frame.layers.reduce(
    (held: Layer, candidate: Layer): Layer =>
      candidate.weight >= held.weight ? candidate : held,
  );
  return [{ ...structuredClone(selected), weight: 1 }];
};
