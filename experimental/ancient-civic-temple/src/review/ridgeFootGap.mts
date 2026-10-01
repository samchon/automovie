/** Metre clearance of a ridge foot from the tile top at a degree-valued pitch. */
export const ridgeFootGap = (datum: number, tileThickness: number, footX: number, angleDegrees: number) => {
  const angle = angleDegrees * Math.PI / 180;
  return datum - (tileThickness / Math.cos(angle) - footX * Math.tan(angle));
};
