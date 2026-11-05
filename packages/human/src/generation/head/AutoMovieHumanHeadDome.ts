import { AutoMovieViewAxis, type IAutoMovieViewPart } from "@automovie/engine";

/**
 * A small part rising from its base to an apex along its own axis, drawn
 * from its views: the shared form of the face's masses (brow ridge, zygoma,
 * cheek, chin pad, jaw angle), the nose's and the lips' bodies, the auricle,
 * and of the cutters that hollow the face (orbit, temple, sulci).
 *
 * In the part's frame the unit axis `w` points from the cap base toward its
 * apex, inward for a cutter; `u` is the footprint's long direction and
 * `v = u x w`. A constant-footprint stem starts behind the nominal cap base
 * by twice the host-sagitta estimate. Each cap extent falls to the apex along the
 * quarter super-ellipse `e(s) = e0 (1 - (s/h)^p)^(1/p)`, the part's
 * projection profile in its side views, and the apex is the part's pole.
 * Each quarter's fullness is one conic shoulder.
 * The declared profile is preserved even for a shallow cap: an engine join
 * limitation must remain a join diagnostic rather than reshape its source.
 *
 * @evidence contracts/common.md#principled-implementation Emits the declared super-elliptic station ordinates and conic shoulders in the caller's orthonormal frame. Sagitta embedding is an explicit host-curvature estimate; engine interpolation between those ordinates remains distinct from the analytic profile.
 * @evidence contracts/common.md#clear-and-simple-design One cap constructor and one sagitta calculation serve the face-part consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Honors the declared profile without a grazing-bound compensation or person branch. The inherited minimum rise and optional host-radius estimate remain construction conventions.
 * @evidence contracts/common.md#meaningful-documentation States units, frame, station profile, embedding estimate and the boundary between source shape and join acceptance.
 * @evidence contracts/performance.md#efficient-algorithms One four-extent maximum and the fixed STEM+LAYERS+1 station count bound construction work; no loft, body realization or reference read occurs.
 * @evidence contracts/performance.md#reuse-equivalent-work One station array serves all four signed outlines and one sagitta result places the axis.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned view owns bounded arrays and outline closures. No cache, figure, task or handle is retained globally.
 */
export namespace AutoMovieHumanHeadDome {
  /**
   * A dome's generating frame and positive dimensions in calibration mm.
   *
   * @evidence contracts/common.md#principled-implementation Separates the caller's frame, footprint, rise, profile and shoulder from the optional host-curvature estimate.
   * @evidence contracts/common.md#clear-and-simple-design A single record supplies the cap source.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no person selector, reference target or join-driven shape override.
   * @evidence contracts/common.md#meaningful-documentation Documents each field's units, orientation and optional default.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A data contract chooses no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A data contract coordinates no work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A data contract owns no runtime resource lifecycle.
   */
  export interface IDome {
    /** Chain name. */
    name: string;

    /** Nominal cap-base centre before the stem's embedding offset, world mm. */
    origin: [number, number, number];

    /** Unit direction from the cap base to its apex, inward for a cutter. */
    outward: [number, number, number];

    /** Unit long direction of the footprint, square to `outward`. */
    along: [number, number, number];

    /** Half extents of the base along `+u`, `+v`, `-u`, `-v`, mm, positive. */
    extents: [number, number, number, number];

    /** Height from the base to the apex, mm. */
    height: number;

    /** Exponent of the projection profile, 2 for the ellipse. */
    profile: number;

    /** Conic shoulder of every quarter. */
    shoulder: number;

    /**
     * Host radius used for the embedding estimate, mm. The base sinks by
     * the sagitta estimate `e^2 / (2 R)` of the longest half extent `e`;
     * absent, R is e. A supplied local radius or size proxy is not a
     * certified least principal radius over the complete footprint.
     */
    host?: number;
  }

  /**
   * Layers of the sunk stem under the base.
   *
   * @evidence contracts/common.md#principled-implementation Retains four constant-radius embedding stations before the cap base.
   * @evidence contracts/common.md#clear-and-simple-design One station-count constant serves the sunk stem.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts This fixed resolution is independent of person and join outcome.
   * @evidence contracts/common.md#meaningful-documentation Names the hidden-stem sampling role.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A scalar count has no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A scalar count coordinates no work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A scalar count retains no resources.
   */
  export const STEM: number = 4;

  /**
   * Layers from the base to the apex.
   *
   * @evidence contracts/common.md#principled-implementation Retains sixteen equal axial steps for the declared cap profile.
   * @evidence contracts/common.md#clear-and-simple-design One count serves all four signed cap outlines.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Sampling count changes neither the declared profile nor a failed join.
   * @evidence contracts/common.md#meaningful-documentation Names base-to-apex discretization.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A scalar count has no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A scalar count coordinates no work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A scalar count retains no resources.
   */
  export const LAYERS: number = 16;

  /**
   * Control points per section, a multiple of 4.
   *
   * @evidence contracts/common.md#principled-implementation Keeps equal quadrant subdivisions in the engine loft's section order.
   * @evidence contracts/common.md#clear-and-simple-design One order is shared by the cap's sections.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The fixed order is not selected from a fixture or failed join.
   * @evidence contracts/common.md#meaningful-documentation States control-point count and four-quarter divisibility.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A scalar order has no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A scalar order coordinates no work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A scalar order retains no resources.
   */
  export const ORDER: number = 16;

