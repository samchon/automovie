import { IAutoMovieSemanticMaskEntry, IAutoMovieSemanticMaskSlot, IAutoMovieSemanticMaskGap, IAutoMovieSemanticMask } from "@automovie/interface";
import { renderSemanticMaskPayload } from "./renderSemanticMaskPayload";
import { sealSemanticMaskUnchecked } from "./sealSemanticMaskUnchecked";
import { renameSemanticMaskKey } from "./renameSemanticMaskKey";
/** Return the original eight unknown or missing v2 key cases at mask, entry, slot and gap boundaries with their original addressed refusal substrings and production-projected digests. */
export const malformedCurrentSemanticMasks: (mask: IAutoMovieSemanticMask) => readonly (readonly [string, IAutoMovieSemanticMask, string])[] = (
  mask: IAutoMovieSemanticMask,
): ReadonlyArray<readonly [string, IAutoMovieSemanticMask, string]> => {
  const entry: IAutoMovieSemanticMaskEntry = mask.entries[1]!;
  const slot: IAutoMovieSemanticMaskSlot = entry.slot!;
  const gap: IAutoMovieSemanticMaskGap = mask.unaddressed[0]!;
  return [
    [
      "unknown root field",
      sealSemanticMaskUnchecked({ ...renderSemanticMaskPayload(mask), future: true }),
      "mask keys",
    ],
    [
      "missing root field",
      sealSemanticMaskUnchecked(renameSemanticMaskKey(renderSemanticMaskPayload(mask), "background", "backdrop")),
      "mask keys",
    ],
    [
      "unknown entry field",
      sealSemanticMaskUnchecked({
        ...renderSemanticMaskPayload(mask),
        entries: [{ ...mask.entries[0]!, future: true }, entry],
      }),
      "entry 0 keys",
    ],
    [
      "missing entry field",
      sealSemanticMaskUnchecked({
        ...renderSemanticMaskPayload(mask),
        entries: [renameSemanticMaskKey(mask.entries[0]!, "owner", "parent"), entry],
      }),
      "entry 0 keys",
    ],
    [
      "unknown slot field",
      sealSemanticMaskUnchecked({
        ...renderSemanticMaskPayload(mask),
        entries: [
          mask.entries[0]!,
          { ...entry, slot: { ...slot, future: true } },
        ],
      }),
      "entry 1 slot keys",
    ],
    [
      "missing slot field",
      sealSemanticMaskUnchecked({
        ...renderSemanticMaskPayload(mask),
        entries: [
          mask.entries[0]!,
          { ...entry, slot: renameSemanticMaskKey(slot, "index", "slot") },
        ],
      }),
      "entry 1 slot keys",
    ],
    [
      "unknown gap field",
      sealSemanticMaskUnchecked({
        ...renderSemanticMaskPayload(mask),
        unaddressed: [{ ...gap, future: true }, ...mask.unaddressed.slice(1)],
      }),
      "gap 0 keys",
    ],
    [
      "missing gap field",
      sealSemanticMaskUnchecked({
        ...renderSemanticMaskPayload(mask),
        unaddressed: [
          renameSemanticMaskKey(gap, "remedy", "resolution"),
          ...mask.unaddressed.slice(1),
        ],
      }),
      "gap 0 keys",
    ],
  ];
};
