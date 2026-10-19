import { TestValidator } from "@nestia/e2e";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { createAutoMovieRecoveryArtifact, writeAutoMovieRecoveryArtifact } from "@automovie/recovery/node";

import { createBicubicPlaneRecipe } from "../internal/createBicubicPlaneRecipe";

/**
 * Artifact publication owns immutable bytes, their hash and exception cleanup.
 * Scenarios:
 * 1. A plain nested record round-trips exact UTF-8 JSON bytes with an independently computed hash.
 * 2. An attempted overwrite fails and preserves the earlier publication.
 * 3. A cycle fails after writing begins, then the same destination supports a clean new publication.
 * 4. Bound array fragments retain their values; a wrong byte hash fails before publication and allows retry.
 * 5. Pure artifact metadata distinguishes attempted completion from missing, failed or zero generated domains and exact planned/observed tensor identity populations.
 *
 * @evidence contracts/testing.md#behavioral-verification Publishes into an owned temporary directory and reads the actual bytes, independently hashes them, attempts an immutable overwrite, triggers cycle and fragment-hash failures and successfully retries each failed destination. Pure metadata calls over a general square and empty observation ledger distinguish an ended attempt from domain completeness, including zero geometry, omissions, failed pairs, unresolved groups and missing/duplicate/extra family reports. It catches false hash or completion receipts and leaked partial publication.
 * @evidence contracts/testing.md#independent-expectations JSON.stringify of independently authored data defines encoding and order; Node SHA-256 supplies the byte oracle. A new immutable destination may be published once; failed staging must permit retry. Completion requires a nonempty generated domain, every planned pair and exactly the planned unique tensor IDs with complete reports; an ended attempt alone proves none of those facts. These assertions certify no shape or source fit and simulate no process termination.
 * @evidence contracts/testing.md#distinguishing-cases Covers UTF-8 arrays, immutable overwrite, cyclic staged failure, valid/invalid fragment hashes and retry, plus complete/checkpoint/zero/failure/omission/unresolved metadata twins and missing/duplicate/extra tensor IDs. Geometry algorithms, source isolation and filesystem crash durability are outside this test.
 * @evidence contracts/testing.md#execution-ownership The entry calls generic publication and pure artifact metadata with a mathematical square and empty curve ledger; extraction, fitting and reconstruction are never invoked. Its temporary files are removed in finally. It starts no process/browser/GPU/build and uses no Human figure or fixture.
 */
