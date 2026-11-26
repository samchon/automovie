import { compileAutoMovieSweep, AutoMovieEngineSweep } from "@automovie/engine";
import type {
  IAutoMovieSurfaceNetwork,
  IAutoMovieSweepSurface,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { sweepGirthTube } from "../../internal/sweepGirthTube";
import { sweepRowPerimeter } from "../../internal/sweepRowPerimeter";
import { sweepTransitionTube } from "../../internal/sweepTransitionTube";
import { throwsError } from "../../internal/throwsError";

/**
 * Without a declared perimeter the subdivided limit falls short of a ring's
 * girth, and `sampleAutoMovieSurfaceNetwork` refuses a perimeter on a ring that
 * cannot hold it.
 *
 * Fixture: the elliptic girth tube (exponent 2); its middle ring's section
 * perimeter is the 4096-segment polyline of the compiled sweep at u = 0.5.
 *
 * Scenarios:
 *
 * 1. Without a perimeter, the medium-tier limit's perimeter at u = 0.5 falls more
 *    than 2 mm short of the section's.
 * 2. A perimeter of -1 ("positive and finite"), one beside positions ("both
 *    positions and a perimeter"), on a ring of three edges that does not run
 *    once round ("once round one sweep at one u"), on the open end's ring and
 *    beside a count-changing band's corners ("not a regular interior vertex"),
 *    and two rings at one u ("share one u") are refused at the medium tier.
 */
export function test_engine_geometry_sweep_girth_refusals(): void {
  const sweep: IAutoMovieSweepSurface = compileAutoMovieSweep(
    sweepGirthTube({ exponent: 2 }).sweeps.tube!,
  );
  let perimeter: number = 0;
  for (let k: number = 0; k < 4096; ++k) {
    const a: IAutoMovieVector3 = sweep.point(0.5, k / 4096);
    const b: IAutoMovieVector3 = sweep.point(0.5, (k + 1) / 4096);
    perimeter += Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
  }

  // 1.
  TestValidator.predicate(
    "free girth falls short",
    perimeter -
      sweepRowPerimeter(sweepGirthTube({ exponent: 2 }), "medium", [0.5])[0]! >
      0.002,
  );

  // 2.
  const tube: IAutoMovieSurfaceNetwork = sweepGirthTube({
    exponent: 2,
    perimeter,
  });
  const girth = (
    change: (
      ring: IAutoMovieSurfaceNetwork.IRing,
    ) => IAutoMovieSurfaceNetwork.IRing,
  ): IAutoMovieSurfaceNetwork => ({
    ...tube,
    rings: tube.rings!.map((ring: IAutoMovieSurfaceNetwork.IRing) =>
      ring.name === "girth" ? change(ring) : ring,
    ),
  });
  const bare = (
    ring: IAutoMovieSurfaceNetwork.IRing,
  ): IAutoMovieSurfaceNetwork.IRing => ({ name: ring.name, edges: ring.edges });
  const edge = (from: number, to: number, n: number): IAutoMovieSurfaceNetwork.IRing["edges"][number] => ({
    type: "sweep",
    sweep: "tube",
    from: { u: 0.5, v: from },
    to: { u: 0.5, v: to },
    segments: { lowest: n, low: (3 * n) / 2, medium: 2 * n, high: 2 * n },
  });
  const banded: IAutoMovieSurfaceNetwork = sweepTransitionTube();
  for (const [label, network, message] of [
    [
      "not positive",
      girth((ring) => ({ ...ring, perimeter: -1 })),
      "positive and finite",
    ],
    [
      "beside positions",
      girth((ring) => ({
        ...ring,
        positions: Array.from({ length: 16 }, (_: unknown, k: number) => ({
          x: Math.cos(k),
          y: 0.3,
          z: Math.sin(k),
        })),
      })),
      "both positions and a perimeter",
    ],
    [
      "not once round",
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
            edges: [edge(0, 0.5, 4), edge(0.5, 1, 4), edge(1, 0, 8)],
          },
        ],
      },
      "once round one sweep at one u",
    ],
    [
      "open end",
      {
        ...tube,
        rings: tube.rings!.map((ring: IAutoMovieSurfaceNetwork.IRing) =>
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
      "band corners",
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
      "two at one u",
      {
        ...tube,
        rings: [...tube.rings!, { ...bare(tube.rings![1]!), name: "again" }],
      },
      "share one u",
    ],
  ] satisfies [string, IAutoMovieSurfaceNetwork, string][])
    TestValidator.predicate(
      label,
      throwsError(
        (): unknown =>
          AutoMovieEngineSweep.sampleSurfaceNetwork({ network, tier: "medium" }),
        message,
      ),
    );
}
