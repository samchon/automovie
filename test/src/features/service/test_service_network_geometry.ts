import {
  serviceEnvelopeObstructions,
  serviceMaintenanceBounds,
  serviceSegmentBounds,
  serviceSegmentClashes,
  serviceSegmentSpanBounds,
  validateServiceNetwork,
} from "@automovie/engine";
import { IAutoMoviePropBox, IAutoMovieBuiltEnvironment, IAutoMovieServiceNetwork, IAutoMovieServiceNode, IAutoMovieServicePort, IAutoMovieServiceSegment, IAutoMovieServicePenetration, IAutoMovieValidation, IAutoMovieConstraintViolation, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  hasViolation,
  namedFacts,
  throwsError,
  vclose,
  violationCount,
} from "../internal/predicates";
import {
  segment,
  serviceEnvironment,
  serviceNetwork,
  withNode,
  withPort,
  withSegment,
  withSleeve,
} from "../internal/serviceFixtures";

const box: (min: [number, number, number], max: [number, number, number]) => IAutoMoviePropBox = (
  min: [number, number, number],
  max: [number, number, number],
): IAutoMoviePropBox => ({
  min: { x: min[0], y: min[1], z: min[2] },
  max: { x: max[0], y: max[1], z: max[2] },
});

/**
 * Interference is decided span by span, and that decision is the whole reason a
 * run carries a radius.
 *
 * One box around a whole polyline is not a pipe. A run that drops out of a
 * fixture, turns along a floor and crosses a building would claim the entire
 * cuboid those three legs span, so every other discipline in the room would
 * report as clashing with it and the finding that mattered would be buried.
 * This case pins the per-leg volume by hand arithmetic, then proves the two
 * things built on it: that runs meeting at a fitting are exempt while runs
 * merely sharing a lane are not, and that a maintenance envelope is a volume a
 * run may not cross even when nothing is physically joined.
 *
 * Scenarios:
 *
 * 1. A straight run's overall bound is its extremes grown by its own radius, and a
 *    run with no route has no bound to give rather than a silent empty one.
 * 2. A three-point run yields two per-leg boxes, each the extremes of that leg
 *    alone; a one-point route yields none.
 * 3. A maintenance envelope is the node-local box offset by the node's own
 *    position, and a node that declares none has none.
 * 4. Obstruction is interior overlap: a box inside an envelope intrudes, a box
 *    meeting it exactly on a face does not, a box spanning two envelopes names
 *    both in declaration order, and a distant box names nothing.
 * 5. The clean fixture has no clash, and a run moved into another discipline's
 *    lane produces exactly one — reported once, from the earlier-declared run.
 * 6. Runs that meet at a shared fitting never clash even where their volumes
 *    plainly overlap, which is what keeps a tee's three legs quiet.
 * 7. A run crossing an equipment access volume it is not joined to is refused, and
 *    the run feeding that equipment is not.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual overall/span/access bounds, obstruction and clash queries, then validates authored lane and maintenance intrusions with exact source paths and single-defect counts.
 * @evidence contracts/testing.md#independent-expectations Literal route extrema plus radii0.025/0.02 and translated equipment corners supply bounds at 1e-12 tolerance; independent interior/face-contact boxes and authored source ids define obstruction/clash expectations.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts straight/turning/empty/singleton routes, present/absent access boxes, strict interior versus face contact, one/two/no obstructions, shared-fitting exemption and unrelated runs crossing a maintenance volume.
 * @evidence contracts/testing.md#execution-ownership Owns synchronous portable bathhouse/network metadata and invokes conservative AABB-based engine checks; no mesh rendering or physical installation is observed, and diagonal circular interference or distant overlap of shared-node runs is not established by these orthogonal cases.
 */
