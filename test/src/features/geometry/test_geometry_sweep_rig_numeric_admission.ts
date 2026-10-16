import {
  type IAutoMovieSurfaceNetwork,
  type IAutoMovieSweep,
  sampleAutoMovieSurfaceNetwork,
} from "@automovie/engine";
import type { AutoMovieHumanoidBone } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { bufferAutoMovieBones } from "../../../../packages/engine/src/geometry/sweep/bufferAutoMovieBones";
import { rigAutoMovieSweep } from "../../../../packages/engine/src/geometry/sweep/rigAutoMovieSweep";
import { nclose } from "../internal/nclose";
import { sweepBranchedBody } from "../internal/sweepBranchedBody";
import { sweepBranchedSkeleton } from "../internal/sweepBranchedSkeleton";
import { throwsError } from "../internal/throwsError";

/**
 * Registered surface samples and girth scales retain the same numeric domain as surface queries.
 *
 * Scenarios:
 *
 * 1. A normal circular network retains a finite nonzero cross-section; a positive subnormal scale must refuse instead of returning 32 vertices on its spine. Overflow is likewise refused by its owning numeric layer.
 * 2. A valid factor changes two registered scale slots to the analytically expected values. A late invalid factor or overflowing scale product refuses without changing either slot, including after return to rest. An unrepresentable derivative/normal probe also refuses before publishing factors.
 *
 * @evidence contracts/testing.md#behavioral-verification Samples the real network with fitting disabled so an inverse fit cannot hide collapsed input, and exercises the real bound sweep rig's factor update and rest writer. Silent axial collapse, non-finite geometry and partial failed factor/probe publication fail.
 * @evidence contracts/testing.md#independent-expectations A circular radius 0.1 m at scale 1 has a nonzero cross-section; positive scale cannot mathematically collapse it. Authored scale 2 times factors 0.5 and 0.75 gives 1 and 1.5. Rejected mutation must preserve the pre-call scales exactly.
 * @evidence contracts/testing.md#distinguishing-cases Covers ordinary and subnormal/overflow network scales, valid varying factors, a late NaN factor, an overflowing finite product and a return-to-rest read. Public origin-point semantics belong to numeric_admission, and active pose-volume failure has a separate scenario.
 * @evidence contracts/testing.md#execution-ownership Portable synchronous test_geometry_sweep_rig_numeric_admission; real internal producers are imported directly without substitutions, and every compile and update is inside the measured entry.
 */
