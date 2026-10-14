import { HUMAN_PERSON_SEAM } from "../constants/HUMAN_PERSON_SEAM";
import type { IAutoMovieHumanPersonBandFaceView } from "../structures/IAutoMovieHumanPersonBandFaceView";
import type { IAutoMovieHumanPersonGeneration } from "../structures/IAutoMovieHumanPersonGeneration";

/** The never-emitted face surface (and its region) that carries the band's body cells. */
const BAND_SURFACE: string = "person-neck-band";

/**
 * Compile the face view over the body side of a generation's neck band, once.
 *
 * The band's body support is every body vertex that a face band row or a continued face attachment names. Each body triangle touching that support joins one added face surface, `person-neck-band`, over copies of its body vertices in first-use order: body neutral positions, the face band rows, the continued attachment rows and the body corner UVs (the region is untextured when a triangle has none). A shared cut-sample copy carries no row; the evaluator takes those vertices from the face skin. Every other surface, channel, landmark, articulation and contact record is the face view's own, so the face skin's sealed openings, closure and hair records stay valid. The face producer then evaluates its channels, closure and articulation on the band exactly as on the head, and the evaluator reads the band back without emitting it.
 *
 * Refuses a generation without band rows. The body index and resident sparse-row targets are admitted generation premises. Positions and deltas use source metres. The added surface owns copied geometry/rows, while unchanged face records remain borrowed and must not mutate during the compiled builder's lifetime.
 *
 * @evidence contracts/common.md#principled-implementation The union of face-target and attachment support selects whole touching body triangles, compacts vertices by first use and readdresses sparse rows in ascending local order for the existing face evaluator.
 * @evidence contracts/common.md#clear-and-simple-design One transient face surface lets existing channel/closure/articulation owners evaluate band displacement; the body partition alone emits these triangles.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing band rows refuse, and any triangle without region UVs makes the whole added region untextured; admitted body index/row residency remain generation premises rather than guessed correspondence.
 * @evidence contracts/common.md#meaningful-documentation Prose specifies source metres, first-use vertex order, sorted sparse rows, transient non-emission and owned versus borrowed source records.
 * @evidence contracts/performance.md#efficient-algorithms Support/UV/triangle passes are linear in rows and source triangles; each sparse row population sorts O(R log R) for local ordering, with copied buffers proportional to selected band topology.
 * @evidence contracts/performance.md#reuse-equivalent-work One local body-to-band map serves triangle, position and all sparse-row remaps; the resulting view compiles once for unchanged generation evaluation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned copied surface/vertex buffers and borrowed face records belong to the compiler; temporary support/UV maps are call-local and no global task or handle persists.
 */
export function createHumanPersonBandFaceView(
  generation: IAutoMovieHumanPersonGeneration,
  bodyIndex: number,
): IAutoMovieHumanPersonBandFaceView {
  const band: IAutoMovieHumanPersonGeneration["band"] = generation.band;
  if (band === undefined)
    throw new Error("The generation carries no neck band rows.");
  const body: IAutoMovieHumanPersonGeneration["body"]["surfaces"][number] =
    generation.body.surfaces[bodyIndex];

  const support: Set<number> = new Set<number>();
  for (const rows of Object.values(band.bodyFaceTargets))
    for (let i: number = 0; i < rows.length; i += 4) support.add(rows[i]);
  for (const attachment of band.bodyAttachments)
    for (let i: number = 0; i < attachment.rows.length; i += 2)
      support.add(attachment.rows[i]);

  const uvOf: Map<string, number[]> = new Map<string, number[]>();
  for (const region of body.regions)
    if (region.uvs !== null)
      for (let t: number = 0; t < region.indices.length; t += 3)
        uvOf.set(
          region.indices.slice(t, t + 3).join(","),
          region.uvs.slice(t * 2, t * 2 + 6),
        );

  const local: Map<number, number> = new Map<number, number>();
  const bodyVertices: number[] = [];
  const idOf: (vertex: number) => number = (vertex: number): number => {
    let id: number | undefined = local.get(vertex);
    if (id === undefined) {
      id = bodyVertices.length;
      local.set(vertex, id);
      bodyVertices.push(vertex);
    }
    return id;
  };
  const indices: number[] = [];
  const uvs: number[] = [];
  let textured: boolean = true;
  for (let t: number = 0; t < body.indices.length; t += 3) {
    const triangle: number[] = body.indices.slice(t, t + 3);
    if (!triangle.some((vertex: number): boolean => support.has(vertex)))
      continue;
    indices.push(...triangle.map(idOf));
    const uv: number[] | undefined = uvOf.get(triangle.join(","));
    if (uv === undefined) textured = false;
    else uvs.push(...uv);
  }

  // rows re-addressed to surface vertices, ascending as the face basis requires
  const move: (rows: readonly number[], stride: number) => number[] = (
    rows: readonly number[],
    stride: number,
  ): number[] => {
    const order: number[] = [];
    for (let i: number = 0; i < rows.length; i += stride) order.push(i);
    order.sort(
      (a: number, b: number): number =>
        local.get(rows[a])! - local.get(rows[b])!,
    );
    return order.flatMap((i: number): number[] => [
      local.get(rows[i])!,
      ...rows.slice(i + 1, i + stride),
    ]);
  };
  const targets: Record<string, number[]> = {};
  for (const [name, rows] of Object.entries(band.bodyFaceTargets))
    targets[name] = move(rows, 4);
  const surface: IAutoMovieHumanPersonGeneration["face"]["surfaces"][number] = {
    id: BAND_SURFACE,
    positions: bodyVertices.flatMap((vertex: number): number[] =>
      [0, 1, 2].map(
        (axis: number): number => body.positions[vertex * 3 + axis],
      ),
    ),
    indices,
    targets,
    attachments: band.bodyAttachments.map(
      (
        attachment: NonNullable<
          IAutoMovieHumanPersonGeneration["band"]
        >["bodyAttachments"][number],
      ): NonNullable<
        IAutoMovieHumanPersonGeneration["face"]["surfaces"][number]["attachments"]
      >[number] => ({
        owner: attachment.owner,
        rows: move(attachment.rows, 2),
      }),
    ),
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
