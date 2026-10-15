import {
  type IAutoMovieSurfaceNetwork,
  type IAutoMovieSweepSurface,
  compileAutoMovieSweep,
  sampleAutoMovieSurfaceNetwork,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { sweepGirthTube } from "../internal/sweepGirthTube";
import { sweepRowPerimeter } from "../internal/sweepRowPerimeter";
import { sweepTransitionTube } from "../internal/sweepTransitionTube";
import { throwsError } from "../internal/throwsError";

/**
 * Without a declared perimeter the limit falls short of a girth, and a
 * perimeter is refused on a ring that cannot hold it.
 *
 * Scenarios:
 *
 * 1. The elliptic tube's middle ring without a perimeter, at the medium
 *    tier: the subdivided limit's perimeter falls more than 2 mm short of
 *    the section's, so holding it changes the surface.
 * 2. A perimeter that is not positive, one beside positions, one on a ring
 *    that does not run once round, one on a ring through the open end, one beside
 *    a count-changing band's extraordinary corners, and two rings of one
 *    sweep at one `u` are refused.
 *
 * @evidence contracts/testing.md#behavioral-verification Samples networks with `sampleAutoMovieSurfaceNetwork`; a sampler that already met the girth would make the hold untestable, and each invalid ring must fail with its own diagnostic.
 * @evidence contracts/testing.md#independent-expectations The section's perimeter is a dense polyline of `compileAutoMovieSweep`, and the limit's is measured on the subdivided surface; each refusal names its cause.
 * @evidence contracts/testing.md#distinguishing-cases Covers the free shortfall and every refusal; the held perimeter is owned by the girth test.
 * @evidence contracts/testing.md#execution-ownership A portable unit test reached through the discoverable `test_geometry_sweep_girth_refusal` entry with no process, browser or GPU.
 */
export function test_geometry_sweep_girth_refusal(): void {
  const sweep: IAutoMovieSweepSurface = compileAutoMovieSweep(
    sweepGirthTube({ exponent: 2 }).sweeps.tube!,
  );
  let perimeter: number = 0;
  for (let k: number = 0; k < 4096; ++k) {
    const a = sweep.point(0.5, k / 4096);
    const b = sweep.point(0.5, (k + 1) / 4096);
    perimeter += Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
  }
  TestValidator.predicate(
    "a free girth falls short",
    perimeter -
      sweepRowPerimeter(sweepGirthTube({ exponent: 2 }), "medium", 0.5) >
      0.002,
  );

  const tube: IAutoMovieSurfaceNetwork = sweepGirthTube({
    exponent: 2,
    perimeter,
  });
  const rings = (
    change: (
      ring: IAutoMovieSurfaceNetwork.IRing,
    ) => IAutoMovieSurfaceNetwork.IRing,
  ): IAutoMovieSurfaceNetwork => ({
    ...tube,
    rings: tube.rings!.map(
      (ring: IAutoMovieSurfaceNetwork.IRing): IAutoMovieSurfaceNetwork.IRing =>
        ring.name === "girth" ? change(ring) : ring,
    ),
  });
  const banded: IAutoMovieSurfaceNetwork = sweepTransitionTube();
  // the ring without its perimeter
  const bare = (
    ring: IAutoMovieSurfaceNetwork.IRing,
  ): IAutoMovieSurfaceNetwork.IRing => ({ name: ring.name, edges: ring.edges });
  const invalids: Array<readonly [string, IAutoMovieSurfaceNetwork, string]> = [
    [
      "a perimeter that is not positive",
      rings(
        (
          ring: IAutoMovieSurfaceNetwork.IRing,
        ): IAutoMovieSurfaceNetwork.IRing => ({ ...ring, perimeter: -1 }),
      ),
      "positive and finite",
    ],
    [
      "a perimeter beside positions",
      rings(
        (
          ring: IAutoMovieSurfaceNetwork.IRing,
        ): IAutoMovieSurfaceNetwork.IRing => ({
          ...ring,
          positions: Array.from({ length: 16 }, (_: unknown, k: number) => ({
            x: Math.cos(k),
            y: 0.3,
            z: Math.sin(k),
          })),
        }),
      ),
      "both positions and a perimeter",
    ],
    [
      "a ring that does not run once round",
      {
        ...tube,
        rings: [
          ...tube.rings!.filter(
            (ring: IAutoMovieSurfaceNetwork.IRing): boolean =>
              ring.name !== "girth",
          ),
          {
            name: "girth",
            perimeter,
            edges: [
              {
                type: "sweep",
                sweep: "tube",
                from: { u: 0.5, v: 0 },
                to: { u: 0.5, v: 0.5 },
                segments: { lowest: 4, low: 6, medium: 8, high: 8 },
              },
              {
                type: "sweep",
                sweep: "tube",
                from: { u: 0.5, v: 0.5 },
                to: { u: 0.5, v: 1 },
                segments: { lowest: 4, low: 6, medium: 8, high: 8 },
              },
              {
                type: "sweep",
                sweep: "tube",
                from: { u: 0.5, v: 1 },
                to: { u: 0.5, v: 0 },
                segments: { lowest: 8, low: 12, medium: 16, high: 16 },
              },
            ],
          },
        ],
      },
      "once round one sweep at one u",
    ],
    [
      "a ring through the open end",
      {
        ...tube,
        rings: tube.rings!.map(
          (
            ring: IAutoMovieSurfaceNetwork.IRing,
          ): IAutoMovieSurfaceNetwork.IRing =>
            ring.name === "start"
              ? { ...ring, perimeter }
              : ring.name === "girth"
                ? bare(ring)
                : ring,
        ),
      },
      "not a regular interior vertex",
    ],
    [
      "a ring beside a band's corners",
      {
        ...banded,
        rings: [
          ...banded.rings!,
          {
            name: "band",
            perimeter,
            edges: [
              {
                type: "sweep",
                sweep: "tube",
                from: { u: 0.36, v: 0 },
                to: { u: 0.36, v: 1 },
                segments: { lowest: 8, low: 16, medium: 16, high: 32 },
              },
            ],
          },
        ],
      },
      "not a regular interior vertex",
    ],
    [
      "two rings at one u",
      {
        ...tube,
        rings: [...tube.rings!, { ...bare(tube.rings![1]!), name: "again" }],
      },
      "share one u",
    ],
  ];
  for (const [name, network, message] of invalids)
    TestValidator.predicate(
      `${name} is refused by its own diagnostic`,
      throwsError(
        () => sampleAutoMovieSurfaceNetwork({ network, tier: "medium" }),
        message,
      ),
    );
}
