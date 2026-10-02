/** Signed intersection length of a strap and batten's closed metre Y intervals. */
export const strapBattenVerticalMargin = (battenBottom: number, battenHeight: number, strapCentre: number, strapHeight: number) =>
  Math.min(strapCentre + strapHeight / 2, battenBottom + battenHeight) -
  Math.max(strapCentre - strapHeight / 2, battenBottom);
