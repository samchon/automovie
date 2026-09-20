import { IAutoMovieSemanticMask, IAutoMovieSemanticMaskEntry } from "@automovie/interface";

/**
 * Index a mask by the scene node ids that draw each entry.
 *
 * The viewer holds objects, not semantics; this is the join it uses. Built as
 * one map rather than searched per mesh, because a structural pass touches
 * every drawable in the scene once per frame.
 *
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Joins each renderer node name to the semantic entry whose colour it must paint.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Supplies the per-drawable lookup that projects semantic identities into the structural mask channel.
 */
export const autoMovieSemanticMaskNodeIndex = (
  mask: IAutoMovieSemanticMask,
): Map<string, IAutoMovieSemanticMaskEntry> => {
  const index = new Map<string, IAutoMovieSemanticMaskEntry>();
  for (const entry of mask.entries) {
    for (const node of entry.nodes) index.set(node, entry);
    // An instance set's viewer group carries the entry's own id as its name,
    // so the same index resolves batched geometry without a second lookup.
    if (entry.kind === "instance-set") index.set(entry.id, entry);
  }
  return index;
};
