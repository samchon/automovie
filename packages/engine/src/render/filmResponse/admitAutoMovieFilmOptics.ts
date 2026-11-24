import type { IAutoMovieFilmOptics } from "@automovie/interface";

/**
 * Admit a film's camera response for one drawn second, or throw an error naming
 * the second and the first field it refuses.
 *
 * Checks every range {@link IAutoMovieFilmOptics} states: a finite `ev100`; a
 * `toneMapping` of `"none"` or `"acesFilmic"`; a `whiteBalance` within [1667,
 * 25000] K, the range of the Planckian approximation it is adapted from; a
 * `glare.strength` within [0, 0.2]; and a `grade` whose slope, offset and
 * saturation are finite and whose powers are finite and above zero; a `samples`
 * that is a safe integer of at least 2 and present exactly when a `shutter` or
 * a `lens` is; a `shutter.angle` within (0, 360]; and a `lens` whose `fNumber`
 * and `focusDistance` are finite and above zero. The draw host calls it before
 * every beauty draw that has optics, because a film returns its optics per
 * second and a value can go wrong at any one of them; it reads the value once
 * and returns nothing.
 */
export function admitAutoMovieFilmOptics(
  optics: IAutoMovieFilmOptics,
  seconds: number,
): void {
  const refuse: (field: string, rule: string, value: unknown) => never = (
    field: string,
    rule: string,
    value: unknown,
  ): never => {
    throw new Error(
      `Film optics at ${seconds} s: ${field} must be ${rule}, got ${String(value)}`,
    );
  };
  if (!Number.isFinite(optics.ev100)) refuse("ev100", "finite", optics.ev100);
  if (optics.toneMapping !== "none" && optics.toneMapping !== "acesFilmic")
    refuse("toneMapping", `"none" or "acesFilmic"`, optics.toneMapping);
  if (
    optics.whiteBalance !== undefined &&
    !(
      Number.isFinite(optics.whiteBalance) &&
      optics.whiteBalance >= 1667 &&
      optics.whiteBalance <= 25000
    )
  )
    refuse("whiteBalance", "within [1667, 25000] K", optics.whiteBalance);
  if (optics.glare !== undefined) {
    const strength: number = optics.glare.strength;
    if (!(Number.isFinite(strength) && strength >= 0 && strength <= 0.2))
      refuse("glare.strength", "within [0, 0.2]", strength);
  }
  if (optics.grade !== undefined) {
    const grade: IAutoMovieFilmOptics.IGrade = optics.grade;
    for (const name of ["slope", "offset", "power"] as const) {
      const channels: [number, number, number] = grade[name];
      channels.forEach((value: number, index: number): void => {
        if (!Number.isFinite(value) || (name === "power" && value <= 0))
          refuse(
            `grade.${name}[${index}]`,
            name === "power" ? "finite and above zero" : "finite",
            value,
          );
      });
    }
    if (!Number.isFinite(grade.saturation))
      refuse("grade.saturation", "finite", grade.saturation);
  }

  // Accumulation: samples exist exactly to integrate a shutter or a lens.
  const sampled: boolean =
    optics.shutter !== undefined || optics.lens !== undefined;
  if (optics.samples === undefined) {
    if (optics.shutter !== undefined)
      refuse("samples", "set when shutter is present", optics.samples);
    if (optics.lens !== undefined)
      refuse("samples", "set when lens is present", optics.samples);
  } else {
    if (!sampled)
      refuse("samples", "absent without a shutter or a lens", optics.samples);
    if (!(Number.isSafeInteger(optics.samples) && optics.samples >= 2))
      refuse("samples", "a safe integer of at least 2", optics.samples);
  }
  if (optics.shutter !== undefined) {
    const angle: number = optics.shutter.angle;
    if (!(Number.isFinite(angle) && angle > 0 && angle <= 360))
      refuse("shutter.angle", "within (0, 360] degrees", angle);
  }
  if (optics.lens !== undefined)
    for (const name of ["fNumber", "focusDistance"] as const) {
      const value: number = optics.lens[name];
      if (!(Number.isFinite(value) && value > 0))
        refuse(`lens.${name}`, "finite and above zero", value);
    }
}
