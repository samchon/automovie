import type { IHumanSourceCrownAffineFrame } from "./structures/IHumanSourceCrownAffineFrame.ts";

/** One source affine formula for neutral coefficients and every endpoint vector. */
export function createHumanSourceCrownAffineMatrix(frame: IHumanSourceCrownAffineFrame, scales: readonly number[]): number[] {
  const directions = [frame.widthAxis, frame.depthAxis, frame.heightAxis];
  const matrix = Array.from({ length: 9 }, (_, at) => at % 4 === 0 ? 1 : 0);
  for (let component = 0; component < 3; component++) {
    const scale = scales[frame.parameterIndices[component]];
    if (!(scale > 0) || !Number.isFinite(scale)) throw new Error("Source crown affine scale is not positive finite.");
    for (let row = 0; row < 3; row++) for (let column = 0; column < 3; column++)
      matrix[3 * row + column] += (scale - 1) * directions[component][row] * directions[component][column];
  }
  const [a,b,c,d,e,f,g,h,i] = matrix;
  const determinant = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  if (!(determinant > 0) || !Number.isFinite(determinant) || matrix.some((value) => !Number.isFinite(value)))
    throw new Error("Source crown affine matrix lost positive Jacobian at emitted arithmetic.");
  return matrix;
}
