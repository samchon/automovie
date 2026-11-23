import type { IAutoMovieFilmShading } from "@automovie/interface";

/**
 * Admit a film's indirect shading for one drawn second, or throw an error
 * naming the second and the first field it refuses.
 *
 * Checks every range {@link IAutoMovieFilmShading} states: `occlusion.radius`
 * finite and above zero; probe box corners finite with `max` at least `min`,
 * `spacing` finite and above zero, `layer` a safe integer within [1, 31] and
 * `revision` a string. A shading that asks for any member while the film has no
 * optics at that second is refused naming `optics`, because the occlusion
 * prepass and the probe cubes live in the optics' linear format. The draw host
 * calls it before every beauty draw of a scene with `shading`.
 *
 * @param shading The film's shading at the second.
 * @param seconds The drawn second.
 * @param optics Whether the film supplies optics at that second.
 */
export function admitAutoMovieFilmShading(
  shading: IAutoMovieFilmShading,
  seconds: number,
  optics: boolean,
): void {
  const refuse: (field: string, rule: string, value: unknown) => never = (
    field: string,
    rule: string,
    value: unknown,
  ): never => {
    throw new Error(
      `Film shading at ${seconds} s: ${field} must be ${rule}, got ${String(value)}`,
    );
  };
  if (typeof shading !== "object" || shading === null)
    refuse("shading", "an object", shading);
  if (shading.occlusion !== undefined) {
    if (!optics)
      refuse("optics", "present when shading has occlusion", undefined);
    const radius: unknown = shading.occlusion?.radius;
    if (!(typeof radius === "number" && Number.isFinite(radius) && radius > 0))
      refuse("occlusion.radius", "finite and above zero", radius);
  }
  if (shading.probes !== undefined) {
    if (!optics) refuse("optics", "present when shading has probes", undefined);
    const probes: IAutoMovieFilmShading.IProbes = shading.probes;
    for (const corner of ["min", "max"] as const)
      for (const axis of ["x", "y", "z"] as const) {
        const value: unknown = probes[corner]?.[axis];
        if (!(typeof value === "number" && Number.isFinite(value)))
          refuse(`probes.${corner}.${axis}`, "finite", value);
      }
    for (const axis of ["x", "y", "z"] as const)
      if (probes.max[axis] < probes.min[axis])
        refuse(`probes.max.${axis}`, "at least probes.min", probes.max[axis]);
    if (
      !(
        typeof probes.spacing === "number" &&
        Number.isFinite(probes.spacing) &&
        probes.spacing > 0
      )
    )
      refuse("probes.spacing", "finite and above zero", probes.spacing);
    if (
      !(
        Number.isSafeInteger(probes.layer) &&
        probes.layer >= 1 &&
        probes.layer <= 31
      )
    )
      refuse("probes.layer", "a safe integer within [1, 31]", probes.layer);
    if (typeof probes.revision !== "string")
      refuse("probes.revision", "a string", probes.revision);
  }
}
