import { IAutoMovieSemanticMask } from "@automovie/interface";

import { compareAutoMovieRenderIds } from "./compareAutoMovieRenderIds";

/*
 * Project the complete current semantic payload into one field/collection
 * order.
 */
export function canonicalAutoMovieSemanticMaskPayload(
  mask: Omit<IAutoMovieSemanticMask, "digest">,
): Omit<IAutoMovieSemanticMask, "digest"> {
  return {
    version: mask.version,
    protocol: mask.protocol,
    background: mask.background,
    entries: [...mask.entries]
      .sort(
        (
          left: IAutoMovieSemanticMask["entries"][number],
          right: IAutoMovieSemanticMask["entries"][number],
        ): number => compareAutoMovieRenderIds(left.id, right.id),
      )
      .map(
        (
          entry: IAutoMovieSemanticMask["entries"][number],
        ): IAutoMovieSemanticMask["entries"][number] => ({
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
        }),
      ),
    unaddressed: [...mask.unaddressed]
      .sort(
        (
          left: IAutoMovieSemanticMask["unaddressed"][number],
          right: IAutoMovieSemanticMask["unaddressed"][number],
        ): number =>
          compareAutoMovieRenderIds(left.instanceSet, right.instanceSet),
      )
      .map(
        (
          gap: IAutoMovieSemanticMask["unaddressed"][number],
        ): IAutoMovieSemanticMask["unaddressed"][number] => ({
          instanceSet: gap.instanceSet,
          slots: gap.slots,
          reason: gap.reason,
          remedy: gap.remedy,
        }),
      ),
  };
}