export function test_service_network_geometry(): void {
  const environment: IAutoMovieBuiltEnvironment = serviceEnvironment();
  const network: IAutoMovieServiceNetwork = serviceNetwork();
  const coldRun: IAutoMovieServiceSegment = network.segments[0]!;
  const coldBranch: IAutoMovieServiceSegment = network.segments[1]!;

  const overall: IAutoMoviePropBox = serviceSegmentBounds(coldRun);
  TestValidator.equals(
    "a run's overall bound is its extremes grown by its radius",
    namedFacts([
      [
        "min",
        (): boolean => vclose(overall.min, { x: 3.475, y: 2.475, z: 0.975 }, 1e-12),
      ],
      [
        "max",
        (): boolean => vclose(overall.max, { x: 8.025, y: 2.525, z: 1.025 }, 1e-12),
      ],
    ]),
    { min: true, max: true },
  );
  TestValidator.predicate(
    "a run with no route has no bound to give",
    throwsError(
      (): IAutoMoviePropBox => serviceSegmentBounds(segment({ id: "ghost", route: [] })),
      ['"ghost" has no route'],
    ),
  );

  const spans: IAutoMoviePropBox[] = serviceSegmentSpanBounds(coldBranch);
  TestValidator.equals(
    "each leg of a turning run carries its own volume",
    namedFacts([
      ["legCount", (): boolean => spans.length === 2],
      [
        "firstMin",
        (): boolean => vclose(spans[0]!.min, { x: 0.98, y: 2.48, z: 0.98 }, 1e-12),
      ],
      [
        "firstMax",
        (): boolean => vclose(spans[0]!.max, { x: 3.52, y: 2.52, z: 1.02 }, 1e-12),
      ],
      [
        "secondMin",
        (): boolean => vclose(spans[1]!.min, { x: 0.98, y: 0.88, z: 0.98 }, 1e-12),
      ],
      [
        "secondMax",
        (): boolean => vclose(spans[1]!.max, { x: 1.02, y: 2.52, z: 1.02 }, 1e-12),
      ],
      [
        "singleVertexHasNoLeg",
        (): boolean =>
          serviceSegmentSpanBounds(segment({ route: [{ x: 1, y: 2, z: 3 }] }))
            .length === 0,
      ],
    ]),
    {
      legCount: true,
      firstMin: true,
      firstMax: true,
      secondMin: true,
      secondMax: true,
      singleVertexHasNoLeg: true,
    },
  );

  const ahu: IAutoMoviePropBox | null = serviceMaintenanceBounds(network.nodes[5]!);
  TestValidator.equals(
    "an access volume travels with the equipment that needs it",
    namedFacts([
      ["present", (): boolean => ahu !== null],
      [
        "min",
        (): boolean => ahu !== null && vclose(ahu.min, { x: 7.5, y: 0.2, z: 4 }, 1e-12),
      ],
      [
        "max",
        (): boolean => ahu !== null && vclose(ahu.max, { x: 8.5, y: 3, z: 5 }, 1e-12),
      ],
      [
        "absentWhereUnneeded",
        (): boolean => serviceMaintenanceBounds(network.nodes[9]!) === null,
      ],
    ]),
    { present: true, min: true, max: true, absentWhereUnneeded: true },
  );

  TestValidator.equals(
    "obstruction is interior overlap, not contact",
    namedFacts([
      [
        "inside",
        (): boolean =>
          serviceEnvelopeObstructions({
            network,
            bounds: box([8, 1, 4.2], [8.2, 2, 4.4]),
          }).join() === "ahu",
      ],
      [
        "panel",
        (): boolean =>
          serviceEnvelopeObstructions({
            network,
            bounds: box([8.2, 1, 2.5], [8.4, 2, 2.8]),
          }).join() === "panel",
      ],
      [
        "face",
        (): boolean =>
          serviceEnvelopeObstructions({
            network,
            bounds: box([8.5, 1, 4.2], [9, 2, 4.4]),
          }).length === 0,
      ],
      [
        "both",
        (): boolean =>
          serviceEnvelopeObstructions({
            network,
            bounds: box([8.2, 1, 2.5], [8.6, 2, 4.2]),
          }).join() === "panel,ahu",
      ],
      [
        "away",
        (): boolean =>
          serviceEnvelopeObstructions({
            network,
            bounds: box([0, 0, 0], [0.5, 0.5, 0.5]),
          }).length === 0,
      ],
    ]),
    { inside: true, panel: true, face: true, both: true, away: true },
  );

  const lane: IAutoMovieVector3 = { x: 8, y: 2.5, z: 1 };
  const crossed: IAutoMovieServiceNetwork = withSleeve(
    withSleeve(
      withSegment(
        withPort(
          withPort(network, "hot-main-out", (port: IAutoMovieServicePort): IAutoMovieServicePort => ({
            ...port,
            position: lane,
          })),
          "basin-hot",
          (port: IAutoMovieServicePort): IAutoMovieServicePort => ({ ...port, position: { x: 1, y: 0.9, z: 1 } }),
        ),
        "hot-run",
        (run: IAutoMovieServiceSegment): IAutoMovieServiceSegment => ({
          ...run,
          route: [
            { x: 8, y: 2.5, z: 1 },
            { x: 1, y: 2.5, z: 1 },
            { x: 1, y: 0.9, z: 1 },
          ],
        }),
      ),
      "hot-plant-hall",
      (sleeve: IAutoMovieServicePenetration): IAutoMovieServicePenetration => ({ ...sleeve, position: { x: 7, y: 2.5, z: 1 } }),
    ),
    "hot-bath-hall",
    (sleeve: IAutoMovieServicePenetration): IAutoMovieServicePenetration => ({ ...sleeve, position: { x: 4, y: 2.5, z: 1 } }),
  );
  const clashed: IAutoMovieValidation = validateServiceNetwork({ network: crossed, environment });
  TestValidator.equals(
    "sharing a lane clashes, sharing a fitting does not",
    namedFacts([
      ["clean", (): boolean => serviceSegmentClashes(network).length === 0],
      [
        "onePair",
        (): boolean =>
          serviceSegmentClashes(crossed)
            .map((clash: ReturnType<typeof serviceSegmentClashes>[number]): string => `${clash.left}/${clash.right}`)
            .join() === "cold-run/hot-run",
      ],
      [
        "reported",
        (): boolean => hasViolation(clashed, "physics", "$input.segments[0].route"),
      ],
      ["onlyDefect", (): boolean => violationCount(clashed) === 1],
      [
        "degenerateRouteIgnored",
        (): boolean =>
          serviceSegmentClashes({
            ...network,
            segments: [
              ...network.segments,
              segment({ id: "stub", route: [{ x: 1, y: 2.5, z: 1 }] }),
            ],
          }).length === 0,
      ],
    ]),
    {
      clean: true,
      onePair: true,
      reported: true,
      onlyDefect: true,
      degenerateRouteIgnored: true,
    },
  );

  const blocked: IAutoMovieServiceNetwork = withNode(network, "ahu", (node: IAutoMovieServiceNode): IAutoMovieServiceNode => ({
    ...node,
    maintenance: {
      min: { x: -0.5, y: -2.5, z: -2 },
      max: { x: 0.5, y: 0.3, z: 0.5 },
    },
  }));
  const obstruction: IAutoMovieValidation = validateServiceNetwork({ network: blocked, environment });
  TestValidator.equals(
    "a run crossing an access volume it does not feed is refused",
    namedFacts([
      [
        "reported",
        (): boolean =>
          hasViolation(obstruction, "physics", "$input.nodes[5].maintenance"),
      ],
      ["onlyDefect", (): boolean => violationCount(obstruction) === 1],
      [
        "ownFeedExempt",
        (): boolean =>
          obstruction.success === false &&
          obstruction.violations.every((item: IAutoMovieConstraintViolation): boolean => item.value !== "air-run"),
      ],
    ]),
    { reported: true, onlyDefect: true, ownFeedExempt: true },
  );
}
