import { lowerServiceNetwork } from "@automovie/engine";
import { IAutoMovieMeshGeometry, IAutoMovieMesh, IAutoMovieModel, IAutoMovieStageSetPiece, IAutoMovieServiceSegment, IAutoMovieWetZone, IAutoMovieBuiltEnvironment, IAutoMovieServiceNetwork } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  namedFacts,
  nclose,
  throwsError,
  vclose,
} from "../internal/predicates";
import {
  serviceEnvironment,
  serviceNetwork,
  withSegment,
  withZone,
} from "../internal/serviceFixtures";

/** Extremes of a lowered run's baked triangle mesh, in world metres. */
const extents: (mesh: number[]) => Record<"x" | "y" | "z", { min: number; max: number }> = (mesh: number[]): Record<"x" | "y" | "z", { min: number; max: number }> => {
  const axis: (offset: number) => { min: number; max: number } = (offset: number): { min: number; max: number } => {
    const values: number[] = mesh.filter((_unused: number, index: number): boolean => index % 3 === offset);
    return { min: Math.min(...values), max: Math.max(...values) };
  };
  return { x: axis(0), y: axis(1), z: axis(2) };
};

/**
 * A run is drawn from the same centre line the validator measured, and from
 * nothing else.
 *
 * The description a clash, a sleeve and a length were all decided on is a
 * polyline and a radius, so sweeping a regular section along that polyline is
 * the whole of drawing it. There is no fitting library and no per-discipline
 * appearance here on purpose: a production that wants a modelled valve body
 * authors that asset and places it on the node, exactly as it would author any
 * other prop. What this lowering owes is that the tube it emits sits on the
 * line the graph was checked against, in world coordinates, with an identity
 * placement that cannot drift from it.
 *
 * It refuses lowering when structural service or wet-zone validation fails,
 * raising the first violation by path. Successful lowering produces numerical
 * mesh records; it does not establish hydraulic operation or a rendered frame.
 *
 * Scenarios:
 *
 * 1. Every run becomes exactly one generated model and one staged piece, named for
 *    the network and the run, in declaration order.
 * 2. The swept tube stands on its own centre line: a straight run along `-x` at
 *    2.5 m carries a section in the `y`/`z` plane of its own radius, and its
 *    extremes are the hand-computed ones.
 * 3. A turning run rings every one of its route points, so the vertex count is the
 *    section's own size times the points it was swept through.
 * 4. The section's resolution is the caller's, and a section too coarse to close
 *    is refused rather than drawn.
 * 5. A graph defect and a wet-zone defect each refuse the drawing, quoting the
 *    path the violation stands at.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual service lowering, checks generated model/set records, tube extents and route-ring vertex counts, then verifies invalid section resolution and graph/wet-zone refusals at their owning paths.
 * @evidence contracts/testing.md#independent-expectations The authored cold run spans x=3.5..8 at y=2.5/z=1 with radius0.025; route points times eight or three section sides fix component counts independently of returned meshes.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts straight/turning routes, default/coarse section resolution, invalid two-side/fractional requests and graph versus wet-zone failures while checking world-baked identity placement; endpoint ids are sampled, not an exhaustive declaration-order assertion.
 * @evidence contracts/testing.md#execution-ownership Owns synchronous in-memory bathhouse/network and emitted geometry records through the portable runner; no browser, GPU, screenshot or output file is created, and these numerical mesh checks do not establish visual appearance or live product integration.
 */
