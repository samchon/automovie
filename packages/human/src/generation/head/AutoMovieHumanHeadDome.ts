import { AutoMovieViewAxis, type IAutoMovieViewPart } from "@automovie/engine";

import { AutoMovieHumanHeadDomeHost } from "./AutoMovieHumanHeadDomeHost";

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
 * @evidence contracts/performance.md#efficient-algorithms Contact creation admits the original parent scalars, sorts its source sites and searches original knot-plane brackets at the native/axis owners' costs. A subsequent IHost curvature query retains each prepared scalar's lookup cost; cap construction and returned storage follow STEM+LAYERS+1.
 * @evidence contracts/performance.md#reuse-equivalent-work One station array serves all four signed outlines and one sagitta result places the axis.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned view owns bounded arrays and outline closures. No cache, figure, task or handle is retained globally.
 */
export namespace AutoMovieHumanHeadDome {
  /**
   * The cap's complete original material datum, owned by DomeHost.
   *
   * @evidence contracts/common.md#principled-implementation Preserves the identical source/frame/contact record used by the native material reader.
   * @evidence contracts/common.md#clear-and-simple-design One alias retains the existing regional input boundary without copying the host definition.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The alias adds no fitted value, alternate parent or unavailable derivative.
   * @evidence contracts/common.md#meaningful-documentation DomeHost owns calibration-mm fields and plane-only versus contact semantics.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A type alias performs no work.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The original host factories own preparation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources An alias acquires no resources.
   */
  export type IHost = AutoMovieHumanHeadDomeHost.IHost;

  /**
   * A cap retaining its actual original material contact for downstream consumers.
   *
   * @evidence contracts/common.md#principled-implementation The same complete source/frame/contact used to author embedding remains attached to the original part.
   * @evidence contracts/common.md#clear-and-simple-design One record preserves geometry and its actual borrowed material owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Retaining a contact claims neither whole-footprint agreement nor Boolean acceptance.
   * @evidence contracts/common.md#meaningful-documentation Null means a caller supplied no original material parent.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Data performs no work.
   * @evidence contracts/performance.md#reuse-equivalent-work Regional metadata borrows the identical prepared contact.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The composition owns the part and its transitive original-parent source.
   */
  export interface IPart extends IAutoMovieViewPart {
    /** Identical source contact consumed by embedding, or null without an original parent. */
    attachment: IHost | null;
  }

  /**
   * One actual source attempt collected before publishing any composed result.
   * @evidence contracts/common.md#principled-implementation Records the real caller's parent domain, independent placement anchor, nominal base and successful regular native contact or original exception.
   * @evidence contracts/common.md#clear-and-simple-design One record represents either success or failure without manufacturing geometry.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Collection cannot turn a failed source into a published part or proxy.
   * @evidence contracts/common.md#meaningful-documentation Source stations and world positions use calibration mm; error retains the original cause.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Data performs no work.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The attempt factory owns original construction.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The explicit inspection owns its bounded actual-caller records.
   */
  export interface IAttempt {
    /** Actual child source name. */
    name: string;
    /** Identical original frame, widths, rise and profile, before parent queries. */
    definition: Omit<IDome, "host">;
    /** Actual selected material owner, distinct from the tree's parent label. */
    parent: string | null;
    /** Identical original parent retained for independent source/frame inspection, even after a failed attachment query. */
    parentSource: IAutoMovieViewPart | null;
    /** Original declared physical station domain, without extension or clamping. */
    domain: [number, number] | null;
    /** Original child nominal base, independent of attachment. */
    base: [number, number, number];
    /** Original source placement anchor; distinct from a derived parent-surface contact. */
    point: [number, number, number];
    /** Successful native surface contact, distinct from the original placement anchor. */
    attachment: IHost | null;
    /** Original failed premise or null for an actual successful source. */
    error: string | null;
  }

