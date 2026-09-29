import type {
  AutoMovieHumanoidBone,
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMovieVector3,
} from "@automovie/interface";

import { portraitNormals } from "../../common/mesh/portraitNormals";
import { HUMAN_BODY_UNDERWEAR } from "../constants/HUMAN_BODY_UNDERWEAR";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyUnderwear } from "../structures/IAutoMovieHumanBodyUnderwear";

/**
 * Plain default underwear cut from the posed skin.
 *
 * The garment is the skin itself lifted off the body: every surface's
 * triangles are kept where a coverage field is positive and clipped where it
 * changes sign, and the kept surface is moved `offsetMetres` along the posed
 * skin's normals. Because it is made of the posed skin, the underwear
 * follows every shape, pose, corrective and soft-tissue sag the skin does,
 * with no cloth simulation and nothing authored per person.
 *
 * The coverage field is read on the body at rest (the document's shape
 * without its pose), so the garment's edges stay on the same skin whatever
 * the pose. It is a signed distance-like value in metres, positive inside,
 * built from the table's landmark rules (`HUMAN_BODY_UNDERWEAR`):
 *
 * - **Briefs.** Below the waistband height (a fraction from the pelvis up to
 *   the lumbar landmark) and above the leg line. The line is read against the
 *   hip joints: their mean height, depth and half distance, and the thighs'
 *   mean hip-to-knee length. Within the gusset (a distance from the midline,
 *   X against the pelvis) it stands at the crotch depth below the hip
 *   joints; from there it runs linearly to the outer hip's depth at the
 *   outer distance and holds it beyond, so the front view is the brief's V
 *   or, with equal depths, the boxer's hem. The outer depth blends from the
 *   back value to the front value as the vertex's depth runs from half the
 *   hips' half distance behind the hip joints to as far in front, so the
 *   back covers the buttock.
 * - **Bra** (`bra-and-briefs` only). A band from under the breasts (a
 *   fraction from the nipple down to the lower chest) to an upper edge a
 *   fraction up toward the clavicle, higher in front than behind: the edge
 *   blends by depth from the back (at the chest landmark's depth or behind)
 *   to the front (at the nipple's depth or ahead). A strap on each side
 *   (a band in X around a fraction from the clavicle out to the shoulder)
 *   runs from the band over the shoulder. The nipple is one skin vertex of
 *   one surface; the body is taken to be symmetric about the pelvis, so its
 *   height and depth serve both sides.
 * - **Arms.** A vertex half of whose skin belongs to the table's uncovered
 *   bones or their descendants is outside (the term is `0.5 - weight`, a
 *   metre per unit of weight, steep enough never to bind elsewhere), so the
 *   bra's arm holes follow the arm's skin rather than a plane.
 *
 * A triangle with all three corners inside is kept; one with one or two is
 * clipped at the zero of the field along its edges (linear, the crossing
 * held at least 5% of an edge from either corner so no clipped triangle
 * degenerates), and a crossing is shared by both triangles of its edge, so
 * the garment is as manifold as the skin. A surface with no kept triangle
 * emits no part. Normals are recomputed on the lifted surface; the posed
 * skin's normals must be nonzero wherever a triangle is kept.
 *
 * The compiled closure caches the uncovered weight per vertex, which depends
 * on the basis alone; a basis material with the table's material id is
 * refused on compilation, and a colour outside [0,1], a missing landmark or
 * a nipple vertex outside its surface when a document asks for the style
 * that reads it. The body builder (`createHumanBodyBasisBuilder`) is the
 * consumer: it compiles this once per basis, calls it after skinning and
 * soft-tissue sag with the document's body at rest and its posed surfaces,
 * and appends the parts after the skin's regions, which is why the segment
 * partition and the contact reading, which read the skin, leave them out.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-underwear Cuts the plain underwear of either style from the posed skin, so it fits every shape and follows every pose.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-underwear Evaluates the coverage rules on the body at rest, clips at their zero and lifts the kept skin along the posed normals.
 */
