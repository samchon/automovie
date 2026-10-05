/**
 * Prepare the coupled oral contact revision of an articulated face basis.
 *
 * Everything the contact block needs is measured on the shared source, never
 * chosen per person:
 *
 * - The vermilion seam and incisal edge vertex pairs are the closest
 *   fixed/mandibular vertex pair within a transverse band about the jaw
 *   axis, on the lip region and the dental surface respectively.
 * - Each collider's crown root rings (boundary loops of at most
 *   `maximumRingVertices` vertices after exact welding) are sealed with fan
 *   triangles wound so the sealed crown has positive volume; larger loops
 *   (the gum sheets) stay open and are recorded.
 * - The closure channel's rows, which the articulated revision holds as the
 *   raw delta the source authored over its open jaw, are decomposed as a
 *   companion of the reference channel: the delta is unposed through the
 *   per-vertex blend at reference weight one, so the closure plus the
 *   reference replays the source's authored closed-lip pose exactly and the
 *   builder can scale it to any smaller aperture. Correctives driven by the
 *   closure channel compensated the old rotation and are removed with their
 *   magnitude recorded.
 * - Soft budgets are either a cited tissue thickness or the surface's own
 *   extent along the opening direction on the neutral: a push larger than
 *   the tissue itself is no longer a local deformation but the tissue in
 *   the wrong place, which the passage rule states for the tongue and this
 *   budget catches otherwise. A collider's reach is the largest soft budget,
 *   since a push beyond it refuses anyway. Beside each budget the receipt
 *   records what the source itself authored: the surface's overlap with the
 *   sealed crowns at rest, and the deepest excess over the rest floor that
 *   the floor rule finds on the neutral and on every expression endpoint at
 *   weight one, measured through the builder with the budget lifted, so a
 *   reader sees the modelling noise the rule resolves against the budget.
 *
 * `prepare-contact-basis.ts` supplies the study inputs and constants and
 * writes the receipt; analytic unit scenarios call this on the contact
 * fixture with known answers.
 */
import { createAutoMovieSignedMeshQuery } from "@automovie/engine";
import {
  type IAutoMovieHumanFaceBasis,
  createHumanFaceBasisBuilder,
  evaluateHumanFaceRest,
  measureHumanFaceAperture,
  poseHumanFaceSurface,
  resolveHumanFaceArticulation,
  unposeHumanFaceSurface,
} from "@automovie/human";

import { denseRows, sparseRows } from "./articulatedResiduals";
import type { IContactBasisInput } from "./IContactBasisInput";
import { findLipMarginPairs } from "./findLipMarginPairs";
import { findSeamPair } from "./findSeamPair";
import { roundedMillimetres } from "./roundedMillimetres";
import { sealCrownRings } from "./sealCrownRings";

type Surface = IAutoMovieHumanFaceBasis["surfaces"][number];

