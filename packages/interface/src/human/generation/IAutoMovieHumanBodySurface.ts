import type { IAutoMovieHumanLoftMesh } from "../lofting/IAutoMovieHumanLoftMesh";
import type { IAutoMovieHumanConstructionPath } from "./IAutoMovieHumanConstructionPath";

/**
 * Generated registered-frame skin buffers, material coordinates and opening
 * rims in millimetres.
 *
 * The interface package owns these declarations; AutoMovieHumanBodySurface in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanBodySurface {
  /** Generated skin in millimetres, registered frame. */
  export interface IOutput {
    /**
     * Skin buffers, triangles counter-clockwise from outside. Triangle groups
     * are named `<chain>/<k>`: the interval between principal layers k and k+1
     * of that chain, which the sections `<chain>/<k>` and `<chain>/<k+1>`
     * shape.
     */
    mesh: IAutoMovieHumanLoftMesh.IContext;

    /** Flat unit vertex normals of the whole skin. */
    normals: number[];

    /**
     * Loft coordinates of every vertex, flat `[chain, station, phase, ...]`:
     * the index of the chain in the calibration that evaluated it, the station
     * (height or tilted-frame station, mm) and the phase (radians). A pole apex
     * has phase NaN; a vertex the aperture cut or the lid tuck derived from
     * others has all three NaN.
     *
     * These are the skin's own surface parameters. The rig and every attachment
     * bind to them instead of to vertex or triangle numbers, which change with
     * every parameter set, so a bound point can be evaluated again on another
     * body or pose by the chain functions.
     */
    coordinates: number[];

    /** Aperture paths sampled by the actual skin generation, in millimetres. */
    construction: IAutoMovieHumanConstructionPath[];

    /**
     * The rim of every opening closed from its trim loop, by name: the loop's
     * points on its base chain in loop order, mm.
     */
    rims: Map<string, [number, number, number][]>;
  }

  /**
   * The details argument of AutoMovieHumanBodySurface.generate. Loft the whole
   * calibrated body.
   *
   * @param calibration Shared chain coefficients, events and poles.
   */
  export type GenerateDetails = [
    [number, number, number],
    [number, number, number],
  ][];
}
