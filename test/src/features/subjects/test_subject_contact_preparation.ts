import { createAutoMovieSignedMeshQuery } from "@automovie/engine";
import {
  type IAutoMovieHumanFaceBasis,
  createHumanFaceBasisBuilder,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import {
  findSeamPair,
  prepareContactBasis,
  sealCrownRings,
} from "../../../scripts/face-review/prepareContactBasis";
import { humanFaceContactFixture } from "../internal/humanFaceContactFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * The contact preparation measures its block from the source alone.
 * Scenarios:
 * 1. Seam pairs are the closest fixed/mandibular vertices in the midline
 *    band: the lip seam (0, 3) at 0.1 and the incisal pair (3, 8) at 0.2; a
 *    band with no pair refuses.
 * 2. The open crown's four-vertex ring is sealed by two fan triangles wound
 *    for positive volume and the sealed surface admits as a sheet; a loop
 *    above the ring limit stays open and is recorded; a forked boundary and
 *    an inward-wound crown refuse.
 * 3. The raw closure delta the source authored over its open jaw becomes the
 *    companion rows (0, 0.35, -1.45), the corrective it drove is removed
 *    with its magnitude, the tongue's budget is its own height along the
 *    opening direction (0.3) with the authored excess recorded as zero and
 *    the tongue-through-teeth endpoint recorded as refused, the reach is the
 *    largest budget,
 *    documents and controls are restamped and the receipt carries the
 *    neutral apertures.
 * 4. A repeated revision, a linear basis, a prepared basis, absent surfaces,
 *    regions or channels, a self-referential closure and a foreign document
 *    refuse.
 */
export const test_subject_contact_preparation = (): void => {
  const source = (): IAutoMovieHumanFaceBasis => {
    const { basis } = humanFaceContactFixture();
    const raw = structuredClone(basis);
    delete raw.contact;
    raw.surfaces[1].targets.closeTarget = [3, 0, 1.45, 0.35];
    raw.correctives = [
      {
        id: "openCloseEase",
        weight: 1,
        target: "openCloseEaseTarget",
        inputs: [
          { channel: "open", side: "positive" },
          { channel: "close", side: "positive" },
        ],
      },
    ];
    raw.surfaces[1].targets.openCloseEaseTarget = [3, 0, 0.02, 0];
    return raw;
  };
  const basis = source();
  const input = () => ({
    basis,
    lips: { surface: "mouth", region: "mouth/all" },
    incisors: { surface: "teeth" },
    midlineBandMetres: 0.01,
    closure: { channel: "close", reference: "open" },
    passage: { surface: "tongue", channel: "out", slabMetres: 0.5 },
    colliders: [{ surface: "teeth", maximumRingVertices: 6 }],
    soft: [
      { surface: "mouth", budget: { metres: 0.5 } },
      { surface: "tongue", budget: { extent: true as const } },
    ],
    toleranceMetres: 1e-9,
    decimals: 9,
    revision: "analytic-contact/2",
    documents: [
      {
        id: "subject",
        name: "Subject",
        basis: basis.id,
        shape: { wide: 0.5 },
        expression: {},
      },
    ],
    controls: { basis: basis.id, groups: [] },
  });
  const axis = [1, 0, 0];
  const pivot = [0, 0, 0];
  const lips = findSeamPair({
    surface: basis.surfaces[1],
    candidates: [0, 1, 2, 3, 4, 5],
    axis,
    pivot,
    bandMetres: 0.01,
  });
  TestValidator.equals("lip seam pair", lips, {
    upper: 0,
    lower: 3,
    gapMetres: 0.1,
  });
  const incisors = findSeamPair({
    surface: basis.surfaces[0],
    candidates: Array.from({ length: 12 }, (_, i) => i),
    axis,
    pivot,
    bandMetres: 0.01,
  });
  TestValidator.predicate(
    "incisal pair",
    incisors.upper === 3 &&
      incisors.lower === 8 &&
      nclose(incisors.gapMetres, 0.2),
  );
  TestValidator.predicate(
    "an empty band refuses",
    throwsError(
      () =>
        findSeamPair({
          surface: basis.surfaces[1],
          candidates: [1, 2, 4, 5],
          axis,
          pivot,
          bandMetres: 0.01,
        }),
      "no fixed and mandibular vertex pair",
    ),
  );
  const sealed = sealCrownRings(basis.surfaces[0], 6);
  TestValidator.equals(
    "one ring of four sealed by two triangles",
    {
      rings: sealed.sealedRings,
      triangles: sealed.closure.length / 3,
      open: sealed.openLoops,
      sealedTriangles: sealed.sealedTriangles.length / 3,
    },
    { rings: [4], triangles: 2, open: [], sealedTriangles: 4 },
  );
  const query = createAutoMovieSignedMeshQuery(
    {
      positions: basis.surfaces[0].positions,
      indices: [...basis.surfaces[0].indices, ...sealed.closure],
      normals: null,
      uvs: null,
      skin: null,
    },
    { boundary: "open" },
  );
  TestValidator.predicate(
    "sealed crown is a closed outward solid",
    nclose(query([0, -0.25, 1]).signedDistance, -0.05) &&
      nclose(query([0, -0.3, 0.7]).signedDistance, 0.1),
  );
  TestValidator.equals(
    "a large loop stays open",
    sealCrownRings(basis.surfaces[0], 3).openLoops,
    [4],
  );
  const forked = structuredClone(basis.surfaces[0]);
  forked.indices.push(6, 7, 9);
  TestValidator.predicate(
    "a forked boundary refuses",
    throwsError(() => sealCrownRings(forked, 6), "rings must be simple"),
  );
  const inward = structuredClone(basis.surfaces[0]);
  for (let at = 24; at < inward.indices.length; at += 3)
    [inward.indices[at], inward.indices[at + 1]] = [
      inward.indices[at + 1],
      inward.indices[at],
    ];
  TestValidator.predicate(
    "an inward-wound crown refuses",
    throwsError(() => sealCrownRings(inward, 6), "inward-wound crown"),
  );
  const prepared = prepareContactBasis(input());
  TestValidator.predicate(
    "closure rows are the companion delta",
    prepared.basis.surfaces[1].targets.closeTarget.every((value, i) =>
      nclose(value, [3, 0, 0.35, -1.45][i], 1e-9),
    ),
  );
  TestValidator.equals(
    "the closure corrective is removed with its magnitude",
    {
      correctives: prepared.basis.correctives,
      removed: prepared.receipt.closure.removedCorrectives,
      rows: "openCloseEaseTarget" in prepared.basis.surfaces[1].targets,
    },
    {
      correctives: undefined,
      removed: [{ id: "openCloseEase", maxMm: 20 }],
      rows: false,
    },
  );
  const contact = prepared.basis.contact!;
  TestValidator.predicate(
    "budgets, reach and pairs",
    contact.soft[0].budgetMetres === 0.5 &&
      nclose(contact.soft[1].budgetMetres, 0.3) &&
      contact.colliders[0].reachMetres === 0.5 &&
      contact.lips.upper === 0 &&
      contact.lips.lower === 3 &&
      contact.incisors.upper === 3 &&
      contact.incisors.lower === 8 &&
      contact.colliders[0].closure.length === 6,
  );
  TestValidator.equals(
    "documents and controls are restamped",
    [prepared.documents[0].basis, prepared.controls.basis, prepared.basis.id],
    ["analytic-contact/2", "analytic-contact/2", "analytic-contact/2"],
  );
  TestValidator.predicate(
    "receipt carries the neutral apertures",
    nclose(prepared.receipt.neutral.interlabialMm, 100) &&
      nclose(prepared.receipt.neutral.interincisalMm, 200) &&
      nclose(prepared.receipt.neutral.referenceInterlabialMm, 1450) &&
      nclose(prepared.receipt.neutral.referenceInterincisalMm, 1100) &&
      prepared.receipt.soft[1].restCrownOverlapMm === 0 &&
      prepared.receipt.soft[1].authoredExcessMm === 0 &&
      prepared.receipt.probedEndpointRefusals.length === 1 &&
      prepared.receipt.probedEndpointRefusals[0].endpoint === "outTarget",
  );
  const replay = createHumanFaceBasisBuilder(prepared.basis)({
    ...prepared.documents[0],
    shape: {},
    expression: { open: 1, close: 1 },
  });
  const mouth = replay.parts.find((part) => part.id === "mouth/all")!.geometry;
  TestValidator.predicate(
    "the prepared closure seals the seam at the reference",
    mouth.type === "mesh" &&
      [0, 1, 2].every((axis) =>
        nclose(mouth.mesh.positions[9 + axis], mouth.mesh.positions[axis]),
      ),
  );
  const refusals: [(i: ReturnType<typeof input>) => void, string][] = [
    [(i) => void (i.revision = i.basis.id), "distinct revision"],
    [
      (i) => void (i.basis = { ...i.basis, articulation: undefined }),
      "articulated basis",
    ],
    [
      (i) => {
        i.basis = prepared.basis;
        i.revision = "analytic-contact/3";
      },
      "without a contact block",
    ],
    [(i) => void (i.lips.surface = "nose"), "absent surface"],
    [(i) => void (i.lips.region = "mouth/none"), "lip region is absent"],
    [(i) => void (i.closure.channel = "wide"), "expression channel"],
    [(i) => void (i.closure.reference = "close"), "different reference"],
    [(i) => void (i.documents[0].basis = "other"), "binds a different basis"],
    [(i) => void (i.controls.basis = "other"), "control map binds"],
  ];
  for (const [mutate, message] of refusals) {
    const candidate = input();
    mutate(candidate);
    TestValidator.predicate(
      "preparation refusal: " + message,
      throwsError(() => prepareContactBasis(candidate), message),
    );
  }
};
