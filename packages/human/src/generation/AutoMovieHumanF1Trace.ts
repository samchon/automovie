import { AutoMovieLoftChain, AutoMovieMeshCourse, AutoMovieMeshExtract, type AutoMovieViewAxis, AutoMovieViewChain, AutoMovieViewLoft, AutoMovieViewOutline, AutoMovieViewSection, type IAutoMovieLoftChain, type IAutoMovieViewPart } from "@automovie/engine";

type V3 = [number, number, number];

/** A chart point, mm. */
type V2 = [number, number];

/**
 * The direct path's one shared builder (owner's plan, step 1: conic lofting
 * from feature lines read off f1's own cuts, "only following coordinates"):
 * for every part, the same stages.
 *
 * 1. Course: the caller's axis through her joint centres in her own world,
 *    each station's section plane the axis frame there (`IAxis.at`: origin,
 *    `u`, `v`, normal `v x u`).
 * 2. Cut and read: `AutoMovieMeshCourse.cut` cuts her mesh on every station's
 *    own plane and keeps the outer piece holding the course point, every
 *    point of it.
 * 3. Guides ({@link trace}): each support direction's guide is followed from
 *    cut to cut. A domain's first cut takes the loop's measured extreme; each
 *    next cut climbs, on its own loop, the hill holding the point nearest the
 *    previous guide (`AutoMovieMeshCourse.ascend`, persistence 0.5 mm). While
 *    every guide's hill stands within 0.5 mm of the loop's measured envelope
 *    the domain continues; where the envelope stands higher, another feature
 *    has become the extreme, and a new domain opens there with its own
 *    measured extremes. A domain boundary is a chart boundary of this
 *    reading, not a physical branch: the previous domain ends at the cut
 *    before it and nothing joins the two. The quarters between the guides
 *    are read on the loop's own arcs and split at their shoulder bars
 *    (`AutoMovieMeshCourse.pieces`, #3158).
 * 4. Knots: each run reduced by `AutoMovieMeshExtract.reduce` within 0.5 mm.
 *    A ratio's error `d` moves its point by `d` times its reach, so a ratio
 *    run's tolerance is 0.5 mm over the LARGEST reach of the run. The reducer
 *    certifies its own cubic Hermite; the loft reads the knots through
 *    `AutoMovieViewOutline` (authored first jets, natural second derivatives,
 *    shared-jet quintics), a different interpolant. So every run is read back
 *    through that actual evaluator at every cut, its physical deviation
 *    measured, and the worst sample over 0.5 mm pinned as a knot and the run
 *    reduced again until the actual curve holds.
 * 5. Loft: one `IAutoMovieViewPart` per domain (front and side the guides'
 *    runs, fullness the top shoulders with touch offsets and splits) through
 *    `AutoMovieViewLoft.create`, whose stations are conic chains.
 *
 * The outcomes are distinct. A cut with no holding loop is dropped and ends
 * its domain. A domain cut with a missing split or piece, a shoulder outside
 * `(0, 1)`, or a turn whose `kr` is not below 1 refuses that domain's part:
 * no value is clamped, defaulted or interpolated across. A run whose actual
 * outline still leaves a cut by more than 0.5 mm after every offending
 * sample is pinned adds a diagnostic and the part is still built. A loft that
 * refuses the built part leaves the loft result with a null `chain` and its
 * diagnostics.
 *
 * Two readings report what the runs cannot, both finite samples: the lofted
 * surface itself (the chain's own rings) is compared with her loop at every
 * cut station and at the midpoint between each two cuts (her vertex's radius
 * minus the ring's radius at the same phase; not a nearest-distance or
 * all-phase measure), and each cut's turn regularity is read from the axis's
 * own analytic jet when it has one (`kr`; unobserved without a jet). Neither
 * says anything between the sampled stations or vertices. Her crests and
 * notches facing each support direction are reported as features, a
 * diagnostic persistence reading.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the stages, the guide correspondence and its domains as chart boundaries, the outcomes, the tolerance basis, the interpolant the knots are verified on, the sampled readings and their scope.
 * @evidence contracts/development/design.md#principled-representation The namespace groups one part's trace: the reference's own cuts with their followed guides and split quarters, the domains where one set of guides holds, each domain's reduced runs with their actual-evaluator residuals, its loft and its surface departures, all in millimetres along the caller's course.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Its consumer is every step-1 part provider (now `NodeTrunkCaptureSource`); cutting, climbing and reading belong to `AutoMovieMeshCourse`, lofting to `AutoMovieViewLoft`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No member is shaped for one part; the trunk passes only its course, cuts and loft settings, and no guide is moved across a feature to keep a domain whole.
 */
export namespace AutoMovieHumanF1Trace {
  /**
   * One station's reading.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit, chart and null meaning.
   * @evidence contracts/development/design.md#principled-representation One holding loop's own readings at one station: its envelope, its followed guides with their gaps to that envelope, its split quarters and its domain.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `trace`, the provider's receipt lines and the surface comparison.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A missing shoulder stays null; a zero-area normal and centroid stay null.
   */
  export interface ICut {
    /** Station, mm along the course. */
    station: number;

    /** Her holding loop, chart mm about the course point (`u`, `v`), every point. */
    loop: [number, number][];

    /** Her measured envelope: extents `+u`, `-u`, `+v`, `-v`, signed chart mm. */
    extents: [number, number, number, number];

    /** Where each envelope extreme touches its support line off the course point's axis line, mm (`AutoMovieMeshCourse.IReading.touch`), a reading of this cut alone. */
    touch: [number, number, number, number];

    /** Her crests and notches facing `+u`, `-u`, `+v`, `-v` (`AutoMovieMeshCourse.IReading.features`), a diagnostic reading. */
    features: AutoMovieMeshCourse.IReading["features"];

    /** The followed guides `+u`, `+v`, `-u`, `-v`, chart mm: loop points. */
    guides: [V2, V2, V2, V2];

    /** The envelope's support less each guide's, mm, in the guides' order: zero at a domain's first cut, at most 0.5 mm inside a domain. */
    gaps: [number, number, number, number];

