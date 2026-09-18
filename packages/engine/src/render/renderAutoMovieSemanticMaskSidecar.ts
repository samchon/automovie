import { IAutoMovieSemanticMask } from "@automovie/interface";
import { compareAutoMovieRenderIds } from "./compareAutoMovieRenderIds";
import { verifyAutoMovieSemanticMask } from "./verifyAutoMovieSemanticMask";

/**
 * Serialize one mask as the sidecar that travels beside the pixels: pretty
 * JSON, declared field order, one trailing newline.
 *
 * A mask frame is unreadable on its own. `#0A1B2C` is a door leaf only because
 * this document says so, so the palette has to leave the renderer with the
 * frames rather than be re-derived by whoever opens them later; a consumer that
 * re-derived it from a design that has since moved on would read yesterday's
 * colours off today's pixels. The bytes are the same convention the caption and
 * pose-keypoint sidecars use, so a host writes all three the same way.
 *
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Serializes the palette that makes each rendered mask colour resolvable to its semantic entity.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Produces the deterministic sidecar paired with the identity-mask frames.
 * @author Samchon
 */
export const renderAutoMovieSemanticMaskSidecar = (
  mask: IAutoMovieSemanticMask,
): string => {
  verifyAutoMovieSemanticMask(mask);
  return `${JSON.stringify(
    { ...canonicalSemanticMaskPayload(mask), digest: mask.digest },
    null,
    2,
  )}\n`;
};

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
