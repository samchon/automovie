import {
  type IAutoMovieRecoverySavedSection,
  type IAutoMovieRecoverySectionsInput,
  type IAutoMovieRecoverySlabObservation,
  type IAutoMovieRecoverySlabsInput,
  type IAutoMovieRecoverySourceLineage,
  observeAutoMovieRecoverySections,
  observeAutoMovieRecoverySlabs,
} from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/** Source slabs bind saved publication metadata without processing coefficients.
 *
 * Scenarios:
 * 1. Two disjoint tetrahedra retain both cylinder-like source components and four exact ports between two saved interior planes.
 * 2. Saved broad incidence acquires fresh exact cut support without changing any original curve, direction or actual physical phase width.
 * 3. Opaque external rational/high-degree curve names stay unverified references; saved coefficients are never API input.
 * 4. Missing/stale contours, source identity, selection, frame, alias, closure and exact-face disagreements refuse before slab delivery.
 * 5. Failed publications, empty sections and isolated source contacts remain explicit without fitting or inventing caps.
 * 6. Callback mutation affects only its copy; exceptions and cooperative abort publish no usable value or later slab.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the public slab-only observer with saved official contour metadata, asserts independently known two-component topology and original face ordinals, unchanged saved coefficient serialization, raw-only binding flags, mismatch refusal, retained unsupported ports and callback/cancellation outcomes.
 * @evidence contracts/testing.md#independent-expectations Each authored tetrahedron has base Y=0 and apex Y=3; two interior cuts bound a cylinder with Euler characteristic zero and two coherent cycles. Translating the second tetrahedron by 10 mm gives a second independent component and original faces 4,5,7. Y=-1 is empty and Y=3 gives two isolated contacts. These geometric facts determine expectations independently of saved fitted coefficients.
 * @evidence contracts/testing.md#distinguishing-cases Separates raw-cut identity from arbitrary curve-name trust, broad versus exact provenance, supported closed ports versus failed/contact/empty evidence, all-component preservation and malformed saved commitments. Existing generic branch and fixed-section tests own the PL saddle geometry and fitting basis conversion; this test adds no Human fixture or generated-skin assertion.
 * @evidence contracts/testing.md#execution-ownership The portable test_recovery_slab_observation_resume entry owns tiny generic resident tetrahedra, metadata mutations and synchronous callbacks only. No Human or viewer import, filesystem, process, native build, acquisition host, timer or GPU is used; execution belongs to the central runner.
 */
