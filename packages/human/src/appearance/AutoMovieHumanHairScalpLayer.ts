import type { IAutoMovieImage, IAutoMovieMesh } from "@automovie/interface";

import type { IAutoMovieHumanScalpHair } from "../structures/appearance/IAutoMovieHumanScalpHair";
import type { AutoMovieHumanHairGuide } from "./AutoMovieHumanHairGuide";
import { AutoMovieHumanHeadField } from "./AutoMovieHumanHeadField";
import type { AutoMovieHumanScalpBoundary } from "./AutoMovieHumanScalpBoundary";
import { AutoMovieHumanScalpCoverageDepth } from "./AutoMovieHumanScalpCoverageDepth";
import { AutoMovieHumanScalpCoverageImage } from "./AutoMovieHumanScalpCoverageImage";
import { AutoMovieHumanScalpShellEdge } from "./AutoMovieHumanScalpShellEdge";
import { AutoMovieHumanScalpShellPole } from "./AutoMovieHumanScalpShellPole";
import { AutoMovieHumanScalpShellVault } from "./AutoMovieHumanScalpShellVault";

/**
 * The scalp layer: a shell over the hair-bearing scalp that hides the skin
 * exactly as much as real hair over it would, assembled from its pieces.
 *
 * Cards are a sparse stand-in for the hair: a few thousand bundles for some
 * hundred thousand hairs, whose alpha cut-outs and gaps would show skin where
 * real hair hides it. The shell carries the hidden hair's share of occlusion:
 * its alpha at each chart direction is 1 - T, T the share of scalp real hair
 * lets through there (`AutoMovieHumanHairOcclusion`), so it is opaque under
 * the hair mass and fades to the skin where hair thins: at the boundary, at a
 * parting and at a whorl. The mesh is the shell's edge on the boundary
 * (`AutoMovieHumanScalpShellEdge`), its vault of rows
 * (`AutoMovieHumanScalpShellVault`) and its cap at the vertex
 * (`AutoMovieHumanScalpShellPole`); the image is the accumulated optical depth
 * of the guides (`AutoMovieHumanScalpCoverageDepth`) turned into alpha and
 * encoded (`AutoMovieHumanScalpCoverageImage`). Its edge therefore lies on
 * the boundary itself and never shows as a line.
 */
export namespace AutoMovieHumanHairScalpLayer {
  /** The layer's mesh and its coverage image. */
  export interface IOutput {
    /** Shell mesh in model metres with UV0. */
    mesh: IAutoMovieMesh;

    /** RGBA coverage image: white, alpha the share of scalp the hair hides. */
    image: IAutoMovieImage;
  }

  /**
   * Build the layer.
   *
   * @param field Head chart
   * @param hair Scalp hair input
   * @param boundary The head's scalp boundary
   * @param guides Solved guides
   * @returns Mesh and coverage image
   */
  export function generate(
    field: AutoMovieHumanHeadField.IField,
    hair: IAutoMovieHumanScalpHair,
    boundary: AutoMovieHumanScalpBoundary.IBoundary,
    guides: AutoMovieHumanHairGuide.IGuide[],
  ): IOutput {
    const alpha: Float64Array = AutoMovieHumanScalpCoverageImage.alpha(
      AutoMovieHumanScalpCoverageDepth.depth(field, hair, guides),
    );
    return {
      mesh: shell(field, boundary),
      image: AutoMovieHumanScalpCoverageImage.image(alpha),
    };
  }
}

/**
 * The shell mesh over the hair-bearing scalp, its edge on the boundary.
 *
 * @param field Head chart
 * @param boundary The head's scalp boundary
 * @returns Mesh in model metres with UV0
 */
function shell(
  field: AutoMovieHumanHeadField.IField,
  boundary: AutoMovieHumanScalpBoundary.IBoundary,
): IAutoMovieMesh {
  const buffer: AutoMovieHumanScalpShellVault.IBuffer = {
    positions: [],
    normals: [],
    uvs: [],
    indices: [],
  };
  AutoMovieHumanScalpShellVault.rows(
    field,
    buffer,
    AutoMovieHumanScalpShellEdge.elevations(field, boundary),
  );
  AutoMovieHumanScalpShellPole.cap(field, buffer);
  return {
    positions: buffer.positions,
    normals: buffer.normals,
    uvs: buffer.uvs,
    indices: buffer.indices,
    skin: null,
  };
}
