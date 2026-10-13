import type { HumanViewerAddress } from "@automovie/viewer/human/inspection/HumanViewerAddress";

/**
 * The address after one part is switched into or out of the isolated set
 * (`parts`, only these are shown) or the hidden set (`hide`, these are not).
 * A part is listed once, in the order it was chosen; switching a part off
 * removes it and an empty set means no restriction. The rest of the address,
 * the camera included, is kept, so the frame changes only by that part.
 *
 * @evidence contracts/common.md#principled-implementation Removing the selected name before optional append gives one occurrence and preserves every unrelated address field.
 * @evidence contracts/common.md#clear-and-simple-design One copied address update serves isolated and hidden sets with the same chosen-order rule.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Part names are caller data; the update neither changes numerical document values nor special-cases a named anatomy or fixture.
 * @evidence contracts/common.md#meaningful-documentation Defines the two set meanings, empty restriction, uniqueness, order and retained camera state.
 */
export function changeHumanViewerParts(
  address: HumanViewerAddress,
  name: string,
  set: "parts" | "hide",
  on: boolean,
): HumanViewerAddress {
  const others = address[set].filter((part) => part !== name);
  return { ...address, [set]: on ? [...others, name] : others };
}
