import { AutoMovieArchetypeUnevenBars } from "@automovie/archetypes";
import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMoviePhysicalShape,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** Metre rounding for normalizing a rotation and evaluating the rail diagonal. */
const ROUNDING: number = 1e-9;

/**
 * The inner rail separation comes from physical radii and the difference
 * between authored top heights.
 *
 * Scenarios:
 * 1. Both rail colliders lie along X and their upper tangent points meet the
 *    independently chosen low and high heights.
 * 2. The centre distance in the YZ section minus the two radii is the inner
 *    diagonal. Increasing the requested diagonal increases only separation in
 *    Z. Each grip stays on its physical centre.
 */
export function test_archetypes_gym_uneven_bars_axes(): void {
  const lowHeight: number = 1.74;
  const highHeight: number = 2.56;
  const diameter: number = 0.0392;
  const length: number = 2.39;
  const fixtures: readonly number[] = [1.4, 1.7];

  for (const diagonal of fixtures) {
    const bars: ReturnType<typeof AutoMovieArchetypeUnevenBars.create> = AutoMovieArchetypeUnevenBars.create({
      diagonal,
      lowHeight,
      highHeight,
      diameter,
      length,
    });
    const low: IAutoMovieAffordance = bars.affordance("lowBar");
    const high: IAutoMovieAffordance = bars.affordance("highBar");
    const lowAt: IAutoMovieVector3 = low.frame.translation;
    const highAt: IAutoMovieVector3 = high.frame.translation;
    TestValidator.predicate(
      `the ${diagonal} m diagonal spans the inner rail surfaces`,
      lowAt.z < 0 &&
        highAt.z > 0 &&
        nclose(lowAt.z + highAt.z, 0, ROUNDING) &&
        nclose(
          Math.hypot(highAt.y - lowAt.y, highAt.z - lowAt.z) - diameter,
          diagonal,
          ROUNDING,
        ),
    );

    const shapes: IAutoMoviePhysicalShape[] = bars.shapes();
    const rails: readonly (readonly [IAutoMovieAffordance, number])[] = [
      [low, lowHeight],
      [high, highHeight],
    ];
    for (const [grip, height] of rails) {
      const shaft: IAutoMoviePhysicalShape | undefined = shapes.find(
        (shape: IAutoMoviePhysicalShape): boolean => shape.id === grip.id,
      );
      if (shaft?.kind !== "capsule")
        throw new Error(`${grip.id} needs a round rail`);
      const axis: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
        shaft.transform.rotation,
        { x: 0, y: 1, z: 0 },
      );
      TestValidator.predicate(
        `${grip.id} has the authored top and centred grip at ${diagonal} m`,
        vclose(axis, { x: 1, y: 0, z: 0 }, ROUNDING) &&
          vclose(shaft.transform.position, grip.frame.translation, ROUNDING) &&
          nclose(shaft.transform.position.y + shaft.radius, height, ROUNDING) &&
          nclose(2 * shaft.radius, diameter, ROUNDING) &&
          nclose(2 * (shaft.halfLength + shaft.radius), length, ROUNDING) &&
          nclose(grip.aperture ?? NaN, diameter, ROUNDING),
      );
    }
  }
}
