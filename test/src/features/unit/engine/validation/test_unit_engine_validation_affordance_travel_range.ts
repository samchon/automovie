import { affordanceTravelRange } from "@automovie/engine";
import type {
  AutoMovieAffordanceKind,
  IAutoMovieAffordance,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `affordanceTravelRange` is the range an articulation may travel: a crank with
 * no travel turns without bound, a wheel turns its travel either way, a hinge,
 * knob or slider may go back by its `reverse`, and anything else runs from 0
 * to its travel (0 when none is given).
 *
 * Scenarios:
 *
 * 1. A crank without travel is unbounded both ways.
 * 2. A wheel with travel 3 spans -3 to 3.
 * 3. A hinge with travel 90 and reverse 30 spans -30 to 90; a slider without
 *    reverse spans 0 to its travel 0.25.
 * 4. A button's reverse is ignored: 0 to 0.01; a pedal without travel is 0 to 0.
 */
export function test_unit_engine_validation_affordance_travel_range(): void {
  const affordance = (
    kind: AutoMovieAffordanceKind,
    extra: Partial<IAutoMovieAffordance> = {},
  ): IAutoMovieAffordance => ({
    id: kind,
    kind,
    frame: {
      translation: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
    extent: null,
    ...extra,
  });
  TestValidator.equals(
    "each kind's travel range",
    [
      affordanceTravelRange(affordance("crank")),
      affordanceTravelRange(affordance("wheel", { travel: 3 })),
      affordanceTravelRange(affordance("hinge", { travel: 90, reverse: 30 })),
      affordanceTravelRange(affordance("slider", { travel: 0.25 })),
      affordanceTravelRange(affordance("button", { travel: 0.01, reverse: 1 })),
      affordanceTravelRange(affordance("pedal")),
    ],
    [
      { minimum: null, maximum: null },
      { minimum: -3, maximum: 3 },
      { minimum: -30, maximum: 90 },
      { minimum: 0, maximum: 0.25 },
      { minimum: 0, maximum: 0.01 },
      { minimum: 0, maximum: 0 },
    ],
  );
}