  /**
   * Ring samples of the emitted chain.
   *
   * @evidence contracts/common.md#principled-implementation Declares the retained ring sampling hint separately from source knot ordinates.
   * @evidence contracts/common.md#clear-and-simple-design One sampling hint is returned with the cap view.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The count does not fit a reference or suppress diagnostics.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes ring sampling from axial layers and section order.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A scalar sampling hint has no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A scalar hint coordinates no work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A scalar hint retains no resources.
   */
  export const SAMPLES: number = 64;

  /**
   * The dome as a view part.
   *
   * @param dome Its views.
   * @returns The part, its top a pole at the apex.
   *
   * @evidence contracts/common.md#principled-implementation Preserves the caller's profile exponent and frame, emits a sunk constant footprint followed by declared cap ordinates, and leaves interpolation/joins to their engine owners.
   * @evidence contracts/common.md#clear-and-simple-design Builds one station list, four signed outlines and a shared fullness source.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not steepen shallow caps for a kernel grazing bound. The retained 1e-3 mm minimum rise is a declared construction floor, not a measured dimension.
   * @evidence contracts/common.md#meaningful-documentation Explains embedding, profile preservation, frame directions and source versus final-join scope.
   * @evidence contracts/performance.md#efficient-algorithms Time and returned storage follow the fixed STEM+LAYERS+1 station count; no surface is realized.
   * @evidence contracts/performance.md#reuse-equivalent-work Four outlines share the identical station list and profile; sagitta and axis placement are computed once.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The returned part owns its bounded knot arrays and small closures; call-local intermediates and no global references survive separately.
   */
  export function of(dome: IDome): IAutoMovieViewPart {
    const w: [number, number, number] = dome.outward;
    const u: [number, number, number] = dome.along;
    const v: [number, number, number] = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];

    // A sunk stem under the base, as wide as the base, twice as deep as the
    // estimated host sagitta. This allowance does not certify containment
    // when the host radius varies; the actual join must report that case.
    const sink: number = 2 * sagitta(dome);

    // The source belongs to its author; a shallow crossing is the join
    // owner's responsibility and cannot change this declared profile.
    const profile: number = dome.profile;
    const origin: [number, number, number] = [dome.origin[0] - sink * w[0], dome.origin[1] - sink * w[1], dome.origin[2] - sink * w[2]];
    const rise: number = Math.max(1e-3, dome.height);
    const h: number = sink + rise;
    const stem: number[] = sink > 0 ? Array.from({ length: STEM }, (_: unknown, k: number): number => (sink * k) / STEM) : [];
    const stations: number[] = [...stem, ...Array.from({ length: LAYERS + 1 }, (_: unknown, k: number): number => sink + (rise * k) / LAYERS)];

    /** Signed profile ordinates on the one shared station list. */
    const outline: (e0: number, sign: number) => IAutoMovieViewPart.IOutline = (e0: number, sign: number): IAutoMovieViewPart.IOutline => ({
      knots: stations.map((s: number, k: number): IAutoMovieViewPart.IKnot => ({
        site: `${dome.name}.${k}`,
        station: s,
        value: k === stations.length - 1 ? 0 : s <= sink ? sign * e0 : sign * e0 * (1 - ((s - sink) / rise) ** profile) ** (1 / profile),
      })),
    });
    return {
      name: dome.name,
      axis: AutoMovieViewAxis.straight(origin, u, v),
      stations,
      front: { positive: outline(dome.extents[0], 1), negative: outline(dome.extents[2], -1) },
      side: { positive: outline(dome.extents[1], 1), negative: outline(dome.extents[3], -1) },
      fullness: {
        kind: "shoulder",
        shoulder: {
          knots: [
            { site: `${dome.name}.base`, station: 0, value: dome.shoulder },
            { site: `${dome.name}.apex`, station: h, value: dome.shoulder },
          ],
        },
      },
      pole: "top",
      order: ORDER,
      samples: SAMPLES,
    };
  }

  /**
   * The depth a curved host falls away by under the footprint's longest half
   * extent: `e^2 / (2 R)`.
   *
   * @param dome The dome.
   * @returns Depth, mm.
   *
   * @evidence contracts/common.md#principled-implementation Uses e^2/(2R) as the declared host embedding estimate, with the longest footprint extent and optional host radius; it is not a certified whole-footprint curvature bound.
   * @evidence contracts/common.md#clear-and-simple-design Keeps the embedding estimate in its shared cap owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Reads no mesh, person target or join result; absent host radius uses the documented footprint scale.
   * @evidence contracts/common.md#meaningful-documentation Gives the estimate, units, default radius and limitation.
   * @evidence contracts/performance.md#efficient-algorithms One fixed four-extent maximum and scalar expression use constant time and storage.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This scalar calculation coordinates no requests or retained work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns one number without retained resources.
   */
  export function sagitta(dome: IDome): number {
    const e: number = Math.max(...dome.extents);
    const R: number = dome.host ?? e;
    return R > 0 ? (e * e) / (2 * R) : 0;
  }
}
