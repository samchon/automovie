import { markHumanSourceSide } from "./markHumanSourceSide.ts";
import type { IHumanSourceGenerationSkin } from "./structures/IHumanSourceGenerationSkin.ts";

/**
 * Flag the original skin vertices that belong to the head partition alone:
 * touched by a head triangle and by no body triangle. Vertices inserted by the
 * neck cut are never flagged.
 */
export function markHumanSourceHeadOnly(
  skin: IHumanSourceGenerationSkin,
): Uint8Array {
  const head = markHumanSourceSide(skin, 0);
  const body = markHumanSourceSide(skin, 1);
  return head.map((flag, x) => (flag === 1 && body[x] === 0 ? 1 : 0));
}
