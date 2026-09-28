/**
 * Pure preparation of an articulated facial basis from a linear one.
 *
 * `prepare-articulated-basis.ts` supplies the tracked basis, the extracted
 * attachment metadata and the personal documents and writes the result; this
 * owner does the measurement and assembly without files, so the analytic unit
 * scenarios exercise every refusal and every fit on point sets whose answers
 * are known. Nothing here reads a person: the weights, axes, angles and
 * residuals are measured from the shared source's own authored endpoints.
 *
 * Order, and why it is this order:
 *
 * 1. Refuse a basis that is not the one the attachments were extracted from,
 *    by revision and by the neutral's exact bytes.
 * 2. Take the legacy rigid membership off the surfaces: it becomes the unit
 *    attachment of teeth and globes, and the post-hoc rigid fit it fed is gone.
 * 3. Attach the landmarks (source joint cubes with their shape rows).
 * 4. Fit the mandible: the pure-translation endpoints (protrusion, both
 *    laterotrusions) must leave no rotation and give the translations; the
 *    opening endpoint's screw is decomposed under the cited coupling into a
 *    condylar axis point, expressed as an offset from the pivot landmark.
 * 5. Fit each globe's gaze channels as rotations about its centre landmark
 *    plus the eccentric translation the source authored.
 * 6. Attach the skin and tongue with the weights the translations imply.
 * 7. Rewrite every expression endpoint and corrective as a rest-space
 *    residual (`articulatedResiduals`), retiring what would deform bone.
 * 8. Admit the result through the real builder and replay every expression
 *    at weight one (a carrier with its carried channel) against the authored
 *    pose, then restamp the documents and the control map to the new revision.
 *
 * The receipt records each fit's figures and tolerances, the retired rows and
 * correctives and the replay error, which is the evidence a reviewer reads.
 */
import { Quaternion, Vector3 } from "@automovie/engine";
import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  type IAutoMovieHumanFaceControlMap,
  createHumanFaceBasisBuilder,
  evaluateHumanFaceRest,
} from "@automovie/human";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { createHash } from "node:crypto";

import {
  decomposeOpening,
  fitEndpointTransform,
  impliedWeights,
} from "./articulatedFits";
import {
  decomposeExpressionResiduals,
  denseRows,
} from "./articulatedResiduals";

type Surface = IAutoMovieHumanFaceBasis["surfaces"][number];
type LegacyGroup = { id: string; vertices: number[]; motion: "fixed" | "fit" };
export type LegacyBasis = Omit<IAutoMovieHumanFaceBasis, "surfaces"> & {
  surfaces: (Surface & { rigidGroups?: LegacyGroup[] })[];
};

export interface IArticulatedBasisInput {
  basis: LegacyBasis;
  attachments: {
    basis: string;
    surface: string;
    neutralFloat64LESha256: string;
    landmarks: NonNullable<IAutoMovieHumanFaceBasis["landmarks"]>;
  };
  jaw: {
    pivot: string;
    opening: string;
    protrusion: string;
    left: string;
    right: string;
    /** Surface and legacy group of the mandibular arch. */
    surface: string;
    group: string;
    /** Metres of mandibular translation per degree of opening, head frame. */
    couplingPerDegree: [number, number, number];
    translationLimitMetres: number;
  };
  eyes: {
    id: string;
    center: string;
    surface: string;
    group: string;
    gaze: string[];
  }[];
  /** Surfaces whose attachment weights the translation endpoints imply. */
  attachedSurfaces: string[];
  carriers: { channel: string; carried: string }[];
  tolerances: {
    rotationDegrees: number;
    slideMetres: number;
    gazeCenterMetres: number;
    replayMetres: number;
  };
  revision: string;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
}

const vector = (v: IAutoMovieVector3): [number, number, number] => [
  v.x,
  v.y,
  v.z,
];
const mm = (metres: number): number => Math.round(metres * 1e6) / 1e3;