export function test_geometry_sweep_rig_numeric_admission(): void {
  const counts: IAutoMovieSurfaceNetwork.ICounts = {
    lowest: 8,
    low: 8,
    medium: 8,
    high: 8,
  };
  const rows: IAutoMovieSurfaceNetwork.ICounts = {
    lowest: 3,
    low: 3,
    medium: 3,
    high: 3,
  };
  function network(radius: number, scale: number): IAutoMovieSurfaceNetwork {
    const section: IAutoMovieSweep.IStation["section"] = {
      type: "superellipse",
      right: radius,
      up: radius,
      left: radius,
      down: radius,
      exponents: [2, 2, 2, 2],
    };
    return {
      sweeps: {
        tube: {
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
          scale: [
            { at: 0, value: scale },
            { at: 1, value: scale },
          ],
        },
      },
      patches: [
        {
          type: "sweep",
          name: "tube",
          sweep: "tube",
          u: [0, 1],
          v: [0, 1],
          rows,
          columns: counts,
        },
      ],
    };
  }
  const normal: ReturnType<typeof sampleAutoMovieSurfaceNetwork> =
    sampleAutoMovieSurfaceNetwork({
      network: network(0.1, 1),
      tier: "medium",
      fit: false,
    });
  TestValidator.predicate(
    "normal registered samples stay finite and away from their axis",
    normal.targets.every(Number.isFinite) &&
      normal.targets.some(
        (value: number, index: number): boolean =>
          index % 3 !== 1 && Math.abs(value) > 0.05,
      ),
  );
  TestValidator.predicate(
    "positive scale underflow cannot return an axial cage",
    throwsError(
      (): unknown =>
        sampleAutoMovieSurfaceNetwork({
          network: network(0.1, 2 * Number.MIN_VALUE),
          tier: "medium",
          fit: false,
        }),
      "scaled sweep sample is not representable",
    ),
  );
  TestValidator.predicate(
    "overflow cannot return a non-finite cage",
    throwsError((): unknown =>
      sampleAutoMovieSurfaceNetwork({
        network: network(2, Number.MAX_VALUE),
        tier: "medium",
        fit: false,
      }),
    ),
  );

  const probing: ReturnType<typeof rigAutoMovieSweep> = rigAutoMovieSweep({
    sweep: network(0.1, 1).sweeps.tube!,
    preserveVolume: false,
  });
  probing.probe(0.5, 0);
  probing.seal();
  const previousScales: Float64Array = probing.scales.slice();
  const previousProbes: Float64Array = probing.probes.slice();
  TestValidator.predicate(
    "an unrepresentable probe refuses before factor publication",
    throwsError(
      (): unknown =>
        probing.girth((u: number): number =>
          u < 0.5 ? Number.MAX_VALUE / 2 : Number.MAX_VALUE,
        ),
      "sweep probe is not representable",
    ),
  );
  TestValidator.predicate(
    "probe refusal preserves the last valid factors and normals",
    probing.scales.every((value: number, index: number): boolean =>
      nclose(value, previousScales[index]!, 0),
    ) &&
      probing.probes.every((value: number, index: number): boolean =>
        nclose(value, previousProbes[index]!, 0),
      ),
  );

  const skeleton: ReturnType<typeof sweepBranchedSkeleton> =
    sweepBranchedSkeleton();
  const motion: ReturnType<typeof bufferAutoMovieBones> = bufferAutoMovieBones(
    skeleton.rest,
  );
  const binding: (typeof skeleton.bindings.sweeps)[string] =
    skeleton.bindings.sweeps.sideLeft!;
  const rig: ReturnType<typeof rigAutoMovieSweep> = rigAutoMovieSweep({
    sweep: {
      ...sweepBranchedBody().sweeps.sideLeft!,
      scale: [
        { at: 0, value: 2 },
        { at: 1, value: 2 },
      ],
    },
    binding: {
      points: binding.points.map((bone: AutoMovieHumanoidBone): number =>
        motion.index(bone),
      ),
      stations: binding.stations.map(
        (bones: AutoMovieHumanoidBone[]): number[] =>
          bones.map((bone: AutoMovieHumanoidBone): number =>
            motion.index(bone),
          ),
      ),
    },
    preserveVolume: false,
  });
  rig.scale(0.25);
  rig.scale(0.75);
  rig.seal();
  rig.girth((u: number): number => (u < 0.5 ? 0.5 : 0.75));
  rig.pose(null);
  TestValidator.predicate(
    "valid factors keep their exact meaning at rest",
    nclose(rig.scales[0]!, 1, 0) && nclose(rig.scales[1]!, 1.5, 0),
  );
  rig.girth((): number => 1);
  const before: Float64Array = rig.scales.slice();
  for (const [name, value, message] of [
    ["invalid factor", NaN, "girth factor"],
    ["overflowing product", Number.MAX_VALUE, "girth scale"],
  ] as const) {
    TestValidator.predicate(
      name + " refuses at its owner",
      throwsError(
        (): unknown =>
          rig.girth((u: number): number => (u < 0.5 ? 0.5 : value)),
        message,
      ),
    );
    rig.pose(null);
    TestValidator.predicate(
      name + " preserves all last valid rest scales",
      rig.scales.every((scale: number, index: number): boolean =>
        nclose(scale, before[index]!, 0),
      ),
    );
  }
}
