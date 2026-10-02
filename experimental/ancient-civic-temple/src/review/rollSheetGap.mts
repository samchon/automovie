/** Signed metre gap between a circular roll and the sheet corner in shared YZ. */
export const rollSheetGap = (sheetY: number, sheetZ: number, rollY: number, rollZ: number, radius: number) =>
  Math.hypot(sheetY - rollY, sheetZ - rollZ) - radius;
