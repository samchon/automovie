import type { IAutoMoviePropBox } from "../harness/IAutoMoviePropBox";
import type { IAutoMoviePropSupportFace } from "./IAutoMoviePropSupportFace";

/** Data and callback contracts shared by the PropSupportGap operations. */
export namespace IAutoMoviePropSupportGap {
  /**
   * How far a staged prop's underside stands above the face it rests on, in
   * metres: negative where it sinks into the support, zero where it touches it,
   * positive where it floats. `null` when no probe of the prop's footprint lies
   * over the face at all, which is the answer for a prop that does not stand
   * over its support rather than one standing at the wrong height on it.
   *
   * Contact is probed from both sides: at the footprint's four corners and its
   * centre where those land on the face, and at the face's own ring corners,
   * holes included, where those land under the footprint. One side alone would
   * be wrong in one direction each. A prop standing on a patch smaller than
   * itself covers none of its own probes with the patch, and a patch wider than
   * the prop is never reached at its corners, so a bench on a plinth and a
   * chair on a floor are the same question asked from whichever side can answer
   * it.
   *
   * The deepest probe answers, which is what lets a box resting along one edge
   * of a ramp still be resting on it while a box whose near corner has gone
   * through the ramp is not, and it is the same footprint sampling
   * {@link supportContactsFor} decides a scene's supports by. Relief between the
   * probes is not read: a support that rises and falls between them is answered
   * where they stand. Edge intersections are not added as probes, so a thin
   * overlap can be missed and even a planar support need not expose its deepest
   * overlapping point to this finite probe set.
   */
  export type IProps = {
    /** The face the prop claims to rest on. */
    face: IAutoMoviePropSupportFace;

    /** The prop's world occupancy, from {@link propOccupancyBounds}. */
    bounds: IAutoMoviePropBox;
  };
}
