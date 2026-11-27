import { isDenseFinite } from "./isDenseFinite";

/*
 * Resolve one segment's local [cubic, quadratic, derivative, value] powers.
 */
export function resolvePchipPowers(
  width: number,
  secant: number,
  value: number,
  startDerivative: number,
  endDerivative: number,
): [number, number, number, number] {
  const t: number = (startDerivative + endDerivative - 2 * secant) / width;
  const powers: [number, number, number, number] = [
    t / width,
    (secant - startDerivative) / width - t,
    startDerivative,
    value,
  ];
  if (!isDenseFinite(powers))
    throw new Error("Spline power coefficients must be finite");
  return powers;
}
