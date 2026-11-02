import { AutoMovieHumanSurfaceNormalBlend } from "../../../../packages/human/src/generation/AutoMovieHumanSurfaceNormalBlend";
import { HumanFixtureAudit } from "../internal/HumanFixtureAudit";

/**
 * Sparse normal mixing keeps synchronous passes and untouched neighbours.
 *
 * Scenarios:
 * 1. Two unit normals exchange exactly in one simultaneous pass and return in two.
 * 2. An inactive vertex still contributes through a directed neighbour edge.
 * 3. Empty neighbours, a rejected fold, zero resultant and zero passes preserve values.
 * 4. Two real one-node production passes form a sequential-update negative control against the independent simultaneous exchange.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the production compact-buffer blend and reads all returned normals. The explicit sequential-update defect collapses the two-node exchange to one direction and is rejected; active-to-inactive edges and skipped writes catch compact-index and stale-buffer errors.
 * @evidence contracts/testing.md#independent-expectations At unit mixing weight a single neighbour supplies its own unit normal, so synchronous exchange yields [Y,X] while the sequential defect yields [Y,Y]. A two-pass exchange returns the input. A zero resultant cannot be normalized and a fold below the supplied dot threshold is excluded by the declared operator.
 * @evidence contracts/testing.md#distinguishing-cases Covers zero, one, two and sixteen passes, empty active and neighbour sets, one-way edges, inactive sources, fold rejection, cancellation, and immutable input. This pins an existing display-normal operator, not anatomical smoothness or acceptance of post-hoc surface repair.
 * @evidence contracts/testing.md#execution-ownership A portable synchronous CPU unit using a few literal normals, with no person, host, process, browser or GPU.
 */
export function test_human_surface_normal_blend(): void {
  /** Every graph operator runs independently before the final diagnostic. */
  const audit: HumanFixtureAudit = new HumanFixtureAudit(
    "sparse-directed-normal-graph",
    "surface-normal-blend",
  );
  /** Literal input exposes accidental writes to caller-owned normals. */
  const source: number[] = [1, 0, 0, 0, 1, 0];
  /** The two directed edges define a simultaneous exchange. */
  const graph: Map<number, Set<number>> = new Map([
    [0, new Set([1])],
    [1, new Set([0])],
  ]);
  /** Each operation remains lazy until its own exception-collecting case. */
  const cases: {
    label: string;
    passes: number;
    expected: readonly number[];
    perform: () => readonly number[];
  }[] = [
    {
      label: "simultaneous exchange",
      passes: 1,
      expected: [0, 1, 0, 1, 0, 0],
      perform: (): number[] =>
        AutoMovieHumanSurfaceNormalBlend.apply(source, [1, 1], graph, 1, -1),
    },
    ...[0, 2, 16].map(
      (
        passes: number,
      ): {
        label: string;
        passes: number;
        expected: readonly number[];
        perform: () => readonly number[];
      } => ({
        label: "even exchange preserves the source",
        passes,
        expected: source,
        perform: (): number[] =>
          AutoMovieHumanSurfaceNormalBlend.apply(
            source,
            [1, 1],
            graph,
            passes,
            -1,
          ),
      }),
    ),
    {
      label: "inactive neighbour remains readable",
      passes: 16,
      expected: [0, 1, 0, 0, 1, 0],
      perform: (): number[] =>
        AutoMovieHumanSurfaceNormalBlend.apply(
          source,
          [1, 0],
          new Map([[0, new Set([1])]]),
          16,
          -1,
        ),
    },
    {
      label: "fold exclusion",
      passes: 16,
      expected: source,
      perform: (): number[] =>
        AutoMovieHumanSurfaceNormalBlend.apply(source, [1, 1], graph, 16, 0.9),
    },
    {
      label: "empty neighbour set",
      passes: 16,
      expected: source,
      perform: (): number[] =>
        AutoMovieHumanSurfaceNormalBlend.apply(
          source,
          [1, 1],
          new Map([[0, new Set()]]),
          16,
          -1,
        ),
    },
    {
      label: "empty active region",
      passes: 16,
      expected: source,
      perform: (): number[] =>
        AutoMovieHumanSurfaceNormalBlend.apply(
          source,
          [1, 1],
          new Map(),
          16,
          -1,
        ),
    },
    {
      label: "zero resultant preserves the prior normal",
      passes: 16,
      expected: [1, 0, 0, -1, 0, 0],
      perform: (): number[] =>
        AutoMovieHumanSurfaceNormalBlend.apply(
          [1, 0, 0, -1, 0, 0],
          [0.5, 0.5],
          graph,
          16,
          -1,
        ),
    },
    {
      label: "input is immutable",
      passes: 0,
      expected: [1, 0, 0, 0, 1, 0],
      perform: (): number[] => source,
    },
  ];
  for (const fixture of cases)
    audit.run(
      {
        scenario: fixture.label,
        passes: fixture.passes,
        direction: "flat world XYZ normal triples",
        coordinates: source,
      },
      (): void =>
        compare(
          audit,
          fixture.perform(),
          fixture.expected,
          fixture.label,
          fixture.passes,
        ),
    );
  audit.run(
    {
      scenario: "sequential-update negative control",
      vertex: 1,
      direction: "normal X",
      coordinates: source,
      passes: 1,
    },
    (): void => {
      /** A one-node production pass consumes the old neighbour before the next pass. */
      const first: number[] = AutoMovieHumanSurfaceNormalBlend.apply(
        source,
        [1, 1],
        new Map([[0, new Set([1])]]),
        1,
        -1,
      );
      /** A second one-node production pass reads the already-updated first node. */
      const sequential: number[] = AutoMovieHumanSurfaceNormalBlend.apply(
        first,
        [1, 1],
        new Map([[1, new Set([0])]]),
        1,
        -1,
      );
      audit.scope({
        scenario: "sequential-update negative control",
        vertex: 1,
        direction: "normal X",
        coordinates: sequential.slice(3),
        passes: [1, 1],
        allNormals: sequential,
      });
      audit.reject(
        "actual sequential consumer differs from independent simultaneous exchange",
        sequential[3]!,
        1,
        1e-12,
        "unit normal component",
      );
    },
  );
  audit.finish();
}

/** Record every actual normal coordinate and direction before the test's final failure. */
function compare(
  audit: HumanFixtureAudit,
  actual: readonly number[],
  expected: readonly number[],
  label: string,
  passes: number,
): void {
  audit.scope({
    scenario: label,
    passes,
    direction: "flat world XYZ normal triples",
    coordinates: actual,
  });
  audit.vector(label, actual, expected, 1e-12, "unit normal component");
}
