export const humanPreviewUnitVector = (v: readonly number[]): [number, number, number] => {
  const length = Math.hypot(v[0]!, v[1]!, v[2]!);
  if (!(length > 0)) throw new Error("A light direction needs a length.");
  return [v[0]! / length, v[1]! / length, v[2]! / length];
};
