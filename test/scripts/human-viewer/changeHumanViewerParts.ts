import type { HumanViewerAddress } from "./HumanViewerAddress";

/**
 * The address after one part is switched into or out of the isolated set
 * (`parts`, only these are shown) or the hidden set (`hide`, these are not).
 * A part is listed once, in the order it was chosen; switching a part off
 * removes it and an empty set means no restriction. The rest of the address,
 * the camera included, is kept, so the frame changes only by that part.
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
