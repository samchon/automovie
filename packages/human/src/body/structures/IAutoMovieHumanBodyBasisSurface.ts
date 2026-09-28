/**
 * One connected skin surface with shared vertices, source regions, weights and optional tissue appearance.
 * This is authored basis data in metres and the shared Y-up, Z-forward
 * frame. The connected body builder reads it without mutating it.
 */
import type { AutoMovieHumanoidBone } from "@automovie/interface";

export interface IAutoMovieHumanBodyBasisSurface {
  id: string;

  /** Shared flat XYZ positions, before material or UV seam splitting. */
  positions: number[];

  /** Oriented triangles over those shared vertex identities. */
  indices: number[];

  /** Sparse [vertex, dx, dy, dz] rows, strictly increasing by vertex per endpoint. */
  targets: Record<string, number[]>;

  /** An exact partition of the surface triangles, preserving oriented triples. */
  regions: {
    id: string;
    material: string;
    indices: number[];

    /** Flat UV pairs per triangle corner, or null for untextured geometry. */
    uvs: number[] | null;
  }[];

  /**
   * Four influences per shared vertex, glTF style: `boneIndices[4v..4v+3]`
   * index `joints` and `weights[4v..4v+3]` sum to one. The weights blend the
   * bones' `posed ∘ rest⁻¹` transforms as unit dual quaternions, so a shared
   * vertex follows one rigid screw motion between its bones and keeps its
   * distance from the joint at a fold or a twist, and a vertex bound to one
   * bone with weight one moves rigidly with it, which is the property the
   * rigid-segment check measures.
   */
  skin: {
    joints: AutoMovieHumanoidBone[];
    boneIndices: number[];
    weights: number[];
  };

  /**
   * Soft-tissue sag under gravity after skinning, or absent for none. A
   * vertex carries the tissue the document's rest body has over the same
   * body with each `lean` channel at its weight, along the rest normal;
   * its compliance is that times `gain` and the softness, `base` plus the
   * sum of each `softness.channels` gain times the document's weight of that
   * channel, held in `range`; it moves by compliance times the change of
   * gravity's direction (-Y) in its skin's frame, smoothed over `sweeps`
   * half-steps with the open boundary held.
   */
  sag?: {
    lean: Record<string, number>;
    gain: number;
    sweeps: number;
    softness: {
      base: number;
      channels: Record<string, number>;
      range: [number, number];
    };
  };

  /**
   * The skin's anatomical relief, or absent for none: a tangent-space
   * normal map over this surface's UV layout (a PNG data URI, linear, UV
   * set 0 bound once, v down the image) of the flexion creases and
   * wrinkles its vertices are too coarse to carry, for the regions of
   * `material`. A document's skin detail binds it under the tiled
   * micro-relief.
   */
  relief?: { material: string; texture: string };

  /**
   * Surface layers over this surface's UV layout for the regions of
   * `material`, or absent for none, which a document's skin detail binds
   * as that material's overlays: images bound once over UV set 0, v down
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
  overlays?: (
    | {
        kind: "nails";
        material: string;
        color: string;
        normal?: string;
        roughness: number;
        cheek?: { r: number; g: number; b: number };
      }
    | {
        kind: "veins";
        material: string;
        color: string;
        normal?: string;
        vertices: number[];
        attenuation: number;
      }
  )[];
}
