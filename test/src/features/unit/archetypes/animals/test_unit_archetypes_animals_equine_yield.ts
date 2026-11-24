import {
  type AutoMovieArchetypeQuadrupedFooting,
  AutoMovieArchetypeRefusal,
  createHorse,
  rideHorse,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeHorseRide } from "../../../internal/archetypeHorseRide";

/** The authored sand's sinkage, metres. */
const DEPTH: number = 0.05;

/**
 * A loaded hoof sinks into yielding footing by its declared depth for the stance and clears the surface in swing; a footing deeper than the limb can lift clear refuses.
 *
 * Scenarios:
 * 1. A horse walks the same straight over firm ground and over sand declaring 5 cm: at each left fore's mid-stance its displayed hoof joint is 5 cm lower on the sand, within 0.1 mm.
 * 2. At each mid-swing on the sand the hoof joint is above the surface.
 * 3. A footing declaring 0.6 m, deeper than the carpus stands, refuses as an AutoMovieArchetypeRefusal on the footing.
 */
export function test_unit_archetypes_animals_equine_yield(): void {
  const horse = createHorse({ withersHeight: 1.6, tempo: 0 }, 1);
  const issues: string[] = [];
  const ride = (depth: number | undefined): ReturnType<typeof rideHorse> => {
    const plane: AutoMovieArchetypeQuadrupedFooting.IPlane = {
      id: "ground",
      origin: { x: 0, y: 0, z: 0 },
      x: [-10, 10],
      z: [-10, 30],
      slope: { x: 0, z: 0 },
      ...(depth === undefined
        ? {}
        : { yield: { material: "sand", depth, source: "authored" } }),
    };
    return rideHorse(
      horse,
      {
        start: { x: 0, z: 0, heading: 0 },
        cruise: 1.5,
        startSpeed: 1.5,
        endSpeed: 1.5,
        legs: [{ kind: "straight", length: 9 }],
        footing: { planes: [plane] },
      },
      "walk",
    );
  };
  const firm = ride(undefined);
  const sand = ride(DEPTH);
  const on: number[] = archetypeHorseRide.footfalls(sand, "leftFore");
  for (let k: number = 1; k + 1 < on.length; k++) {
    const gap: number = on[k + 1]! - on[k]!;
    const stance: number = on[k]! + 0.25 * gap;
    const sunk: number =
      archetypeHorseRide.hoof(firm, "leftFore", stance).y -
      archetypeHorseRide.hoof(sand, "leftFore", stance).y;
    if (!(Math.abs(sunk - DEPTH) <= 1e-4))
      issues.push(`stance ${k}: sinks ${sunk} m, expected ${DEPTH} m`);
    const swing: number = archetypeHorseRide.hoof(
      sand,
      "leftFore",
      on[k]! + 0.8 * gap,
    ).y;
    if (!(swing > 0)) issues.push(`swing ${k}: hoof joint at ${swing} m`);
  }
  let refusal: unknown;
  try {
    ride(0.6);
  } catch (error) {
    refusal = error;
  }
  if (
    !(
      refusal instanceof AutoMovieArchetypeRefusal && refusal.axis === "footing"
    )
  )
    issues.push(`an over-deep footing raises ${String(refusal)}`);
  TestValidator.equals("yielding footing", issues, []);
}
