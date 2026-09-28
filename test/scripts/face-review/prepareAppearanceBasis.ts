import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  type IAutoMovieHumanFaceControlMap,
  createHumanFaceBasisBuilder,
  decodePortraitPng,
  encodePortraitPng,
} from "@automovie/human";

import { faceLikenessSrgbToLab } from "./faceLikenessColour";

/**
 * Give a contact basis's ocular surface and enamel their measured
 * appearance, as a new basis revision.
 *
 * `prepare-appearance-basis.ts` calls this with the published basis. Two
 * shared material facts are revised, each on the surface the geometry
 * identifies, never by an asset name:
 *
 * - The ocular surface is covered by the tear film, an optically smooth
 *   layer, so the material of every articulated eye's globe (the first
 *   textured region whose triangles are fully bound to that eye) gets the
 *   requested `roughness`; the source's 0.55 spread a light's reflection
 *   over the whole eye, so no catchlight formed and a dark iris read as grey.
 *   Its albedo is left as the source painted it: no measurement this
 *   repository holds fixes the sclera's.
 * - The crowns' enamel is moved to the requested CIELAB mean: the crowns
 *   are the connected components of the contact dentition that the contact
 *   seals as colliders (their root-ring closure), their texels found by
 *   rasterizing those triangles' UVs, and every such texel is shifted by the
 *   difference between the target and their median L*, a* and b*, which
 *   keeps the texture's own variation (translucency, interproximal shade).
 *   The gums and every other texel are unchanged.
 *
 * Documents and controls are restamped to the new revision and the real
 * builder must admit the neutral and every document. The receipt records
 * what each rule touched and the before and after values. Pure: the inputs
 * are cloned. Refuses a basis without articulated eyes, a textured globe or
 * contact, parameters out of range, the same revision, and documents or
 * controls naming another basis.
 */
export function prepareAppearanceBasis(input: {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  revision: string;
  ocular: { roughness: number };
  enamel: { lab: [number, number, number] };
}): {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  receipt: {
    source: string;
    revision: string;
    ocular: {
      materials: string[];
      roughness: { before: number[]; after: number };
    };
    enamel: {
      material: string;
      crowns: number;
      texels: number;
      lab: { before: number[]; after: number[] };
    };
  };
} {
  const { basis, documents, controls, revision, ocular, enamel } =
    structuredClone(input);
  if (revision.trim() === "" || revision === basis.id)
    throw new Error("An appearance revision needs a distinct revision.");
  if (
    !(ocular.roughness >= 0 && ocular.roughness <= 1) ||
    !enamel.lab.every(Number.isFinite)
  )
    throw new Error(
      "Appearance needs a roughness in [0, 1] and a finite CIELAB target.",
    );
  const contact = basis.contact;
  if (contact === undefined)
    throw new Error("An appearance revision needs a contact basis.");
  const globes = (basis.articulation?.eyes ?? []).map((eye) =>
    findGlobe(basis, eye.id),
  );
  if (globes.length === 0 || globes.some((globe) => globe === null))
    throw new Error("An appearance revision needs textured articulated eyes.");
  const material = (id: string) =>
    basis.materials.find((one) => one.id === id)!;

  // The enamel's crowns: sealed collider components with surface triangles.
  const teeth = basis.surfaces.find(
    (one) => one.id === contact.incisors.surface,
  )!;
  const sealed = new Set(
    contact.colliders
      .filter((one) => one.surface === teeth.id)
      .flatMap((one) => one.closure),
  );
  const parent = Array.from(
    { length: teeth.positions.length / 3 },
    (_, index) => index,
  );
  const root = (vertex: number): number => {
    while (parent[vertex] !== vertex) vertex = parent[vertex]!;
    return vertex;
  };
  for (const region of teeth.regions)
    for (let t = 0; t < region.indices.length; t += 3)
      for (let k = 1; k < 3; ++k)
        parent[root(region.indices[t + k]!)] = root(region.indices[t]!);
  // A crown is a sealed component with surface triangles; a closure may
  // also name a lone apex vertex that no region triangle uses.
  const surfaced = new Set(
    teeth.regions.flatMap((one) => one.indices.map(root)),
  );
  const crowns = new Set(
    [...sealed].map(root).filter((one) => surfaced.has(one)),
  );
  const region = teeth.regions.find(
    (one) =>
      one.uvs !== null &&
      typeof material(one.material)?.baseColorTexture === "string",
  );
  if (region === undefined || crowns.size === 0)
    throw new Error("An appearance revision needs textured sealed crowns.");
  for (const document of documents)
    if (document.basis !== basis.id)
      throw new Error(`Document ${document.id} names another basis.`);
  if (controls.basis !== basis.id)
    throw new Error("The control map names another basis.");

  // The ocular surface: roughness.
  const eyeMaterials = [...new Set(globes.map((globe) => globe!))];
  const roughnessBefore = eyeMaterials.map((id) => material(id).roughness);
  for (const id of eyeMaterials) material(id).roughness = ocular.roughness;

  // The enamel: every crown texel shifted to the target median.
  const enamelImage = decodePortraitPng(
    material(region.material).baseColorTexture as string,
  );
  const crownTexels = new Set<number>();
  const triangles: { uvs: [number, number][] }[] = [];
  for (let t = 0; t < region.indices.length; t += 3)
    if (crowns.has(root(region.indices[t]!)))
      triangles.push({
        uvs: [0, 1, 2].map((k) => [
          region.uvs![2 * (t + k)]!,
          region.uvs![2 * (t + k) + 1]!,
        ]),
      });
  rasterizeTriangles(enamelImage, triangles, crownTexels);
  const labs = [...crownTexels].map((index) =>
    faceLikenessSrgbToLab(
      enamelImage.rgba[4 * index]!,
      enamelImage.rgba[4 * index + 1]!,
      enamelImage.rgba[4 * index + 2]!,
    ),
  );
  const medianBefore = [0, 1, 2].map((c) => median(labs.map((lab) => lab[c]!)));
  const shift = enamel.lab.map((value, c) => value - medianBefore[c]!);
  [...crownTexels].forEach((index, at) => {
    const rgb = labToSrgb(labs[at]!.map((value, c) => value + shift[c]!));
    for (let c = 0; c < 3; ++c) enamelImage.rgba[4 * index + c] = rgb[c]!;
  });
  material(region.material).baseColorTexture = encodePortraitPng(enamelImage);
  const labsAfter = [...crownTexels].map((index) =>
    faceLikenessSrgbToLab(
      enamelImage.rgba[4 * index]!,
      enamelImage.rgba[4 * index + 1]!,
      enamelImage.rgba[4 * index + 2]!,
    ),
  );

  const source = basis.id;
  basis.id = revision;
  const build = createHumanFaceBasisBuilder(basis);
  const restamped = documents.map((document) => {
    const next = { ...document, basis: revision };
    build(next);
    return next;
  });
  return {
    basis,
    documents: restamped,
    controls: { ...controls, basis: revision },
    receipt: {
      source,
      revision,
      ocular: {
        materials: eyeMaterials,
        roughness: { before: roughnessBefore, after: ocular.roughness },
      },
      enamel: {
        material: region.material,
        crowns: crowns.size,
        texels: crownTexels.size,
        lab: {
          before: medianBefore,
          after: [0, 1, 2].map((c) => median(labsAfter.map((lab) => lab[c]!))),
        },
      },
    },
  };
}