    /** The quarters between the guides, split at their shoulder bars (`AutoMovieMeshCourse.pieces`). */
    pieces: [AutoMovieMeshCourse.IPiece, AutoMovieMeshCourse.IPiece, AutoMovieMeshCourse.IPiece, AutoMovieMeshCourse.IPiece];

    /** Its domain's index. */
    domain: number;

    /** Quarter shoulders q0..q3 on the axis-line guides (between +u/+v, +v/-u, -u/-v, -v/+u), as read; null when the loop misses the quarter's segment. */
    shoulders: [number | null, number | null, number | null, number | null];

    /** Each axis-line quarter's |M->A|, mm. */
    reach: [number, number, number, number];

    /** The loop's unit Newell normal, world, or null for a zero-area loop. */
    normal: V3 | null;

    /** The loop's area centroid in its own plane, world mm, or null for a zero-area loop. */
    centroid: V3 | null;

    /** The loop's area, mm^2. */
    area: number;

    /**
     * The turn regularity at this station: the section reach times the
     * plane normal's turning rate over the origin's speed along that normal,
     * `r |n'| / (n . o')`, from the axis's analytic jet (independent of how
     * the stations are labelled). Neighbouring planes cross inside the
     * section where it reaches 1. Null when the axis has no jet there:
     * unobserved, not straight.
     */
    kr: number | null;

    /** The cut's own flags (open, bridged, unclosed), in full. */
    flags: string[];

    /** The family checks on this loop (jumps). */
    checks: string[];
  }

  /**
   * One reduced run and its verification on the actual evaluator.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the knot layout, both residuals and their units, and the pins' meaning; the actual residual is measured at the cut stations only.
   * @evidence contracts/development/design.md#principled-representation Keeps the reducer's own certificate apart from the actual consumer's residual.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the provider's receipt and diagnostics.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The actual residual is reported even when it exceeds the tolerance.
   */
  export interface IRun {
    /** The run's name: an extent, a touch offset, a shoulder or a split member. */
    name: string;

    /** The knots: station, value, slope. */
    knots: [number, number, number][];

    /** The reducer's own error on its cubic Hermite, in the value's units. */
    reducer: number;

    /** The largest physical deviation of the loft's actual outline from the cuts at the cut stations, mm. */
    actual: number;

    /** Stations pinned because the actual outline left a cut by more than the tolerance. */
    pinned: number[];
  }

  /**
   * One station of the surface compared with her loop at that loop's vertices.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the same-phase radial measure at her loop's vertices, its sign and units, whether the station lies between cuts, and the failure; it is not a nearest-distance, all-edge or all-phase measure.
   * @evidence contracts/development/design.md#principled-representation The largest and mean same-phase radial differences with the phase and sign of the largest, or the named reason the station could not be read.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the provider's receipt and diagnostics.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No threshold is applied here; a nonfinite reading is a named fault, never a number.
   */
  export interface ILayer {
    /** Station, mm. */
    station: number;

    /** The station lies between two cuts (cut here for the check only). */
    between: boolean;

    /** The largest |her loop vertex's radius - surface radius at its phase|, mm; NaN with a fault. */
    max: number;

    /** Its mean over her loop's vertices, mm; NaN with a fault. */
    mean: number;

    /** The phase of the largest departure, radians from `+u` toward `+v`; NaN with a fault. */
    phase: number;

    /** Its signed value there, mm (positive: her loop stands outside the surface); NaN with a fault. */
    signed: number;

    /** Why the station could not be compared, or null. */
    fault: string | null;
  }

  /**
   * The part, its cuts and its loft.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member and the three outcomes: refused at cut admission, built with a residual diagnostic, built but refused by the loft.
   * @evidence contracts/development/design.md#principled-representation A cut refusal keeps its cuts and diagnostics with a null part and loft; a loft refusal keeps the built part and the loft result with its null chain.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the provider until it reads `trace`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No outcome is hidden: each refusal leaves its diagnostics.
   */
  export interface IOutput {
    /** The view part, or null when a cut refuses it; a part the loft refuses stays here. */
    part: IAutoMovieViewPart | null;

    /** Every cut that holds a loop. */
    cuts: ICut[];

    /** Stations where no outer loop holds the course point. */
    dropped: number[];

    /** Every refusal and residual diagnostic, by station and quarter, then the loft's diagnostics. */
    diagnostics: string[];

    /** The reduced runs, empty when refused at cut admission. */
    runs: IRun[];

    /** The loft's layers on cut stations against her loops, empty without sections. */
    layers: ILayer[];

    /** The loft result (its `chain` null when the loft refuses the part), or null when refused at cut admission. */
    loft: AutoMovieViewLoft.IResult | null;

    /** Stage times, milliseconds. */
    ms: Record<string, number>;
  }

  /**
   * One domain: consecutive cuts on which one set of followed guides holds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the span, the opening cause and the three outcomes.
   * @evidence contracts/development/design.md#principled-representation A domain's own part, runs, loft and surface departures, with the reason it opened.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the provider: the part for specs, the chain for clay, the rest for receipts.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A refused domain keeps its diagnostics with a null part and loft.
   */
  export interface IDomain {
    /** Its first and last cut stations, mm. */
    span: [number, number];

    /** Why it opened: the trace's first cut, a dropped cut before it, or the guide whose hill fell below the envelope. */
    opened: string;

    /** Its view part, or null when a cut refuses it. */
    part: IAutoMovieViewPart | null;

    /** Its reduced runs, empty when refused. */
    runs: IRun[];

    /** Its surface against her loops at its cut stations and between them. */
    layers: ILayer[];

    /** Its loft result, or null when refused. */
    loft: AutoMovieViewLoft.IResult | null;

    /** Its refusals, residual diagnostics and loft diagnostics. */
    diagnostics: string[];
  }

