/*
 * Heskestad's mean luminous flame height of a turbulent diffusion flame, `L =
 * 0.235 Q^(2/5) − 1.02 D`, in metres, for a heat release rate `Q` in kW over a
 * fuel bed of diameter `D` in metres (Heskestad, "Luminous heights of turbulent
 * diffusion flames", Fire Safety Journal 5, 1983).
 *
 * The correlation is fitted to pool and burner fires; it can come out zero or
 * negative for a small fire on a wide bed (5 kW on 0.5 m gives −0.063 m), which
 * flame admission refuses rather than drawing.
 */
export function heskestadFlameHeight(
  heatRelease: number,
  diameter: number,
): number {
  return 0.235 * Math.pow(heatRelease, 0.4) - 1.02 * diameter;
}
