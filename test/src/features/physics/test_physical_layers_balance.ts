import type { IAutoMovieFootfallPattern } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { AutoMoviePhysicalBalance as Balance } from "../../../../packages/engine/src/physics/AutoMoviePhysicalBalance";

/** Physical balance behavior.
 *
 * Scenarios:
 * 1. Exercise actual public inputs and compare physical quantities.
 */
export function test_physical_layers_balance(): void {
  const pattern: IAutoMovieFootfallPattern = supports(4);
  const contacts: Balance.ISupport[] = pattern.limbs.map(
    (limb: (typeof pattern.limbs)[number]): Balance.ISupport => ({
      bone: limb.bone,
      position: { x: limb.offset.forward, y: 0, z: limb.offset.left },
      points: [{ x: limb.offset.forward, y: 0, z: limb.offset.left }],
    }),
  );
  const assess: (speed: number) => Balance.IResult = (
    speed: number,
  ): Balance.IResult =>
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
