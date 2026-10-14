import {
  type AutoMovieRepaintRawOutputDisposition,
  type IAutoMovieRepaintRawOutputPublication,
  type IAutoMovieRepaintRawOutputReceipt,
  assertAutoMovieRepaintRawOutput,
  planAutoMovieRepaintRawOutput,
  productionRepaintRawOutputReceiptPath,
} from "@automovie/production";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * Raw repaint bytes remain an immutable attempt-owned recovery source.
 *
 * Scenarios:
 *
 * 1. Candidate, invalid, partial, cancelled and over-budget output retain detached bytes with exact SHA-256 and attempt-owned addresses.
 * 2. Empty, oversized, changed or cross-attempt bytes are refused.
 * 3. Blank identity, foreign disposition, inexact instant and drifted receipt fields refuse while an exact stored receipt remains admitted.
 * 4. An otherwise exact forged empty receipt refuses through the public byte assertion; the adjacent singleton at its one-byte ceiling remains valid.
 *
 * @evidence contracts/testing.md#behavioral-verification Public raw planning, receipt addressing and byte assertion exercise detached retained-copy identity and rejection; source mutation leaves the retained copy intact, while changed supplied bytes, attempt or receipt metadata refuse, including a forged empty receipt. Returned copies remain caller-mutable rather than runtime-frozen.
 * @evidence contracts/testing.md#independent-expectations Nonempty bounded retention, exact request/attempt addressing and detached copy semantics define expectations; SHA-256 vectors for [1,2,3,4], [1] and empty bytes come from independent standard SHA-256 reference computation rather than product output.
 * @evidence contracts/testing.md#distinguishing-cases All five dispositions, exact ceiling, singleton, empty/oversized bytes, source mutation, changed digest bytes, cross-attempt and malformed metadata are covered; atomic filesystem transaction and playable-media admission belong to other owning tests.
 * @evidence contracts/testing.md#execution-ownership This discoverable synchronous unit calls production exports and assertion seams without opening a project, provider, browser or process; the test function owns every generated disposition and mutation case.
 */