export function test_geometry_artifact_publication(): void {
  const directory: string = fs.mkdtempSync(
    path.join(os.tmpdir(), "automovie-artifact-"),
  );
  const first: string = path.join(directory, "first.json"),
    failed: string = path.join(directory, "failed.json"),
    fragment: string = path.join(directory, "fragment.json"),
    assembled: string = path.join(directory, "assembled.json");
  const refuses: (operation: () => void) => boolean = (
    operation: () => void,
  ): boolean => {
    try {
      operation();
      return false;
    } catch (error) {
      return error instanceof Error;
    }
  };
  try {
    const value: {
      text: string;
      numeric: number[];
      nested: { active: boolean; absent: null };
    } = {
      text: 'curves π\\"\n',
      numeric: [0, 1 / 3, -2],
      nested: { active: true, absent: null },
    };
    const publication: ReturnType<typeof writeAutoMovieRecoveryArtifact> =
      writeAutoMovieRecoveryArtifact(first, value);
    const bytes: Buffer = fs.readFileSync(first);
    TestValidator.equals(
      "exact plain JSON encoding",
      bytes.toString("utf8"),
      JSON.stringify(value),
    );
    TestValidator.equals(
      "actual UTF-8 byte count",
      publication.bytes,
      bytes.length,
    );
    TestValidator.equals(
      "independent byte hash",
      publication.sha256,
      createHash("sha256").update(bytes).digest("hex"),
    );
    TestValidator.predicate(
      "immutable overwrite refuses",
      refuses((): void => {
        writeAutoMovieRecoveryArtifact(first, { replacement: true });
      }),
    );
    TestValidator.equals(
      "old bytes survive overwrite",
      fs.readFileSync(first).toString("utf8"),
      bytes.toString("utf8"),
    );

    const cycle: { prefix: number[]; self?: object } = {
      prefix: Array.from(
        { length: 20000 },
        (_: unknown, i: number): number => i,
      ),
    };
    cycle.self = cycle;
    TestValidator.predicate(
      "cycle refuses after staged prefix",
      refuses((): void => {
        writeAutoMovieRecoveryArtifact(failed, cycle);
      }),
    );
    writeAutoMovieRecoveryArtifact(failed, { recovered: true });
    TestValidator.equals(
      "failed destination retries cleanly",
      fs.readFileSync(failed).toString("utf8"),
      '{"recovered":true}',
    );

    const fragmentPublication: ReturnType<typeof writeAutoMovieRecoveryArtifact> =
      writeAutoMovieRecoveryArtifact(fragment, [1, 2, 3]);
    const placeholder: unknown[] = [];
    const sources: Map<
      readonly unknown[],
      readonly { path: string; sha256: string; items: number }[]
    > = new Map([
      [placeholder, [{ path: fragment, sha256: "0".repeat(64), items: 3 }]],
    ]);
    TestValidator.predicate(
      "wrong fragment byte hash refuses",
      refuses((): void => {
        writeAutoMovieRecoveryArtifact(assembled, { values: placeholder }, sources);
      }),
    );
    sources.set(placeholder, [
      { path: fragment, sha256: fragmentPublication.sha256, items: 3 },
    ]);
    writeAutoMovieRecoveryArtifact(assembled, { values: placeholder }, sources);
    TestValidator.equals(
      "bound fragment preserves values",
      fs.readFileSync(assembled).toString("utf8"),
      '{"values":[1,2,3]}',
    );
    TestValidator.equals(
      "only complete owned publications remain",
      fs
        .readdirSync(directory)
        .sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0)),
      ["assembled.json", "failed.json", "first.json", "fragment.json"],
    );
  } finally {
    for (const name of fs.readdirSync(directory))
      fs.unlinkSync(path.join(directory, name));
    fs.rmdirSync(directory);
  }
  type Input = Parameters<typeof createAutoMovieRecoveryArtifact>[0];
  const mesh: Input["spool"]["mesh"] = {
    positions: [0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0],
    indices: [0, 1, 2, 0, 2, 3],
    normals: null,
    uvs: null,
    skin: null,
  };
  const input: Input = {
    base: {
      model: {
        id: "square",
        name: null,
        origin: "generated",
        parts: [
          {
            id: "square",
            name: null,
            geometry: { type: "mesh", mesh },
            material: null,
            attachedBone: null,
            transform: null,
          },
        ],
        skeleton: null,
        body: null,
        materials: [],
        asset: null,
      },
      construction: [],
      diagnostics: [],
      unresolved: [],
      stripObservations: [],
      primitiveRanges: [],
      interactionObservations: [],
      tensorReports: [],
      analyticReports: [],
    },
    spool: {
      mesh,
      construction: [],
      ownership: [],
      counts: { vertices: 4, triangles: 2, chunks: 0 },
      append: (): never => {
        throw new Error("Metadata cannot append geometry");
      },
      commit: (): never => {
        throw new Error("Metadata cannot commit a frontier");
      },
      publish: (): never => {
        throw new Error("Metadata cannot publish files");
      },
    },
    bundle: {
      schema: "automovie-recovery-curves-v1",
      loft: { sections: [], events: [], intervals: [], chordToleranceMm: 1 },
      reports: [],
      diagnostics: [],
      topologyGaps: [],
      unconsumedEvents: [],
      summary: {
        observations: 0,
        spans: 0,
        sections: 0,
        events: 0,
        aliases: 0,
      },
      policy: {
        axis: [0, 1, 0],
        reference: [1, 0, 0],
        stepMm: 1,
        toleranceMm: 1,
        chordToleranceMm: 1,
        maxSections: 2,
        maxSpans: 1,
        exactCoordinateAliases: false,
        sourceOrientationSign: 1,
        cornerDegrees: 90,
      },
    },
    graph: {
      schema: "automovie-recovery-open-continuation-v1",
      criticalPolicy: "boundary-regular-path-v1",
      intervals: [],
      orientations: [],
      diagnostics: [],
      resolutionMm: 1,
      maxVerticesPerRun: 4,
    },
    binding: {
      sourceEpoch: "generic-metadata",
      curveBundleSha256: "0".repeat(64),
      continuationSha256: "1".repeat(64),
      operator: "ruled",
    },
    runs: [],
    pairs: 0,
    completedPairs: 0,
    failedRunPairs: 0,
    omittedIntervals: 0,
    unsupportedGroups: 0,
    unsupportedGroupsWithOpenArcs: 0,
    publishedPairs: 0,
    complete: true,
    started: performance.now(),
    output: "generic-square.json",
    counts: (): { vertices: number; triangles: number } => ({
      vertices: 4,
      triangles: mesh.indices!.length / 3,
    }),
    memory: (): NodeJS.MemoryUsage => process.memoryUsage(),
    peaks: (): { heap: number; rss: number } => ({ heap: 0, rss: 0 }),
  };
  const coverage: (
    value: Input,
  ) => ReturnType<typeof createAutoMovieRecoveryArtifact>["coverage"] = (
    value: Input,
  ): ReturnType<typeof createAutoMovieRecoveryArtifact>["coverage"] =>
    createAutoMovieRecoveryArtifact(value).coverage;
  TestValidator.predicate(
    "complete finite declared domain",
    coverage(input).attemptComplete &&
      coverage(input).processingComplete &&
      coverage(input).retainedDomainComplete,
  );
  TestValidator.predicate(
    "checkpoint is not completed processing",
    !coverage({ ...input, complete: false }).processingComplete,
  );
  const missing: Input[] = [
    {
      ...input,
      counts: (): { vertices: number; triangles: number } => ({
        vertices: 0,
        triangles: 0,
      }),
    },
    { ...input, pairs: 1 },
    { ...input, failedRunPairs: 1 },
    { ...input, omittedIntervals: 1 },
    { ...input, unsupportedGroups: 1 },
    {
      ...input,
      base: {
        ...input.base,
        unresolved: [
          {
            beforeMm: 0,
            afterMm: 1,
            incoming: 1,
            outgoing: 0,
            reason: "declared gap",
          },
        ],
      },
    },
  ];
  for (const value of missing)
    TestValidator.predicate(
      "an ended partial attempt never promotes processing",
      coverage(value).attemptComplete &&
        !coverage(value).processingComplete &&
        !coverage(value).retainedDomainComplete,
    );
  input.bundle.tensorFamilies = ["a", "b"].map(
    (id: string): NonNullable<Input["bundle"]["tensorFamilies"]>[number] => ({
      id,
      geometry: createBicubicPlaneRecipe(),
      replacedGroups: [],
      boundaries: [],
    }),
  );
  const report: (id: string) => Input["base"]["tensorReports"][number] = (
    id: string,
  ): Input["base"]["tensorReports"][number] => ({
    id,
    delegatedGroups: [],
    endCurves: [],
    complete: true,
    approximationQualified: false,
    counts: {
      retainedCoarseCells: 0,
      omittedZeroAreaTriangles: 0,
      unresolvedVertexNormals: 0,
      maxErrorBoundMm: 0,
    },
    primitiveRanges: [],
    diagnostics: [],
  });
  for (const ids of [["a"], ["a", "a"], ["a", "extra"]]) {
    input.base.tensorReports = ids.map(report);
    TestValidator.predicate(
      "missing duplicate or extra family is incomplete",
      !coverage(input).processingComplete,
    );
  }
  input.base.tensorReports = [report("b"), report("a")];
  TestValidator.predicate(
    "exact tensor identity population is order independent",
    coverage(input).processingComplete,
  );
  input.base.tensorReports[0].complete = false;
  TestValidator.predicate(
    "a reported partial family remains incomplete",
    !coverage(input).processingComplete,
  );
}