  /**
   * A traced part: its cuts and its domains.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member.
   * @evidence contracts/development/design.md#principled-representation Every cut that holds a loop, the dropped stations, and the domains in station order.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the provider.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No cut or domain is hidden.
   */
  export interface ITrace {
    /** Every cut that holds a loop. */
    cuts: ICut[];

    /** Stations where no outer loop holds the course point. */
    dropped: number[];

    /** The domains, in station order. */
    domains: IDomain[];

    /** Stage times, milliseconds. */
    ms: Record<string, number>;
  }

  /**
   * Inputs of one part.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States units, ordering, the frame of the mesh and the loft's premises on order.
   * @evidence contracts/development/design.md#principled-representation Her mesh in her own world, the course, the cut and layer stations and the loft's section settings.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Every member is consumed by `trace`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No point filter or registration input exists.
   */
  export interface IInput {
    /** Chain name. */
    name: string;

    /** Her mesh, mm, in her own world. */
    mesh: AutoMovieMeshExtract.IMesh;

    /** The course. */
    axis: AutoMovieViewAxis.IAxis;

    /** Cut stations, mm, strictly increasing. */
    cuts: number[];

    /** Emitted layer stations, mm, strictly increasing within the cuts; every knot is added. */
    stations?: number[];

    /** Section control points: a multiple of 4 and at least 8, the view loft's premise (it refuses the part otherwise). */
    order: number;

    /** Ring samples. */
    samples: number;
  }

  /** The extraction tolerance, mm (the owner's 0.5 mm). */
  export const TOLERANCE: number = 0.5;

  /**
   * Cut, follow the guides, split into domains, reduce, verify and loft one part.
   *
   * @param input The part's inputs.
   * @param observations The actual original curves sampled in the same charts, when supplied. The raw mesh still supplies admission and verification.
   * @returns The cuts and the domains with their parts and readings.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The namespace comment states the stages, the domains and the outcomes; the result states refusal and residual meanings.
   * @evidence contracts/development/implementation.md#principled-implementation Exact plane cuts; guides followed by climbing each next loop's own hill from the previous guide, a domain opening only where the measured envelope stands above that hill by more than the tolerance; the shoulder-bar split pieces on the loop's own arcs; Lyche and Morken knot removal with residuals measured on the consumer's own evaluator at the cut stations; the view loft's conic chains; the chain's own rings against her loops.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Cut, follow and split, then per domain: admit, reduce-and-verify, loft, compare.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No clamp, default, point filter or skipped cut; a guide never jumps inside a domain; a sample is pinned only because the actual outline missed it, never to steer a shape.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cutting is O(S T) for S cuts over T triangles, twice with the between-cut checks; following and splitting O(N) per cut; each run's reduction is O(S^2) and is repeated once per pinned sample.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work One call coordinates no requests across calls.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing between calls; the returned cuts hold each loop's points, linear in the cut crossings.
   */
  export function trace(input: IInput, observations?: ReadonlyMap<number, [number, number][]>): ITrace {
    const ms: Record<string, number> = {};
    let t: number = performance.now();
    const lap = (name: string): void => {
      const now: number = performance.now();
      ms[name] = now - t;
      t = now;
    };
    const sections: AutoMovieMeshCourse.ISection[] = AutoMovieMeshCourse.cut(input.mesh, input.cuts.map((s: number): AutoMovieMeshCourse.IPlane => plane(input.axis, s)), TOLERANCE);
    const raw = observations === undefined ? undefined : new Map(sections.map((section: AutoMovieMeshCourse.ISection): [number, [number, number][] | null] => [section.plane.station, section.loop]));
    lap("cut");

    // Follow the guides from cut to cut; a dropped cut or a guide fallen below the envelope opens a domain.
    const cuts: ICut[] = [];
    const dropped: number[] = [];
    const opened: string[] = [];
    let previous: ICut | null = null;
    for (const section of sections) {
      const loop: [number, number][] | null | undefined = observations === undefined ? section.loop : observations.get(section.plane.station);
      if (section.reading === null || section.loop === null || loop === undefined || loop === null || loop.length < 3) {
        dropped.push(section.plane.station);
        previous = null;
        continue;
      }
      const r: AutoMovieMeshCourse.IReading = observations === undefined ? section.reading : AutoMovieMeshCourse.read(loop, TOLERANCE);
      const envelope: number[] = [r.extents[0], r.extents[2], -r.extents[1], -r.extents[3]];
      const extreme: number[] = QUARTER.map((d: number): number => highest(loop, d));
      let guides: number[] = extreme;
      let domain: number = previous === null ? opened.length : previous.domain;
      if (previous === null) opened.push(cuts.length === 0 ? "the trace's first cut" : `the cut after dropped station ${dropped[dropped.length - 1]!.toFixed(2)} mm`);
      else {
        const prior: ICut = previous;
        const followed: number[] = QUARTER.map((d: number, q: number): number => AutoMovieMeshCourse.ascend(loop, d, nearest(loop, prior.guides[q]!), TOLERANCE));
        const fallen: string[] = followed.flatMap((i: number, q: number): string[] => {
          const gap: number = envelope[q]! - support(loop[i]!, QUARTER[q]!);
          return gap > TOLERANCE ? [`${NAMES[q]} guide's hill at (${loop[i]![0].toFixed(1)}, ${loop[i]![1].toFixed(1)}) stands ${gap.toFixed(3)} mm below the envelope at (${loop[extreme[q]!]![0].toFixed(1)}, ${loop[extreme[q]!]![1].toFixed(1)})`] : [];
        });
        if (fallen.length === 0) guides = followed;
        else {
          domain = opened.length;
          opened.push(`station ${section.plane.station.toFixed(2)} mm: ${fallen.join("; ")}`);
        }
      }
      const g: [number, number, number, number] = guides as [number, number, number, number];
      const c: ICut = {
        station: section.plane.station,
        loop,
        extents: r.extents,
        touch: r.touch,
        features: r.features,
        guides: g.map((i: number): V2 => [loop[i]![0], loop[i]![1]]) as ICut["guides"],
        gaps: g.map((i: number, q: number): number => envelope[q]! - support(loop[i]!, QUARTER[q]!)) as ICut["gaps"],
        pieces: AutoMovieMeshCourse.pieces(loop, g),
        domain,
        shoulders: r.quarters.map((q: AutoMovieMeshCourse.IQuarter): number | null => q.rho) as ICut["shoulders"],
        reach: r.quarters.map((q: AutoMovieMeshCourse.IQuarter): number => q.reach) as ICut["reach"],
        normal: section.normal,
        centroid: section.centroid,
        area: section.area!,
        kr: turn(input.axis, section.plane.station, section.reach!),
        flags: section.flags,
        checks: section.checks,
      };
      cuts.push(c);
      previous = c;
    }
    lap("follow");

    // Each domain: admit, reduce, loft, compare.
    const domains: IDomain[] = opened.map((why: string, k: number): IDomain => build(input, k, why, cuts.filter((c: ICut): boolean => c.domain === k), raw));
    lap("domains");
    return { cuts, dropped, domains, ms };
  }

