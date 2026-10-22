import {
  type IAutoMovieRecoverySectionsInput,
  type IAutoMovieRecoverySlabObservation,
  type IAutoMovieRecoverySourceLineage,
  observeAutoMovieRecoverySections,
} from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * Exact cut-emitting provenance binds a real one-to-two source branch without changing saved curves.
 *
 * Scenarios:
 * 1. A closed height-field solid with two peaks has one lower loop, two upper loops and one regular saddle at (0,1,0).
 * 2. Acquisition ports bind those three fitted curves to one orientable genus-zero component with three boundary cycles.
 * 3. A triangle touching a cut-chain endpoint appears in broad incidence but cannot become that chain's exact port support.
 * 4. Mutating delivered lineage copies cannot corrupt slab ownership or curve output.
 * 5. Slab-observer exceptions, cooperative abort and invalid bounds produce explicit terminal outcomes.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the public fixed-section observer with finite slab pairs, asserts exact face provenance, real branch topology, critical link counts and brackets, publication identities, unchanged coefficient output and callback failure/cancellation.
 * @evidence contracts/testing.md#independent-expectations The authored top graph has two Y=3 peaks separated by a Y=1 saddle, with every outer boundary at Y=0 and a closed Y=-1 floor. Thus Y=0.5 cuts one island and Y=1.5 cuts two, while the connecting surface has three boundary cycles and Euler characteristic -1. A second triangle meeting only a chain endpoint cannot emit that chain's segment; original face 0 alone supplies it.
 * @evidence contracts/testing.md#distinguishing-cases Covers regular manifold branching, exact-versus-star provenance, a source point contact, callback copy mutation, malformed interval selection, observer failure and cancellation. It does not claim material phase correspondence, physical transverse jets or geometric embedding; existing curve and fixed-section tests own polynomial and frame arithmetic.
 * @evidence contracts/testing.md#execution-ownership The portable test_recovery_source_slabs entry creates one tiny generic CPU solid and a two-triangle contact fixture, with no Human data, acquisition program, native host, GPU, filesystem or subprocess; execution belongs to the central runner.
 */