/**
 * The material of one eye's globe as the iris pigment rule finds it: the
 * first textured, UV-bearing region whose triangles are fully bound to that
 * eye.
 */
function findGlobe(
  basis: IAutoMovieHumanFaceBasis,
  eye: string,
): string | null {
  for (const surface of basis.surfaces) {
    const rows =
      surface.attachments?.find((one) => one.owner === eye)?.rows ?? [];
    const bound = new Set<number>();
    for (let i = 0; i < rows.length; i += 2)
      if (rows[i + 1] === 1) bound.add(rows[i]!);
    for (const region of surface.regions) {
      const texture = basis.materials.find(
        (one) => one.id === region.material,
      )?.baseColorTexture;
      if (region.uvs === null || typeof texture !== "string") continue;
      for (let t = 0; t < region.indices.length; t += 3)
        if (region.indices.slice(t, t + 3).every((vertex) => bound.has(vertex)))
          return region.material;
    }
  }
  return null;
}

/**
 * Add the texels whose centres lie inside any triangle's UVs, row `y`
 * growing with `v` as the iris rasterizer and the viewer read them.
 */
function rasterizeTriangles(
  image: { width: number; height: number },
  triangles: readonly { uvs: readonly (readonly [number, number])[] }[],
  into: Set<number>,
): void {
  for (const triangle of triangles) {
    const [a, b, c] = triangle.uvs.map(([u, v]) => [
      u * image.width,
      v * image.height,
    ]) as [number[], number[], number[]];
    const area =
      (b[0]! - a[0]!) * (c[1]! - a[1]!) - (c[0]! - a[0]!) * (b[1]! - a[1]!);
    if (area === 0) continue;
    const x0 = Math.max(0, Math.floor(Math.min(a[0]!, b[0]!, c[0]!)));
    const x1 = Math.min(
      image.width - 1,
      Math.ceil(Math.max(a[0]!, b[0]!, c[0]!)),
    );
    const y0 = Math.max(0, Math.floor(Math.min(a[1]!, b[1]!, c[1]!)));
    const y1 = Math.min(
      image.height - 1,
      Math.ceil(Math.max(a[1]!, b[1]!, c[1]!)),
    );
    for (let y = y0; y <= y1; ++y)
      for (let x = x0; x <= x1; ++x) {
        const px = x + 0.5;
        const py = y + 0.5;
        const wa =
          ((b[0]! - px) * (c[1]! - py) - (c[0]! - px) * (b[1]! - py)) / area;
        const wb =
          ((c[0]! - px) * (a[1]! - py) - (a[0]! - px) * (c[1]! - py)) / area;
        if (wa >= 0 && wb >= 0 && 1 - wa - wb >= 0)
          into.add(y * image.width + x);
      }
  }
}

function toByte(linear: number): number {
  const c =
    linear <= 0.0031308 ? 12.92 * linear : 1.055 * linear ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, c)) * 255);
}

/** CIELAB (D65) back to 8-bit sRGB, the inverse of `faceLikenessSrgbToLab`. */
function labToSrgb(lab: readonly number[]): number[] {
  const fy = (lab[0]! + 16) / 116;
  const fx = fy + lab[1]! / 500;
  const fz = fy - lab[2]! / 200;
  const inverse = (f: number): number =>
    f ** 3 > 216 / 24389 ? f ** 3 : (116 * f - 16) / (24389 / 27);
  const x = inverse(fx) * 0.95047;
  const y = inverse(fy);
  const z = inverse(fz) * 1.08883;
  return [
    3.2404542 * x - 1.5371385 * y - 0.4985314 * z,
    -0.969266 * x + 1.8760108 * y + 0.041556 * z,
    0.0556434 * x - 0.2040259 * y + 1.0572252 * z,
  ].map(toByte);
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]!
    : (sorted[middle - 1]! + sorted[middle]!) / 2;
}