  /**
   * One admitted arc of an observed quarter. The quarter's first arc starts at its actual guide.
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes the source point, tangent angle and measured shoulder.
   */
  export interface IObservedArc {
    /** First contact in the source section's chart, mm. */
    point: [number, number];
    /** Tangent angle in the positive phase direction, radians. */
    angle: number;
    /** Shoulder on this actual arc. */
    rho: number;
    /** Corner reach used to verify the shoulder's reduction, mm. */
    reach: number;
  }

  /**
   * Cut, read, reduce, verify and loft one part on its observed guides.
   *
   * @param input The part's inputs.
   * @param observations Closed reference curves sampled in the course chart at each cut, when available.
   * @param arcs Measured arc contacts with the same feature order at every cut, when using split quarters.
   * @returns The part and its readings, or a cut-admission refusal with every reason.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The result states refusal and residual meanings.
   * @evidence contracts/development/implementation.md#principled-implementation Exact plane cuts, the conic shoulder definition shared with the engine section, Lyche and Morken knot removal with residuals measured on the consumer's own evaluator at the cut stations, and the view loft.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Cut, refuse, reduce-and-verify, loft, compare: consecutive stages over one set of cuts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No clamp, default, point filter or skipped cut; a sample is pinned only because the actual outline missed it, never to steer a shape.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cutting is O(S T) for S cuts over T triangles; each run's reduction is O(S^2) and is repeated once per pinned sample.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work One call coordinates no requests across calls.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing between calls; the returned cuts hold each loop's points, linear in the cut crossings.
   */
  export function create(input: IInput, observations?: ReadonlyMap<number, [number, number][]>, arcs?: ReadonlyMap<number, IAutoMovieViewPart.IQuarters<IObservedArc[]>>): IOutput {
    const ms: Record<string, number> = {};
    let t: number = performance.now();
    const lap = (name: string): void => {
      const now: number = performance.now();
      ms[name] = now - t;
      t = now;
    };
    const sections: AutoMovieMeshCourse.ISection[] = AutoMovieMeshCourse.cut(input.mesh, input.cuts.map((s: number): AutoMovieMeshCourse.IPlane => plane(input.axis, s)), TOLERANCE);
    lap("cut");
    const cuts: ICut[] = [];
    const dropped: number[] = [];
    const diagnostics: string[] = [];
    for (const section of sections) {
      const observation: [number, number][] | undefined = observations?.get(section.plane.station);
      if (observations !== undefined && (observation === undefined || observation.length < 3)) {
        dropped.push(section.plane.station);
        diagnostics.push(`station ${section.plane.station} mm: no closed reference curve was supplied`);
        continue;
      }
      const c: ICut | null = cut(section, input.axis, observation);
      if (c === null) {
        dropped.push(section.plane.station);
        diagnostics.push(`station ${section.plane.station} mm: no outer loop holds the course point (${section.pieces} outer pieces)`);
        continue;
      }
      cuts.push(c);
      if (arcs === undefined) c.shoulders.forEach((rho: number | null, q: number): void => {
        if (rho === null || !(rho > 0 && rho < 1)) diagnostics.push(`station ${c.station} mm: quarter ${q} shoulder ${rho === null ? "missing (the loop does not meet M->A)" : rho.toFixed(4)} outside (0, 1), |M->A| ${c.reach[q]!.toFixed(2)} mm`);
      });
      if (c.kr !== null && !(c.kr < 1)) diagnostics.push(`station ${c.station} mm: turn k r ${c.kr.toFixed(4)} not below 1`);
    }
    if (cuts.length < 2) diagnostics.push(`${cuts.length} of ${input.cuts.length} cuts hold a loop; a part needs two`);
    const observed = arcs === undefined ? undefined : cuts.map((cut: ICut) => arcs.get(cut.station));
    if (observed !== undefined)
      observed.forEach((row, i: number): void => {
        if (row === undefined || row.some((quarter: IObservedArc[], q: number): boolean => quarter.length === 0 || quarter.length !== observed[0]?.[q]?.length || quarter.some((arc: IObservedArc): boolean => !(arc.rho > 0 && arc.rho < 1 && arc.reach > 0))))
          diagnostics.push(`station ${cuts[i]!.station} mm: the observed conic arcs are absent, invalid or differ in layout`);
      });
    if (diagnostics.length !== 0) return { part: null, cuts, dropped, diagnostics, runs: [], layers: [], loft: null, ms };

    const runs: IRun[] = [];
    const dimension = (name: string, values: number[]): IAutoMovieViewPart.IOutline => run(input.name, cuts, runs, name, values, (): number => 1, TOLERANCE);
    const scaled = (name: string, values: number[], reaches: number[]): IAutoMovieViewPart.IOutline => run(input.name, cuts, runs, name, values, (i: number): number => reaches[i]!, TOLERANCE / Math.max(...reaches));
    const at = (i: number, q: number, j: number): IObservedArc => observed![i]![q]![j]!;
    const extent = (k: number, name: string): IAutoMovieViewPart.IOutline => {
      const q: number = [0, 2, 1, 3][k]!;
      return dimension(name, cuts.map((c: ICut, i: number): number => observed === undefined ? c.extents[k]! : at(i, q, 0).point[k < 2 ? 0 : 1]));
    };
    const reach: number = Math.max(...cuts.flatMap((c: ICut): number[] => c.reach));
    const shoulder = (q: number, j: number = 0): IAutoMovieViewPart.IOutline =>
      observed === undefined
        ? run(input.name, cuts, runs, `rho${q}`, cuts.map((c: ICut): number => c.shoulders[q]!), (i: number): number => cuts[i]!.reach[q]!, TOLERANCE / reach)
        : scaled(`rho${q}.${j}`, cuts.map((_: ICut, i: number): number => at(i, q, j).rho), cuts.map((_: ICut, i: number): number => at(i, q, j).reach));
    const front: IAutoMovieViewPart.IPair = { positive: extent(0, "+u"), negative: extent(1, "-u") };
    const side: IAutoMovieViewPart.IPair = { positive: extent(2, "+v"), negative: extent(3, "-v") };
    const shoulders: IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IOutline> = [shoulder(0), shoulder(1), shoulder(2), shoulder(3)];
    const fullness: IAutoMovieViewPart.ITop = { kind: "top", shoulders };
    if (observed !== undefined) {
      fullness.touch = [0, 1, 2, 3].map((q: number): IAutoMovieViewPart.IOutline => dimension(`touch${q}`, cuts.map((_: ICut, i: number): number => at(i, q, 0).point[q % 2 === 0 ? 1 : 0]))) as IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IOutline>;
      fullness.pieces = observed[0]!.map((quarter: IObservedArc[], q: number): IAutoMovieViewPart.ISplit[] => quarter.slice(1).map((_: IObservedArc, k: number): IAutoMovieViewPart.ISplit => {
        const j: number = k + 1;
        const angles: number[] = [];
        for (let i: number = 0; i < cuts.length; ++i) {
          const angle: number = at(i, q, j).angle;
          angles.push(i === 0 ? angle : angle + 2 * Math.PI * Math.round((angles[i - 1]! - angle) / (2 * Math.PI)));
        }
        return {
          u: dimension(`split${q}.${j}.u`, cuts.map((_: ICut, i: number): number => at(i, q, j).point[0])),
          v: dimension(`split${q}.${j}.v`, cuts.map((_: ICut, i: number): number => at(i, q, j).point[1])),
          angle: scaled(`split${q}.${j}.angle`, angles, cuts.map((_: ICut, i: number): number => Math.max(at(i, q, j - 1).reach, at(i, q, j).reach))),
          shoulder: shoulder(q, j),
        };
      })) as IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.ISplit[]>;
    }
    lap("reduce");
    const unverified: string[] = runs.filter((r: IRun): boolean => r.actual > TOLERANCE).map((r: IRun): string => `${r.name} ${r.actual.toFixed(3)} mm`);
    if (unverified.length !== 0) diagnostics.push(`runs whose actual outline still leaves a cut by more than ${TOLERANCE} mm with every offending sample pinned: ${unverified.join(", ")}`);
    const part: IAutoMovieViewPart = { name: input.name, axis: input.axis, stations: stations(input, cuts, runs), front, side, fullness, order: input.order, samples: input.samples };
    const loft: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(part);
    lap("loft");
    const layers: ILayer[] = observations === undefined || loft.chain === null ? compare(cuts, loft) : verify(input, sections.map((s: AutoMovieMeshCourse.ISection): Pick<ICut, "station" | "loop"> => ({ station: s.plane.station, loop: s.loop! })), loft.chain);
    lap("layers");
    return { part, cuts, dropped, diagnostics: [...diagnostics, ...loft.diagnostics.map((d: { contract: string; detail: string }): string => `loft ${d.contract}: ${d.detail}`)], runs, layers, loft, ms };
  }