export function test_recovery_slab_observation_resume(): void {
  const firstVertices: IAutoMovieRecoverySectionsInput["verticesMm"] = [
    [0, 0, 0],
    [3, 0, 0],
    [0, 0, 3],
    [0, 3, 0],
  ];
  const firstTriangles: IAutoMovieRecoverySectionsInput["triangles"] = [
    [0, 3, 1],
    [0, 2, 3],
    [0, 1, 2],
    [1, 3, 2],
  ];
  const original: IAutoMovieRecoverySectionsInput = {
    name: "saved-generic-tetrahedra",
    verticesMm: [
      ...firstVertices,
      ...firstVertices.map(
        (point: [number, number, number]): [number, number, number] => [
          point[0] + 10,
          point[1],
          point[2],
        ],
      ),
    ],
    triangles: [
      ...firstTriangles,
      ...firstTriangles.map(
        (triangle: [number, number, number]): [number, number, number] => [
          triangle[0] + 4,
          triangle[1] + 4,
          triangle[2] + 4,
        ],
      ),
    ],
    axis: [0, 2, 0],
    reference: [2, 0, 0],
    coordinatesMm: [0.5, 1.5, 3, -1],
    exactCoordinateAliases: false,
    toleranceMm: 0.01,
    maxSpans: 32,
    sourceOrientationSign: 1,
    cornerDegrees: 45,
  };
  const lineage: IAutoMovieRecoverySourceLineage[] = [];
  const fitted: ReturnType<typeof observeAutoMovieRecoverySections<"hermite">> =
    observeAutoMovieRecoverySections(original, {
      curveFormat: "hermite",
      onSourceLineage: (record: IAutoMovieRecoverySourceLineage): void => {
        lineage.push(record);
      },
    });
  if (!("value" in fitted))
    throw new Error(
      "Generic tetrahedron observation must publish its original curves",
    );
  const savedBytes: string = JSON.stringify(fitted.value);
  const sourceBytes: string = JSON.stringify(original);
  const allSaved: IAutoMovieRecoverySavedSection[] = fitted.value.sections.map(
    (
      section: (typeof fitted.value.sections)[number],
    ): IAutoMovieRecoverySavedSection => ({
      coordinateMm: section.coordinateMm,
      sourceIdentity: "caller-verified-generic-source",
      sourceSelectionIdentity: "registered-complete-original-face-order",
      observationIdentity: "caller-verified-saved-coefficient-artifact",
      frame: fitted.value.frame,
      exactCoordinateAliases: original.exactCoordinateAliases,
      sourceLineage: lineage.filter(
        (record: IAutoMovieRecoverySourceLineage): boolean =>
          record.coordinateMm === section.coordinateMm,
      ),
    }),
  );
  const input: IAutoMovieRecoverySlabsInput = {
    name: "additive-source-topology",
    verticesMm: original.verticesMm,
    triangles: original.triangles,
    axis: original.axis,
    reference: original.reference,
    exactCoordinateAliases: false,
    sourceIdentity: allSaved[0]!.sourceIdentity,
    sourceSelectionIdentity: allSaved[0]!.sourceSelectionIdentity,
    savedSections: allSaved.slice(0, 2),
    slabPairs: [{ beforeMm: 0.5, afterMm: 1.5 }],
  };
  const inputBytes: string = JSON.stringify(input);
  const callbacks: IAutoMovieRecoverySlabObservation[] = [];
  const observed: ReturnType<typeof observeAutoMovieRecoverySlabs> =
    observeAutoMovieRecoverySlabs(input, {
      onSourceSlab: (record: IAutoMovieRecoverySlabObservation): void => {
        callbacks.push(record);
        record.components.length = 0;
        record.ports[0]!.exactSourceTriangleIds.fill(-1);
      },
    });
  if (!("value" in observed))
    throw new Error(
      "Matching saved source cuts must retain source slab observations",
    );
  TestValidator.equals(
    "additive source operator identity",
    observed.operator,
    "source-slabs-v1",
  );
  TestValidator.equals("one requested slab", observed.value.slabs.length, 1);
  const slab: IAutoMovieRecoverySlabObservation = observed.value.slabs[0]!;
  TestValidator.equals(
    "both source components remain",
    slab.components.length,
    2,
  );
  TestValidator.equals(
    "independent cylinder Euler characteristics",
    slab.components.map(
      (component: (typeof slab.components)[number]): number | null =>
        component.topology.euler,
    ),
    [0, 0],
  );
  TestValidator.equals(
    "two cycles per component",
    slab.components.map(
      (component: (typeof slab.components)[number]): number =>
        component.topology.boundaryCycles,
    ),
    [2, 2],
  );
  TestValidator.equals("all four exact source ports", slab.ports.length, 4);
  TestValidator.predicate(
    "all exact ports have unique component ownership",
    slab.ports.every(
      (port: (typeof slab.ports)[number]): boolean =>
        port.status === "unique-component" &&
        port.publication.kind === "closed",
    ),
  );
  TestValidator.equals(
    "fresh exact first-source faces",
    [
      ...observed.value.sections[0]!.sourceLineage[0]!.exactSourceTriangleIds!,
    ].sort((a: number, b: number): number => a - b),
    [0, 1, 3],
  );
  TestValidator.equals(
    "fresh exact second-source original ordinals",
    [
      ...observed.value.sections[0]!.sourceLineage[1]!.exactSourceTriangleIds!,
    ].sort((a: number, b: number): number => a - b),
    [4, 5, 7],
  );
  TestValidator.equals(
    "original nonunit source direction survives",
    observed.value.axis,
    [0, 2, 0],
  );
  TestValidator.equals(
    "actual normalized source direction",
    observed.value.frame.n,
    [0, 1, 0],
  );
  TestValidator.equals(
    "raw closure population",
    observed.value.sections.map(
      (section: (typeof observed.value.sections)[number]): boolean[] =>
        section.rawContours.map(
          (contour: (typeof section.rawContours)[number]): boolean =>
            contour.closed,
        ),
    ),
    [
      [true, true],
      [true, true],
    ],
  );
  TestValidator.equals(
    "input and saved identity records unchanged",
    JSON.stringify(input),
    inputBytes,
  );
  TestValidator.equals(
    "all saved degree/phase/physical derivative bytes unchanged",
    JSON.stringify(fitted.value),
    savedBytes,
  );
  TestValidator.equals(
    "registered source arrays unchanged",
    JSON.stringify(original),
    sourceBytes,
  );
  TestValidator.equals(
    "callback owns its mutated independent copy",
    callbacks[0]!.components.length,
    0,
  );
  TestValidator.predicate(
    "callback source-address mutation cannot corrupt output",
    slab.ports.every((port: (typeof slab.ports)[number]): boolean =>
      port.exactSourceTriangleIds.every((face: number): boolean => face >= 0),
    ),
  );
  TestValidator.equals(
    "binding scope is source only",
    observed.value.bindingAuthority,
    "raw-cut-addresses-and-closure-only",
  );
  TestValidator.equals(
    "coefficient payload was not read",
    observed.value.curveCoefficientsRead,
    false,
  );
  TestValidator.equals(
    "caller still owns cryptographic and coefficient binding",
    observed.value.callerBindingRequired,
    true,
  );
  const referenceOnly: IAutoMovieRecoverySlabsInput = structuredClone(input);
  const reference: IAutoMovieRecoverySourceLineage["publication"] =
    referenceOnly.savedSections[0]!.sourceLineage[0]!.publication;
  if (reference.kind !== "closed")
    throw new Error("The authored first contour is closed");
  reference.curveName = "external-degree-seven-rational-identity";
  const external: ReturnType<typeof observeAutoMovieRecoverySlabs> =
    observeAutoMovieRecoverySlabs(referenceOnly);
  if (!("value" in external))
    throw new Error(
      "A symbolic curve name must remain separately caller-attested",
    );
  TestValidator.equals(
    "arbitrary curve identity is never geometry-verified",
    external.value.curveCoefficientsRead,
    false,
  );
  TestValidator.predicate(
    "symbolic name is retained without basis conversion",
    external.value.slabs[0]!.ports.some(
      (port: (typeof slab.ports)[number]): boolean =>
        port.publication.kind === "closed" &&
        port.publication.curveName ===
          "external-degree-seven-rational-identity",
    ),
  );
  const mutations: Array<(value: IAutoMovieRecoverySlabsInput) => void> = [
    (value: IAutoMovieRecoverySlabsInput): void => {
      value.savedSections[0]!.sourceIdentity = "different-source";
    },
    (value: IAutoMovieRecoverySlabsInput): void => {
      value.savedSections[0]!.sourceSelectionIdentity = "different-selection";
    },
    (value: IAutoMovieRecoverySlabsInput): void => {
      value.savedSections[0]!.exactCoordinateAliases = true;
    },
    (value: IAutoMovieRecoverySlabsInput): void => {
      value.savedSections[0]!.frame = {
        ...value.savedSections[0]!.frame,
        n: [0, -1, 0],
      };
    },
    (value: IAutoMovieRecoverySlabsInput): void => {
      value.savedSections[0]!.sourceLineage =
        value.savedSections[0]!.sourceLineage.slice(1);
    },
    (value: IAutoMovieRecoverySlabsInput): void => {
      (
        value.savedSections[0]!.sourceLineage[0]!.sourceTriangleIds as number[]
      )[0] = 2;
    },
    (value: IAutoMovieRecoverySlabsInput): void => {
      Object.assign(value.savedSections[0]!.sourceLineage[0]!, {
        exactSourceTriangleIds: [2],
      });
    },
    (value: IAutoMovieRecoverySlabsInput): void => {
      Object.assign(value.savedSections[0]!.sourceLineage[0]!, {
        publication: {
          kind: "open",
          reportIndex: 0,
          curveName: "wrong-open-classification",
        },
      });
      Object.assign(value.savedSections[0]!.sourceLineage[1]!, {
        publication: {
          kind: "closed",
          loopIndex: 0,
          curveName: "remaining-closed",
        },
      });
    },
  ];
  for (const mutate of mutations) {
    const changed: IAutoMovieRecoverySlabsInput = structuredClone(input);
    mutate(changed);
    let delivered: number = 0;
    const refused: ReturnType<typeof observeAutoMovieRecoverySlabs> =
      observeAutoMovieRecoverySlabs(changed, {
        onSourceSlab: (): void => {
          delivered++;
        },
      });
    TestValidator.equals(
      "incompatible saved source binding refuses",
      refused.status,
      "refused",
    );
    TestValidator.predicate(
      "binding refusal supplies no value",
      !("value" in refused),
    );
    TestValidator.equals(
      "all binding checks precede slab delivery",
      delivered,
      0,
    );
  }
  const failedReference: IAutoMovieRecoverySlabsInput = structuredClone(input);
  Object.assign(failedReference.savedSections[0]!.sourceLineage[0]!, {
    publication: {
      kind: "failed",
      diagnostic: "Preserved earlier fit exhaustion",
    },
  });
  Object.assign(failedReference.savedSections[0]!.sourceLineage[1]!, {
    publication: {
      kind: "closed",
      loopIndex: 0,
      curveName: "remaining-saved-closed",
    },
  });
  const failedPort: ReturnType<typeof observeAutoMovieRecoverySlabs> =
    observeAutoMovieRecoverySlabs(failedReference);
  if (!("value" in failedPort))
    throw new Error(
      "A failed saved fit must remain an unpublished source boundary",
    );
  TestValidator.equals(
    "failed coefficient remains partial",
    failedPort.status,
    "partial",
  );
  TestValidator.predicate(
    "failed fit is not silently resumed",
    failedPort.value.slabs[0]!.ports.some(
      (port: (typeof slab.ports)[number]): boolean =>
        port.publication.kind === "failed" &&
        port.publication.diagnostic === "Preserved earlier fit exhaustion",
    ),
  );
  const contacts: ReturnType<typeof observeAutoMovieRecoverySlabs> =
    observeAutoMovieRecoverySlabs({
      ...input,
      savedSections: allSaved,
      slabPairs: [
        { beforeMm: -1, afterMm: 0.5 },
        { beforeMm: 0.5, afterMm: 3 },
      ],
    });
  if (!("value" in contacts))
    throw new Error(
      "Empty and contact endpoint planes must retain their evidence",
    );
  TestValidator.equals(
    "empty saved section stays empty",
    contacts.value.sections[3]!.rawContours,
    [],
  );
  TestValidator.equals(
    "two isolated source contacts survive",
    contacts.value.sections[2]!.rawContours.map(
      (
        contour: (typeof contacts.value.sections)[number]["rawContours"][number],
      ): number => contour.observationCount,
    ),
    [1, 1],
  );
  TestValidator.predicate(
    "contacts remain degenerate publications",
    contacts.value.sections[2]!.sourceLineage.every(
      (record: IAutoMovieRecoverySourceLineage): boolean =>
        record.publication.kind === "degenerate",
    ),
  );
  const observerFailure: ReturnType<typeof observeAutoMovieRecoverySlabs> =
    observeAutoMovieRecoverySlabs(input, {
      onSourceSlab: (): void => {
        throw new Error("slab-only observer failed");
      },
    });
  TestValidator.equals(
    "observer error is explicit",
    observerFailure.diagnostics,
    ["slab-only observer failed"],
  );
  TestValidator.equals(
    "observer error fails",
    observerFailure.status,
    "failed",
  );
  TestValidator.predicate(
    "observer failure carries no output",
    !("value" in observerFailure),
  );
  const controller: AbortController = new AbortController();
  let delivered: number = 0;
  const cancelled: ReturnType<typeof observeAutoMovieRecoverySlabs> =
    observeAutoMovieRecoverySlabs(
      { ...input, slabPairs: [...input.slabPairs, ...input.slabPairs] },
      {
        signal: controller.signal,
        onSourceSlab: (): void => {
          delivered++;
          controller.abort();
        },
      },
    );
  TestValidator.equals("callback abort cancels", cancelled.status, "cancelled");
  TestValidator.equals("abort stops later slab delivery", delivered, 1);
  TestValidator.predicate(
    "cancelled source observation has no value",
    !("value" in cancelled),
  );
  const preaborted: AbortController = new AbortController();
  preaborted.abort();
  let progress: number = 0;
  const beforeWork: ReturnType<typeof observeAutoMovieRecoverySlabs> =
    observeAutoMovieRecoverySlabs(input, {
      signal: preaborted.signal,
      onProgress: (): void => {
        progress++;
      },
    });
  TestValidator.equals(
    "pre-abort cancels before work",
    beforeWork.status,
    "cancelled",
  );
  TestValidator.equals("pre-abort emits no progress", progress, 0);
  for (const slabPairs of [
    [],
    [{ beforeMm: 1.5, afterMm: 0.5 }],
    [{ beforeMm: 0.5, afterMm: 1 }],
    [{ beforeMm: Number.NaN, afterMm: 1.5 }],
  ])
    TestValidator.equals(
      "invalid slab plan refuses",
      observeAutoMovieRecoverySlabs({ ...input, slabPairs }).status,
      "refused",
    );
}
