import { createHorse, rideHorse } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeHorseRide } from "../../../internal/archetypeHorseRide";

/**
 * A trunk lean pitches the body while the planted hooves stay where they landed on the level ground.
 *
 * Scenarios:
 * 1. A harnessed horse walks a straight with a constant 5.33 degree forward lean: no planted hoof slides, and at each left fore's mid-stance its hoof joint stands at the unleaned ride's height, within 0.1 mm.
 * 2. The same with a lean ramping from 0 to 8 degrees over the ride: no planted hoof slides.
 */
export function test_unit_archetypes_animals_equine_lean(): void {
  const horse = createHorse(
    { tack: "harness", withersHeight: 1.6, tempo: 0 },
    1,
  );
  const issues: string[] = [];
  const ride = (
    lean?: (seconds: number) => number,
  ): ReturnType<typeof rideHorse> =>
    rideHorse(
      horse,
      {
        start: { x: 0, z: 0, heading: 0 },
        legs: [{ kind: "straight", length: 10 }],
        cruise: 1.3,
        acceleration: 0.6,
        deceleration: 0.6,
        ...(lean === undefined ? {} : { lean }),
      },
      "walk",
    );
  const level = ride();
  const constant = ride((): number => 5.33);
  const ramped = ride((seconds: number): number => Math.min(8, seconds));
  for (const [label, leaning] of [
    ["constant", constant],
    ["ramped", ramped],
  ] as const) {
    const slide: number = archetypeHorseRide.slide(leaning).worst;
    if (!(slide <= 1e-9))
      issues.push(`${label}: a planted hoof slides ${slide} m`);
  }
  const on: number[] = archetypeHorseRide.footfalls(constant, "leftFore");
  for (let k: number = 1; k + 1 < on.length; k++) {
    const stance: number = on[k]! + 0.25 * (on[k + 1]! - on[k]!);
    const drop: number =
      archetypeHorseRide.hoof(level, "leftFore", stance).y -
      archetypeHorseRide.hoof(constant, "leftFore", stance).y;
    if (!(Math.abs(drop) <= 1e-4))
      issues.push(`stance ${k}: hoof joint ${drop} m off the level ride's`);
  }
  TestValidator.equals("planted under a lean", issues, []);
}