  /**
   * One cut on the axis frame's plane at a station: the loop holding the
   * course point and its readings, or null when no outer loop holds it.
   *
   * @param mesh Her mesh, mm.
   * @param axis The course.
   * @param station The station, mm.
   * @returns The cut, its guides at its own measured extremes, or null.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the guides and the null case.
   * @evidence contracts/development/implementation.md#principled-implementation The same single-plane cut and reading `trace` uses at a domain's first cut.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Delegates to `AutoMovieMeshCourse.cut` with one plane.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No fallback loop is chosen when none holds the course point.
   * @evidence contracts/development/implementation.md#efficient-algorithms One O(T) plane cut over T triangles.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A single reading coordinates no requests.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function read(mesh: AutoMovieMeshExtract.IMesh, axis: AutoMovieViewAxis.IAxis, station: number): ICut | null {
    return cut(AutoMovieMeshCourse.cut(mesh, [plane(axis, station)], TOLERANCE)[0]!, axis);
  }

  /** The support directions of the guides `+u`, `+v`, `-u`, `-v` (`AutoMovieMeshCourse.ascend`'s numbering). */
  const QUARTER: readonly number[] = [0, 2, 1, 3];

  /** The guides' names. */
  const NAMES: readonly string[] = ["+u", "+v", "-u", "-v"];

