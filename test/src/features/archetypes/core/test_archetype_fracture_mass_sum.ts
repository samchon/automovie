import {
  AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  type AutoMovieArchetypeFracture,
  AutoMovieArchetypeRefusal,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

/**
 * Complete fracture masses reject a true overflow that individual additions
 * round away, before velocity or mass-property reconstruction uses that total.
 *
 * Scenarios:
 * 1. Four authored coincident unit boxes carry deliberately malformed external
 *    part masses [MAX_VALUE,2^969,2^969,2^969]. Their exact positive total exceeds
 *    MAX_VALUE's overflow midpoint: its ULP is 2^971, while the three small
 *    terms add 3/4 ULP. A finite-looking MAX_VALUE is therefore unsupported.
 * 2. One four-box fragment exercises the per-piece reduction; four one-box
 *    fragments exercise the departing-total reduction. Both report fractureMass.
 * 3. Each grouping with four genuine 1 kg parts still breaks at the authored
 *    1 J threshold, carries total mass 4 kg and has zero velocity at zero momentum.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Derives the binary64 overflow midpoint and distinguishes malformed external mass records from the valid authored positive controls.
 * @evidence contracts/development/testing.md#behavioral-verification Consumes real public AutoMovieArchetype.broken for both fragment groupings, checks the structured mass-admission axis and complete returned mass/velocity for controls; no arithmetic implementation is replaced.
 * @evidence contracts/development/testing.md#independent-expectations MAX_VALUE's adjacent spacing is 2^971, so three exact 2^969 contributions exceed its half-ULP overflow midpoint even though each isolated addition rounds away. Four unit masses sum exactly to 4 and zero momentum independently gives zero velocity.
 * @evidence contracts/development/testing.md#distinguishing-cases Per-piece and cross-fragment totals, false-finite positive overflow, one/four fragments, exact threshold and finite valid controls.
 * @evidence contracts/development/testing.md#execution-ownership One portable discovered in-memory unit owns its authored boxes and deliberately malformed producer record; it starts no compiler, process, renderer or host and changes no runtime implementation.
 */
export function test_archetype_fracture_mass_sum(): void {
  const findings: string[] = [];
  for (const grouped of [true, false]) {
    let refused: boolean = false;
    try {
      fixture([Number.MAX_VALUE, 2 ** 969, 2 ** 969, 2 ** 969], grouped).broken(
        { energy: 1, momentum: { x: 0, y: 0, z: 0 } },
      );
    } catch (error) {
      refused =
        error instanceof AutoMovieArchetypeRefusal &&
        error.axis === "fractureMass";
    }
    if (!refused)
      findings.push(
        `${grouped ? "piece" : "departing"} mass reduction accepted the true overflow midpoint`,
      );
    const broken: AutoMovieArchetypeFracture.IPieces<never, never> | null =
      fixture([1, 1, 1, 1], grouped).broken({
        energy: 1,
        momentum: { x: 0, y: 0, z: 0 },
      });
    if (broken === null)
      findings.push("valid 1 kg part masses did not fracture");
    else if (
      broken.remainder !== null ||
      broken.fragments.length !== (grouped ? 1 : 4) ||
      broken.fragments.reduce(
        (
          total: number,
          fragment: AutoMovieArchetypeFracture.IPiece<never>,
        ): number => total + fragment.archetype.properties.mass,
        0,
      ) !== 4 ||
      broken.fragments.some(
        (fragment: AutoMovieArchetypeFracture.IPiece<never>): boolean =>
          fragment.velocity.x !== 0 ||
          fragment.velocity.y !== 0 ||
          fragment.velocity.z !== 0,
      )
    )
      findings.push(
        "valid fragment grouping changed its partition, total mass or zero velocity",
      );
  }
  TestValidator.equals(
    "fracture owns complete representable mass reductions",
    findings,
    [],
  );

  /** External rest metadata isolate admission without changing any producer method. */
  function fixture(
    weights: readonly number[],
    grouped: boolean,
  ): AutoMovieArchetype<never, never> {
    const draw: AutoMovieArchetypeDrawSession<never> =
      new AutoMovieArchetypeDrawSession<never>("fracture-sum", {}, undefined);
    const builder: AutoMovieArchetypeBuilder<never, never> =
      new AutoMovieArchetypeBuilder<never, never>({
        draw,
        name: "fracture mass sum fixture",
        material: "steel",
      });
    const ids: string[] = ["a", "b", "c", "d"];
    for (const id of ids)
      builder.box(id, { x: 1, y: 1, z: 1 }, { x: 0, y: 0, z: 0 });
    const made: AutoMovieArchetype<never, never> = builder.build(4, {
      restitution: 0,
    });
    const fractures: AutoMovieArchetypeFracture.ISet[] = grouped
      ? [{ id: "whole", parts: ids }]
      : ids.map(
          (id: string): AutoMovieArchetypeFracture.ISet => ({
            id,
            parts: [id],
          }),
        );
    return new AutoMovieArchetype<never, never>({
      archetype: "fracture-sum",
      id: "fracture-sum",
      name: "external part masses",
      parts: made.parts,
      affordances: [],
      materials: made.materials,
      properties: {
        ...made.properties,
        mass: weights[0] === 1 ? 4 : Number.MAX_VALUE,
      },
      friction: null,
      kineticFriction: null,
      surfaces: {},
      material: "steel",
      restitution: 0,
      drag: null,
      contact: { fracture: 1 },
      fractures,
      masses: Object.fromEntries(
        ids.map((id: string, i: number): [string, number] => [id, weights[i]!]),
      ),
      dimensions: {},
      provenance: draw.provenance,
      spans: [],
    });
  }
}
