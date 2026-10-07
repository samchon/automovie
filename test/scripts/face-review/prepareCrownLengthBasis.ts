import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanFaceBasisDocument,
  IAutoMovieHumanFaceControlMap,
} from "@automovie/human";

import { createDentalCrownAxis } from "./createDentalCrownAxis";
import { meshComponents } from "./prepareGingivaBasis";

/**
 * The maxillary crowns nearest the midline lengthened cervically to their
 * anatomic lengths, as a new basis revision.
 *
 * The source's crown meshes stop short of the cemento-enamel junction:
 * along each crown's axis, from the incisal edge to the root ring's most
 * cervical point, the central incisors measure 11.51 mm, the laterals 9.18,
 * the canines 9.39 and the first premolars 7.99, where 146 extracted
 * maxillary teeth measure 11.69 mm (unworn centrals), 10.83 mm (unworn
 * canines) and 9.34 to 9.55 mm (laterals) from the incisal edge to the CEJ,
 * and 9.33 mm (first premolars) from the buccal cusp (Magne P, Gallucci GO,
 * Belser UC. Anatomic crown width/length ratios of unworn and worn maxillary
 * teeth in white subjects. J Prosthet Dent 2003;89:453-61). A crown shorter
 * than its anatomic length leaves its ring where the gum must stand to show
 * the clinical crown, so the gum cannot rise to its norm: the canines' rings
 * allowed no rise at all, and the first premolars' rings, whose span covers
 * the canines' zeniths, held the canines' rise. The crowns are paired with
 * `norms` by rank from the midline (centrals, laterals, canines, first
 * premolars, as many pairs as norms; a null norm leaves that pair); each
 * whose length falls short is lengthened along its own long axis, the unit
 * direction from its incisal edge (the centroid of its vertices in the most
 * incisal tenth of its height) to its ring's centroid. Every vertex at or
 * beyond the ring's least cervical point moves the whole shortfall, so the
 * ring's scallop keeps its shape; the crown's incisal half does not move;
 * the part between ramps linearly. Rows are displacements and stay valid;
 * documents and the control map are restamped. Pure: the inputs are cloned.
 * A crown whose ring reaches into its incisal half refuses.
 */
export function prepareCrownLengthBasis(input: {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  revision: string;
  /**
   * Anatomic crown lengths by pair from the midline (central, lateral,
   * canine, first premolar), metres.
   */
  norms: readonly (number | null)[];
}): {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  receipt: {
    source: string;
    revision: string;
    crowns: {
      centre: number;
      normMetres: number | null;
      beforeMetres: number;
      afterMetres: number;
    }[];
  };
} {
  const { basis, documents, controls, revision } = structuredClone(input);
  if (revision.trim() === "" || revision === basis.id)
    throw new Error("A crown length revision needs a distinct revision.");
  const contact = basis.contact;
  const teeth = basis.surfaces.find(
    (one) => one.id === contact?.incisors.surface,
  );
  if (teeth === undefined)
    throw new Error("Crown lengths need a contact basis and its dentition.");
  const P = teeth.positions;
  const component = meshComponents(P.length / 3, teeth.indices);
  const rings = new Map<number, number[]>();
  for (const collider of contact!.colliders)
    if (collider.surface === teeth.id)
      for (const vertex of collider.closure) {
        const crown = component[vertex]!;
        rings.set(crown, [...(rings.get(crown) ?? []), vertex]);
      }
  const jaw = teeth.attachments?.find((one) => one.owner === "jaw")?.rows ?? [];
  const mandibular = new Set(
    jaw
      .filter((_v, i) => i % 2 === 0 && jaw[i + 1] === 1)
      .map((vertex) => component[vertex]!),
  );
  const members = new Map<number, number[]>();
  for (let v = 0; v < P.length / 3; ++v) {
    const c = component[v]!;
    if (!rings.has(c) || mandibular.has(c)) continue;
    members.set(c, [...(members.get(c) ?? []), v]);
  }
  const centre = (vertices: readonly number[]) =>
    vertices.reduce((sum, v) => sum + P[3 * v]!, 0) / vertices.length;
  const count = 2 * input.norms.length;
  const anterior = [...members.entries()]
    .sort((a, b) => Math.abs(centre(a[1])) - Math.abs(centre(b[1])))
    .slice(0, count);
  if (anterior.length < count)
    throw new Error("Crown lengths need a maxillary crown for every norm.");
  const mean = (vertices: readonly number[]) =>
    [0, 1, 2].map(
      (k) =>
        vertices.reduce((sum, v) => sum + P[3 * v + k]!, 0) / vertices.length,
    );
  const crowns = anterior.map(([crown, vertices], rank) => {
    const norm = input.norms[Math.floor(rank / 2)] ?? null;
    const ring = [...new Set(rings.get(crown)!)];
    const heights = vertices.map((v) => P[3 * v + 1]!);
    const bottom = Math.min(...heights);
    const reach = Math.max(...heights) - bottom;
    const incisal = mean(
      vertices.filter((v) => P[3 * v + 1]! <= bottom + reach / 10),
    );
    const cervical = mean(ring);
    const { unit } = createDentalCrownAxis(incisal, cervical);
    // Along the axis from the incisal edge: the ring's least and most
    // cervical points, and the crown's length to the latter.
    const along = (v: number) =>
      [0, 1, 2].reduce(
        (sum, k) => sum + (P[3 * v + k]! - incisal[k]!) * unit[k]!,
        0,
      );
    const edge = Math.min(...vertices.map(along));
    const low = Math.min(...ring.map(along));
    const high = Math.max(...ring.map(along));
    const before = high - edge;
    const shortfall = norm === null ? 0 : Math.max(0, norm - before);
    const half = edge + before / 2;
    if (!(low > half))
      throw new Error("A crown's root ring reaches into its incisal half.");
    if (shortfall > 0) {
      for (const v of vertices) {
        const t = Math.min(1, Math.max(0, (along(v) - half) / (low - half)));
        for (let k = 0; k < 3; ++k)
          P[3 * v + k] = P[3 * v + k]! + shortfall * t * unit[k]!;
      }
    }
    return {
      centre: centre(vertices),
      normMetres: norm,
      beforeMetres: before,
      afterMetres: before + shortfall,
    };
  });
  const source = basis.id;
  basis.id = revision;
  return {
    basis,
    documents: documents.map((one) => ({ ...one, basis: revision })),
    controls: { ...controls, basis: revision },
    receipt: { source, revision, crowns },
  };
}