export function prepareContactBasis(input: IContactBasisInput) {
  const { closure, passage, revision, decimals } = structuredClone(input);
  const basis = structuredClone(input.basis);
  const documents = structuredClone(input.documents);
  const controls = structuredClone(input.controls);
  if (revision.trim() === "" || revision === basis.id)
    throw new Error("Contact preparation needs a distinct revision.");
  if (basis.articulation === undefined || basis.contact !== undefined)
    throw new Error(
      "Contact preparation needs an articulated basis without a contact block.",
    );
  const surface = (id: string): Surface => {
    const found = basis.surfaces.find((one) => one.id === id);
    if (found === undefined)
      throw new Error("Contact preparation names an absent surface: " + id);
    return found;
  };
  const channel = (id: string) => {
    const found = basis.channels.find((one) => one.id === id);
    if (found === undefined || found.kind !== "expression")
      throw new Error("Contact preparation needs an expression channel: " + id);
    return found;
  };
  const neutral = evaluateHumanFaceRest(basis, {
    weights: new Map(),
    activations: [],
  });
  const { jaw } = basis.articulation;
  const pivotLandmark = neutral.landmarks[jaw.pivot];
  const pivot = [pivotLandmark.x, pivotLandmark.y, pivotLandmark.z];

  // 1. Seam pairs.
  const lipSurface = surface(input.lips.surface);
  const lipRegion = lipSurface.regions.find(
    (region) => region.id === input.lips.region,
  );
  if (lipRegion === undefined)
    throw new Error("The lip region is absent: " + input.lips.region);
  const lips = findSeamPair({
    surface: lipSurface,
    candidates: new Set(lipRegion.indices),
    axis: jaw.axis,
    pivot,
    bandMetres: input.midlineBandMetres,
  });
  const margin = findLipMarginPairs({
    surface: lipSurface,
    region: lipRegion.indices,
    axis: jaw.axis,
    stationMetres: input.marginStationMetres,
  });
  const incisorSurface = surface(input.incisors.surface);
  const incisors = findSeamPair({
    surface: incisorSurface,
    candidates: Array.from(
      { length: incisorSurface.positions.length / 3 },
      (_, i) => i,
    ),
    axis: jaw.axis,
    pivot,
    bandMetres: input.midlineBandMetres,
  });

  // 2. Colliders.
  const colliders = input.colliders.map((collider) => {
    const sealed = sealCrownRings(
      surface(collider.surface),
      collider.maximumRingVertices,
    );
    return { surface: collider.surface, ...sealed };
  });

  // 3. Companion decomposition of the closure channel.
  const closureChannel = channel(closure.channel);
  const referenceChannel = channel(closure.reference);
  if (closureChannel.id === referenceChannel.id)
    throw new Error("The closure channel needs a different reference channel.");
  const referenceMotions = resolveHumanFaceArticulation(
    basis.articulation,
    new Map([[referenceChannel.id, 1]]),
    neutral.landmarks,
  ).motions;
  const decomposed: Record<string, { maxDeltaMm: number; rows: number }> = {};
  for (const one of basis.surfaces) {
    const raw = one.targets[closureChannel.positive];
    if (raw === undefined) continue;
    const count = one.positions.length / 3;
    const delta = denseRows(count, raw);
    if ((one.attachments?.length ?? 0) === 0) continue;
    const referenceRows = denseRows(
      count,
      one.targets[referenceChannel.positive],
    );
    const referenceRest = one.positions.map(
      (value, i) => value + referenceRows[i],
    );
    const posed = poseHumanFaceSurface(
      referenceRest,
      one.attachments!,
      referenceMotions,
    );
    const unposed = unposeHumanFaceSurface(
      posed.map((value, i) => value + delta[i]),
      one.attachments!,
      referenceMotions,
    );
    const companion = new Float64Array(count * 3);
    let maxDelta = 0;
    for (let v = 0; v < count; v++) {
      for (let axis = 0; axis < 3; axis++)
        companion[3 * v + axis] =
          unposed[3 * v + axis] - referenceRest[3 * v + axis];
      maxDelta = Math.max(
        maxDelta,
        Math.hypot(
          companion[3 * v] - delta[3 * v],
          companion[3 * v + 1] - delta[3 * v + 1],
          companion[3 * v + 2] - delta[3 * v + 2],
        ),
      );
    }
    const rows = sparseRows(companion, decimals);
    if (rows.length === 0) delete one.targets[closureChannel.positive];
    else one.targets[closureChannel.positive] = rows;
    decomposed[one.id] = { maxDeltaMm: roundedMillimetres(maxDelta), rows: rows.length / 4 };
  }
  const removedCorrectives: { id: string; maxMm: number }[] = [];
  basis.correctives = (basis.correctives ?? []).filter((corrective) => {
    if (!corrective.inputs.some((one) => one.channel === closureChannel.id))
      return true;
    let max = 0;
    for (const one of basis.surfaces) {
      const rows = one.targets[corrective.target];
      if (rows === undefined) continue;
      for (let i = 0; i < rows.length; i += 4)
        max = Math.max(max, Math.hypot(rows[i + 1], rows[i + 2], rows[i + 3]));
      delete one.targets[corrective.target];
    }
    removedCorrectives.push({ id: corrective.id, maxMm: roundedMillimetres(max) });
    return false;
  });
  if (basis.correctives.length === 0) delete basis.correctives;

  // 4. Rest overlap with the sealed crowns alone (closed, so the sign holds
  // everywhere), recorded per soft surface.
  const crownQueries = colliders.map((collider) =>
    createAutoMovieSignedMeshQuery({
      positions: surface(collider.surface).positions,
      indices: [...collider.sealedTriangles, ...collider.closure],
      normals: null,
      uvs: null,
      skin: null,
    }),
  );
  const overlaps: Record<string, number> = {};
  for (const entry of input.soft) {
    const one = surface(entry.surface);
    let overlap = 0;
    for (let at = 0; at < one.positions.length; at += 3)
      for (const query of crownQueries)
        overlap = Math.max(
          overlap,
          -query(one.positions.slice(at, at + 3)).signedDistance,
        );
    overlaps[entry.surface] = roundedMillimetres(overlap);
  }
  // 5. Budgets: a cited thickness, or the tissue's own extent along the
  // opening direction; the reach is the largest budget. The authored excess
  // over the rest floor is probed on every endpoint for the receipt.
  const contactWith = (
    budgets: Map<string, number>,
  ): NonNullable<IAutoMovieHumanFaceBasis["contact"]> => ({
    lips: { surface: input.lips.surface, upper: lips.upper, lower: lips.lower },
    margin: margin.pairs,
    incisors: {
      surface: input.incisors.surface,
      upper: incisors.upper,
      lower: incisors.lower,
    },
    closure: { channel: closureChannel.id, reference: referenceChannel.id },
    passage: {
      surface: surface(passage.surface).id,
      channel: channel(passage.channel).id,
      slabMetres: passage.slabMetres,
    },
    colliders: colliders.map((collider) => ({
      surface: collider.surface,
      closure: collider.closure,
      reachMetres: Math.max(...budgets.values()),
    })),
    soft: input.soft.map((entry) => ({
      surface: entry.surface,
      budgetMetres: budgets.get(entry.surface)!,
    })),
    toleranceMetres: input.toleranceMetres,
  });
  const openingFrame = measureHumanFaceAperture(
    basis,
    contactWith(new Map(input.soft.map((entry) => [entry.surface, 1]))),
    neutral.surfaces,
    resolveHumanFaceArticulation(
      basis.articulation,
      new Map(),
      neutral.landmarks,
    ).motions,
  );
  const extentAlongUp = (id: string): number => {
    const one = surface(id);
    let low = Infinity;
    let high = -Infinity;
    for (let at = 0; at < one.positions.length; at += 3) {
      const height =
        one.positions[at] * openingFrame.up.x +
        one.positions[at + 1] * openingFrame.up.y +
        one.positions[at + 2] * openingFrame.up.z;
      low = Math.min(low, height);
      high = Math.max(high, height);
    }
    return high - low;
  };
  const budgets = new Map(
    input.soft.map((entry) => [
      entry.surface,
      "metres" in entry.budget
        ? entry.budget.metres
        : extentAlongUp(entry.surface),
    ]),
  );
  const authored = new Map<string, number>();
  // The probe must not refuse for budget, yet its correction solve scales by
  // the budget, so an unbounded value overflows to a non-finite displacement
  // and refuses an endpoint for arithmetic. The extent of the whole assembly
  // is finite and no tissue correction can move a vertex farther than that.
  const low = [Infinity, Infinity, Infinity];
  const high = [-Infinity, -Infinity, -Infinity];
  for (const one of basis.surfaces)
    for (let at = 0; at < one.positions.length; at++) {
      low[at % 3] = Math.min(low[at % 3], one.positions[at]);
      high[at % 3] = Math.max(high[at % 3], one.positions[at]);
    }
  const assemblyExtent = Math.hypot(
    high[0] - low[0],
    high[1] - low[1],
    high[2] - low[2],
  );
  const probeBudgets = new Map(
    input.soft.map((entry) => [entry.surface, assemblyExtent]),
  );
  const probed: { endpoint: string; refused: string }[] = [];
  const probe = createHumanFaceBasisBuilder(
    { ...basis, contact: contactWith(probeBudgets) },
    {
      observe: (summary) => {
        for (const entry of summary?.resolved ?? [])
          authored.set(
            entry.surface,
            Math.max(authored.get(entry.surface) ?? 0, entry.maxDepthMetres),
          );
      },
    },
  );
  const neutralDocument = {
    id: basis.id,
    name: basis.id,
    basis: basis.id,
    shape: {},
    expression: {},
  };
  for (const one of basis.channels) {
    if (one.kind !== "expression") continue;
    for (const weight of one.negative === null ? [1] : [1, -1])
      try {
        probe({ ...neutralDocument, expression: { [one.id]: weight } });
      } catch (error) {
        probed.push({
          endpoint: weight < 0 ? one.negative! : one.positive,
          refused: error instanceof Error ? error.message : String(error),
        });
      }
  }
  const reach = Math.max(...budgets.values());
  const soft = [...budgets].map(([surface, budgetMetres]) => ({
    surface,
    budgetMetres,
  }));
  basis.contact = {
    lips: { surface: input.lips.surface, upper: lips.upper, lower: lips.lower },
    margin: margin.pairs,
    incisors: {
      surface: input.incisors.surface,
      upper: incisors.upper,
      lower: incisors.lower,
    },
    closure: { channel: closureChannel.id, reference: referenceChannel.id },
    passage: {
      surface: surface(passage.surface).id,
      channel: channel(passage.channel).id,
      slabMetres: passage.slabMetres,
    },
    colliders: colliders.map((collider) => ({
      surface: collider.surface,
      closure: collider.closure,
      reachMetres: reach,
    })),
    soft,
    toleranceMetres: input.toleranceMetres,
  };
  const oldId = basis.id;
  basis.id = revision;
  for (const document of documents) {
    if (document.basis !== oldId)
      throw new Error("A document binds a different basis: " + document.id);
    document.basis = revision;
  }
  if (controls.basis !== oldId)
    throw new Error("The control map binds a different basis.");
  controls.basis = revision;

  // 5. Admission, neutral apertures and every document.
  // Every document's face is evaluated against the new block; its groom is a
  // separate artifact the contact block does not touch and is not rebuilt.
  const build = createHumanFaceBasisBuilder(basis);
  for (const document of documents) build({ ...document, hair: null });
  const referenced = evaluateHumanFaceRest(basis, {
    weights: new Map([[referenceChannel.id, 1]]),
    activations: [],
  });
  const apertures = measureHumanFaceAperture(
    basis,
    basis.contact,
    neutral.surfaces,
    resolveHumanFaceArticulation(
      basis.articulation,
      new Map(),
      neutral.landmarks,
    ).motions,
  );
  const reference = measureHumanFaceAperture(
    basis,
    basis.contact,
    referenced.surfaces,
    referenceMotions,
  );
  return {
    basis,
    documents,
    controls,
    receipt: {
      revision,
      source: oldId,
      lips: { ...lips, gapMm: roundedMillimetres(lips.gapMetres) },
      incisors: { ...incisors, gapMm: roundedMillimetres(incisors.gapMetres) },
      midlineBandMm: roundedMillimetres(input.midlineBandMetres),
      margin: {
        stationMm: roundedMillimetres(input.marginStationMetres),
        commissureLimitMm: roundedMillimetres(margin.limitMetres),
        pairs: margin.pairs,
      },
      colliders: colliders.map((collider) => ({
        surface: collider.surface,
        sealedRings: collider.sealedRings.length,
        ringVertices: [...new Set(collider.sealedRings)].sort((a, b) => a - b),
        closureTriangles: collider.closure.length / 3,
        openLoops: collider.openLoops,
        reachMm: roundedMillimetres(reach),
      })),
      closure: { ...closure, decomposed, removedCorrectives },
      passage: { ...passage, slabMm: roundedMillimetres(passage.slabMetres) },
      soft: soft.map((entry) => ({
        surface: entry.surface,
        budgetMm: roundedMillimetres(entry.budgetMetres),
        authoredExcessMm: roundedMillimetres(authored.get(entry.surface) ?? 0),
        restCrownOverlapMm: overlaps[entry.surface],
      })),
      probedEndpointRefusals: probed,
      toleranceMm: roundedMillimetres(input.toleranceMetres),
      neutral: {
        interlabialMm: roundedMillimetres(apertures.lips.gap),
        interincisalMm: roundedMillimetres(apertures.incisors.gap),
        referenceInterlabialMm: roundedMillimetres(reference.lips.gap),
        referenceInterincisalMm: roundedMillimetres(reference.incisors.gap),
        up: [apertures.up.x, apertures.up.y, apertures.up.z],
        forward: [
          apertures.forward.x,
          apertures.forward.y,
          apertures.forward.z,
        ],
      },
      admittedDocuments: documents.length,
    },
  };
}
