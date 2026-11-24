import { type AutoMovieArchetype, AutoMovieArchetypeRefusal } from "../core";
import { createBow } from "./createBow";

/**
 * The provisional speed from the bow prototype's declared stroke-energy law:
 * what `createBow.launchSpeed` gives. Its reference numbers are reinterpreted
 * stroke factors, as createBow.KOOI documents; this is not native-q or measured
 * force-draw reconstruction.
 *
 * @param bow The bow.
 * @param mass The arrow's finite positive mass, kilograms.
 * @param travel The finite string travel from brace, metres, inside its stroke;
 *   0 gives no speed.
 * @returns The finite speed, metres per second; representational underflow can
 *   give zero.
 * @throws {AutoMovieArchetypeRefusal} For invalid mass, draw weight, string
 *   stroke or travel, an unread draw weight, or unrepresentable launch
 *   arithmetic.
 */
export function bowLaunchSpeed(
  bow: AutoMovieArchetype<createBow.Affordance, createBow.Dimension>,
  mass: number,
  travel: number,
): number {
  if (!(mass > 0))
    refuse(
      "mass",
      mass,
      "an arrow needs finite positive mass",
      "give the arrow's mass in kilograms above zero",
    );
  const draw: number | undefined = bow.dimensions.draw;
  if (draw === undefined)
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype: bow.archetype,
      axis: "draw",
      value: bow.name,
      reason: `no source read gives the ${bow.name}'s draw weight, so its stored energy is unknown`,
      fix: "launch from a bow whose draw weight is read",
    });
  if (!(draw > 0))
    refuse(
      "draw",
      draw,
      "the bow needs a finite positive draw force",
      "give a sourced positive draw weight in newtons",
    );
  const stroke: number | undefined = bow.affordance("string").travel;
  if (!(stroke !== undefined && stroke > 0))
    refuse(
      "string",
      stroke,
      "the bow needs a finite positive string stroke",
      "declare the string's positive travel in metres",
    );
  if (!(travel >= 0 && travel <= stroke))
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype: bow.archetype,
      axis: "travel",
      value: travel,
      feasible: { kind: "range", minimum: 0, maximum: stroke, unit: "m" },
      reason: "a launch needs finite string travel inside the bow's stroke",
      fix: "give a travel from brace through the declared full draw",
    });

  // A longbow's and a crossbow's straight limbs take the straight-end bow's factor, a crossbow's provisionally.
  const q: number =
    bow.name === "longbow" || bow.name === "crossbow"
      ? createBow.KOOI.straight
      : createBow.KOOI.recurve;
  if (travel === 0) return 0;
  const share: number = travel / stroke;
  const stored: number = q * draw * stroke * share ** (1 / q);
  const virtual: number =
    (createBow.KOOI.arrow * (1 - createBow.KOOI.efficiency)) /
    createBow.KOOI.efficiency;
  const squared: number = (2 * stored) / (mass + virtual);
  const speed: number = Math.sqrt(squared);

  // The least normal binary64 value marks lost energy precision, not a physical draw cutoff.
  const result: number =
    stored < 2 ** -1022 || squared < 2 ** -1022
      ? Math.exp(
          (Math.log(2 * q) +
            Math.log(draw) +
            Math.log(stroke) -
            Math.log(mass + virtual)) /
            2 +
            (Math.log(travel) - Math.log(stroke)) / (2 * q),
        )
      : speed;
  return result;

  /** Keep invalid physical inputs in the public structured refusal contract. */
  function refuse(
    axis: string,
    value: number | undefined,
    reason: string,
    fix: string,
  ): never {
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype: bow.archetype,
      axis,
      value,
      reason,
      feasible: null,
      fix,
    });
  }
}
