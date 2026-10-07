import type { AutoMovieHumanoidBone } from "@automovie/interface";

import { areaWeightedNormals } from "../../common/mesh/areaWeightedNormals";
import { HUMAN_BODY_UNDERWEAR } from "../constants/HUMAN_BODY_UNDERWEAR";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyUnderwear } from "../structures/IAutoMovieHumanBodyUnderwear";
import type { IAutoMovieHumanBodyUnderwearParts } from "../structures/IAutoMovieHumanBodyUnderwearParts";
import type { IAutoMovieHumanBodyUnderwearProps } from "../structures/IAutoMovieHumanBodyUnderwearProps";
import { closeHumanBodyUnderwearCreases } from "./closeHumanBodyUnderwearCreases";
import { createHumanBodyUnderwearCoverage } from "./createHumanBodyUnderwearCoverage";
import { cutHumanBodyUnderwearSurface } from "./cutHumanBodyUnderwearSurface";

/**
 * Plain default underwear cut from the posed skin.
 *
 * The garment is the skin itself lifted off the body: every surface's
 * triangles are kept where a coverage field is positive and clipped where it
 * changes sign (`cutHumanBodyUnderwearSurface`), carried across every skin
 * crease narrower than the table's `spanMetres`
 * (`closeHumanBodyUnderwearCreases`), and lifted `offsetMetres` along the
 * skin's normals (the closing surface's where it bridged). Because it is made
 * of the posed skin, the underwear follows every shape, pose, corrective and
 * soft-tissue sag the skin does, with no cloth simulation and nothing authored
 * per person.
 *
 * The coverage field is read on the body at rest (the document's shape without
 * its pose), so the garment's edges stay on the same skin whatever the pose;
 * `createHumanBodyUnderwearCoverage` owns its rules. A vertex half of whose
 * skin belongs to the table's uncovered bones or their descendants is outside,
 * so the bra's arm holes follow the arm's skin. A surface with no kept
 * triangle emits no part. Normals are recomputed on the lifted surface, and a
 * bridged vertex takes its normal from the closing surface, where the
 * collapsed triangles of a crease's floor carry none; the posed skin's normals
 * must be nonzero wherever a triangle is kept.
 *
 * The compiled closure caches the uncovered weight per vertex, which depends
 * on the basis alone; a basis material with the table's material id is
 * refused on compilation, and a colour outside [0,1], a missing landmark or a
 * skin landmark the basis does not declare when a document asks for the style
 * that reads it. The body builder (`createHumanBodyBasisBuilder`) is the consumer: it
 * compiles this once per basis, calls it after skinning and soft-tissue sag
 * with the document's body at rest and its posed surfaces, and appends the
 * parts after the skin's regions, which is why the segment partition and the
 * contact reading, which read the skin, leave them out. Closing the creases
 * costs a fraction of a build and only when a document wears underwear.
 *
 * @evidence contracts/common.md#principled-implementation Cutting a triangle mesh by a per-vertex field, then lifting it along the vertex normals, keeps the garment made of the skin's own triangulation, so it follows every shape and pose the skin does; the coverage field is read at rest so its edges stay on one place of the skin, and the closing bridges creases the way cloth that cannot bend tighter than a radius does. The offset is a constant thickness along the normal, exact for a flat skin and an approximation where the skin curves tighter than the offset.
 * @evidence contracts/common.md#clear-and-simple-design The function compiles the per-basis arm weights and orchestrates, per call, the field, the cut and the closing in that order; each of the three has its own file and owner, and only the material and the parts are assembled here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No vertex list, person or fixture is named: the garment is rules on the body's landmarks and the skin's own triangles, and the closing is a general geometric operation. Nothing patches another module.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the garment is made of, in which state each input is read, what is refused and the consumer that calls it.
 * @evidence contracts/modeling.md#part-identity-and-grouping The garment is one part per covered skin surface, named after that surface and the garment material, and appended after the skin's regions, so it never merges with a skin part and the skin's segment partition leaves it out.
 * @evidence contracts/modeling.md#parameter-channels The document's underwear is one closed choice of style and one optional colour, two independent traits; the shape, pose and sag channels reach the garment only through the posed skin it is cut from.
 * @evidence contracts/modeling.md#emitted-geometry The triangles are the skin's own where kept and at most two per clipped skin triangle; the closing moves vertices and adds none, so the count follows the skin's tessellation and the field and never grows with the garment's features.
 * @evidence contracts/modeling.md#spatial-conventions Every value is metres in the basis frame (+Y up, +Z front, +X the body's left); the field is evaluated at the rest positions and the geometry taken from the same vertex indices of the posed skin, the one correspondence between the two states, and the closing reads the posed frame.
 * @evidence contracts/anatomy.md#anatomical-source The landmarks are the basis's own joints and the nipple vertex; the fractions of the table are costume convention set by rendering, stated as such in its documentation, and no measurement is claimed for them.
 * @evidence contracts/anatomy.md#permitted-range The colour is admitted in [0,1] per channel and refused otherwise, the style is a closed choice, and a missing landmark or nipple vertex refuses with its name, leaving the caller's document unchanged.
 * @evidence contracts/anatomy.md#parametric-authority The inputs are a closed style and a colour; no input addresses a vertex, curve or patch, and the garment's edges come from the table's rules on landmarks.
 */
export function createHumanBodyUnderwear(
  basis: IAutoMovieHumanBodyBasis,
  table: IAutoMovieHumanBodyUnderwear.ITable = HUMAN_BODY_UNDERWEAR,
): (
  props: IAutoMovieHumanBodyUnderwearProps,
) => IAutoMovieHumanBodyUnderwearParts {
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
    const color = underwear.color ?? table.color;
    if (![color.r, color.g, color.b].every((value) => value >= 0 && value <= 1))
      throw new Error("Body underwear needs a colour in [0,1].");
    const coverage = createHumanBodyUnderwearCoverage({
      table,
      style: underwear.style,
      basis,
      rest,
    });
    // the posed skin of every surface, which the closing reads
    const skin = basis.surfaces.map((surface, index) => ({
      positions: posed[index].positions,
      indices: surface.indices,
    }));
    const meshes = basis.surfaces.map((surface, index) => {
      const at = rest.surfaces[index];
      const field = new Float64Array(at.length / 3);
      for (let v = 0; v < field.length; v++)
        field[v] = coverage(
          at[v * 3],
          at[v * 3 + 1],
          at[v * 3 + 2],
          armWeights[index][v],
        );
      // the kept surface on the skin, before the lift, and the lift's normals
      const cut = cutHumanBodyUnderwearSurface({
        indices: surface.indices,
        positions: posed[index].positions,
        normals: posed[index].normals,
        field,
      });
      const closed = closeHumanBodyUnderwearCreases({
        skin,
        points: cut.points,
        normals: cut.normals,
        offsetMetres: table.offsetMetres,
        spanMetres: table.spanMetres,
      });
      const shaded = areaWeightedNormals(closed.positions, cut.indices);
      for (let v = 0; v < closed.bridged.length; v++) {
        const weight = closed.bridged[v];
        if (weight === 0) continue;
        const blend = [0, 1, 2].map(
          (k) =>
            shaded[v * 3 + k] +
            weight * (closed.normals[v * 3 + k] - shaded[v * 3 + k]),
        );
        const size = Math.hypot(blend[0], blend[1], blend[2]);
        for (let k = 0; k < 3; k++) shaded[v * 3 + k] = blend[k] / size;
      }
      return {
        positions: closed.positions,
        normals: shaded,
        uvs: null,
        indices: cut.indices,
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