  /**
   * Attempt the actual caller once and optionally collect every sibling outcome.
   *
   * @param dome Actual original cap definition, before any parent query.
   * @param parent Actual selected material source, if present.
   * @param point Original source placement anchor, world mm.
   * @param attempts Explicit inspection sink; its composer must reject aggregate failure.
   * @returns Actual original part, or null only in explicit failure collection mode.
   *
   * @evidence contracts/common.md#principled-implementation Uses the same attachment and source construction as production and records their real outcomes.
   * @evidence contracts/common.md#clear-and-simple-design One owner supplies both normal throwing and explicit all-caller inspection.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Failed collection emits no substitute view; normal production still throws the original exception.
   * @evidence contracts/common.md#meaningful-documentation A collecting composer must aggregate failures before publishing any result.
   * @evidence contracts/performance.md#efficient-algorithms Each parent-backed attempt performs one original scalar admission, O(n log n) source-site ordering, bounded contact-bracket inversions and fixed-size cap construction; native, scalar and axis owners retain their query costs.
   * @evidence contracts/performance.md#reuse-equivalent-work Inspection reuses the real region's definitions rather than reauthoring fixtures.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only an explicitly supplied caller-owned inspection array retains outcomes.
   */
  export function attempt(
    dome: Omit<IDome, "host">,
    parent: IAutoMovieViewPart | undefined,
    point: [number, number, number],
    attempts?: IAttempt[],
  ): IPart | null {
    let host: IHost | null = null;
    const record: (error: string | null) => void = (
      error: string | null,
    ): void => {
      attempts?.push({
        name: dome.name,
        definition: dome,
        parent: parent?.name ?? null,
        parentSource: parent ?? null,
        domain:
          parent === undefined
            ? null
            : [parent.stations[0]!, parent.stations.at(-1)!],
        base: [...dome.origin],
        point: [...point],
        attachment: host,
        error,
      });
    };
    try {
      host = parent === undefined ? null : contact(parent, dome);
      const part: IPart = {
        ...of({ ...dome, ...(host === null ? {} : { host }) }),
        attachment: host,
      };
      record(null);
      return part;
    } catch (error: unknown) {
      if (attempts === undefined) throw error;
      record(
        error instanceof Error ? (error.stack ?? error.message) : String(error),
      );
      return null;
    }
  }

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
     * Explicit parent-plane datum or numeric host radius, calibration mm.
     * A datum queries native curvature in its actual frame and radial direction.
     * The base sinks by
     * the sagitta estimate `e^2 / (2 R)` of the longest half extent `e`;
     * absent, R is e. A supplied local radius or size proxy is not a
     * certified least principal radius over the complete footprint.
     */
    host?: number | IHost;
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
   * @evidence contracts/performance.md#efficient-algorithms Cap construction and returned storage follow STEM+LAYERS+1. An IHost additionally queries its already-admitted scalar owners at their knot-search costs and prepares one fixed-size native curvature reading; numeric/default radii need constant work.
   * @evidence contracts/performance.md#reuse-equivalent-work Four outlines share the identical station list and profile; sagitta and axis placement are computed once.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The returned part owns its bounded knot arrays and small closures; call-local intermediates and no global references survive separately.
   */
  export function of(dome: IDome): IAutoMovieViewPart {
    const w: [number, number, number] = dome.outward;
    const u: [number, number, number] = dome.along;
    const v: [number, number, number] = [
      u[1] * w[2] - u[2] * w[1],
      u[2] * w[0] - u[0] * w[2],
      u[0] * w[1] - u[1] * w[0],
    ];

    // A sunk stem under the base, as wide as the base, twice as deep as the
    // estimated host sagitta. This allowance does not certify containment
    // when the host radius varies; the actual join must report that case.
    const sink: number = 2 * sagitta(dome);

    // The source belongs to its author; a shallow crossing is the join
    // owner's responsibility and cannot change this declared profile.
    const profile: number = dome.profile;
    const origin: [number, number, number] = [
      dome.origin[0] - sink * w[0],
      dome.origin[1] - sink * w[1],
      dome.origin[2] - sink * w[2],
    ];
    const rise: number = Math.max(1e-3, dome.height);
    const h: number = sink + rise;
    const stem: number[] =
      sink > 0
        ? Array.from(
            { length: STEM },
            (_: unknown, k: number): number => (sink * k) / STEM,
          )
        : [];
    const stations: number[] = [
      ...stem,
      ...Array.from(
        { length: LAYERS + 1 },
        (_: unknown, k: number): number => sink + (rise * k) / LAYERS,
      ),
    ];

    /** Signed profile ordinates on the one shared station list. */
    const outline: (e0: number, sign: number) => IAutoMovieViewPart.IOutline = (
      e0: number,
      sign: number,
    ): IAutoMovieViewPart.IOutline => ({
      knots: stations.map(
        (s: number, k: number): IAutoMovieViewPart.IKnot => ({
          site: `${dome.name}.${k}`,
          station: s,
          value:
            k === stations.length - 1
              ? 0
              : s <= sink
                ? sign * e0
                : sign *
                  e0 *
                  (1 - ((s - sink) / rise) ** profile) ** (1 / profile),
        }),
      ),
    });
    return {
      name: dome.name,
      axis: AutoMovieViewAxis.straight(origin, u, v),
      stations,
      front: {
        positive: outline(dome.extents[0], 1),
        negative: outline(dome.extents[2], -1),
      },
      side: {
        positive: outline(dome.extents[1], 1),
        negative: outline(dome.extents[3], -1),
      },
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
   * @evidence contracts/performance.md#efficient-algorithms The four-extent maximum and numeric/default-radius branch take constant work. IHost delegates to prepared scalar lookups plus fixed-size native phase/curvature work; query storage is fixed and no original source is admitted here.
   * @evidence contracts/performance.md#reuse-equivalent-work Reads one radius from the supplied prepared host datum and uses it once; the parent is not readmitted.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one scalar and retains no temporary native geometry or borrowed source.
   */
  export function sagitta(dome: IDome): number {
    const e: number = Math.max(...dome.extents);
    const R: number =
      typeof dome.host === "object"
        ? AutoMovieHumanHeadDomeHost.radius(dome.host)
        : (dome.host ?? e);
    return R > 0 ? (e * e) / (2 * R) : 0;
  }

  /**
   * Locate a supplied placement point in the original source's parallel planes.
   *
   * @param parent Identical original parent source.
   * @param point World placement point, calibration mm, which may lie off the parent surface.
   * @returns Complete parent-plane datum in its own physical source station clock.
   *
   * @evidence contracts/common.md#principled-implementation Inverts the original axis plane equation over its declared source domain, then retains that exact frame and original scalar preparation.
   * @evidence contracts/common.md#clear-and-simple-design Explicit parallel-plane admission and one bracketed source-plane inverse precede native curvature reading.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No world-Y/station equivalence, child relocation, domain clamp, mesh footpoint or proxy fallback is assumed.
   * @evidence contracts/common.md#meaningful-documentation Parallel planes must bracket the supplied point; the result establishes its plane but not surface incidence. A missing plane is an explicit premise failure.
   * @evidence contracts/performance.md#efficient-algorithms Original scalar admission takes linear time/retained storage in parent knots. Constant endpoint reads and at most fifty-six inverse iterations retain the axis owner's at-query cost; each iteration uses fixed temporary storage.
   * @evidence contracts/performance.md#reuse-equivalent-work The shared plane inverse receives the identical admitted source; it performs no second admission.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned caller-owned parent datum survives; no global cache or emitted surface is retained.
   */
  export function attachment(
    parent: IAutoMovieViewPart,
    point: [number, number, number],
  ): IHost {
    return AutoMovieHumanHeadDomeHost.attachment(parent, point);
  }

  /**
   * First bracketed regular contact of the unchanged nominal cap axis and its original material parent.
   *
   * @evidence contracts/common.md#principled-implementation Searches the declared axis segment on original knot-plane intervals, using the complete signed native field and actual parallel planes. Exact endpoints remain authoritative; a missing bracket, point pole or unresolved 1e-8 mm radial residual is rejected rather than moved.
   * @evidence contracts/common.md#clear-and-simple-design One original admission and one contact owner serve every regional cap; placement anchors remain independent metadata.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No output mesh, domain extension, seed clamp, alternate parent or missing derivative supplies contact. Bracket detection does not certify unbracketed tangencies or the complete footprint.
   * @evidence contracts/common.md#meaningful-documentation The parameter is physical mm from the original nominal base toward its original apex; the first regular bracket is the explicit selection convention.
   * @evidence contracts/performance.md#efficient-algorithms Linear scalar admission, O(n) actual-axis site queries and O(n log n) source-site sorting precede endpoint/final readings and at most forty-eight bisections per bracket. A plane inverse retains up to fifty-six actual-axis queries and scalar lookup costs; fixed-plane readers reuse their located station.
   * @evidence contracts/performance.md#reuse-equivalent-work One admitted source serves the entire search and returned datum; fixed-plane frame and native phase preparation are shared by every residual query.
   * @evidence contracts/performance.md#bound-retention-and-release-resources O(n) sites and local search readings are call-owned; only the selected original source/frame/contact survive in IHost.
   */
  export function contact(
    parent: IAutoMovieViewPart,
    dome: Omit<IDome, "host">,
  ): IHost {
    return AutoMovieHumanHeadDomeHost.contact(parent, dome);
  }
}