export function prepareArticulatedBasis(input: IArticulatedBasisInput) {
  const { attachments, jaw, eyes, carriers, tolerances, revision } =
    structuredClone(input);
  const basis = structuredClone(input.basis) as IAutoMovieHumanFaceBasis;
  const documents = structuredClone(input.documents);
  const controls = structuredClone(input.controls);
  if (
    revision.trim() === "" ||
    revision === basis.id ||
    attachments.basis !== basis.id
  )
    throw new Error(
      "Articulated preparation needs the attachments' source basis and a distinct revision.",
    );
  const human = basis.surfaces.find(
    (surface) => surface.id === attachments.surface,
  );
  if (human === undefined)
    throw new Error("The attachment surface is absent: " + attachments.surface);
  const bytes = Buffer.alloc(human.positions.length * 8);
  human.positions.forEach((value, index) =>
    bytes.writeDoubleLE(value, index * 8),
  );
  if (
    createHash("sha256").update(bytes).digest("hex") !==
    attachments.neutralFloat64LESha256
  )
    throw new Error(
      "The attachments were extracted from a different neutral surface.",
    );
  const legacy = new Map<string, LegacyGroup[]>();
  for (const surface of basis.surfaces as LegacyBasis["surfaces"]) {
    legacy.set(surface.id, surface.rigidGroups ?? []);
    delete surface.rigidGroups;
  }
  const member = (
    surfaceId: string,
    groupId: string,
  ): { surface: Surface; vertices: number[] } => {
    const surface = basis.surfaces.find((one) => one.id === surfaceId);
    const group = legacy.get(surfaceId)?.find((one) => one.id === groupId);
    if (
      surface === undefined ||
      group === undefined ||
      group.vertices.length === 0
    )
      throw new Error(
        `Articulated preparation needs the legacy rigid group ${surfaceId}/${groupId}.`,
      );
    return { surface, vertices: group.vertices };
  };
  const channel = (id: string) => {
    const found = basis.channels.find((one) => one.id === id);
    if (found === undefined || found.kind !== "expression")
      throw new Error("Articulation needs an expression channel: " + id);
    return found;
  };
  basis.landmarks = attachments.landmarks;
  const landmarks = evaluateHumanFaceRest(basis, {
    weights: new Map(),
    activations: [],
  }).landmarks;
  const pivot = landmarks[jaw.pivot];
  if (pivot === undefined)
    throw new Error("The jaw pivot landmark is absent: " + jaw.pivot);

  // 4. The mandible.
  const arch = member(jaw.surface, jaw.group);
  const translation = (id: string) => {
    const fit = fitEndpointTransform(
      arch.surface.positions,
      arch.surface.targets[channel(id).positive],
      arch.vertices,
    );
    if (fit.degrees > tolerances.rotationDegrees)
      throw new Error(
        `${id} turns the arch by ${fit.degrees.toFixed(3)} degrees; a translation endpoint must not rotate.`,
      );
    return {
      translation: Vector3.subtract(fit.targetCenter, fit.referenceCenter),
      rmsMetres: fit.rmsMetres,
      degrees: fit.degrees,
    };
  };
  const protrusion = translation(jaw.protrusion);
  const left = translation(jaw.left);
  const right = translation(jaw.right);
  const openFit = fitEndpointTransform(
    arch.surface.positions,
    arch.surface.targets[channel(jaw.opening).positive],
    arch.vertices,
  );
  const opening = decomposeOpening({
    ...openFit,
    pivotLandmark: pivot,
    couplingPerDegree: Vector3.create(...jaw.couplingPerDegree),
  });
  if (opening.slideMetres > tolerances.slideMetres)
    throw new Error(
      `${jaw.opening} slides ${mm(opening.slideMetres)} mm along its axis; the opening is not a plane screw.`,
    );
  const articulation: NonNullable<IAutoMovieHumanFaceBasis["articulation"]> = {
    jaw: {
      pivot: jaw.pivot,
      axisOffset: vector(Vector3.subtract(opening.axisPoint, pivot)),
      axis: vector(opening.axis),
      opening: {
        channel: jaw.opening,
        degrees: opening.degrees,
        translation: vector(opening.translation),
      },
      protrusion: {
        channel: jaw.protrusion,
        translation: vector(protrusion.translation),
      },
      laterotrusion: {
        left: { channel: jaw.left, translation: vector(left.translation) },
        right: { channel: jaw.right, translation: vector(right.translation) },
      },
      translationLimitMetres: jaw.translationLimitMetres,
    },
    eyes: [],
  };
  arch.surface.attachments = [
    { owner: "jaw", rows: arch.vertices.flatMap((v) => [v, 1]) },
  ];

  // 5. The globes: a gaze endpoint turns about the centre landmark and shifts
  // the globe by whatever the fitted centroid image `R (a - C) + C` misses
  // the fitted target centroid by; that eccentric shift is kept as the
  // channel's translation, within the bound, so the authored globe and the
  // lids sculpted around it stay together.
  const gazeRecord: Record<
    string,
    { degrees: number; axis: number[]; translationMm: number[]; rmsMm: number }
  > = {};
  for (const eye of eyes) {
    const globe = member(eye.surface, eye.group);
    const center = landmarks[eye.center];
    if (center === undefined)
      throw new Error("An eye centre landmark is absent: " + eye.center);
    const gaze = eye.gaze.map((id) => {
      const fit = fitEndpointTransform(
        globe.surface.positions,
        globe.surface.targets[channel(id).positive],
        globe.vertices,
      );
      const image = Vector3.add(
        Quaternion.rotateVector(
          fit.rotation,
          Vector3.subtract(fit.referenceCenter, center),
        ),
        center,
      );
      const shift = Vector3.subtract(fit.targetCenter, image);
      const centerResidual = Vector3.length(shift);
      if (centerResidual > tolerances.gazeCenterMetres)
        throw new Error(
          `${id} turns the globe ${mm(centerResidual)} mm off its centre landmark.`,
        );
      gazeRecord[id] = {
        degrees: fit.degrees,
        axis: vector(fit.axis),
        translationMm: vector(shift).map(mm),
        rmsMm: mm(fit.rmsMetres),
      };
      return {
        channel: id,
        axis: vector(fit.axis),
        degrees: fit.degrees,
        translation: vector(shift),
      };
    });
    articulation.eyes.push({ id: eye.id, center: eye.center, gaze });
    globe.surface.attachments = [
      ...(globe.surface.attachments ?? []),
      { owner: eye.id, rows: globe.vertices.flatMap((v) => [v, 1]) },
    ];
  }
  basis.articulation = articulation;

  // 6. Implied attachment of the soft surfaces.
  const weightRecord: Record<
    string,
    {
      attached: number;
      fullyAttached: number;
      clamped: number;
      worstExcess: number;
      worstOffAxisMm: number;
    }
  > = {};
  for (const id of input.attachedSurfaces) {
    const surface = basis.surfaces.find((one) => one.id === id);
    if (surface === undefined)
      throw new Error("An attached surface is absent: " + id);
    const count = surface.positions.length / 3;
    const implied = impliedWeights(count, [
      {
        rows: surface.targets[channel(jaw.protrusion).positive],
        translation: protrusion.translation,
      },
      {
        rows: surface.targets[channel(jaw.left).positive],
        translation: left.translation,
      },
      {
        rows: surface.targets[channel(jaw.right).positive],
        translation: right.translation,
      },
    ]);
    const rows: number[] = [];
    let fully = 0;
    for (let v = 0; v < count; v++) {
      const weight = Math.round(implied.weights[v] * 1e7) / 1e7;
      if (weight <= 0) continue;
      if (weight >= 0.999) fully++;
      rows.push(v, weight);
    }
    weightRecord[id] = {
      attached: rows.length / 2,
      fullyAttached: fully,
      clamped: implied.clamped,
      worstExcess: implied.worstExcess,
      worstOffAxisMm: mm(implied.worstOffAxisMetres),
    };
    if (rows.length > 0) surface.attachments = [{ owner: "jaw", rows }];
  }

  // 7. Residuals.
  const bone = new Set([jaw.surface, ...eyes.map((eye) => eye.surface)]);
  const source = structuredClone(basis);
  const decomposition = decomposeExpressionResiduals({
    basis,
    boneSurfaces: bone,
    carriers,
    decimals: 7,
  });

  // 8. Admission, replay and restamping. A replay reads the builder's region
  // meshes, whose vertices gather source vertices corner by corner.
  basis.id = revision;
  const build = createHumanFaceBasisBuilder(basis);
  const replay: Record<string, number> = {};
  for (const one of basis.channels.filter((c) => c.kind === "expression")) {
    // A carrier's authored rows are the pose with the carried channel at one
    // as well, so it replays with both.
    const carrier = carriers.find((c) => c.channel === one.id);
    const expression =
      carrier === undefined
        ? { [one.id]: 1 }
        : { [one.id]: 1, [carrier.carried]: 1 };
    const model = build({
      id: "replay",
      name: "replay",
      basis: revision,
      shape: {},
      expression,
    });
    let max = 0;
    basis.surfaces.forEach((surface, index) => {
      if (bone.has(surface.id)) return;
      const src = source.surfaces[index];
      const count = src.positions.length / 3;
      const authored = denseRows(count, src.targets[one.positive]);
      for (const region of surface.regions) {
        const part = model.parts.find((p) => p.id === region.id);
        if (part === undefined || part.geometry.type !== "mesh")
          throw new Error("A prepared region is absent from the replay.");
        const mesh = part.geometry.mesh;
        if (mesh.indices === null)
          throw new Error("A prepared region mesh is indexed.");
        const indices = mesh.indices;
        region.indices.forEach((sourceVertex, corner) => {
          const gathered = indices[corner];
          max = Math.max(
            max,
            Math.hypot(
              ...[0, 1, 2].map(
                (axis) =>
                  mesh.positions[3 * gathered + axis] -
                  src.positions[3 * sourceVertex + axis] -
                  authored[3 * sourceVertex + axis],
              ),
            ),
          );
        });
      }
    });
    if (max > tolerances.replayMetres)
      throw new Error(
        `${one.id} replays ${mm(max)} mm off its authored pose at weight one.`,
      );
    replay[one.id] = mm(max);
  }
  for (const document of documents) {
    if (document.basis !== input.basis.id)
      throw new Error("A document names another basis: " + document.id);
    document.basis = revision;
  }
  if (controls.basis !== input.basis.id)
    throw new Error("The control map names another basis.");
  controls.basis = revision;
  return {
    basis,
    documents,
    controls,
    receipt: {
      revision,
      source: input.basis.id,
      jaw: {
        axis: articulation.jaw.axis,
        openingDegrees: opening.degrees,
        openingTranslationMm: vector(opening.translation).map(mm),
        screwPivotMm: vector(opening.screwPivot).map(mm),
        slideMm: mm(opening.slideMetres),
        axisPointMm: vector(opening.axisPoint).map(mm),
        axisOffsetMm: articulation.jaw.axisOffset.map(mm),
        openingFitRmsMm: mm(openFit.rmsMetres),
        protrusion: {
          translationMm: vector(protrusion.translation).map(mm),
          residualDegrees: protrusion.degrees,
          rmsMm: mm(protrusion.rmsMetres),
        },
        left: {
          translationMm: vector(left.translation).map(mm),
          residualDegrees: left.degrees,
          rmsMm: mm(left.rmsMetres),
        },
        right: {
          translationMm: vector(right.translation).map(mm),
          residualDegrees: right.degrees,
          rmsMm: mm(right.rmsMetres),
        },
        translationLimitMm: mm(jaw.translationLimitMetres),
      },
      gaze: gazeRecord,
      weights: weightRecord,
      dropped: decomposition.dropped.map((d) => ({
        surface: d.surface,
        endpoint: d.endpoint,
        maxMm: mm(d.maxMetres),
      })),
      residuals: decomposition.residuals.map((r) => ({
        endpoint: r.endpoint,
        maxMm: mm(r.maxMetres),
      })),
      removedCorrectives: decomposition.removedCorrectives,
      replayWorstMm: replay,
      tolerances,
      documents: documents.length,
    },
  };
}
