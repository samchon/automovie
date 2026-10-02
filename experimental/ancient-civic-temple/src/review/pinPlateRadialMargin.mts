/** Positive radial overlap of a plate and pin in their shared metre Y frame. */
export const pinPlateRadialMargin = (plateRadius: number, plateY: number, pinRadius: number, pinY: number) =>
  plateRadius + pinRadius - Math.abs(pinY - plateY);