export function createHumanBodyUnderwear(
  basis: IAutoMovieHumanBodyBasis,
  table: IAutoMovieHumanBodyUnderwear.ITable = HUMAN_BODY_UNDERWEAR,
): (props: {
  underwear: IAutoMovieHumanBodyUnderwear;
  rest: { surfaces: number[][]; landmarks: Record<string, IAutoMovieVector3> };
  posed: { positions: number[]; normals: number[] }[];
}) => { material: IAutoMovieMaterial; parts: IAutoMovieModel["parts"] } {
  if (basis.materials.some((material) => material.id === table.material))
    throw new Error(
      "Body underwear needs a material id the basis does not use: " +
        table.material,
    );
  // the uncovered bones and everything below them, by the rig's parents
  const uncovered = new Set<AutoMovieHumanoidBone>(table.uncovered);
  for (const joint of basis.joints)
    if (joint.parent !== null && uncovered.has(joint.parent))
      uncovered.add(joint.bone);
  const armWeights = basis.surfaces.map((surface) => {
    const count = surface.positions.length / 3;
    const weights = new Float64Array(count);
    for (let v = 0; v < count; v++)
      for (let k = 0; k < 4; k++)
        if (
          uncovered.has(
            surface.skin.joints[surface.skin.boneIndices[v * 4 + k]],
          )
        )
          weights[v] += surface.skin.weights[v * 4 + k];
    return weights;
  });
  return ({ underwear, rest, posed }) => {
    const { style } = underwear;
    const color = underwear.color ?? table.color;
    if (![color.r, color.g, color.b].every((value) => value >= 0 && value <= 1))
      throw new Error("Body underwear needs a colour in [0,1].");
    const landmark = (id: string): IAutoMovieVector3 => {
      const found = rest.landmarks[id];
      if (found === undefined)
        throw new Error("Body underwear needs the landmark " + id + ".");
      return found;
    };
    const names = table.landmarks;
    const pelvis = landmark(names.pelvis);
    const briefs = table.briefs[style];
    const waist =
      pelvis.y + briefs.waist * (landmark(names.lumbar).y - pelvis.y);
    // the hip joints' mean height and depth, their half distance and the
    // thighs' mean length
    const hips = [landmark(names.hips.left), landmark(names.hips.right)];
    const knees = [landmark(names.knees.left), landmark(names.knees.right)];
    const hipY = (hips[0].y + hips[1].y) / 2;
    const hipZ = (hips[0].z + hips[1].z) / 2;
    const half = Math.abs(hips[0].x - hips[1].x) / 2;
    const thigh =
      hips
        .map((hip, k) =>
          Math.hypot(
            knees[k].x - hip.x,
            knees[k].y - hip.y,
            knees[k].z - hip.z,
          ),
        )
        .reduce((sum, length) => sum + length, 0) / 2;
    const clamp = (value: number) => Math.min(1, Math.max(0, value));
    // the leg line's height: at the crotch within the gusset, rising (or
    // falling) linearly to the outer hip's height by the outer distance, that
    // height blended from the back to the front over the hip joints' depth
    const legLine = (x: number, z: number) => {
      const outer =
        briefs.back +
        (briefs.front - briefs.back) * clamp(0.5 + (z - hipZ) / half);
      const across = clamp(
        (Math.abs(x - pelvis.x) - briefs.gusset * half) /
          ((briefs.outer - briefs.gusset) * half),
      );
      return hipY - thigh * (briefs.crotch + (outer - briefs.crotch) * across);
    };
    const bra =
      style === "bra-and-briefs"
        ? (() => {
            const rule = table.bra;
            const { surface, vertex } = rule.nipple;
            const on = rest.surfaces[surface];
            if (
              on === undefined ||
              !Number.isInteger(vertex) ||
              vertex < 0 ||
              vertex * 3 + 2 >= on.length
            )
              throw new Error("Body underwear needs its nipple vertex.");
            const nipple = on.slice(vertex * 3, vertex * 3 + 3);
            const clavicle = landmark(names.clavicle);
            const shoulder = landmark(names.shoulder);
            const chest = landmark(names.lowerChest);
            const up = clavicle.y - nipple[1];
            const reach = Math.abs(shoulder.x - clavicle.x);
            return {
              bottom: nipple[1] - rule.bottom * (nipple[1] - chest.y),
              front: nipple[1] + rule.front * up,
              back: nipple[1] + rule.back * up,
              backDepth: chest.z,
              frontDepth: nipple[2],
              strap: Math.abs(clavicle.x - pelvis.x) + rule.strap * reach,
              strapHalfWidth: rule.strapHalfWidth * reach,
            };
          })()
        : null;
    const coverage = (x: number, y: number, z: number, arm: number) => {
      let inside = Math.min(waist - y, y - legLine(x, z));
      if (bra !== null) {
        const front = clamp(
          (z - bra.backDepth) / (bra.frontDepth - bra.backDepth),
        );
        const top = bra.back + (bra.front - bra.back) * front;
        const band = Math.min(y - bra.bottom, top - y);
        const strap = Math.min(
          y - bra.bottom,
          bra.strapHalfWidth - Math.abs(Math.abs(x - pelvis.x) - bra.strap),
        );
        inside = Math.max(inside, band, strap);
      }
      return Math.min(inside, 0.5 - arm);
    };
    const meshes = basis.surfaces.map((surface, index) => {
      const at = rest.surfaces[index];
      const { positions, normals } = posed[index];
      const count = at.length / 3;
      const field = new Float64Array(count);
      for (let v = 0; v < count; v++)
        field[v] = coverage(
          at[v * 3],
          at[v * 3 + 1],
          at[v * 3 + 2],
          armWeights[index][v],
        );
      const out: number[] = [];
      const emitted = new Map<string, number>();
      const emit = (a: number, b: number): number => {
        // a kept corner (b === a), or the crossing on the edge a-b read from
        // its lower index so both triangles of the edge share it
        const [low, high] = a <= b ? [a, b] : [b, a];
        const key = low + "/" + high;
        let id = emitted.get(key);
        if (id !== undefined) return id;
        const t =
          low === high
            ? 0
            : Math.min(
                0.95,
                Math.max(0.05, field[low] / (field[low] - field[high])),
              );
        const normal = [0, 1, 2].map(
          (k) =>
            normals[low * 3 + k] +
            t * (normals[high * 3 + k] - normals[low * 3 + k]),
        );
        const norm = Math.hypot(normal[0], normal[1], normal[2]);
        for (let k = 0; k < 3; k++)
          out.push(
            positions[low * 3 + k] +
              t * (positions[high * 3 + k] - positions[low * 3 + k]) +
              (table.offsetMetres * normal[k]) / norm,
          );
        id = out.length / 3 - 1;
        emitted.set(key, id);
        return id;
      };
      const indices: number[] = [];
      for (let i = 0; i < surface.indices.length; i += 3) {
        const corners = [0, 1, 2].map((k) => surface.indices[i + k]);
        const inside = corners.map((v) => field[v] > 0);
        const kept = inside.filter(Boolean).length;
        if (kept === 0) continue;
        if (kept === 3) {
          indices.push(...corners.map((v) => emit(v, v)));
          continue;
        }
        // rotate the winding so the lone corner (inside with one kept, the
        // outside one with two) comes first
        const lone = inside.findIndex((flag) => flag === (kept === 1));
        const [a, b, c] = [0, 1, 2].map((k) => corners[(lone + k) % 3]);
        if (kept === 1) indices.push(emit(a, a), emit(a, b), emit(a, c));
        else {
          const ab = emit(a, b);
          const ca = emit(c, a);
          indices.push(ab, emit(b, b), emit(c, c), ab, emit(c, c), ca);
        }
      }
      return {
        positions: out,
        normals: portraitNormals(out, indices),
        uvs: null,
        indices,
        skin: null,
      };
    });
    return {
      material: {
        id: table.material,
        name: table.material,
        baseColor: { ...color, a: 1, hex: null },
        metallic: 0,
        roughness: table.roughness,
        emissive: null,
        opacity: 1,
        baseColorTexture: null,
        doubleSided: true,
      },
      parts: meshes.flatMap((mesh, index) =>
        mesh.indices.length === 0
          ? []
          : [
              {
                id: basis.surfaces[index].id + "/" + table.material,
                name: basis.surfaces[index].id + "/" + table.material,
                material: table.material,
                geometry: { type: "mesh" as const, mesh },
                attachedBone: null,
                transform: null,
              },
            ],
      ),
    };
  };
}
