import type { IAutoMovieHumanBodyLayerThicknessField } from "@automovie/human/body/anatomy/layer/IAutoMovieHumanBodyLayerThicknessField";
import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";
import { areaWeightedNormals } from "@automovie/human/common/mesh/areaWeightedNormals";

import type { IHumanBodyLayerThicknessReceipt } from "./IHumanBodyLayerThicknessReceipt.ts";
import { readHumanBodyLayerThicknessAnchors } from "./readHumanBodyLayerThicknessAnchors.ts";

/**
 * Field and observed segment ranges produced from one immutable body view.
 * @author Samchon
 */
interface IHumanBodyLayerThicknessProduction {
  /** Metre-valued arrays addressed by the input's native vertex ordinal. */
  field: IAutoMovieHumanBodyLayerThicknessField;

  /** First-maximal skin-influence census, not anatomical segmentation. */
  byDominantSegment: IHumanBodyLayerThicknessReceipt["byDominantSegment"];
}

/**
 * Blend the historical authored layer anchors on the actual native skin.
 * Positions use the basis's right-handed Y-up, Z-forward metre frame. The
 * area-weighted outward normal's forward component blends trunk front/back
 * SAT; the skin's own influence weights blend segment values. No surface,
 * weight, joint or caller-owned array is changed. This field remains an
 * authored default, not an inferred personal tissue map or offset admission.
 * The existing shared normal owner supplies the same area-weighted formula;
 * its face-major accumulation can differ in final rounding from the historical
 * NumPy corner-major order. No copied normal formula defines another answer.
 */
export function authorHumanBodyLayerThicknessField(body: IAutoMovieHumanBodyBasis): IHumanBodyLayerThicknessProduction {
  const surface = body.surfaces[0];
  if (surface === undefined || surface.positions.length % 3 !== 0 || surface.indices.length % 3 !== 0)
    throw new Error("Native thickness production needs an indexed skin surface.");
  const count = surface.positions.length / 3;
  const skin = surface.skin;
  const slots = skin.boneIndices.length / count;
  if (count === 0 || !Number.isInteger(slots) || slots <= 0 || skin.weights.length !== skin.boneIndices.length)
    throw new Error("Native thickness production needs complete skin influence rows.");
  const anchors = readHumanBodyLayerThicknessAnchors();
  const sat = new Map(anchors.filter((anchor) => anchor.layer === "subcutaneous")
    .map((anchor) => [anchor.site, anchor.metres * 1000]));
  const measuredSkin = new Map(anchors.filter((anchor) => anchor.layer === "skin")
    .map((anchor) => [anchor.site, anchor.metres * 1000]));
  const segments = skin.joints.map(segmentOf);
  if (surface.indices.some((id) => !Number.isInteger(id) || id < 0 || id >= count))
    throw new Error("Native thickness triangles address an absent vertex.");
  const normals = areaWeightedNormals(surface.positions, surface.indices);
  const skinMetres: number[] = [];
  const subcutaneousMetres: number[] = [];
  const byDominantSegment: IHumanBodyLayerThicknessProduction["byDominantSegment"] = {};
  for (let vertex = 0; vertex < count; vertex++) {
    const at = vertex * 3;
    const length = Math.sqrt(normals[at] ** 2 + normals[at + 1] ** 2 + normals[at + 2] ** 2);
    if (!(length > 0) || !Number.isFinite(length))
      throw new Error("Native thickness skin has no finite outward vertex normal.");
    const front = Math.max(0, Math.min(1, (normals[at + 2] + 1) / 2));
    let weightSum = 0;
    let skinValue = 0;
    let fatValue = 0;
    let dominant = "";
    let largest = -Infinity;
    for (let slot = 0; slot < slots; slot++) {
      const row = vertex * slots + slot;
      const bone = skin.boneIndices[row];
      const weight = skin.weights[row];
      if (!Number.isInteger(bone) || bone < 0 || bone >= segments.length || !Number.isFinite(weight) || weight < 0)
        throw new Error("Native thickness skin has invalid joint indices or influence weights.");
      const segment = segments[bone];
      const trunk = segment === "pelvis" || segment === "trunk";
      const anterior = sat.get(trunk ? "anteriorTrunk" : segment)!;
      const posterior = sat.get(segment === "pelvis" ? "buttocks" : segment === "trunk" ? "posteriorTrunk" : segment)!;
      const dermal = measuredSkin.get(trunk ? "abdomen" : segment === "thigh" ? "thigh" : "every segment other than trunk and thigh")!;
      weightSum += weight;
      fatValue += weight * (front * anterior + (1 - front) * posterior);
      skinValue += weight * dermal;
      if (weight > largest) {
        largest = weight;
        dominant = segment;
      }
    }
    if (Math.abs(weightSum - 1) > 1e-6 || !Number.isFinite(skinValue) || !Number.isFinite(fatValue))
      throw new Error("Skin weights must sum to one to blend finite segment values.");
    skinMetres.push(skinValue / 1000);
    subcutaneousMetres.push(fatValue / 1000);
    const row = byDominantSegment[dominant] ??= {
      vertices: 0, skinMetres: [Infinity, -Infinity], subcutaneousMetres: [Infinity, -Infinity],
    };
    row.vertices++;
    row.skinMetres[0] = Math.min(row.skinMetres[0], skinValue / 1000);
    row.skinMetres[1] = Math.max(row.skinMetres[1], skinValue / 1000);
    row.subcutaneousMetres[0] = Math.min(row.subcutaneousMetres[0], fatValue / 1000);
    row.subcutaneousMetres[1] = Math.max(row.subcutaneousMetres[1], fatValue / 1000);
  }
  return {
    field: {
      basis: body.id, skinMetres, subcutaneousMetres, anchors,
      qualification: "Authored default. Each rig segment takes its anchor's value and a vertex blends its segments by its own skin weights; trunk values blend anterior and posterior by the outward normal. A value is a measurement only at its anchor's site for its anchor's population. Women, older adults, other body compositions and all sites between anchors are unmeasured by these sources and unknown; the field describes no individual.",
    },
    byDominantSegment: Object.fromEntries(Object.entries(byDominantSegment).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)),
  };
}

/** Preserve the historical rig-name to measured-segment authoring convention. */
function segmentOf(joint: string): string {
  const stem = joint.startsWith("left") ? joint.slice(4) : joint.startsWith("right") ? joint.slice(5) : joint;
  const name = stem[0].toLowerCase() + stem.slice(1);
  if (name === "hips") return "pelvis";
  if (["spine", "chest", "upperChest", "shoulder"].includes(name)) return "trunk";
  if (["neck", "head", "upperArm", "foot"].includes(name)) return name;
  if (name === "lowerArm") return "forearm";
  if (name === "upperLeg") return "thigh";
  if (name === "lowerLeg") return "leg";
  if (name === "toes" || joint.includes("Toe") || joint.includes("Hallux")) return "foot";
  return "hand";
}
