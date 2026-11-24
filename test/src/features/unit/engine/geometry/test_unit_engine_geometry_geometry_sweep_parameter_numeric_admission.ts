import { rigAutoMovieSweep } from "@automovie/engine";
import type { IAutoMovieSweep, IAutoMovieSweepRig } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";

/**
 * Numeric admission of the Cartesian writer and its real staged probe consumer.
 *
 * Scenarios:
 *
 * 1. Ordinary geometry follows its correspondence and numeric domain.
 * 2. Origin/cancellation or numeric refusal preserves the declared state.
 * 3. Registered consumers share the same admitted field.
 */
export function test_unit_engine_geometry_geometry_sweep_parameter_numeric_admission(): void {
  function make(size: number): IAutoMovieSweepRig {
    const section: IAutoMovieSweep.IStation["section"] = {
      type: "polygon",
      points: [
        { x: 2 * size, y: size },
        { x: 4 * size, y: size },
        { x: 4 * size, y: 3 * size },
        { x: 2 * size, y: 3 * size },
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
  }
  const positive: IAutoMovieSweepRig = make(1);
  const writer: ReturnType<IAutoMovieSweepRig["sample"]> = positive.sample(
    0.5,
    0.125,
    [0.2, 0.2, 0.1, 0.1],
  );
  positive.seal();
  positive.girth((): number => Number.MIN_VALUE);
  const retained: Float64Array = new Float64Array(3);
  writer(retained, 0);
  TestValidator.predicate(
    "a positive subnormal constant remains positive",
    retained[0]! > 0 && retained[2]! > 0,
  );
  const tiny: IAutoMovieSweepRig = make(0.1);
  const refused: ReturnType<IAutoMovieSweepRig["sample"]> = tiny.sample(
    0.5,
    0.125,
    [0.2, 0.2, 0.1, 0.1],
  );
  tiny.seal();
  tiny.girth((): number => Number.MIN_VALUE);
  const output: Float64Array = new Float64Array(6).fill(7);
  TestValidator.predicate(
    "unrepresentable nonzero Cartesian products refuse",
    throwsError(
      (): void => refused(output, 2),
      "scaled parameter sweep sample is not representable",
    ),
  );
  TestValidator.predicate(
    "refused writer publishes no coordinate",
    output.every((value: number): boolean => nclose(value, 7, 0)),
  );
  const probing: IAutoMovieSweepRig = make(1);
  probing.probe(0.5, 0.125, [0.2, 0.2, 0.1, 0.1]);
  probing.seal();
  const scales: Float64Array = probing.scales.slice(),
    probes: Float64Array = probing.probes.slice();
  TestValidator.predicate(
    "overflowing finite probe products refuse before publication",
    throwsError(
      (): void => probing.girth((): number => Number.MAX_VALUE),
      "scaled parameter sweep sample is not representable",
    ),
  );
  TestValidator.predicate(
    "probe refusal preserves scales and normals",
    probing.scales.every((value: number, index: number): boolean =>
      nclose(value, scales[index]!, 0),
    ) &&
      probing.probes.every((value: number, index: number): boolean =>
        nclose(value, probes[index]!, 0),
      ),
  );
  probing.pose(null);
  TestValidator.predicate(
    "the previous valid rest state remains usable",
    probing.scales.every((value: number, index: number): boolean =>
      nclose(value, scales[index]!, 0),
    ) &&
      probing.probes.every((value: number, index: number): boolean =>
        nclose(value, probes[index]!, 0),
      ),
  );
  const invalid: IAutoMovieSweepRig = make(1);
  TestValidator.predicate(
    "a positive reach with an unrepresentable weight refuses",
    throwsError(
      (): unknown =>
        invalid.sample(0.5, 0.125, [Number.MIN_VALUE, Number.MAX_VALUE, 0, 0]),
      "parameter sweep cell weight is not representable",
    ),
  );
}
