import { type AutoMovieArchetype, AutoMovieArchetypeRefusal } from "../core";
import { createBow } from "./createBow";

/**
 * The provisional speed from the bow prototype's declared stroke-energy law: what `createBow.launchSpeed` gives. Its reference numbers are reinterpreted stroke factors, as createBow.KOOI documents; this is not native-q or measured force-draw reconstruction.
 *
 * @param bow The bow.
 * @param mass The arrow's finite positive mass, kilograms.
 * @param travel The finite string travel from brace, metres, inside its stroke; 0 gives no speed.
 * @returns The finite speed, metres per second; representational underflow can give zero.
 * @throws {AutoMovieArchetypeRefusal} For invalid mass, draw weight, string stroke or travel, an unread draw weight, or unrepresentable launch arithmetic.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the inputs' admitted ranges, units, brace zero, numerical underflow and explicit refusal cases.
 * @evidence contracts/development/implementation.md#principled-implementation Kooi's energy balance, `A = (m + K) v^2 / 2` (eq. 3.89, p. 77), with `A` the stored energy, the draw-force curve's integral from brace to the travel, and `K` the virtual mass of limbs and string, `m0 (1 - eta) / eta` from his efficiency `eta` at his arrow mass `m0` (eq. 3.90). The authored prototype curve is the one-parameter power law `F (x / X)^p` whose full-stroke energy is the prototype's stroke factor `q` times `F X`, `p = 1 / q - 1`, so `A(x) = q F X (x / X)^(1 / q)`; the source's native q instead normalizes by full draw D, so reusing its number for stroke X is an explicit uncalibrated prototype assumption. The curve and borrowed efficiency are provisional. If energy, squared speed or the travel ratio loses representability, the identical positive speed law is evaluated in logarithms of the original force, stroke, mass and travel, exponentiating only the final speed.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit mass and source mechanics, admit travel, then compute the stored energy, virtual mass and speed.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Invalid or out-of-range inputs are refused rather than clamped, and unread draw weight stays unknown. Kooi shows the virtual mass is not constant across arrow masses (pp. 78, 123); it is held at his arrow's, provisional for others. No force, efficiency or travel limit is tuned to a speed band.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function bowLaunchSpeed(
  bow: AutoMovieArchetype<createBow.Affordance, createBow.Dimension>,
  mass: number,
  travel: number,
): number {
  if (!(Number.isFinite(mass) && mass > 0))
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
  if (!(Number.isFinite(draw) && draw > 0))
    refuse(
      "draw",
      draw,
      "the bow needs a finite positive draw force",
      "give a sourced positive draw weight in newtons",
    );
  const stroke: number | undefined = bow.affordance("string").travel;
  if (!(stroke !== undefined && Number.isFinite(stroke) && stroke > 0))
    refuse(
      "string",
      stroke,
      "the bow needs a finite positive string stroke",
      "declare the string's positive travel in metres",
    );
  if (!(Number.isFinite(travel) && travel >= 0 && travel <= stroke))
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
    !Number.isFinite(squared) || stored < 2 ** -1022 || squared < 2 ** -1022
      ? Math.exp(
          (Math.log(2 * q) +
            Math.log(draw) +
            Math.log(stroke) -
            Math.log(mass + virtual)) /
            2 +
            (Math.log(travel) - Math.log(stroke)) / (2 * q),
        )
      : speed;
  if (!Number.isFinite(result))
    refuse(
      "launch",
      result,
      "the launch arithmetic has no finite speed",
      "use mechanics whose energy and speed are representable",
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
