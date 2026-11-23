import { createProjectile } from "./createProjectile";

/**
 * A projectile's flight data for its body, which `createProjectile.flight`
 * gives: its drag, its restitution where it bounces or rolls, and its embedding
 * where it sticks, each only where `createProjectile.FLIGHT` read it.
 *
 * @param kind A launched kind; a cartridge, loaded and never launched, has no
 *   flight data.
 * @param model The read object, where the kind has one.
 * @param radius The sphere's or the shaft's radius, metres, whose cross-section
 *   is the drag's reference area.
 * @returns The body's flight data, for `AutoMovieArchetypeBuilder.build`.
 */
export function projectileFlight(
  kind: Exclude<createProjectile.Kind, "cartridge">,
  model: createProjectile.Model | undefined,
  radius: number,
): {
  drag?: { coefficient: number; area: number };
  restitution?: number;
  outcome?: { embed?: number };
} {
  const flight: typeof createProjectile.FLIGHT = createProjectile.FLIGHT;
  const area: number = Math.PI * radius * radius;
  const embed: number | undefined =
    kind === "ball"
      ? flight.ballEmbed
      : kind === "arrow"
        ? flight.arrowEmbed
        : kind === "roundShot" && model !== undefined
          ? flight.shotEmbed[model]
          : undefined;
  return {
    ...(kind === "bolt"
      ? {}
      : {
          drag: {
            coefficient: kind === "arrow" ? flight.arrow : flight.sphere,
            area,
          },
        }),
    ...(createProjectile.OUTCOME[kind] === "stick"
      ? {}
      : { restitution: flight.ground }),
    ...(embed === undefined ? {} : { outcome: { embed } }),
  };
}