  /** One domain's admission, runs, loft and surface check. */
  function build(input: IInput, k: number, opened: string, cuts: ICut[], raw?: ReadonlyMap<number, [number, number][] | null>): IDomain {
    const span: [number, number] = [cuts[0]?.station ?? NaN, cuts[cuts.length - 1]?.station ?? NaN];
    const refuse = (diagnostics: string[]): IDomain => ({ span, opened, part: null, runs: [], layers: [], loft: null, diagnostics });
    if (cuts.length < 2) return refuse([`${cuts.length} cut in the domain; a part needs two`]);
    const diagnostics: string[] = [];
    for (const c of cuts) {
      c.pieces.forEach((p: AutoMovieMeshCourse.IPiece, q: number): void => {
        if (p.split === null) diagnostics.push(`station ${c.station} mm: quarter ${q} has no shoulder-bar split (its arc misses M->A)`);
        p.shoulders.forEach((rho: number | null, j: number): void => {
          if (p.split !== null && (rho === null || !(rho > 0 && rho < 1))) diagnostics.push(`station ${c.station} mm: quarter ${q} piece ${j} shoulder ${rho === null ? "missing (its tangent lines do not meet ahead of both ends, or its arc misses M->A)" : rho.toFixed(4)} outside (0, 1)`);
        });
      });
      if (c.kr !== null && !(c.kr < 1)) diagnostics.push(`station ${c.station} mm: turn k r ${c.kr.toFixed(4)} not below 1`);
    }
    if (diagnostics.length !== 0) return refuse(diagnostics);

    // The runs: extents and touch offsets from the guides, shoulders and splits from the pieces.
    const runs: IRun[] = [];
    const name: string = `${input.name}.${k}`;
    const mm = (label: string, values: number[]): IAutoMovieViewPart.IOutline => run(name, cuts, runs, label, values, (): number => 1, TOLERANCE);
    const ratio = (label: string, values: number[], scale: (i: number) => number): IAutoMovieViewPart.IOutline => {
      const largest: number = Math.max(...cuts.map((_: ICut, i: number): number => scale(i)));
      return run(name, cuts, runs, label, values, scale, TOLERANCE / largest);
    };
    const front: IAutoMovieViewPart.IPair = { positive: mm("+u", cuts.map((c: ICut): number => c.guides[0][0])), negative: mm("-u", cuts.map((c: ICut): number => c.guides[2][0])) };
    const side: IAutoMovieViewPart.IPair = { positive: mm("+v", cuts.map((c: ICut): number => c.guides[1][1])), negative: mm("-v", cuts.map((c: ICut): number => c.guides[3][1])) };
    const touch: IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IOutline> = [mm("touch+u", cuts.map((c: ICut): number => c.guides[0][1])), mm("touch+v", cuts.map((c: ICut): number => c.guides[1][0])), mm("touch-u", cuts.map((c: ICut): number => c.guides[2][1])), mm("touch-v", cuts.map((c: ICut): number => c.guides[3][0]))];
    const shoulders: IAutoMovieViewPart.IOutline[] = [];
    const splits: IAutoMovieViewPart.ISplit[] = [];
    for (let q: number = 0; q < 4; ++q) {
      const piece = (c: ICut): AutoMovieMeshCourse.IPiece => c.pieces[q]!;
      shoulders.push(ratio(`rho${q}a`, cuts.map((c: ICut): number => piece(c).shoulders[0]!), (i: number): number => piece(cuts[i]!).reach[0]!));

      // The split tangent unwrapped along the domain, so a run never crosses the atan2 seam.
      const angles: number[] = [];
      for (const c of cuts) {
        let a: number = piece(c).angle!;
        if (angles.length !== 0) a += 2 * Math.PI * Math.round((angles[angles.length - 1]! - a) / (2 * Math.PI));
        angles.push(a);
      }
      splits.push({
        u: mm(`split${q}.u`, cuts.map((c: ICut): number => piece(c).split![0])),
        v: mm(`split${q}.v`, cuts.map((c: ICut): number => piece(c).split![1])),
        angle: ratio(`split${q}.angle`, angles, (i: number): number => Math.max(piece(cuts[i]!).reach[0]!, piece(cuts[i]!).reach[1]!)),
        shoulder: ratio(`rho${q}b`, cuts.map((c: ICut): number => piece(c).shoulders[1]!), (i: number): number => piece(cuts[i]!).reach[1]!),
      });
    }
    const unverified: string[] = runs.filter((r: IRun): boolean => r.actual > TOLERANCE).map((r: IRun): string => `${r.name} ${r.actual.toFixed(3)} mm`);
    if (unverified.length !== 0) diagnostics.push(`runs whose actual outline still leaves a cut by more than ${TOLERANCE} mm with every offending sample pinned: ${unverified.join(", ")}`);
    const part: IAutoMovieViewPart = {
      name,
      axis: input.axis,
      stations: stations(input, cuts, runs),
      front,
      side,
      fullness: { kind: "top", shoulders: shoulders as IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IOutline>, touch, splits: splits as IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.ISplit> },
      order: input.order,
      samples: input.samples,
    };
    const loft: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(part);
    const measured: readonly Pick<ICut, "station" | "loop">[] = raw === undefined ? cuts : cuts.map((c: ICut): Pick<ICut, "station" | "loop"> => ({ station: c.station, loop: raw.get(c.station)! }));
    const layers: ILayer[] = loft.chain === null ? [] : verify(input, measured, loft.chain);
    if (loft.chain === null) diagnostics.push("no loft chain: no surface to verify");
    return { span, opened, part, runs, layers, loft, diagnostics: [...diagnostics, ...loft.diagnostics.map((d: { contract: string; detail: string }): string => `loft ${d.contract}: ${d.detail}`)] };
  }

