import type { IAutoMovieFluidDomain } from "@automovie/interface";

/*
 * The domain's gravity-wave Courant expression `dt * sqrt(g * H) * sqrt(1/dx² +
 * 1/dz²)`, with H the solver's design referenceDepth.
 *
 * `validateFluidDomain` compares this number with `1` at the declared design
 * depth, and `fluidDomainBudget` reports it without admission. Initial depth is
 * checked against that design depth, but later inflow can exceed it without
 * another Courant check.
 *
 * The direct operation order retains the ordinary stability boundary. Scale
 * extreme positive finite operands before multiplying so a representable
 * result survives underflow or overflow of individual products.
 */
export function fluidCourantNumber(domain: IAutoMovieFluidDomain): number {
  const { fixedStepSeconds: dt, gravity, referenceDepth } = domain.solver;
  const { cellX, cellZ } = domain.grid;
  const minimum: number = Math.min(dt, gravity, referenceDepth, cellX, cellZ);
  const maximum: number = Math.max(dt, gravity, referenceDepth, cellX, cellZ);
  // At most three powers of this input scale contribute to the expression.
  // This range keeps the direct intermediate products and quotients normal.
  const directLimit: number = 2 ** 128;
  if (
    !(minimum > 0) ||
    !Number.isFinite(maximum) ||
    (minimum >= 1 / directLimit && maximum <= directLimit)
  )
    return (
      dt *
      Math.sqrt(gravity * referenceDepth) *
      Math.sqrt(1 / (cellX * cellX) + 1 / (cellZ * cellZ))
    );

  // Factor the reciprocal norm by the shortest cell side. The remaining
  // directional factor lies between one and sqrt(2).
  const shortest: number = Math.min(cellX, cellZ);
  const longest: number = Math.max(cellX, cellZ);
  const rootGravity: number = Math.sqrt(gravity);
  const rootDepth: number = Math.sqrt(referenceDepth);
  const clockPower: number = binaryExponent(dt);
  const gravityPower: number = binaryExponent(rootGravity);
  const depthPower: number = binaryExponent(rootDepth);
  const spacingPower: number = binaryExponent(shortest);
  const wave: number =
    (dt / 2 ** clockPower) *
    (rootGravity / 2 ** gravityPower) *
    (rootDepth / 2 ** depthPower);
  const coefficient: number =
    (wave / (shortest / 2 ** spacingPower)) * Math.hypot(1, shortest / longest);

  // Restore the combined scale in two powers to retain subnormal results.
  const exponent: number = clockPower + gravityPower + depthPower - spacingPower;
  const shift: number = Math.max(-1022, Math.min(1023, exponent));
  return coefficient * 2 ** (exponent - shift) * 2 ** shift;
}

/* Number.MAX_VALUE rounds to 1024 under log2, where the power would overflow. */
function binaryExponent(value: number): number {
  return Math.min(1023, Math.floor(Math.log2(value)));
}
