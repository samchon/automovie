import { FamilyConicCaptureTransport as Transport } from "../../../reference-conics/FamilyConicCaptureTransport";
import { FamilyConicCaseIdentity as Identity } from "../../../reference-conics/FamilyConicCaseIdentity";

/**
 * Recorded source-only inputs bind the same exact fields to a separately identified current observation.
 *
 * Scenarios:
 * 1. A valid exact old/current bridge returns the selected object and fields unchanged.
 * 2. Changed ids, actual/declared fields, old bytes, source scopes, unknown drift and unproven outcomes are refused.
 * 3. Recorded source-only evidence cannot authorize a full-case capture.
 * 4. Actual submitted input points convert mm to metres; increasing/decreasing phase order is retained, while missing points, zero steps and direction changes split the sequence without closure or invented seam curves.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the shared transport admission/scope/point boundaries with made metadata, never a field converter, body constructor, solver, renderer or filesystem.
 * @evidence contracts/development/testing.md#independent-expectations Literal1000/2000/3000mm input points require1/2/3m display points; exact ids, byte digests and all changed source addresses distinguish the current observation from the old one.
 * @evidence contracts/development/testing.md#distinguishing-cases The valid selected-object counterpart accompanies independent metadata mismatches, unrestricted/source-only scopes and finite/missing point sequences.
 * @evidence contracts/development/testing.md#execution-ownership No generation or actual source/case artifact is executed; only finite JSON identities and recorded point arrays are observed.
 * @evidence contracts/development/common.md#meaningful-documentation Four numbered scenarios keep transport, source-only scope and sampled operator inputs separate from shape approval.
 */