  /**
   * The lofted surface itself against her loops: at every cut station of the
   * domain and at the midpoint between each two (cut there for this check
   * only), her loop's vertices against the chain's own ring
   * (`AutoMovieLoftChain.ring`) at their phases, read back into the course
   * frame's chart. A station the chain cannot read, or whose ring or
   * difference is not finite, keeps that as its named fault.
   */
  function verify(input: IInput, cuts: readonly Pick<ICut, "station" | "loop">[], chain: IAutoMovieLoftChain): ILayer[] {
    const between: number[] = cuts.slice(1).map((c: Pick<ICut, "station" | "loop">, i: number): number => (cuts[i]!.station + c.station) / 2);
    const extra: AutoMovieMeshCourse.ISection[] = AutoMovieMeshCourse.cut(input.mesh, between.map((s: number): AutoMovieMeshCourse.IPlane => plane(input.axis, s)), TOLERANCE);
    const rows: { station: number; between: boolean; loop: [number, number][] | null }[] = [
      ...cuts.map((c: Pick<ICut, "station" | "loop">): { station: number; between: boolean; loop: [number, number][] | null } => ({ station: c.station, between: false, loop: c.loop })),
      ...extra.map((s: AutoMovieMeshCourse.ISection): { station: number; between: boolean; loop: [number, number][] | null } => ({ station: s.plane.station, between: true, loop: s.loop })),
    ].sort((a: { station: number }, b: { station: number }): number => a.station - b.station);
    return rows.map((row: { station: number; between: boolean; loop: [number, number][] | null }): ILayer => {
      const faulted = (fault: string): ILayer => ({ station: row.station, between: row.between, max: NaN, mean: NaN, phase: NaN, signed: NaN, fault });
      if (row.loop === null) return faulted("no outer loop of her mesh holds the course point here");
      const f: ReturnType<AutoMovieViewAxis.IAxis["at"]> = input.axis.at(row.station);
      const phases: number[] = row.loop.map(([a, b]: [number, number]): number => Math.atan2(b, a));
      let ring: readonly (readonly number[])[];
      try {
        ring = AutoMovieLoftChain.ring(chain, row.station, phases);
      } catch (error: unknown) {
        return faulted(`the chain does not read here: ${error instanceof Error ? error.message : String(error)}`);
      }
      let max: number = 0;
      let sum: number = 0;
      let phase: number = 0;
      let signed: number = 0;
      for (let i: number = 0; i < row.loop.length; ++i) {
        const [a, b] = row.loop[i]!;
        const p: readonly number[] = ring[i]!;
        const d3: number[] = [p[0]! - f.origin[0]!, p[1]! - f.origin[1]!, p[2]! - f.origin[2]!];
        const r: number = Math.hypot(d3[0]! * f.u[0]! + d3[1]! * f.u[1]! + d3[2]! * f.u[2]!, d3[0]! * f.v[0]! + d3[1]! * f.v[1]! + d3[2]! * f.v[2]!);
        const d: number = Math.hypot(a, b) - r;
        if (!Number.isFinite(d)) return faulted(`the chain's ring or its difference is not finite at phase ${((phases[i]! * 180) / Math.PI).toFixed(1)} deg`);
        sum += Math.abs(d);
        if (Math.abs(d) > max) {
          max = Math.abs(d);
          phase = phases[i]!;
          signed = d;
        }
      }
      return { station: row.station, between: row.between, max, mean: sum / row.loop.length, phase, signed, fault: null };
    });
  }

  /** Reduce one run and verify it on the outline evaluator the loft reads it through, pinning the worst sample until the actual curve holds. */
  function run(part: string, cuts: readonly ICut[], runs: IRun[], name: string, values: number[], scale: (i: number) => number, tolerance: number): IAutoMovieViewPart.IOutline {
    const dense: [number, number][] = cuts.map((c: ICut, i: number): [number, number] => [c.station, values[i]!]);
    const pins: number[] = [];
    for (;;) {
      const reduced: { knots: AutoMovieMeshExtract.IKnot[]; error: number } = AutoMovieMeshExtract.reduce(dense, tolerance, pins);
      const source: IAutoMovieViewPart.IOutline = knotted(name, reduced.knots);
      const actual: AutoMovieViewOutline.IOutline | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create(source);
      if ("contract" in actual) throw new Error(`${part} ${name}: the traced knots are refused by the outline evaluator: ${actual.detail}`);
      let worst: number = -1;
      let deviation: number = 0;
      dense.forEach(([s, v]: [number, number], i: number): void => {
        const read: number | string = AutoMovieViewOutline.value(actual, s);
        const d: number = typeof read === "string" ? Infinity : Math.abs(read - v) * scale(i);
        if (d > deviation) {
          deviation = d;
          worst = i;
        }
      });
      if (deviation <= TOLERANCE || pins.includes(worst)) {
        runs.push({ name, knots: reduced.knots.map((k: AutoMovieMeshExtract.IKnot): [number, number, number] => [k.s, k.value, k.slope]), reducer: reduced.error, actual: deviation, pinned: pins.map((i: number): number => dense[i]![0]) });
        return source;
      }
      pins.push(worst);
    }
  }

  /** The layer stations: the requested ones within the cuts plus every knot. */
  function stations(input: IInput, cuts: readonly ICut[], runs: readonly IRun[]): number[] {
    const first: number = cuts[0]!.station;
    const last: number = cuts[cuts.length - 1]!.station;
    const knots: number[] = runs.flatMap((r: IRun): number[] => r.knots.map((k: [number, number, number]): number => k[0]));
    return [...new Set([...(input.stations ?? cuts.map((c: ICut): number => c.station)), ...knots])].filter((s: number): boolean => s >= first && s <= last).sort((a: number, b: number): number => a - b);
  }

  /** Each loft section on a cut station against her loop at that loop's vertices, the four-quarter sections and the chains alike. */
  function compare(cuts: readonly ICut[], loft: AutoMovieViewLoft.IResult): ILayer[] {
    const byStation: Map<number, ICut> = new Map(cuts.map((c: ICut): [number, ICut] => [c.station, c]));
    const readers: { station: number; radius: (phi: number) => number }[] = [
      ...loft.sections.map((st: AutoMovieViewLoft.IStation): { station: number; radius: (phi: number) => number } => ({ station: st.station, radius: (phi: number): number => AutoMovieViewSection.radius(st.section, phi)[0] })),
      ...loft.chains.map((st: AutoMovieViewLoft.IChainStation): { station: number; radius: (phi: number) => number } => ({ station: st.station, radius: (phi: number): number => AutoMovieViewChain.radius(st.chain, phi) })),
    ].sort((a: { station: number }, b: { station: number }): number => a.station - b.station);
    const layers: ILayer[] = [];
    for (const st of readers) {
      const c: ICut | undefined = byStation.get(st.station);
      if (c === undefined) continue;
      let max: number = 0;
      let sum: number = 0;
      let phase: number = 0;
      let signed: number = 0;
      let fault: string | null = null;
      for (const [a, b] of c.loop) {
        const phi: number = Math.atan2(b, a);
        const d: number = Math.hypot(a, b) - st.radius(phi);
        if (!Number.isFinite(d)) {
          fault = `the section's radius is not finite at phase ${((phi * 180) / Math.PI).toFixed(1)} deg`;
          break;
        }
        sum += Math.abs(d);
        if (Math.abs(d) > max) {
          max = Math.abs(d);
          phase = phi;
          signed = d;
        }
      }
      layers.push(fault === null ? { station: st.station, between: false, max, mean: sum / c.loop.length, phase, signed, fault } : { station: st.station, between: false, max: NaN, mean: NaN, phase: NaN, signed: NaN, fault });
    }
    return layers;
  }

