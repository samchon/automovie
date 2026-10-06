import type { IAutoMovieHumanBodyToeSplit } from "./IAutoMovieHumanBodyToeSplit";
import type { IAutoMovieHumanSkinBinding } from "../../../common/basis/IAutoMovieHumanSkinBinding";

import type { IAutoMovieHumanBasisSourcePartition } from "../../../common/basis/IAutoMovieHumanBasisSourcePartition";
import type { IAutoMovieHumanBodyBasisSurfaceMush } from "./IAutoMovieHumanBodyBasisSurfaceMush";
import type { IAutoMovieHumanBodyBasisSurfaceSag } from "./IAutoMovieHumanBodyBasisSurfaceSag";
import type { IAutoMovieHumanBodyBasisRegion } from "./IAutoMovieHumanBodyBasisRegion";
import type { IAutoMovieHumanBodySurfaceRelief } from "./IAutoMovieHumanBodySurfaceRelief";
import type { IAutoMovieHumanBodyNailsOverlay } from "./IAutoMovieHumanBodyNailsOverlay";
import type { IAutoMovieHumanBodyVeinsOverlay } from "./IAutoMovieHumanBodyVeinsOverlay";

/**
 * One connected skin surface in the common right-handed Y-up, Z-forward
 * basis frame, with shared positions in metres.
 *
 * Its source vertices have one identity across triangles and material regions;
 * UV seams may split render corners but do not split the physical skin answer.
 * Shape endpoints and four-influence weights move the same shared vertices,
 * and `createHumanBodySurfaceParts` calculates the posed surface before
 * material projection. Skinning, sag and appearance metadata do not by
 * themselves establish volume preservation or contact. This one exterior
 * sheet has no bone surfaces, individual muscle volumes, or subcutaneous fat
 * boundary from which their compression could be solved. The Visible Human
 * male/female lower-limb segmentation distinguishes bones, muscles, cartilage,
 * ligaments, and two fat/fascia compartments (Andreassen et al. 2023,
 * doi:10.1038/s41597-022-01905-2); those are separate anatomical structures,
 * not displacements to infer from this skin array alone. The current MPFB
 * study records initial topology and skin-weight extraction in its extraction
 * receipt and subsequent bilateral weight changes in its symmetry receipt.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyBasisSurface {
  /** Stable name of the surface in the basis document. */
  id: string;

  /** Shared flat XYZ positions, before material or UV seam splitting. */
  positions: number[];

  /** Optional shared-source cell lineage for a consuming face/body assembly. */
  sourcePartition?: IAutoMovieHumanBasisSourcePartition;

  /** Oriented triangles over those shared vertex identities. */
  indices: number[];

  /** Sparse [vertex, dx, dy, dz] rows, strictly increasing by vertex per endpoint. */
  targets: Record<string, number[]>;

  /** An exact partition of the surface triangles, preserving oriented triples. */
  regions: IAutoMovieHumanBodyBasisRegion[];

  /**
   * Four influences per shared vertex, glTF style: `boneIndices[4v..4v+3]`
   * index `joints` and `weights[4v..4v+3]` sum to one. The weights blend the
   * bones' `posed ∘ rest⁻¹` transforms as unit dual quaternions. Their
   * normalized blend applies one rigid transform to each vertex, and a
   * vertex bound to one bone with weight one follows that bone exactly,
   * which is the property the rigid-segment check measures. Different
   * vertices can receive different transforms; neither distance to a
   * shared anatomical joint nor local tissue volume is thereby preserved.
   */
  skin: IAutoMovieHumanSkinBinding;

  /**
   * Optional division of this surface's toes weight among the toe ray
   * phalanges (`IAutoMovieHumanBodyToeSplit`); requires the basis's
   * `toeRays`. Omission skins the toes with the one toes bone.
   */
  toeSplit?: IAutoMovieHumanBodyToeSplit;

  /** Optional numerical rest-detail filter after skinning, before sag. */
  mush?: IAutoMovieHumanBodyBasisSurfaceMush;

  /**
   * Soft-tissue sag proxy under gravity after skinning, or absent for none.
   * A vertex reads the outward difference between the document's rest skin
   * and the same body's `lean` shape along the rest normal. This is a
   * difference between two exterior skins, not a measured fat or muscle
   * boundary; neither skin is guaranteed free of crossings in every pose.
   * Compliance is that difference times `gain` and the softness. Softness is
   * `base` plus the sum of each `softness.channels` gain times the document's
   * weight of that channel, held in `range`. It moves by compliance times
   * the change of gravity's direction (-Y) in its skin's frame, smoothed
   * over `sweeps` half-steps with the open boundary held.
   */
  sag?: IAutoMovieHumanBodyBasisSurfaceSag;

  /**
   * The skin's anatomical relief, or absent for none: a tangent-space
   * normal map over this surface's UV layout (a PNG data URI, linear, UV
   * set 0 bound once, v down the image) of the flexion creases and
   * wrinkles its vertices are too coarse to carry, for the regions of
   * `material`. A document's skin detail binds it under the tiled
   * micro-relief.
   */
  relief?: IAutoMovieHumanBodySurfaceRelief;

  /**
   * Surface layers over this surface's UV layout for the skin material,
   * or absent for none. The builder binds nail plates at full
   * strength and veins when the document requests them, independently of
   * skin micro-relief. Images bind once over UV set 0, v down
   * the image, as PNG data URIs, the colour in sRGB with its coverage in
   * alpha and the normal map linear.
   *
   * - A `nails` layer is the nail plates, another tissue that replaces the
   *   skin where it covers, with its own colour, surface and `roughness`
   *   in [0, 1], shown in full. With the `cheek` albedo its colour was
   *   drawn for, a document's own cheek tints it by the palm's albedo
   *   against that cheek's (the palm is the skin's least pigmented site,
   *   as a nail bed is), so the plates follow the person's pigmentation.
   * - A `veins` layer is the superficial veins, a tint of the skin over
   *   them and their raised relief, drawn as they show over the lean body
   *   this surface's `sag` declares. A document's `skinVeins` shows them
   *   at its strength times `exp(-attenuation · t)`, where `t` is the mean
   *   tissue in metres the document's body carries over its lean self
   *   along the rest normal at the `vertices` the veins lie over, and
   *   `attenuation` (per metre) is how fast the light a vein takes falls
   *   with its depth. A body's regions keep different tissue over their
   *   veins, so a surface may carry a veins layer per region.
   *
   * A material takes one nails layer at most and four layers in all.
   */
  overlays?: (IAutoMovieHumanBodyNailsOverlay | IAutoMovieHumanBodyVeinsOverlay)[];
}