export function test_production_repaint_raw_output(): void {
  const source: Uint8Array = new Uint8Array([1, 2, 3, 4]);
  const dispositions: AutoMovieRepaintRawOutputDisposition[] = [
    "candidate-source",
    "invalid",
    "partial",
    "cancelled",
    "budget-exhausted",
  ];
  const publications: IAutoMovieRepaintRawOutputPublication[] = dispositions.map((disposition: AutoMovieRepaintRawOutputDisposition): IAutoMovieRepaintRawOutputPublication =>
    planAutoMovieRepaintRawOutput({
      productionId: "film",
      shot: "opening",
      requestId: "10000000-0000-4000-8000-000000000001",
      attemptId: "20000000-0000-4000-8000-000000000001",
      bytes: source,
      mediaType: "video/mp4",
      disposition,
      retainedAt: "2026-09-04T00:00:00.000Z",
      maximumBytes: 4,
    }),
  );
  source[0] = 9;
  for (const publication of publications)
    assertAutoMovieRepaintRawOutput({
      receipt: publication.receipt,
      bytes: publication.bytes,
      requestId: publication.receipt.requestId,
      attemptId: publication.receipt.attemptId,
    });
  TestValidator.equals(
    "every terminal disposition retains the same immutable copied raw bytes",
    publications.map(({ receipt, bytes }: IAutoMovieRepaintRawOutputPublication): { disposition: AutoMovieRepaintRawOutputDisposition; bytes: number[]; digest: string; path: string; receiptPath: string } => ({
      disposition: receipt.disposition,
      bytes: [...bytes],
      digest: receipt.digest,
      path: receipt.path,
      receiptPath: productionRepaintRawOutputReceiptPath(
        receipt.requestId,
        receipt.attemptId,
      ),
    })),
    dispositions.map((disposition: AutoMovieRepaintRawOutputDisposition): { disposition: AutoMovieRepaintRawOutputDisposition; bytes: number[]; digest: string; path: string; receiptPath: string } => ({
      disposition,
      bytes: [1, 2, 3, 4],
      digest: "sha256:9f64a747e1b97f131fabb6b447296c9b6f0201e79fb3c5356e6c77e89b6a806a",
      path: "renditions/raw/10000000-0000-4000-8000-000000000001/20000000-0000-4000-8000-000000000001/9f64a747e1b97f131fabb6b447296c9b6f0201e79fb3c5356e6c77e89b6a806a.bin",
      receiptPath:
        "renditions/raw/10000000-0000-4000-8000-000000000001/20000000-0000-4000-8000-000000000001/receipt.json",
    })),
  );
  const receipt: IAutoMovieRepaintRawOutputReceipt = publications[0]!.receipt;
  TestValidator.equals(
    "empty, oversized, changed and cross-attempt output are refused",
    [
      throwsError((): IAutoMovieRepaintRawOutputPublication =>
        planAutoMovieRepaintRawOutput({
          productionId: "film",
          shot: "opening",
          requestId: "request",
          attemptId: "attempt",
          bytes: new Uint8Array(),
          mediaType: "video/mp4",
          disposition: "invalid",
          retainedAt: "2026-09-04T00:00:00.000Z",
          maximumBytes: 4,
        }),
      ),
      throwsError((): IAutoMovieRepaintRawOutputPublication =>
        planAutoMovieRepaintRawOutput({
          productionId: "film",
          shot: "opening",
          requestId: "request",
          attemptId: "attempt",
          bytes: new Uint8Array(5),
          mediaType: "video/mp4",
          disposition: "invalid",
          retainedAt: "2026-09-04T00:00:00.000Z",
          maximumBytes: 4,
        }),
      ),
      throwsError((): void =>
        assertAutoMovieRepaintRawOutput({
          receipt,
          bytes: new Uint8Array([1, 2, 3, 5]),
          requestId: receipt.requestId,
          attemptId: receipt.attemptId,
        }),
      ),
      throwsError((): void =>
        assertAutoMovieRepaintRawOutput({
          receipt,
          bytes: publications[0]!.bytes,
          requestId: receipt.requestId,
          attemptId: "different",
        }),
      ),
      /^sha256:[0-9a-f]{64}$/u.test(receipt.digest as string),
    ],
    [true, true, true, true, true],
  );

  const plan: (overrides: Partial<Parameters<typeof planAutoMovieRepaintRawOutput>[0]>) => boolean = (
    overrides: Partial<Parameters<typeof planAutoMovieRepaintRawOutput>[0]>,
  ): boolean =>
    throwsError((): IAutoMovieRepaintRawOutputPublication =>
      planAutoMovieRepaintRawOutput({
        productionId: "film",
        shot: "opening",
        requestId: "10000000-0000-4000-8000-000000000001",
        attemptId: "20000000-0000-4000-8000-000000000001",
        bytes: new Uint8Array([1]),
        mediaType: "video/mp4",
        disposition: "candidate-source",
        retainedAt: "2026-09-04T00:00:00.000Z",
        maximumBytes: 4,
        ...overrides,
      }),
    );
  const stored: (overrides: Partial<IAutoMovieRepaintRawOutputReceipt>) => boolean = (overrides: Partial<IAutoMovieRepaintRawOutputReceipt>): boolean =>
    throwsError((): void =>
      assertAutoMovieRepaintRawOutput({
        receipt: { ...receipt, ...overrides },
        bytes: publications[0]!.bytes,
        requestId: receipt.requestId,
        attemptId: receipt.attemptId,
      }),
    );
  TestValidator.equals(
    "blank identities, foreign dispositions, inexact instants, and drifted receipts are refused",
    {
      blankProduction: plan({ productionId: " " }),
      paddedShot: plan({ shot: " opening" }),
      unknownDisposition: plan({
        disposition: "retained" as "candidate-source",
      }),
      inexactInstant: plan({ retainedAt: "2026-09-04" }),
      foreignVersion: stored({ version: 2 as 1 }),
      blankShot: stored({ shot: "" }),
      paddedMediaType: stored({ mediaType: "video/mp4 " }),
      driftedInstant: stored({ retainedAt: "2026-09-04T00:00:00Z" }),
      driftedDisposition: stored({
        disposition: "retained" as "candidate-source",
      }),
      malformedDigest: stored({
        digest: "sha256:short" as string,
      }),
      zeroCeiling: stored({ maximumBytes: 0 }),
      driftedCount: stored({ bytes: 3 }),
      driftedPath: stored({ path: "renditions/raw/other.bin" }),
      exactReceiptPasses: stored({}),
    },
    {
      blankProduction: true,
      paddedShot: true,
      unknownDisposition: true,
      inexactInstant: true,
      foreignVersion: true,
      blankShot: true,
      paddedMediaType: true,
      driftedInstant: true,
      driftedDisposition: true,
      malformedDigest: true,
      zeroCeiling: true,
      driftedCount: true,
      driftedPath: true,
      exactReceiptPasses: false,
    },
  );
  const empty: Uint8Array = new Uint8Array();
  const emptyReceipt: IAutoMovieRepaintRawOutputReceipt = {
    ...receipt,
    bytes: 0,
    digest: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    path: "renditions/raw/10000000-0000-4000-8000-000000000001/20000000-0000-4000-8000-000000000001/e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855.bin",
  };
  TestValidator.predicate(
    "an exact count/digest/path cannot make empty retained bytes valid",
    throwsError((): void => assertAutoMovieRepaintRawOutput({
      receipt: emptyReceipt,
      bytes: empty,
      requestId: receipt.requestId,
      attemptId: receipt.attemptId,
    }), "Repaint raw output does not match its immutable attempt-owned receipt."),
  );
  const singleton: IAutoMovieRepaintRawOutputPublication = planAutoMovieRepaintRawOutput({
    productionId: "film",
    shot: "opening",
    requestId: receipt.requestId,
    attemptId: receipt.attemptId,
    bytes: new Uint8Array([1]),
    mediaType: "video/mp4",
    disposition: "candidate-source",
    retainedAt: "2026-09-04T00:00:00.000Z",
    maximumBytes: 1,
  });
  assertAutoMovieRepaintRawOutput({
    receipt: singleton.receipt,
    bytes: singleton.bytes,
    requestId: receipt.requestId,
    attemptId: receipt.attemptId,
  });
  TestValidator.equals("singleton at its exact ceiling remains a valid raw source", {
    bytes: [...singleton.bytes],
    count: singleton.receipt.bytes,
    ceiling: singleton.receipt.maximumBytes,
    digest: singleton.receipt.digest,
  }, {
    bytes: [1],
    count: 1,
    ceiling: 1,
    digest: "sha256:4bf5122f344554c53bde2ebb8cd2b7e3d1600ad631c385a5d7cce23c7785459a",
  });
}
