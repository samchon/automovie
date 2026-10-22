import {
  type IAutoMovieRecoveryContourResumeInput,
  type IAutoMovieRecoverySavedSection,
  type IAutoMovieRecoverySectionsInput,
  type IAutoMovieRecoverySourceLineage,
  observeAutoMovieRecoverySections,
  resumeAutoMovieRecoveryContours,
} from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { createRecoveryContourResumeMutations } from "../internal/createRecoveryContourResumeMutations";
import { nclose } from "../internal/nclose";

/** Failed raw contours resume without refitting successful neighboring curves.
 *
 * Scenarios:
 * 1. One interior plane cuts a triangle and a square. A three-span original budget publishes the triangle and fails the square; resume fits only raw ordinal one into patch index zero.
 * 2. Actual edge count four supplies the new budget, exact four-face provenance supplies preplan bound twelve, and Hermite phase widths sum to the independently known square perimeter twelve millimetres.
 * 3. Original coefficient serialization and source arrays remain unchanged; an opaque high-degree/rational curve reference survives without conversion.
 * 4. Successful, foreign and duplicate targets, stale complete contour bindings and missing, duplicated, invalid or unused original policies refuse before any fit checkpoint.
 * 5. A failed open ribbon cut remains open after resume, while a failed isolated-contact reference remains explicitly unsupported without a fabricated curve.
 * 6. Progress exceptions and cooperative abort return no value; pre-abort performs no work.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the public observer to create an actual mixed successful/failed publication, then the public selective-resume operator. It asserts separate raw/patch addresses, untouched normal bytes, independent physical perimeter/derivative facts, actual and source-face budgets, refusal before fitting and open/contact/cancellation semantics.
 * @evidence contracts/testing.md#independent-expectations At Y=1 the tetrahedron has a triangular cross-section and the square pyramid of base side four and apex height four has square side three. Their corner counts require three and four independent edge spans at a 45-degree corner threshold. Thus the original budget three distinguishes them, and the resumed square has perimeter twelve, four exact side faces and physical unit straight-edge derivatives. A vertical three-segment ribbon intersects the plane in an open orthogonal polyline; the pyramid apex is a single contact.
 * @evidence contracts/testing.md#distinguishing-cases The successful raw-zero triangle beside failed raw-one square distinguishes selective resume from whole-plane refitting and prevents local-zero index aliasing. Symbolic noncubic identity, exact/broad lineage changes, artifact-bound policy admission, closed/open/contact outcomes and exceptions distinguish raw-address authority from coefficient trust. This portable generic fixture does not substitute for Human or viewer tests.
 * @evidence contracts/testing.md#execution-ownership The central runner owns execution. This entry uses tiny resident generic triangles, a tetrahedron and a pyramid with synchronous CPU APIs only; no Human data/import, filesystem, process, native command, GPU, acquisition program or timer is used.
 */