export function test_human_capture_transport(): void {
  // The synthetic receipts identify the source layout at the time of capture.
  const recordedRoot: string = "packages/engine/src/geometry/construction";
  const files: string[] = [
    `${recordedRoot}/AutoMovieConstructionSeeds.ts`,
    `${recordedRoot}/AutoMovieConstructionSplitBand.ts`,
    `${recordedRoot}/index.ts`,
  ];
  const added: string[] = [
    `${recordedRoot}/AutoMovieConstructionSplitBandTrace.ts`,
    `${recordedRoot}/AutoMovieConstructionSeedTrace.ts`,
  ];
  const beforeHashes: Record<string, string> = Object.fromEntries(
    files.map((file: string): [string, string] => [file, "a".repeat(64)]),
  );
  beforeHashes["packages/human/src/untouched.ts"] = "c".repeat(64);
  const current: Record<string, string> = {
    ...beforeHashes,
    ...Object.fromEntries(
      [...files, ...added].map((file: string): [string, string] => [
        file,
        "b".repeat(64),
      ]),
    ),
  };
  const bridge: Transport.IBridge = {
    before: beforeHashes,
    current,
    changed: [...files, ...added].map(
      (file: string): Transport.IBridge["changed"][number] => ({
        file,
        before: beforeHashes[file] ?? null,
        after: current[file]!,
      }),
    ),
  };
  const fields: { width: number } = { width: 2 };
  const selected: { id: string; fields: typeof fields } = { id: "f1", fields };
  const prior: Transport.IClaim = {
    id: "f1",
    fields,
    fieldsHash: Identity.dataHash(fields),
    sourceHashes: beforeHashes,
  };
  const observed: Transport.IObserved = {
    ...prior,
    sourceHashes: current,
    originalCaseByteHash: "d".repeat(64),
    unchangedObservedOutcomes: true,
  };
  const failures: string[] = [];
  const check: (condition: boolean, message: string) => void = (
    condition: boolean,
    message: string,
  ): void => {
    if (!condition) failures.push(message);
  };
  const accepted: typeof selected = Transport.admit(
    selected,
    prior,
    observed,
    bridge,
    "d".repeat(64),
  );
  check(
    accepted === selected && accepted.fields === fields,
    "transport altered or replaced selected fields",
  );
  const refused: { name: string; run: () => unknown }[] = [
    {
      name: "forced alias",
      run: (): unknown =>
        Transport.admit(
          selected,
          prior,
          { ...observed, id: "forced-native-f1" },
          bridge,
          "d".repeat(64),
        ),
    },
    {
      name: "old actual fields",
      run: (): unknown =>
        Transport.admit(
          selected,
          { ...prior, fields: { width: 3 } },
          observed,
          bridge,
          "d".repeat(64),
        ),
    },
    {
      name: "observed actual fields",
      run: (): unknown =>
        Transport.admit(
          selected,
          prior,
          { ...observed, fields: { width: 3 } },
          bridge,
          "d".repeat(64),
        ),
    },
    {
      name: "declared fields hash",
      run: (): unknown =>
        Transport.admit(
          selected,
          prior,
          { ...observed, fieldsHash: "e".repeat(64) },
          bridge,
          "d".repeat(64),
        ),
    },
    {
      name: "old bytes",
      run: (): unknown =>
        Transport.admit(selected, prior, observed, bridge, "e".repeat(64)),
    },
    {
      name: "partial current scope",
      run: (): unknown =>
        Transport.admit(
          selected,
          prior,
          { ...observed, sourceHashes: beforeHashes },
          bridge,
          "d".repeat(64),
        ),
    },
    {
      name: "wrong recorded after",
      run: (): unknown =>
        Transport.admit(
          selected,
          prior,
          observed,
          {
            ...bridge,
            changed: bridge.changed.map(
              (change): Transport.IBridge["changed"][number] => ({
                ...change,
                after: "e".repeat(64),
              }),
            ),
          },
          "d".repeat(64),
        ),
    },
    {
      name: "unrecorded human drift",
      run: (): unknown =>
        Transport.admit(
          selected,
          prior,
          observed,
          {
            ...bridge,
            current: {
              ...current,
              "packages/human/src/untouched.ts": "e".repeat(64),
            },
          },
          "d".repeat(64),
        ),
    },
    {
      name: "unproven outcomes",
      run: (): unknown =>
        Transport.admit(
          selected,
          prior,
          { ...observed, unchangedObservedOutcomes: false },
          bridge,
          "d".repeat(64),
        ),
    },
    {
      name: "full capture from source-only evidence",
      run: (): void =>
        Transport.restrict(
          { evidenceScope: "recorded-input-source-only" },
          false,
        ),
    },
  ];
  for (const scenario of refused) {
    let threw: boolean = false;
    try {
      scenario.run();
    } catch {
      threw = true;
    }
    check(threw, "accepted invalid " + scenario.name);
  }
  try {
    Transport.restrict({}, false);
    Transport.restrict({ evidenceScope: "recorded-input-source-only" }, true);
  } catch {
    failures.push("valid capture scope was refused");
  }
  for (const [preflight, artifact] of [
    [{ evidenceScope: "recorded-input-source-only" }, {}],
    [{}, { evidenceScope: "recorded-input-source-only" }],
  ]) {
    let threw: boolean = false;
    try {
      Transport.restrict(preflight, true, artifact);
    } catch {
      threw = true;
    }
    check(threw, "catalog/preflight source-only scope mismatch was admitted");
  }
  const column: (x: number) => object = (x: number): object => ({
    start: { point: [x, 0, 0] },
    end: { point: [x, 1000, 0] },
  });
  const event: object = {
    owner: "join",
    event: {
      kind: "prepared",
      name: "band",
      childPhases: [0, 1, 2],
      columns: [column(1000), column(2000), column(3000)],
    },
  };
  const layer: Transport.ISubmitted = Transport.submitted([event], []);
  check(
    layer.curves.some(
      (curve): boolean =>
        curve.points.length === 3 &&
        curve.points[0]![0] === 1 &&
        curve.points[2]![0] === 3 &&
        !curve.closed,
    ),
    "actual submitted mm points or open sampled scope were lost",
  );
  const decreasing: Transport.ISubmitted = Transport.submitted(
    [
      {
        owner: "descending",
        event: {
          kind: "prepared",
          name: "band",
          childPhases: [2, 1, 0],
          columns: [column(1000), column(2000), column(3000)],
        },
      },
    ],
    [],
  );
  check(
    decreasing.curves.some(
      (curve): boolean =>
        curve.points.length === 3 &&
        curve.points[0]![0] === 1 &&
        curve.points[2]![0] === 3,
    ),
    "valid decreasing phase order was dropped or reordered",
  );
  for (const phases of [
    [0, 1, 0.5],
    [0, 0, 1],
    [0, NaN, 2],
  ]) {
    const damaged: Transport.ISubmitted = Transport.submitted(
      [
        {
          owner: "damaged",
          event: {
            kind: "prepared",
            name: "band",
            childPhases: phases,
            columns: [column(1000), column(2000), column(3000)],
          },
        },
      ],
      [],
    );
    check(
      damaged.curves.every((curve): boolean => curve.points.length < 3) &&
        damaged.unavailable.length > 0,
      "phase reversal/zero/nonfinite input was bridged",
    );
  }
  const missing: Transport.ISubmitted = Transport.submitted(
    [
      {
        owner: "missing",
        event: {
          kind: "prepared",
          name: "band",
          childPhases: [0, 1, 2],
          columns: [column(1000), null, column(3000)],
        },
      },
    ],
    [],
  );
  check(
    missing.curves.every((curve): boolean => curve.points.length < 3) &&
      missing.unavailable.length > 0,
    "missing recorded column was hidden or bridged",
  );
  const broken: object = {
    owner: "join",
    event: {
      kind: "prepared",
      name: "band",
      childPhases: [0, 1, 2],
      columns: [column(1000), column(NaN), column(3000)],
    },
  };
  const partial: Transport.ISubmitted = Transport.submitted(
    [broken],
    [
      {
        owner: "fan",
        index: 0,
        endpoints: [
          { fullPhysical2: { p: [0, 0, 0] } },
          { fullPhysical2: { p: [1000, 0, 0] } },
        ],
        knots: [{ alongMm: 500, depthMm: 100 }],
      },
    ],
  );
  check(
    partial.curves.every((curve): boolean => curve.points.length < 3),
    "missing submitted interval was bridged",
  );
  check(
    partial.unavailable.some((row): boolean => row.id.includes("start")) &&
      partial.unavailable.some((row): boolean => row.id.includes("fan")),
    "missing point or unrecorded seam world curve was hidden",
  );
  if (failures.length > 0) throw new Error(failures.join("\n"));
}
