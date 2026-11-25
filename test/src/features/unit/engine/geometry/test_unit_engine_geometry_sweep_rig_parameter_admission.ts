import { rigAutoMovieSweep } from "@automovie/engine";
import type { IAutoMovieSweep, IAutoMovieSweepRig } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";

/**
 * A parameter-corresponded sweep rig (`rigAutoMovieSweep`) admits its sample
 * writers and probes numerically: a refused product publishes nothing and
 * keeps the prior state.
 *
 * Fixture: a 1 m spine along y with the square section from (2a, a) to (4a,
 * 3a) at both ends; one sample or probe at (0.5, 0.125) with cell weights (0.2,
 * 0.2, 0.1, 0.1).
 *
 * Scenarios:
 *
 * 1. At a = 1 under a MIN_VALUE girth the writer still writes positive x and z.
 * 2. At a = 0.1 the same girth makes the product unrepresentable: the writer
 *    refuses ("scaled parameter sweep sample is not representable") and leaves
 *    its output (7s) untouched.
 * 3. A probe under a MAX_VALUE girth refuses the same way, keeping scales and
 *    probes, which a null pose leaves as they were.
 * 4. Cell weights (MIN_VALUE, MAX_VALUE, 0, 0) are refused ("parameter sweep cell
 *    weight is not representable").
 */
export function test_unit_engine_geometry_sweep_rig_parameter_admission(): void {
  const make = (a: number): IAutoMovieSweepRig => {
    const section: IAutoMovieSweep.IStation["section"] = {
      type: "polygon",
      points: [
        { x: 2 * a, y: a },
        { x: 4 * a, y: a },
        { x: 4 * a, y: 3 * a },
        { x: 2 * a, y: 3 * a },
      ],
    };
    return rigAutoMovieSweep({
      sweep: {
        correspondence: "parameter",
        spine: {
          points: [
            { x: 0, y: 0, z: 0 },
            { x: 0, y: 1, z: 0 },
          ],
          normal: { x: 0, y: 0, z: 1 },
        },
        stations: [
          { at: 0, section },
          { at: 1, section },
        ],
      },
      preserveVolume: false,
    });
  };
  const weights: number[] = [0.2, 0.2, 0.1, 0.1];
  const unrepresentable: string = "scaled parameter sweep sample is not representable";

  // 1.
  const unit: IAutoMovieSweepRig = make(1);
  const writer: ReturnType<IAutoMovieSweepRig["sample"]> = unit.sample(0.5, 0.125, weights);
  unit.seal();
  unit.girth((): number => Number.MIN_VALUE);
  const kept: Float64Array = new Float64Array(3);
  writer(kept, 0);
  TestValidator.predicate("positive", kept[0]! > 0 && kept[2]! > 0);

  // 2.
  const tiny: IAutoMovieSweepRig = make(0.1);
  const refused: ReturnType<IAutoMovieSweepRig["sample"]> = tiny.sample(0.5, 0.125, weights);
  tiny.seal();
  tiny.girth((): number => Number.MIN_VALUE);
  const output: Float64Array = new Float64Array(6).fill(7);
  TestValidator.predicate("writer refuses", throwsError((): void => refused(output, 2), unrepresentable));
  TestValidator.equals("nothing written", [...output], [7, 7, 7, 7, 7, 7]);

  // 3.
  const probing: IAutoMovieSweepRig = make(1);
  probing.probe(0.5, 0.125, weights);
  probing.seal();
  const scales: number[] = [...probing.scales];
  const probes: number[] = [...probing.probes];
  TestValidator.predicate(
    "probe refuses",
    throwsError((): void => probing.girth((): number => Number.MAX_VALUE), unrepresentable),
  );
  TestValidator.equals("state kept", [[...probing.scales], [...probing.probes]], [scales, probes]);
  probing.pose(null);
  TestValidator.equals("rest usable", [[...probing.scales], [...probing.probes]], [scales, probes]);

  // 4.
  TestValidator.predicate(
    "weight refused",
    throwsError(
      (): unknown => make(1).sample(0.5, 0.125, [Number.MIN_VALUE, Number.MAX_VALUE, 0, 0]),
      "parameter sweep cell weight is not representable",
    ),
  );
}
