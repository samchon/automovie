/** A finite scalar which remains finite when transferred to Rapier's f32 boundary. */
export function isPhysicalNativeNumber(value: number): boolean {
  return Number.isFinite(value) && Number.isFinite(Math.fround(value));
}
