import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  type IAutoMovieHumanFaceControlMap,
  decodePng,
  encodePng,
} from "@automovie/human";

import { meshComponents } from "./prepareGingivaBasis";
import { faceSkinNormals } from "./prepareLidCreaseBasis";

/** CIE L*a*b* (D65) to linear sRGB (IEC 61966-2-1). */
export function faceLabToLinear(
  lab: readonly [number, number, number],
): [number, number, number] {
  const [L, a, b] = lab;
  const fy = (L + 16) / 116;
  const white = [0.95047, 1, 1.08883];
  const [X, Y, Z] = [fy + a / 500, fy, fy - b / 200].map((t, k) => {
    const cube = t ** 3;
    return white[k]! * (cube > 0.008856 ? cube : (t - 16 / 116) / 7.787);
  });
  return [
    3.2404542 * X! - 1.5371385 * Y! - 0.4985314 * Z!,
    -0.969266 * X! + 1.8760108 * Y! + 0.041556 * Z!,
    0.0556434 * X! - 0.2040259 * Y! + 1.0572252 * Z!,
  ];
}

/** Linear sRGB to CIE L*a*b* (D65). */
export function faceLinearToLab(
  rgb: readonly [number, number, number],
): [number, number, number] {
  const [r, g, b] = rgb;
  const [fx, fy, fz] = [
    (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047,
    0.2126729 * r + 0.7151522 * g + 0.072175 * b,
    (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883,
  ].map((t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116));
  return [116 * fy! - 16, 500 * (fx! - fy!), 200 * (fy! - fz!)];
}

/** An 8-bit sRGB value in linear light. */
const decode = (value: number) => {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

/** A linear value as 8-bit sRGB, clamped to [0, 1] first. */
const encode = (value: number) => {
  const c = Math.min(1, Math.max(0, value));
  return Math.round(
    255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055),
  );
};

/**
 * The measured site on a dentition: the maxillary gum's vertices facing
 * forward within 45 degrees over the two central crowns' width (the upper
 * crowns nearest the midline, the narrower one's largest |x|), `band`
 * metres above the lowest of them (the mid-facial margin). The gum is the
 * vertices whose component seals no crown; maxillary is not in
 * `mandibular`. Refuses fewer than two upper crowns and a dentition without
 * such a labial gum. Pure.
 */
export function faceGingivaSite(props: {
  positions: readonly number[];
  indices: readonly number[];
  component: Int32Array;
  crowns: ReadonlySet<number>;
  mandibular: ReadonlySet<number>;
  band: readonly [number, number];
}): number[] {
  const { positions: P, component, crowns, mandibular } = props;
  const count = P.length / 3;
  const upper = new Map<number, { sum: number; n: number; reach: number }>();
  for (let v = 0; v < count; ++v) {
    const c = component[v]!;
    if (!crowns.has(c) || mandibular.has(c)) continue;
    const one = upper.get(c) ?? { sum: 0, n: 0, reach: 0 };
    one.sum += P[3 * v]!;
    one.n += 1;
    one.reach = Math.max(one.reach, Math.abs(P[3 * v]!));
    upper.set(c, one);
  }
  const centrals = [...upper.values()]
    .sort((a, b) => Math.abs(a.sum / a.n) - Math.abs(b.sum / b.n))
    .slice(0, 2);
  if (centrals.length < 2)
    throw new Error("Gingiva colour needs two maxillary central crowns.");
  const width = Math.min(...centrals.map((one) => one.reach));
  const normals = faceSkinNormals(P, props.indices);
  const labial = Array.from({ length: count }, (_v, v) => v).filter((v) => {
    const c = component[v]!;
    const gum = !crowns.has(c) && !mandibular.has(c);
    const facing = normals[3 * v + 2]! > Math.SQRT1_2;
    return gum && facing && Math.abs(P[3 * v]!) <= width;
  });
  if (labial.length === 0) throw new Error("No labial maxillary gingiva.");
  const margin = Math.min(...labial.map((v) => P[3 * v + 1]!));
  return labial.filter((v) => {
    const above = P[3 * v + 1]! - margin;
    return above >= props.band[0] && above <= props.band[1];
  });
}

/**
 * Which texels the gum owns: every texel whose centre a gum triangle's UVs
 * cover, less those a crown triangle's cover, then up to `rings` steps of
 * texels beside them that no triangle covers (an island's padding, which
 * filtering reads). A triangle with a vertex outside `uv` has no texels; a
 * degenerate one covers none. 1 marks the gum's, 2 a crown's, 0 neither.
 * Pure.
 */
export function faceGingivaTexels(props: {
  width: number;
  height: number;
  indices: readonly number[];
  uv: ReadonlyMap<number, readonly [number, number]>;
  gum: (vertex: number) => boolean;
  rings: number;
}): Int8Array {
  const { width: W, height: H, indices, uv } = props;
  const owner = new Int8Array(W * H);
  // Gum first, crowns over it: a crown texel stays a crown's.
  for (const kind of [1, 2]) {
    for (let t = 0; t < indices.length; t += 3) {
      const ids = [indices[t]!, indices[t + 1]!, indices[t + 2]!];
      if (!ids.every((v) => uv.has(v))) continue;
      if (props.gum(ids[0]!) !== (kind === 1)) continue;
      const corner = ids.map((v) => {
        const [u, w] = uv.get(v)!;
        return [u * W, (1 - w) * H] as const;
      });
      const [a, b, c] = corner as [
        readonly [number, number],
        readonly [number, number],
        readonly [number, number],
      ];
      const area =
        (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
      const y0 = Math.max(0, Math.floor(Math.min(a[1], b[1], c[1])));
      const y1 = Math.min(H - 1, Math.ceil(Math.max(a[1], b[1], c[1])));
      const x0 = Math.max(0, Math.floor(Math.min(a[0], b[0], c[0])));
      const x1 = Math.min(W - 1, Math.ceil(Math.max(a[0], b[0], c[0])));
      for (let y = y0; y <= y1; ++y)
        for (let x = x0; x <= x1; ++x) {
          const [px, py] = [x + 0.5, y + 0.5];
          const w0 =
            ((b[0] - px) * (c[1] - py) - (b[1] - py) * (c[0] - px)) / area;
          const w1 =
            ((c[0] - px) * (a[1] - py) - (c[1] - py) * (a[0] - px)) / area;
          // NaN (a zero area) fails every comparison and covers nothing.
          if (w0 >= 0 && w1 >= 0 && w0 + w1 <= 1) owner[y * W + x] = kind;
        }
    }
  }
  let frontier = Array.from({ length: W * H }, (_v, at) => at).filter(
    (at) => owner[at] === 1,
  );
  for (let ring = 0; ring < props.rings; ++ring) {
    const next: number[] = [];
    for (const at of frontier) {
      const x = at % W;
      const beside = [
        x > 0 ? at - 1 : -1,
        x < W - 1 ? at + 1 : -1,
        at - W,
        at + W,
      ];
      for (const other of beside)
        if (other >= 0 && other < W * H && owner[other] === 0) {
          owner[other] = 1;
          next.push(other);
        }
    }
    frontier = next;
  }
  return owner;
}

/**
 * Every owned texel (`owner` 1) moved in CIE L*a*b* by `offset`; a texel
 * the move carries out of the sRGB gamut is clamped per channel and
 * counted. The input is not changed. Pure.
 */
export function faceMoveTexels(props: {
  rgba: Uint8Array;
  owner: Int8Array;
  offset: readonly [number, number, number];
}): { rgba: Uint8Array; texels: number; clamped: number } {
  const out = new Uint8Array(props.rgba);
  let texels = 0;
  let clamped = 0;
  props.owner.forEach((kind, at) => {
    if (kind !== 1) return;
    ++texels;
    const lab = faceLinearToLab([
      decode(out[4 * at]!),
      decode(out[4 * at + 1]!),
      decode(out[4 * at + 2]!),
    ]);
    const moved = faceLabToLinear([
      lab[0] + props.offset[0],
      lab[1] + props.offset[1],
      lab[2] + props.offset[2],
    ]);
    if (moved.some((value) => value < 0 || value > 1)) ++clamped;
    moved.forEach((value, c) => (out[4 * at + c] = encode(value)));
  });
  return { rgba: out, texels, clamped };
}

/**
 * The gingiva's colour set to its measured norm.
 *
 * The dentition texture paints the gum a deep red (the source's attached
 * gingiva above the upper central incisors reads L* 38.9, a* 29.8, b* 9.9)
 * where healthy keratinized gingiva measured in vivo reads L* 52.9 +- 5.2,
 * a* 23.3 +- 3.4, b* 14.9 +- 2.0 (Ho DK, Ghinea R, Herrera LJ, Angelov N,
 * Paravina RD. Color range and color distribution of healthy human gingiva:
 * a prospective clinical study. Sci Rep 2015;5:18498, doi:10.1038/srep18498;
 * 238 adults of four ancestries, spectroradiometer, 2-3 mm apical to the
 * mid-facial gingival margin of a maxillary central incisor). One norm over
 * the whole sample: the paper pools its ancestries, so gingival
 * pigmentation by population is not carried.
 *
 * The site (`faceGingivaSite`) is read at each vertex's texel on the
 * dentition's textured region, its per-channel lower median taken in linear
 * light; the gum's texels (`faceGingivaTexels`) are moved by one CIE
 * L*a*b* offset, the norm less the site's reading (`faceMoveTexels`), so
 * the site reads the norm and the painted variation (the margins' and
 * papillae's shading) keeps its perceptual steps. A gain in linear light
 * would clip the gum's lighter texels (the site needs half as much again in
 * red and two and a half times in green). Crowns keep every texel. Pure:
 * the inputs are cloned and the documents and control map are restamped
 * to `revision`.
 */
export function prepareGingivaColourBasis(input: {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  revision: string;
  norm: [number, number, number];
  band: [number, number];
  rings: number;
}): {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  receipt: {
    source: string;
    revision: string;
    site: number;
    before: [number, number, number];
    after: [number, number, number];
    norm: [number, number, number];
    offset: [number, number, number];
    texels: number;
    clamped: number;
  };
} {
  const { basis, documents, controls, revision } = structuredClone(input);
  if (revision.trim() === "" || revision === basis.id)
    throw new Error("A gingiva colour revision needs a distinct revision.");
  const contact = basis.contact;
  const teeth = basis.surfaces.find(
    (one) => one.id === contact?.incisors.surface,
  );
  if (teeth === undefined)
    throw new Error("Gingiva colour needs a contact basis and its dentition.");
  const component = meshComponents(teeth.positions.length / 3, teeth.indices);
  const crowns = new Set(
    contact!.colliders
      .filter((one) => one.surface === teeth.id)
      .flatMap((one) => one.closure.map((vertex) => component[vertex]!)),
  );
  const jaw = teeth.attachments?.find((one) => one.owner === "jaw")?.rows ?? [];
  const mandibular = new Set(
    jaw
      .filter((_v, i) => i % 2 === 0 && jaw[i + 1] === 1)
      .map((vertex) => component[vertex]!),
  );
  const site = faceGingivaSite({
    positions: teeth.positions,
    indices: teeth.indices,
    component,
    crowns,
    mandibular,
    band: input.band,
  });
  const region = teeth.regions.find((one) => one.uvs !== null);
  const material = basis.materials.find((one) => one.id === region?.material);
  const binding = material?.baseColorTexture;
  if (typeof binding !== "string")
    throw new Error("Gingiva colour needs the dentition's textured region.");
  const image = decodePng(binding);
  const { width: W, height: H } = image;
  const uv = new Map<number, readonly [number, number]>(
    region!.indices.map((v, k) => [
      v,
      [region!.uvs![2 * k]!, region!.uvs![2 * k + 1]!],
    ]),
  );
  const at = site
    .filter((v) => uv.has(v))
    .map((v) => {
      const [u, w] = uv.get(v)!;
      const y = Math.min(H - 1, Math.max(0, Math.floor((1 - w) * H)));
      return y * W + Math.min(W - 1, Math.max(0, Math.floor(u * W)));
    });
  if (at.length === 0)
    throw new Error("The gingival site has no textured vertex.");
  // The lower median of each channel over the site's texels, linear.
  const reading = (rgba: Uint8Array) =>
    faceLinearToLab(
      [0, 1, 2].map(
        (c) =>
          at.map((one) => decode(rgba[4 * one + c]!)).sort((a, b) => a - b)[
            (at.length - 1) >> 1
          ]!,
      ) as [number, number, number],
    );
  const before = reading(image.rgba);
  const offset = [0, 1, 2].map((c) => input.norm[c]! - before[c]!) as [
    number,
    number,
    number,
  ];
  const owner = faceGingivaTexels({
    width: W,
    height: H,
    indices: teeth.indices,
    uv,
    gum: (v) => !crowns.has(component[v]!),
    rings: input.rings,
  });
  const moved = faceMoveTexels({ rgba: image.rgba, owner, offset });
  material!.baseColorTexture = encodePng({
    width: W,
    height: H,
    rgba: moved.rgba,
  });
  const source = basis.id;
  basis.id = revision;
  return {
    basis,
    documents: documents.map((one) => ({ ...one, basis: revision })),
    controls: { ...controls, basis: revision },
    receipt: {
      source,
      revision,
      site: at.length,
      before,
      after: reading(moved.rgba),
      norm: input.norm,
      offset,
      texels: moved.texels,
      clamped: moved.clamped,
    },
  };
}