export function test_service_network_render(): void {
  const environment: IAutoMovieBuiltEnvironment = serviceEnvironment();
  const network: IAutoMovieServiceNetwork = serviceNetwork();
  const lowered: ReturnType<typeof lowerServiceNetwork> = lowerServiceNetwork({ network, environment });

  TestValidator.equals(
    "every run becomes one generated model and one staged piece",
    namedFacts([
      ["models", (): boolean => (lowered.models ?? []).length === 10],
      ["pieces", (): boolean => (lowered.set ?? []).length === 10],
      [
        "names",
        (): boolean =>
          (lowered.models ?? [])[0]!.id === "bathhouse-services/cold-run" &&
          (lowered.models ?? [])[9]!.id === "bathhouse-services/air-run",
      ],
      [
        "generated",
        (): boolean =>
          (lowered.models ?? []).every(
            (model: IAutoMovieModel): boolean =>
              model.origin === "generated" &&
              model.skeleton === null &&
              model.asset === null &&
              model.parts.length === 1 &&
              model.parts[0]!.geometry.type === "mesh",
          ),
      ],
      [
        "identityPlacement",
        (): boolean =>
          (lowered.set ?? []).every(
            (piece: IAutoMovieStageSetPiece): boolean =>
              piece.model === piece.node &&
              vclose(piece.position, { x: 0, y: 0, z: 0 }, 0) &&
              piece.rotation === undefined &&
              piece.scale === undefined &&
              piece.facingDeg === undefined,
          ),
      ],
    ]),
    {
      models: true,
      pieces: true,
      names: true,
      generated: true,
      identityPlacement: true,
    },
  );

  const coldRun: IAutoMovieMesh = (
    (lowered.models ?? [])[0]!.parts[0]!.geometry as IAutoMovieMeshGeometry
  ).mesh;
  const bounds: ReturnType<typeof extents> = extents(coldRun.positions);
  TestValidator.equals(
    "the swept tube stands on the centre line the graph was checked against",
    namedFacts([
      ["vertices", (): boolean => coldRun.positions.length === 2 * 8 * 3],
      ["indexed", (): boolean => coldRun.indices !== null],
      [
        "xSpan",
        (): boolean =>
          nclose(bounds.x.min, 3.5, 1e-12) && nclose(bounds.x.max, 8, 1e-12),
      ],
      [
        "ySpan",
        (): boolean =>
          nclose(bounds.y.min, 2.475, 1e-12) &&
          nclose(bounds.y.max, 2.525, 1e-12),
      ],
      [
        "zSpan",
        (): boolean =>
          nclose(bounds.z.min, 0.975, 1e-12) &&
          nclose(bounds.z.max, 1.025, 1e-12),
      ],
    ]),
    { vertices: true, indexed: true, xSpan: true, ySpan: true, zSpan: true },
  );

  const coldBranch: IAutoMovieMesh = (
    (lowered.models ?? [])[1]!.parts[0]!.geometry as IAutoMovieMeshGeometry
  ).mesh;
  const coarse: ReturnType<typeof lowerServiceNetwork> = lowerServiceNetwork({ network, environment, sides: 3 });
  const coarseRun: IAutoMovieMesh = (
    (coarse.models ?? [])[0]!.parts[0]!.geometry as IAutoMovieMeshGeometry
  ).mesh;
  TestValidator.equals(
    "the section rings every route point, at the resolution the caller asked for",
    namedFacts([
      ["turning", (): boolean => coldBranch.positions.length === 3 * 8 * 3],
      ["coarse", (): boolean => coarseRun.positions.length === 2 * 3 * 3],
      [
        "tooCoarse",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof lowerServiceNetwork> => lowerServiceNetwork({ network, environment, sides: 2 }),
            ["needs at least 3 sides"],
          ),
      ],
      [
        "fractional",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof lowerServiceNetwork> => lowerServiceNetwork({ network, environment, sides: 4.5 }),
            ["needs at least 3 sides"],
          ),
      ],
    ]),
    { turning: true, coarse: true, tooCoarse: true, fractional: true },
  );

  TestValidator.equals(
    "a network that does not work is not drawn",
    namedFacts([
      [
        "graphDefect",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof lowerServiceNetwork> =>
              lowerServiceNetwork({
                network: withSegment(network, "cold-run", (run: IAutoMovieServiceSegment): IAutoMovieServiceSegment => ({
                  ...run,
                  penetrations: [],
                })),
                environment,
              }),
            ["is invalid at $input.segments[0].penetrations"],
          ),
      ],
      [
        "zoneDefect",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof lowerServiceNetwork> =>
              lowerServiceNetwork({
                network: withZone(network, "bath-zone", (zone: IAutoMovieWetZone): IAutoMovieWetZone => ({
                  ...zone,
                  drains: [],
                  slope: 0,
                })),
                environment,
              }),
            ["is invalid at $input.zones[0].drains"],
          ),
      ],
    ]),
    { graphDefect: true, zoneDefect: true },
  );
}
