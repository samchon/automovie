import { type IAutoMovieInspectionKindStyle, type IAutoMovieResolveInspectionColorsProps, type IAutoMovieInspectionColorAssignment, type AutoMovieInspectionShade } from "@automovie/interface";
import type * as THREE from "three";
import { colorAutoMovieInspectionObjectsImplementation } from "./internal/colorAutoMovieInspectionObjectsImplementation.js";
import { resolveAutoMovieInspectionColors as resolveAutoMovieInspectionColorsImplementation } from "./internal/resolveAutoMovieInspectionColors.js";

/** Public operations for Auto Movie Render Inspection Material. */
export namespace AutoMovieRenderInspectionMaterial {
  /** Named input contract for colouring selected inspection meshes. */
  export namespace ColorObjects {
    /** One drawn mesh and its inspection path. */
    export interface IMesh {
      /** Mesh to recolour. */
      mesh: THREE.Mesh;
      /** Path matched by request colour patterns. */
      path: string;
    }
    /** Request colour assignments and their drawn meshes. */
    export interface IProps {
      /** Drawn meshes and their inspection paths. */
      meshes: readonly IMesh[];
      /** Shade currently used to draw the picture. */
      shade: AutoMovieInspectionShade;
      /** Request colour assignments, last matching entry taking precedence. */
      color: readonly IAutoMovieInspectionColorAssignment[];
    }
  }
  /**
   * Shade each mesh a request colour pattern matches and return the call that
   * gives each mesh its own material back. The last matching entry wins.
   * Beauty uses an unlit colour; clay uses the colour lit as clay. Both preserve
   * skinning, morphing, formation cycles and dual-quaternion skin. Other shades
   * encode quantities, so a colour match throws rather than hiding that data.
   */
  export function colorObjects(props: ColorObjects.IProps): () => void {
    return colorAutoMovieInspectionObjectsImplementation(props);
  }
  /**
   * Decide the legend text and colour of every mark kind drawn in one picture,
   * and refuse a picture whose colours would be ambiguous.
   *
   * A kind takes the label and colour its marks carry, or the colour of the last
   * `recolor` entry whose pattern matches the kind under the path grammar. Two
   * marks of one kind that disagree on either throw, because one kind is then two
   * things. Two kinds that end up in one colour throw naming both, and so does a
   * kind whose colour is one of `reserved`, such as the flag colour or a shade's
   * surface colour, naming the kind and the reserved use. Kinds come in the order
   * their first mark appears.
   */
  export function resolveColors(props: IAutoMovieResolveInspectionColorsProps): Map<string, IAutoMovieInspectionKindStyle> {
    return resolveAutoMovieInspectionColorsImplementation(props);
  }
}
