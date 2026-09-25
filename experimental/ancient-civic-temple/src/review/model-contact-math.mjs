/** Geometric distances used by the prose contact audit; every input is metres. */

/** @param {number} plateRadius @param {number} plateY @param {number} pinRadius @param {number} pinY */
export const pinPlateRadialMargin = (plateRadius, plateY, pinRadius, pinY) =>
  plateRadius + pinRadius - Math.abs(pinY - plateY);

/**
 * The imbrex has semicircular tube feet of finite thickness. Both complete
 * radial bands must have positive width inside the adjacent raised ribs.
 * @param {number} centre @param {number} outer @param {number} thickness
 * @param {[number, number]} leftRib @param {[number, number]} rightRib
 */
export const imbrexFootMargin = (centre, outer, thickness, leftRib, rightRib) => {
  const inner = outer - thickness;
  if (inner <= 0) return -Infinity;
  return Math.min(
    centre - outer - leftRib[0],
    leftRib[1] - (centre - inner),
    centre + inner - rightRib[0],
    rightRib[1] - (centre + outer),
  );
};

/** @param {number} sheetY @param {number} sheetZ @param {number} rollY @param {number} rollZ @param {number} radius */
export const rollSheetGap = (sheetY, sheetZ, rollY, rollZ, radius) =>
  Math.hypot(sheetY - rollY, sheetZ - rollZ) - radius;

/** @param {number} datum @param {number} tileThickness @param {number} footX @param {number} angleDegrees */
export const ridgeFootGap = (datum, tileThickness, footX, angleDegrees) => {
  const angle = angleDegrees * Math.PI / 180;
  return datum - (tileThickness / Math.cos(angle) - footX * Math.tan(angle));
};

/** @param {number} battenBottom @param {number} battenHeight @param {number} strapCentre @param {number} strapHeight */
export const strapBattenVerticalMargin = (battenBottom, battenHeight, strapCentre, strapHeight) =>
  Math.min(strapCentre + strapHeight / 2, battenBottom + battenHeight) -
  Math.max(strapCentre - strapHeight / 2, battenBottom);