  /** The course plane at a station. */
  function plane(axis: AutoMovieViewAxis.IAxis, station: number): AutoMovieMeshCourse.IPlane {
    const f: ReturnType<AutoMovieViewAxis.IAxis["at"]> = axis.at(station);
    return { station, origin: [f.origin[0]!, f.origin[1]!, f.origin[2]!], u: [f.u[0]!, f.u[1]!, f.u[2]!], v: [f.v[0]!, f.v[1]!, f.v[2]!] };
  }

  /** A section's reading as a cut with its guides at its own measured extremes, or null without a holding loop. */
  function cut(section: AutoMovieMeshCourse.ISection, axis: AutoMovieViewAxis.IAxis, observation?: [number, number][]): ICut | null {
    const area: number | null = section.area;
    const reach: number | null = section.reach;
    if (section.loop === null || section.reading === null || area === null || reach === null) return null;
    const loop: [number, number][] = observation ?? section.loop;
    const r: AutoMovieMeshCourse.IReading = observation === undefined ? section.reading : AutoMovieMeshCourse.read(observation, TOLERANCE);
    const g: [number, number, number, number] = QUARTER.map((d: number): number => highest(loop, d)) as [number, number, number, number];
    return {
      station: section.plane.station,
      loop,
      extents: r.extents,
      touch: r.touch,
      features: r.features,
      guides: g.map((i: number): V2 => [loop[i]![0], loop[i]![1]]) as ICut["guides"],
      gaps: [0, 0, 0, 0],
      pieces: AutoMovieMeshCourse.pieces(loop, g),
      domain: 0,
      shoulders: r.quarters.map((q: AutoMovieMeshCourse.IQuarter): number | null => q.rho) as ICut["shoulders"],
      reach: r.quarters.map((q: AutoMovieMeshCourse.IQuarter): number => q.reach) as ICut["reach"],
      normal: section.normal,
      centroid: section.centroid,
      area,
      kr: turn(axis, section.plane.station, reach),
      flags: section.flags,
      checks: section.checks,
    };
  }

  /** A point's support along `AutoMovieMeshCourse.ascend`'s direction d: 0 `+u`, 1 `-u`, 2 `+v`, 3 `-v`. */
  function support(p: readonly [number, number], d: number): number {
    return d === 0 ? p[0] : d === 1 ? -p[0] : d === 2 ? p[1] : -p[1];
  }

  /** The loop index of the measured extreme along direction d, the first in loop order. */
  function highest(loop: readonly (readonly [number, number])[], d: number): number {
    let best: number = 0;
    for (let i: number = 1; i < loop.length; ++i) if (support(loop[i]!, d) > support(loop[best]!, d)) best = i;
    return best;
  }

  /** The loop index nearest a chart point. */
  function nearest(loop: readonly (readonly [number, number])[], p: V2): number {
    let best: number = 0;
    let distance: number = Infinity;
    loop.forEach((q: readonly [number, number], i: number): void => {
      const d: number = Math.hypot(q[0] - p[0], q[1] - p[1]);
      if (d < distance) {
        distance = d;
        best = i;
      }
    });
    return best;
  }

  /**
   * `r |n'| / (n . o')` at a station from the axis's analytic jet: the plane
   * normal `n = v x u` turns at `|n'|` per unit of the axis parameter while
   * the origin advances along it at `n . o'`, so a neighbouring plane meets
   * this one at the distance `(n . o') / |n'|` from the course point
   * (first order); a section reaching `r` is crossed where the ratio reaches
   * 1. For planes normal to a circle of radius R it is `r / R`, the classic
   * `k r`. Null without a jet, Infinity where the origin does not advance.
   */
  function turn(axis: AutoMovieViewAxis.IAxis, station: number, reach: number): number | null {
    const jet: ReturnType<NonNullable<AutoMovieViewAxis.IAxis["jet"]>> | undefined = axis.jet?.(station);
    if (jet === null || jet === undefined) return null;
    const n: V3 = cross(jet.value.v, jet.value.u);
    const dn: V3 = add(cross(jet.first.v, jet.value.u), cross(jet.value.v, jet.first.u));
    const speed: number = n[0] * jet.first.origin[0]! + n[1] * jet.first.origin[1]! + n[2] * jet.first.origin[2]!;
    const rate: number = Math.hypot(...dn);
    if (rate === 0) return 0;
    return speed > 0 ? (reach * rate) / speed : Infinity;
  }

  /** Reduced knots as a source outline: each slope as the first jet in the whole outline's normalized parameter. */
  function knotted(name: string, knots: readonly AutoMovieMeshExtract.IKnot[]): IAutoMovieViewPart.IOutline {
    const span: number = knots[knots.length - 1]!.s - knots[0]!.s;
    return { knots: knots.map((k: AutoMovieMeshExtract.IKnot): IAutoMovieViewPart.IKnot => ({ site: `${name}@${k.s.toFixed(2)}`, station: k.s, value: k.value, jet: { first: k.slope * span, second: null } })) };
  }

  /** a x b. */
  function cross(a: readonly number[], b: readonly number[]): V3 {
    return [a[1]! * b[2]! - a[2]! * b[1]!, a[2]! * b[0]! - a[0]! * b[2]!, a[0]! * b[1]! - a[1]! * b[0]!];
  }

  /** a + b. */
  function add(a: V3, b: V3): V3 {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }
}
