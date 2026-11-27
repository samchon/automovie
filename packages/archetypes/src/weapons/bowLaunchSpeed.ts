import { type AutoMovieArchetype, AutoMovieArchetypeRefusal } from "../core";
import { AutoMovieArchetypeBow } from "./AutoMovieArchetypeBow";

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
  bow: AutoMovieArchetype<AutoMovieArchetypeBow.Affordance, AutoMovieArchetypeBow.Dimension>,
  mass: number,
  travel: number,
): number {
  if (!(mass > 0 && mass < Infinity))
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
  if (!(draw > 0 && draw < Infinity))
    refuse(
      "draw",
      draw,
      "the bow needs a finite positive draw force",
      "give a sourced positive draw weight in newtons",
    );
  const stroke: number | undefined = bow.affordance("string").travel;
  if (!(stroke !== undefined && stroke > 0 && stroke < Infinity))
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
      ? AutoMovieArchetypeBow.KOOI.straight
      : AutoMovieArchetypeBow.KOOI.recurve;
  if (travel === 0) return 0;
  const share: number = travel / stroke;
  const force: number = q * draw;
  const full: number = force * stroke;
  const fraction: number = share ** (1 / q);
  const stored: number = full * fraction;
  const virtual: number =
    (AutoMovieArchetypeBow.KOOI.arrow * (1 - AutoMovieArchetypeBow.KOOI.efficiency)) /
    AutoMovieArchetypeBow.KOOI.efficiency;
  const squared: number = (2 * stored) / (mass + virtual);

  // A subnormal intermediate can lose precision even if a later factor
  // recovers its range. The least normal binary64 value is 2 to the -1022.
  const normal: number = 2 ** -1022;
  const result: number =
    force >= normal &&
    full >= normal &&
    fraction >= normal &&
    stored >= normal &&
    squared >= normal &&
    squared < Infinity
      ? Math.sqrt(squared)
      : Math.exp(
          (Math.log(2 * q) +
            Math.log(draw) +
            Math.log(stroke) -
            Math.log(mass + virtual)) /
            2 +
            (Math.log(travel) - Math.log(stroke)) / (2 * q),
        );
  if (!(result >= 0 && result < Infinity))
    refuse(
      "speed",
      result,
      "the sampled speed is outside the representable range",
      "use animation values with a representable speed",
    );
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
