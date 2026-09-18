import { AutoMovieContentDigest, IAutoMovieSemanticMask } from "@automovie/interface";
import { autoMovieRenderDigest } from "./autoMovieRenderDigest";
import { compareAutoMovieRenderIds } from "./compareAutoMovieRenderIds";

/**
 * Return the digest of one mask's complete canonical payload.
 *
 * Every semantic field participates, while collection order does not. Entries,
 * their node joins, and bounded-palette gaps are sorted by their stable ids
 * before an explicit-field-order JSON document is hashed. The self-declared
 * digest is deliberately absent from that document.
 *
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Binds the complete stable owner, instance, and drawable mapping behind an identity-mask product.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Makes the versioned semantic dependency closure, rather than an abbreviated palette row, determine product identity.
 */
export const digestAutoMovieSemanticMask = (
  mask: Omit<IAutoMovieSemanticMask, "digest">,
): AutoMovieContentDigest =>
  autoMovieRenderDigest(JSON.stringify(canonicalSemanticMaskPayload(mask)));

/** Complete mask payload in its one portable field and collection order. */
const canonicalSemanticMaskPayload = (
  mask: Omit<IAutoMovieSemanticMask, "digest">,
): Omit<IAutoMovieSemanticMask, "digest"> => ({
  version: mask.version,
  protocol: mask.protocol,
  background: mask.background,
  entries: [...mask.entries]
    .sort((left, right) => compareAutoMovieRenderIds(left.id, right.id))
    .map((entry) => ({
      id: entry.id,
      kind: entry.kind,
      label: entry.label,
      color: entry.color,
      owner: entry.owner,
      nodes: [...entry.nodes].sort(compareAutoMovieRenderIds),
      slot:
        entry.slot === null
          ? null
          : {
              instanceSet: entry.slot.instanceSet,
              index: entry.slot.index,
            },
    })),
  unaddressed: [...mask.unaddressed]
    .sort((left, right) =>
      compareAutoMovieRenderIds(left.instanceSet, right.instanceSet),
    )
    .map((gap) => ({
      instanceSet: gap.instanceSet,
      slots: gap.slots,
      reason: gap.reason,
      remedy: gap.remedy,
    })),
});
