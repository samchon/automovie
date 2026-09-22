/**
 * Pure preparation of a shared fine facial basis and its dependent bindings.
 * prepare-fine-basis.ts supplies historical/curated data and writes the result.
 * This owner clones all inputs, checks native neutral correspondence, adds
 * named endpoints, clips the selected surface
 * on a neutral metre Y plane, then
 * remaps region-local groom seats before admitting documents and endpoints.
 * A refusal leaves caller data intact. No per-person weight is fitted here.
 * The returned receipt records finite admission, not anatomical acceptance.
 * This historical preparation stage reads pre-migration groom-key documents.
 * Its output is an intermediate for numerical hair migration, not a current
 * editor document. The current builder receives only the face coordinates;
 * legacy attachment inspection remains explicit in this offline stage.
 */
import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  type IAutoMovieHumanFaceControlMap,
  type IAutoMovieHumanFaceGroom,
  appendHumanFaceGroom,
  createHumanFaceBasisBuilder,
  createHumanFaceControlMap,
} from "@automovie/human";
import { assertHumanFaceBasis } from "@automovie/human/face/basis/assertHumanFaceBasis";
import { clipHumanFaceBasisSurface } from "@automovie/human/face/basis/clipHumanFaceBasisSurface";
import { createHash } from "node:crypto";

export type FineBasisEntry = {
  id: string;
  channel: string;
  description: string;
  minimum: number;
  maximum: number;
  negative: string | null;
};
export type FineBasisNative = {
  surfaces: {
    id: string;
    neutralFloat64LESha256: string;
    targets: Record<string, number[]>;
  }[];
};

export function prepareFineBasisArtifacts(input: {
  basis: IAutoMovieHumanFaceBasis;
  source: IAutoMovieHumanFaceBasis;
  entries: FineBasisEntry[];
  native: FineBasisNative;
  grooms: Record<string, IAutoMovieHumanFaceGroom>;
  documents: (Omit<IAutoMovieHumanFaceBasisDocument, "hair"> & {
    hair?: string | null;
  })[];
  controls: IAutoMovieHumanFaceControlMap;
  revision: string;
  cutSurface: string;
  minimumY: number;
}) {
  const {
    basis,
    source,
    entries,
    native,
    grooms,
    documents,
    controls,
    revision,
    cutSurface,
    minimumY,
  } = structuredClone(input);
  const oldId = basis.id;
  assertHumanFaceBasis(basis);
  for (const entry of entries)
    basis.channels.push({
      id: entry.channel,
      description: entry.description,
      kind: "shape",
      minimum: entry.minimum,
      maximum: entry.maximum,
      positive: entry.channel + ".positive",
      negative: entry.negative === null ? null : entry.channel + ".negative",
    });
  for (const surface of basis.surfaces) {
    const field = native.surfaces.find((one) => one.id === surface.id)!;
    const bytes = Buffer.alloc(surface.positions.length * 8);
    surface.positions.forEach((value, i) => bytes.writeDoubleLE(value, i * 8));
    if (
      createHash("sha256").update(bytes).digest("hex") !==
      field.neutralFloat64LESha256
    )
      throw new Error(`Native neutral correspondence differs: ${surface.id}`);
    for (const entry of entries)
      for (const side of entry.negative === null
        ? ["positive"]
        : ["negative", "positive"]) {
        const key = entry.channel + "." + side;
        const rows = field.targets[entry.id + "." + side];
        if (Object.hasOwn(surface.targets, key))
          throw new Error(`Colliding native endpoint: ${surface.id}/${key}`);
        // Native extraction omits a surface's exactly zero displacement field.
        // Basis admission still requires each channel to resolve on some surface.
        if (rows !== undefined) surface.targets[key] = rows;
      }
  }

  const skin = basis.surfaces.find((one) => one.id === cutSurface)!;
  const full = source.surfaces.find((one) => one.id === skin.id)!;
  if (JSON.stringify(full.positions) !== JSON.stringify(skin.positions))
    throw new Error(
      "Full neck connectivity has a different neutral correspondence.",
    );
  const clipped = clipHumanFaceBasisSurface(
    { ...skin, indices: full.indices, regions: full.regions },
    minimumY,
  );
  const maps = new Map<string, Map<number, number>>();
  for (const oldRegion of skin.regions) {
    const region = full.regions.find((one) => one.id === oldRegion.id)!;
    const lookup = new Map<string, number>();
    for (let i = 0; i < region.indices.length; i += 3)
      lookup.set(region.indices.slice(i, i + 3).join("/"), i / 3);
    const map = new Map<number, number>();
    for (let i = 0; i < oldRegion.indices.length; i += 3) {
      const originalTriangle = lookup.get(
        oldRegion.indices.slice(i, i + 3).join("/"),
      );
      if (originalTriangle === undefined)
        throw new Error(
          "Current region triangle is absent from source connectivity.",
        );
      const triangle = clipped.retainedTriangles
        .get(region.id)!
        .get(originalTriangle);
      if (triangle !== undefined) map.set(i / 3, triangle);
    }
    maps.set(region.id, map);
  }
  basis.surfaces[basis.surfaces.indexOf(skin)] = clipped.surface;
  basis.id = revision;
  let seats = 0;
  for (const groom of Object.values(grooms)) {
    if (groom.basis !== oldId) throw new Error("Unexpected groom binding.");
    groom.basis = revision;
    for (const card of groom.cards) {
      const map = maps.get(card.part);
      if (map === undefined) continue;
      const moved = map.get(card.triangle);
      if (moved === undefined)
        throw new Error("Groom seat crosses the new cut.");
      card.triangle = moved;
      seats++;
    }
  }
  for (const document of documents) {
    if (document.basis !== oldId)
      throw new Error("Unexpected document binding.");
    document.basis = revision;
  }
  controls.basis = revision;
  const project = createHumanFaceControlMap({ basis, map: controls });
  const build = createHumanFaceBasisBuilder(basis);
  for (const document of documents) {
    const { hair, ...face } = document;
    let model = build(face);
    if (hair) model = appendHumanFaceGroom({ model, groom: grooms[hair] });
    project(document.shape);
  }
  // Admit every added endpoint through the same builder as editor evaluation.
  const neutral: IAutoMovieHumanFaceBasisDocument = {
    id: "fine-reference",
    name: "Fine reference",
    basis: revision,
    shape: {},
    expression: {},
  };
  let endpoints = 0;
  for (const entry of entries)
    for (const weight of entry.negative === null
      ? [entry.maximum]
      : [entry.minimum, entry.maximum]) {
      build({ ...neutral, shape: { [entry.channel]: weight } });
      endpoints++;
    }

  return {
    basis,
    grooms,
    documents,
    controls,
    receipt: {
      revision,
      minimumY,
      remappedGroomSeats: seats,
      addedShapeChannels: entries.length,
      admittedAddedEndpoints: endpoints,
      admittedDocuments: documents.length,
    },
  };
}