export function test_recovery_source_slabs(): void {
  const vertices: IAutoMovieRecoverySectionsInput["verticesMm"] = [];
  for (const z of [-1, 0, 1])
    for (const x of [-2, -1, 0, 1, 2])
      vertices.push([
        x,
        z === 0 ? (Math.abs(x) === 1 ? 3 : x === 0 ? 1 : 0) : 0,
        z,
      ]);
  for (let i: number = 0; i < 15; i++)
    vertices.push([vertices[i]![0], -1, vertices[i]![2]]);
  const triangles: IAutoMovieRecoverySectionsInput["triangles"] = [];
  for (let j: number = 0; j < 2; j++)
    for (let i: number = 0; i < 4; i++) {
      const a: number = 5 * j + i,
        b: number = a + 1,
        d: number = a + 5,
        c: number = d + 1;
      triangles.push(
        [a, d, b],
        [b, d, c],
        [a + 15, b + 15, d + 15],
        [b + 15, c + 15, d + 15],
      );
    }
  const boundary: number[] = [0, 1, 2, 3, 4, 9, 14, 13, 12, 11, 10, 5];
  for (let i: number = 0; i < boundary.length; i++) {
    const a: number = boundary[i]!,
      b: number = boundary[(i + 1) % boundary.length]!;
    triangles.push([a, b, b + 15], [a, b + 15, a + 15]);
  }
  const input: IAutoMovieRecoverySectionsInput = {
    name: "generic-branch",
    verticesMm: vertices,
    triangles,
    axis: [0, 1, 0],
    reference: [1, 0, 0],
    coordinatesMm: [0.5, 1.5],
    toleranceMm: 0.001,
    maxSpans: 128,
    exactCoordinateAliases: false,
    sourceOrientationSign: 1,
    cornerDegrees: 45,
  };
  const baseline: ReturnType<
    typeof observeAutoMovieRecoverySections<"hermite">
  > = observeAutoMovieRecoverySections(input, { curveFormat: "hermite" });
  const slabs: IAutoMovieRecoverySlabObservation[] = [];
  const observed: ReturnType<
    typeof observeAutoMovieRecoverySections<"hermite">
  > = observeAutoMovieRecoverySections(
    { ...input, slabPairs: [{ beforeMm: 0.5, afterMm: 1.5 }] },
    {
      curveFormat: "hermite",
      onSourceLineage: (record: IAutoMovieRecoverySourceLineage): void => {
        (record.exactSourceTriangleIds as number[] | undefined)?.fill(-1);
      },
      onSourceSlab: (record: IAutoMovieRecoverySlabObservation): void => {
        slabs.push(record);
      },
    },
  );
  if (!("value" in observed) || !("value" in baseline))
    throw new Error("A closed generic branch must retain fitted curves");
  TestValidator.equals(
    "source-slab observation leaves coefficients unchanged",
    JSON.stringify(observed.value),
    JSON.stringify(baseline.value),
  );
  TestValidator.equals(
    "one lower and two upper branches",
    observed.value.sections.map(
      (section: (typeof observed.value.sections)[number]): number =>
        section.loops.length,
    ),
    [1, 2],
  );
  TestValidator.equals("one requested slab delivered", slabs.length, 1);
  const slab: IAutoMovieRecoverySlabObservation = slabs[0]!;
  TestValidator.equals(
    "one connected branch surface",
    slab.components.length,
    1,
  );
  TestValidator.equals(
    "pair-of-pants Euler characteristic",
    slab.components[0]!.topology.euler,
    -1,
  );
  TestValidator.equals(
    "three real boundary cycles",
    slab.components[0]!.cycles.length,
    3,
  );
  TestValidator.predicate(
    "source topology is manifold and orientable",
    slab.components[0]!.topology.manifold &&
      slab.components[0]!.topology.orientable === true,
  );
  TestValidator.equals("three actual source ports", slab.ports.length, 3);
  TestValidator.equals(
    "one lower source port",
    slab.ports.filter(
      (port: (typeof slab.ports)[number]): boolean => port.side === "before",
    ).length,
    1,
  );
  TestValidator.equals(
    "two upper source ports",
    slab.ports.filter(
      (port: (typeof slab.ports)[number]): boolean => port.side === "after",
    ).length,
    2,
  );
  for (const port of slab.ports) {
    TestValidator.equals(
      "exact port has unique source ownership",
      port.status,
      "unique-component",
    );
    TestValidator.equals(
      "actual port names a fitted closed curve",
      port.publication.kind,
      "closed",
    );
    TestValidator.predicate(
      "delivered lineage mutation cannot change private support",
      port.exactSourceTriangleIds.length > 0 &&
        port.exactSourceTriangleIds.every((face: number): boolean => face >= 0),
    );
  }
  TestValidator.equals("one actual source saddle", slab.events.length, 1);
  const saddle: (typeof slab.events)[number] = slab.events[0]!;
  TestValidator.equals(
    "saddle link components",
    [saddle.lowerComponents, saddle.upperComponents],
    [2, 2],
  );
  TestValidator.predicate(
    "saddle point is the observed central vertex",
    nclose(saddle.pointMm[0], 0, 1e-12) &&
      nclose(saddle.pointMm[1], 1, 1e-12) &&
      nclose(saddle.pointMm[2], 0, 1e-12),
  );
  TestValidator.predicate(
    "real saddle and physical bracket qualify",
    saddle.qualified &&
      saddle.beforeMm !== null &&
      saddle.afterMm !== null &&
      saddle.beforeMm < 1 &&
      saddle.afterMm > 1,
  );
  const contacts: IAutoMovieRecoverySectionsInput = {
    ...input,
    name: "endpoint-contact",
    coordinatesMm: [0, 0.5],
    verticesMm: [
      [0, 0, 0],
      [-2, -1, 0],
      [1, 1, 0],
      [0, 1, 1],
      [1, 1, 1],
    ],
    triangles: [
      [0, 1, 2],
      [0, 3, 4],
    ],
    slabPairs: [{ beforeMm: 0, afterMm: 0.5 }],
  };
  const contactLineage: IAutoMovieRecoverySourceLineage[] = [];
  const contactSlabs: IAutoMovieRecoverySlabObservation[] = [];
  const contacted: ReturnType<
    typeof observeAutoMovieRecoverySections<"hermite">
  > = observeAutoMovieRecoverySections(contacts, {
    curveFormat: "hermite",
    onSourceLineage: (record: IAutoMovieRecoverySourceLineage): void => {
      contactLineage.push(record);
    },
    onSourceSlab: (record: IAutoMovieRecoverySlabObservation): void => {
      contactSlabs.push(record);
    },
  });
  if (!("value" in contacted))
    throw new Error(
      "A point-contact source must retain its partial observations",
    );
  const chain: IAutoMovieRecoverySourceLineage | undefined =
    contactLineage.find(
      (record: IAutoMovieRecoverySourceLineage): boolean =>
        record.coordinateMm === 0 && record.publication.kind === "open",
    );
  if (!chain)
    throw new Error("The lower cut must publish the actual open chain");
  TestValidator.equals(
    "endpoint star retains both incident faces",
    chain.sourceTriangleIds,
    [0, 1],
  );
  TestValidator.equals(
    "exact cut provenance excludes merely touching face",
    chain.exactSourceTriangleIds,
    [0],
  );
  const port: IAutoMovieRecoverySlabObservation["ports"][number] | undefined =
    contactSlabs[0]!.ports.find(
      (
        candidate: IAutoMovieRecoverySlabObservation["ports"][number],
      ): boolean =>
        candidate.side === "before" && candidate.publication.kind === "open",
    );
  TestValidator.equals(
    "exact source port remains unique",
    port?.status,
    "unique-component",
  );
  TestValidator.equals(
    "slab uses emitted face rather than endpoint star",
    port?.exactSourceTriangleIds,
    [0],
  );
  const failed: ReturnType<typeof observeAutoMovieRecoverySections<"hermite">> =
    observeAutoMovieRecoverySections(
      { ...input, slabPairs: [{ beforeMm: 0.5, afterMm: 1.5 }] },
      {
        curveFormat: "hermite",
        onSourceSlab: (): void => {
          throw new Error("source slab callback failed");
        },
      },
    );
  TestValidator.equals(
    "slab observer exception fails operation",
    failed.status,
    "failed",
  );
  TestValidator.equals(
    "slab observer failure remains visible",
    failed.diagnostics,
    ["source slab callback failed"],
  );
  TestValidator.predicate(
    "observer failure publishes no value",
    !("value" in failed),
  );
  const controller: AbortController = new AbortController();
  let delivered: number = 0;
  const cancelled: ReturnType<
    typeof observeAutoMovieRecoverySections<"hermite">
  > = observeAutoMovieRecoverySections(
    {
      ...input,
      coordinatesMm: [0.5, 1.5, 2],
      slabPairs: [
        { beforeMm: 0.5, afterMm: 1.5 },
        { beforeMm: 1.5, afterMm: 2 },
      ],
    },
    {
      curveFormat: "hermite",
      signal: controller.signal,
      onSourceSlab: (): void => {
        delivered++;
        controller.abort();
      },
    },
  );
  TestValidator.equals(
    "slab callback cancellation accepted",
    cancelled.status,
    "cancelled",
  );
  TestValidator.equals("cancellation stops slab delivery", delivered, 1);
  for (const slabPairs of [
    [{ beforeMm: 1.5, afterMm: 0.5 }],
    [{ beforeMm: 0.5, afterMm: 1 }],
    [{ beforeMm: Number.NaN, afterMm: 1.5 }],
  ]) {
    const refused: ReturnType<
      typeof observeAutoMovieRecoverySections<"hermite">
    > = observeAutoMovieRecoverySections(
      { ...input, slabPairs },
      { curveFormat: "hermite" },
    );
    TestValidator.equals(
      "invalid slab selection refused",
      refused.status,
      "refused",
    );
  }
}
