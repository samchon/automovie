import { HUMAN_PERSON_SEAM } from "../constants/HUMAN_PERSON_SEAM";
import type { IAutoMovieHumanPersonBandFaceView } from "../structures/IAutoMovieHumanPersonBandFaceView";
import type { IAutoMovieHumanPersonGeneration } from "../structures/IAutoMovieHumanPersonGeneration";

/** The never-emitted face surface (and its region) that carries the band's body cells. */
const BAND_SURFACE = "person-neck-band";

/**
 * Compile the face view over the body side of a generation's neck band, once.
 *
 * The band's body support is every body vertex that a face band row or a
 * continued face attachment names. Each body triangle touching that support
 * joins one added face surface, `person-neck-band`, over copies of its body
 * vertices in first-use order: body neutral positions, the face band rows,
 * the continued attachment rows and the body corner UVs (the region is
 * untextured when a triangle has none). A shared cut-sample copy carries no
 * row; the evaluator takes those vertices from the face skin. Every other
 * surface, channel, landmark, articulation and contact record is the face
 * view's own, so the face skin's sealed openings, closure and hair records
 * stay valid. The face producer then evaluates its channels, closure and
 * articulation on the band exactly as on the head, and the evaluator reads the
 * band back without emitting it.
 *
 * Refuses a generation without band rows.
 *
 * @evidence contracts/common.md#principled-implementation A separate surface keeps the face producer the single evaluator of face channels without changing the topology its closure, contact and hair checks were admitted on.
 * @evidence contracts/common.md#clear-and-simple-design One pass collects the support, one pass over the body triangles builds the surface and its vertex map, and the rows are re-addressed through that map in ascending order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Positions, rows and UVs are copied from the generation; no value is invented and no vertex is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States the support rule, the vertex order, what is copied and what the shared-sample copies carry.
 * @evidence contracts/modeling.md#shared-boundaries The band surface uses the same body triangles the body partition emits, so its values meet the face cells at the shared samples the evaluator owns.
 * @evidence contracts/modeling.md#part-identity-and-grouping The band surface is an evaluation view; the evaluator never emits it, and the body partition keeps emitting those cells.
 * @evidence contracts/modeling.md#spatial-conventions Body neutral positions in the shared metre, Y-up, +Z-forward frame; UVs are the body regions' own corner pairs.
 * @evidenceExclude contracts/modeling.md#parameter-channels No channel is added; band rows belong to existing face endpoints.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The view is compiled data, not emitted geometry.
 * @evidenceExclude contracts/modeling.md#rendered-observation The view is not rendered.
 * @evidenceExclude contracts/anatomy.md#anatomical-source No anatomical value is added.
 * @evidenceExclude contracts/anatomy.md#permitted-range Nothing is admitted here.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The view is compiled source data.
 */
export function createHumanPersonBandFaceView(
  generation: IAutoMovieHumanPersonGeneration,
  bodyIndex: number,
): IAutoMovieHumanPersonBandFaceView {
  const band = generation.band;
  if (band === undefined)
    throw new Error("The generation carries no neck band rows.");
  const body = generation.body.surfaces[bodyIndex];

  const support = new Set<number>();
  for (const rows of Object.values(band.bodyFaceTargets))
    for (let i = 0; i < rows.length; i += 4) support.add(rows[i]);
  for (const attachment of band.bodyAttachments)
    for (let i = 0; i < attachment.rows.length; i += 2)
      support.add(attachment.rows[i]);

  const uvOf = new Map<string, number[]>();
  for (const region of body.regions)
    if (region.uvs !== null)
      for (let t = 0; t < region.indices.length; t += 3)
        uvOf.set(
          region.indices.slice(t, t + 3).join(","),
          region.uvs.slice(t * 2, t * 2 + 6),
        );

  const local = new Map<number, number>();
  const bodyVertices: number[] = [];
  const idOf = (vertex: number): number => {
    let id = local.get(vertex);
    if (id === undefined) {
      id = bodyVertices.length;
      local.set(vertex, id);
      bodyVertices.push(vertex);
    }
    return id;
  };
  const indices: number[] = [];
  const uvs: number[] = [];
  let textured = true;
  for (let t = 0; t < body.indices.length; t += 3) {
    const triangle = body.indices.slice(t, t + 3);
    if (!triangle.some((vertex) => support.has(vertex))) continue;
    indices.push(...triangle.map(idOf));
    const uv = uvOf.get(triangle.join(","));
    if (uv === undefined) textured = false;
    else uvs.push(...uv);
  }

  // rows re-addressed to surface vertices, ascending as the face basis requires
  const move = (rows: readonly number[], stride: number): number[] => {
    const order: number[] = [];
    for (let i = 0; i < rows.length; i += stride) order.push(i);
    order.sort((a, b) => local.get(rows[a])! - local.get(rows[b])!);
    return order.flatMap((i) => [
      local.get(rows[i])!,
      ...rows.slice(i + 1, i + stride),
    ]);
  };
  const targets: Record<string, number[]> = {};
  for (const [name, rows] of Object.entries(band.bodyFaceTargets))
    targets[name] = move(rows, 4);
  const surface = {
    id: BAND_SURFACE,
    positions: bodyVertices.flatMap((vertex) =>
      [0, 1, 2].map((axis) => body.positions[vertex * 3 + axis]),
    ),
    indices,
    targets,
    attachments: band.bodyAttachments.map((attachment) => ({
      owner: attachment.owner,
      rows: move(attachment.rows, 2),
    })),
    regions: [
      {
        id: BAND_SURFACE,
        material: HUMAN_PERSON_SEAM.skinMaterial,
        indices,
        uvs: textured ? uvs : null,
      },
    ],
  };
  return {
    basis: {
      ...generation.face,
      surfaces: [...generation.face.surfaces, surface],
    },
    surface: BAND_SURFACE,
    bodyVertices,
  };
}
