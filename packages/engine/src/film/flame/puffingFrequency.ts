/**
 * Puffing frequency of a buoyant pool fire, `f = 1.5 D^(−1/2)` in hertz for a
 * fuel bed of diameter `D` in metres (Cetegen and Ahmed, "Experiments on the
 * periodic instability of buoyant plumes and pool fires", Combustion and Flame
 * 93, 1993): 0.5 m gives 2.12 Hz.
 */
export function puffingFrequency(diameter: number): number {
  return 1.5 / Math.sqrt(diameter);
}
