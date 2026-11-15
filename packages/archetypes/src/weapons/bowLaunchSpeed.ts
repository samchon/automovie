import { type Archetype, ArchetypeRefusal } from "../core";
import { createBow } from "./createBow";

/**
 * The speed an arrow leaves a bow at, drawn to a travel of its string: what `createBow.launchSpeed` gives.
 *
 * @param bow The bow.
 * @param mass The arrow's mass, kilograms.
 * @param travel The string's travel from brace, metres; 0 gives no speed.
 * @returns The speed, metres per second.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the unit and the zero at brace.
 * @evidence contracts/development/implementation.md#principled-implementation Kooi's energy balance, `A = (m + K) v^2 / 2` (eq. 3.89, p. 77), with `A` the stored energy, the draw-force curve's integral from brace to the travel, and `K` the virtual mass of limbs and string, `m0 (1 - eta) / eta` from his efficiency `eta` at his arrow mass `m0` (eq. 3.90). The curve is the one-parameter power law `F (x / X)^p` whose energy over the full stroke is Kooi's factor `q` of `F X`, `p = 1 / q - 1`, so `A(x) = q F X (x / X)^(1 / q)`; the curve's shape between brace and full draw, and the efficiency for a recurve or a horse bow, are provisional.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The stroke, the stored energy, the virtual mass, the speed.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Kooi shows the virtual mass is not constant across arrow masses (pp. 78, 123); it is held at his arrow's, provisional for others.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function bowLaunchSpeed(
  bow: Archetype<createBow.Affordance, createBow.Dimension>,
  mass: number,
  travel: number,
): number {
  if (bow.dimensions.draw === undefined)
    throw new ArchetypeRefusal({
      kind: "parameter",
      archetype: bow.archetype,
      axis: "draw",
      value: bow.name,
      reason: `no source read gives the ${bow.name}'s draw weight, so its stored energy is unknown`,
      fix: "launch from a bow whose draw weight is read",
    });
  const stroke: number = bow.affordance("string").travel!;
  // A longbow's and a crossbow's straight limbs take the straight-end bow's factor, a crossbow's provisionally.
  const q: number =
    bow.name === "longbow" || bow.name === "crossbow"
      ? createBow.KOOI.straight
      : createBow.KOOI.recurve;
  const share: number = Math.max(0, Math.min(1, travel / stroke));
  const stored: number = q * bow.dimensions.draw! * stroke * share ** (1 / q);
  const virtual: number =
    (createBow.KOOI.arrow * (1 - createBow.KOOI.efficiency)) / createBow.KOOI.efficiency;
  return Math.sqrt((2 * stored) / (mass + virtual));
}