export function test_recovery_contour_resume(): void {
  const original: IAutoMovieRecoverySectionsInput = {
    name: "generic-mixed-publications",
    coordinatesMm: [1],
    axis: [0, 2, 0],
    reference: [2, 0, 0],
    verticesMm: [
      [0, 0, 0],
      [3, 0, 0],
      [0, 0, 3],
      [0, 3, 0],
      [10, 0, 0],
      [14, 0, 0],
      [14, 0, 4],
      [10, 0, 4],
      [12, 4, 2],
    ],
    triangles: [
      [0, 3, 1],
      [0, 2, 3],
      [0, 1, 2],
      [1, 3, 2],
      [4, 8, 5],
      [5, 8, 6],
      [6, 8, 7],
      [7, 8, 4],
      [4, 5, 6],
      [4, 6, 7],
    ],
    toleranceMm: 0.01,
    maxSpans: 3,
    sourceOrientationSign: 1,
    cornerDegrees: 45,
    exactCoordinateAliases: false,
    includeExactSourceLineage: true,
  };
  const lineage: IAutoMovieRecoverySourceLineage[] = [];
  const observed: ReturnType<
    typeof observeAutoMovieRecoverySections<"hermite">
  > = observeAutoMovieRecoverySections(original, {
    curveFormat: "hermite",
    onSourceLineage: (record: IAutoMovieRecoverySourceLineage): void => {
      lineage.push(record);
    },
  });
  if (!("value" in observed))
    throw new Error(
      "Authored source must publish the complete mixed raw ledger",
    );
  TestValidator.equals(
    "actual successful and exhausted neighbors",
    lineage.map(
      (record: IAutoMovieRecoverySourceLineage): string =>
        record.publication.kind,
    ),
    ["closed", "failed"],
  );
  TestValidator.equals(
    "only original triangle was published",
    observed.value.sections[0]!.loops.length,
    1,
  );
  const originalBytes: string = JSON.stringify(observed.value);
  const sourceBytes: string = JSON.stringify(original);
  const saved: IAutoMovieRecoverySavedSection = {
    coordinateMm: 1,
    sourceIdentity: "caller-verified-original-source",
    sourceSelectionIdentity: "registered-original-face-order",
    observationIdentity: "caller-verified-original-artifact",
    frame: observed.value.frame,
    exactCoordinateAliases: false,
    sourceLineage: lineage,
  };
  const input: IAutoMovieRecoveryContourResumeInput = {
    name: "new-failed-only-patch",
    verticesMm: original.verticesMm,
    triangles: original.triangles,
    axis: original.axis,
    reference: original.reference,
    exactCoordinateAliases: false,
    sourceIdentity: saved.sourceIdentity,
    sourceSelectionIdentity: saved.sourceSelectionIdentity,
    savedSections: [saved],
    targets: [{ coordinateMm: 1, contourIndex: 1 }],
    fitPolicies: [
      {
        observationIdentity: saved.observationIdentity,
        toleranceMm: original.toleranceMm,
        cornerDegrees: original.cornerDegrees,
        sourceOrientationSign: original.sourceOrientationSign,
        originalMaxSpans: original.maxSpans,
      },
    ],
  };
  const inputBytes: string = JSON.stringify(input);
  const resumed: ReturnType<typeof resumeAutoMovieRecoveryContours<"hermite">> =
    resumeAutoMovieRecoveryContours(input, { curveFormat: "hermite" });
  if (!("value" in resumed))
    throw new Error(
      "Actual exhausted square must resume from its same raw source cut",
    );
  TestValidator.equals(
    "official resume identity",
    resumed.operator,
    "contour-resume-v1",
  );
  TestValidator.equals(
    "requested square tolerance is complete",
    resumed.status,
    "complete",
  );
  TestValidator.equals(
    "only failed target created coefficients",
    resumed.value.fits.length,
    1,
  );
  TestValidator.equals(
    "normal publication stays external",
    resumed.value.preservedOriginals.map(
      (record: (typeof resumed.value.preservedOriginals)[number]): number =>
        record.originalRawContourIndex,
    ),
    [0],
  );
  TestValidator.equals(
    "opaque original publication address survives",
    resumed.value.preservedOriginals[0]!.publication,
    lineage[0]!.publication,
  );
  TestValidator.equals(
    "all original raw identities survive",
    resumed.value.sections[0]!.sourceLineage.map(
      (record: IAutoMovieRecoverySourceLineage): number => record.contourIndex,
    ),
    [0, 1],
  );
  TestValidator.equals(
    "target original raw ordinal remains one",
    resumed.value.targets[0]!.originalRawContourIndex,
    1,
  );
  const target: (typeof resumed.value.targets)[number] =
    resumed.value.targets[0]!;
  if (target.outcome.kind !== "fitted")
    throw new Error("Authored square has an exact four-edge fit");
  TestValidator.equals(
    "new patch ordinal is independent zero",
    target.outcome.patchCurveIndex,
    0,
  );
  TestValidator.equals(
    "raw edge-derived budget",
    [target.actualObservationCount, target.actualRawEdgeCount, target.maxSpans],
    [4, 4, 4],
  );
  TestValidator.equals(
    "exact source-face preplan bound",
    [target.exactSourceFaceCount, target.plannedSpanUpperBound],
    [4, 12],
  );
  TestValidator.equals(
    "original policy retained under original commitment",
    JSON.stringify(target.originalPolicy),
    JSON.stringify(input.fitPolicies[0]),
  );
  TestValidator.equals(
    "original source face ordinals",
    [
      ...resumed.value.sections[0]!.sourceLineage[1]!.exactSourceTriangleIds!,
    ].sort((a: number, b: number): number => a - b),
    [4, 5, 6, 7],
  );
  const curve: (typeof resumed.value.fits)[number]["curve"] =
    resumed.value.fits[0]!.curve;
  TestValidator.equals(
    "official Hermite publication",
    curve.type,
    "cubicHermite",
  );
  TestValidator.equals("physical phase unit", curve.phaseUnit, "mm");
  TestValidator.predicate(
    "independent physical square perimeter",
    nclose(
      curve.phaseIntervals.reduce(
        (sum: number, width: number): number => sum + width,
        0,
      ),
      12,
      1e-12,
    ),
  );
  for (const span of curve.spans) {
    TestValidator.predicate(
      "new endpoints stay on physical plane",
      nclose(span.start[1], 1, 1e-12) && nclose(span.end[1], 1, 1e-12),
    );
    TestValidator.predicate(
      "straight-edge physical derivatives retain magnitude",
      nclose(Math.hypot(...span.startDerivative), 1, 1e-12) &&
        nclose(Math.hypot(...span.endDerivative), 1, 1e-12),
    );
  }
  TestValidator.equals(
    "all saved coefficients remain byte-identical",
    JSON.stringify(observed.value),
    originalBytes,
  );
  TestValidator.equals(
    "source arrays and original policy remain unchanged",
    JSON.stringify(original),
    sourceBytes,
  );
  TestValidator.equals(
    "saved bindings remain unchanged",
    JSON.stringify(input),
    inputBytes,
  );
  TestValidator.equals(
    "no normal coefficient traversal",
    resumed.value.originalCurveCoefficientsRead,
    false,
  );
  const symbolic: IAutoMovieRecoveryContourResumeInput = structuredClone(input);
  const normal: IAutoMovieRecoverySourceLineage["publication"] =
    symbolic.savedSections[0]!.sourceLineage[0]!.publication;
  if (normal.kind !== "closed")
    throw new Error("Original first contour is closed");
  normal.curveName = "external-degree-seven-rational-physical-chart";
  const opaque: ReturnType<typeof resumeAutoMovieRecoveryContours<"hermite">> =
    resumeAutoMovieRecoveryContours(symbolic, { curveFormat: "hermite" });
  if (!("value" in opaque))
    throw new Error(
      "Original curve names must remain opaque external references",
    );
  TestValidator.equals(
    "noncubic reference not sent to Hermite converter",
    opaque.value.preservedOriginals[0]!.publication,
    normal,
  );
  const mutations: Array<
    (value: IAutoMovieRecoveryContourResumeInput) => void
  > = createRecoveryContourResumeMutations();
  for (const mutate of mutations) {
    const changed: IAutoMovieRecoveryContourResumeInput =
      structuredClone(input);
    mutate(changed);
    let fitting: number = 0;
    const refused: ReturnType<
      typeof resumeAutoMovieRecoveryContours<"hermite">
    > = resumeAutoMovieRecoveryContours(changed, {
      curveFormat: "hermite",
      onProgress: (phase: string): void => {
        if (phase === "contour-resume-fit") fitting++;
      },
    });
    TestValidator.equals(
      "invalid target or binding refuses",
      refused.status,
      "refused",
    );
    TestValidator.predicate("refusal carries no patch", !("value" in refused));
    TestValidator.equals("all admission completes before fitting", fitting, 0);
  }
  const ribbon: IAutoMovieRecoverySectionsInput = {
    ...original,
    name: "generic-open-ribbon",
    maxSpans: 1,
    verticesMm: [
      [0, 0, 0],
      [2, 0, 0],
      [2, 0, 2],
      [4, 0, 2],
      [0, 2, 0],
      [2, 2, 0],
      [2, 2, 2],
      [4, 2, 2],
    ],
    triangles: [
      [0, 1, 5],
      [0, 5, 4],
      [1, 2, 6],
      [1, 6, 5],
      [2, 3, 7],
      [2, 7, 6],
    ],
  };
  const openLineage: IAutoMovieRecoverySourceLineage[] = [];
  const openOriginal: ReturnType<
    typeof observeAutoMovieRecoverySections<"hermite">
  > = observeAutoMovieRecoverySections(ribbon, {
    curveFormat: "hermite",
    onSourceLineage: (record: IAutoMovieRecoverySourceLineage): void => {
      openLineage.push(record);
    },
  });
  if (!("value" in openOriginal))
    throw new Error("Ribbon observation must retain the failed open cut");
  TestValidator.equals(
    "open ribbon actually exhausts original budget",
    openLineage[0]!.publication.kind,
    "failed",
  );
  const openInput: IAutoMovieRecoveryContourResumeInput = {
    ...input,
    verticesMm: ribbon.verticesMm,
    triangles: ribbon.triangles,
    targets: [{ coordinateMm: 1, contourIndex: 0 }],
    sourceIdentity: "caller-verified-ribbon-source",
    sourceSelectionIdentity: "registered-ribbon-original-face-order",
    savedSections: [
      {
        ...saved,
        sourceIdentity: "caller-verified-ribbon-source",
        sourceSelectionIdentity: "registered-ribbon-original-face-order",
        observationIdentity: "caller-verified-ribbon-artifact",
        sourceLineage: openLineage,
        frame: openOriginal.value.frame,
      },
    ],
    fitPolicies: [
      {
        ...input.fitPolicies[0]!,
        observationIdentity: "caller-verified-ribbon-artifact",
        originalMaxSpans: 1,
      },
    ],
  };
  const open: ReturnType<typeof resumeAutoMovieRecoveryContours<"bezier">> =
    resumeAutoMovieRecoveryContours(openInput, { curveFormat: "bezier" });
  if (!("value" in open))
    throw new Error("Failed open cut must be resumable without closure");
  TestValidator.equals(
    "open source topology survives",
    open.value.targets[0]!.closed,
    false,
  );
  TestValidator.equals(
    "new open coefficients remain open",
    open.value.fits[0]!.curve.closed,
    false,
  );
  TestValidator.equals(
    "open source has six actual edges",
    open.value.targets[0]!.actualRawEdgeCount,
    6,
  );
  const contacts: IAutoMovieRecoverySourceLineage[] = [];
  const contactOriginal: ReturnType<
    typeof observeAutoMovieRecoverySections<"hermite">
  > = observeAutoMovieRecoverySections(
    { ...original, coordinatesMm: [4] },
    {
      curveFormat: "hermite",
      onSourceLineage: (record: IAutoMovieRecoverySourceLineage): void => {
        contacts.push(record);
      },
    },
  );
  if (!("value" in contactOriginal))
    throw new Error("Pyramid apex must retain its contact metadata");
  const degenerate: IAutoMovieRecoveryContourResumeInput = {
    ...input,
    savedSections: [
      {
        ...saved,
        coordinateMm: 4,
        observationIdentity: "caller-verified-contact-artifact",
        frame: contactOriginal.value.frame,
        sourceLineage: contacts,
      },
    ],
    targets: [{ coordinateMm: 4, contourIndex: 0 }],
    fitPolicies: [
      {
        ...input.fitPolicies[0]!,
        observationIdentity: "caller-verified-contact-artifact",
      },
    ],
  };
  TestValidator.equals(
    "actual contact cannot be targeted",
    resumeAutoMovieRecoveryContours(degenerate, { curveFormat: "hermite" })
      .status,
    "refused",
  );
  Object.assign(contacts[0]!, {
    publication: {
      kind: "failed",
      diagnostic: "Earlier failed contact observation",
    },
  });
  const unsupported: ReturnType<
    typeof resumeAutoMovieRecoveryContours<"hermite">
  > = resumeAutoMovieRecoveryContours(degenerate, { curveFormat: "hermite" });
  if (!("value" in unsupported))
    throw new Error("A caller-bound failed contact must remain explicit");
  TestValidator.equals("contact stays partial", unsupported.status, "partial");
  TestValidator.equals(
    "contact does not invent a curve",
    unsupported.value.fits.length,
    0,
  );
  TestValidator.equals(
    "contact has no fake positive edge budget",
    unsupported.value.targets[0]!.maxSpans,
    0,
  );
  const callbackFailure: ReturnType<
    typeof resumeAutoMovieRecoveryContours<"hermite">
  > = resumeAutoMovieRecoveryContours(input, {
    curveFormat: "hermite",
    onProgress: (): void => {
      throw new Error("resume progress failed");
    },
  });
  TestValidator.equals(
    "progress exception fails",
    callbackFailure.status,
    "failed",
  );
  TestValidator.equals(
    "progress exception retained",
    callbackFailure.diagnostics,
    ["resume progress failed"],
  );
  TestValidator.predicate(
    "progress exception has no value",
    !("value" in callbackFailure),
  );
  const controller: AbortController = new AbortController();
  let fitCheckpoints: number = 0;
  const cancelled: ReturnType<
    typeof resumeAutoMovieRecoveryContours<"hermite">
  > = resumeAutoMovieRecoveryContours(input, {
    curveFormat: "hermite",
    signal: controller.signal,
    onProgress: (phase: string): void => {
      if (phase === "contour-resume-fit") {
        fitCheckpoints++;
        controller.abort();
      }
    },
  });
  TestValidator.equals(
    "abort cancels before fitting",
    cancelled.status,
    "cancelled",
  );
  TestValidator.equals("abort stops later target progress", fitCheckpoints, 1);
  TestValidator.predicate("abort supplies no patch", !("value" in cancelled));
  const preaborted: AbortController = new AbortController();
  preaborted.abort();
  let progress: number = 0;
  const stopped: ReturnType<typeof resumeAutoMovieRecoveryContours<"hermite">> =
    resumeAutoMovieRecoveryContours(input, {
      curveFormat: "hermite",
      signal: preaborted.signal,
      onProgress: (): void => {
        progress++;
      },
    });
  TestValidator.equals("pre-abort cancels", stopped.status, "cancelled");
  TestValidator.equals("pre-abort does no work", progress, 0);
}
