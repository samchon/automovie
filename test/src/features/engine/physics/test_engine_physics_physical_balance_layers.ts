import { AutoMovieEnginePhysicalBalance as Balance } from "@automovie/engine";
import type {
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalBalance,
  IAutoMoviePhysicalSupportPatch,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Assesses a body over four fixed supports. Increasing forward speed from rest to 2 m/s and then 20 m/s passes through supported, recovery and unrecoverable states.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Checks the supported, recovery and unrecoverable states for increasing forward velocity over four point supports.
 * @evidence contracts/development/testing.md#behavioral-verification Calls balance assessment directly at 0, 2 and 20 m/s using a rectangular stance, a 1 m center height and a 0.7 m step limit.
 * @evidence contracts/development/testing.md#independent-expectations Zero speed leaves the capture point inside. The same geometry and finite reach admit recovery at 2 m/s and rule it out at 20 m/s.
 */
export function test_engine_physics_physical_balance_layers(): void {
  const pattern: IAutoMovieFootfallPattern = supports(4);
  const contacts: IAutoMoviePhysicalSupportPatch[] = pattern.limbs.map(
    (limb: (typeof pattern.limbs)[number]): IAutoMoviePhysicalSupportPatch => ({
      bone: limb.bone,
      position: { x: limb.offset.forward, y: 0, z: limb.offset.left },
      points: [{ x: limb.offset.forward, y: 0, z: limb.offset.left }],
    }),
  );
  const assess: (speed: number) => IAutoMoviePhysicalBalance.IResult = (
    speed: number,
  ): IAutoMoviePhysicalBalance.IResult =>
    Balance.assess({
      center: { x: 0, y: 1, z: 0 },
      velocity: { x: speed, y: 0, z: 0 },
      gravity: 9.81,
      floor: 0,
      supports: contacts,
      pattern,
      maximumStep: 0.7,
      margin: 0.01,
      unavailable: [],
    });
  TestValidator.predicate(
    "increasing disturbance changes recovery feasibility",
    (): boolean =>
      assess(0).state === "supported" &&
      assess(2).state === "recovery" &&
      assess(20).state === "unrecoverable",
  );
}

/** Rectangular support geometry and declared timing, without a species name. */
function supports(count: number): IAutoMovieFootfallPattern {
  return {
    id: `supports-${count}`,
    minimumSupports: 1,
    limbs: Array.from(
      { length: count },
      (
        _: unknown,
        index: number,
      ): {
        bone: string;
        chain: string[];
        phase: number;
        duty: number;
        offset: { forward: number; left: number };
        stride: { speed: number; length: number }[];
      } => ({
        bone: `support-${index}`,
        chain: ["root", `support-${index}`],
        phase: index / count,
        duty: 0.6,
        offset: {
          forward: count === 4 ? (index < 2 ? 0.3 : -0.3) : 0,
          left: index % 2 === 0 ? 0.2 : -0.2,
        },
        stride: [
          { speed: 0, length: 0.6 },
          { speed: 2, length: 0.6 },
        ],
      }),
    ),
  };
}
