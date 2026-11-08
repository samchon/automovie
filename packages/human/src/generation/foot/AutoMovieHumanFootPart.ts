import type { AutoMovieSolidVector, IAutoMovieViewPart } from "@automovie/engine";
import { AutoMovieHumanConstructionView } from "../limb/AutoMovieHumanConstructionView";
import { AutoMovieHumanSiteViewPart } from "../limb/AutoMovieHumanSiteViewPart";
import { AutoMovieHumanSiteControls } from "../limb/AutoMovieHumanSiteControls";
import type { AutoMovieHumanFootConnection } from "./AutoMovieHumanFootConnection";

type Vec3 = AutoMovieSolidVector.Vec3;

/**
 * One foot's body as a part lofted from its views (#3049): straight along the
 * foot's long axis on the floor, its sections the vertical planes square to
 * that axis, closed by a G2 dome at the heel (pternion) and at the forefoot's
 * distal cap past the metatarsal heads, which the toes merge onto and whose
 * skin between them is the webs' blends.
 *
 * Views. The top view (the sole's outline) gives each site's lateral and
 * medial edges; the side view the dorsum above and the plantar edge below.
 * The axis stands at the caller's height over the floor (a height inside every
 * site's box), so a site's lower edge is minus that height where the sole
 * bears on the floor and the sole stands on the floor by construction; the
 * medial arch is the plantar-medial quarter's own shoulder, a sourced
 * departure, never a lifted edge.
 *
 * Sites: the caller's laws by name at their shares of the foot's length from
 * pternion (the heel's breadth, the ankle's front under the malleoli, the
 * instep, the ball at the metatarsal heads with the foot's breadth, the
 * forefoot's end), each with its box and its owner (a tape where one is an
 * input, a sourced shoulder elsewhere). The shank's walk merges onto this
 * part from above (the leg is the part, the foot the host).
 */
export namespace AutoMovieHumanFootPart {
  /** One site's law, calibration mm. */
  export interface ISiteLaw {
    /** Share of the foot's length from pternion, in `(0, 1)`. */
    share: number;

    /** The box's edges from the axis: up (dorsal), lateral, down (plantar, negative), medial (negative), on either foot. */
    edges: [number, number, number, number];

    /** A tape solved on the box, or a sourced shoulder. */
    fullness: AutoMovieHumanSiteViewPart.ISite["fullness"];

    /** Optional plantar tangent/curvature in the whole source's normalized parameter; units are calibration mm. */
    plantarJet?: IAutoMovieViewPart.IKnot["jet"];
  }

  /** What a foot is built from. */
  export interface IInput {
    /** Chain name, `foot.left` or `foot.right`. */
    name: string;

    /** Pternion's plan point on the floor, `[x, 0, z]`, calibration mm. */
    heel: Vec3;

    /** The foot's long axis on the floor, unit and level (its y zero), from the heel toward the toes. */
    along: Vec3;

    /** The axis's height over the floor, mm. */
    height: number;

    /** Foot length, mm: pternion to the longest toe's tip. */
    length: number;

    /** Where the heel's dome closes (a small share behind the first site) and where the forefoot's does, as shares of the length. */
    poles: [number, number];

    /** The sites' laws, by rising share. */
    sites: { site: string; law: ISiteLaw }[];

    /** Optional closed-span plantar bound, in calibration mm relative to the fixed-height axis. */
    plantarRange?: IAutoMovieViewPart.IOutline["range"];

    /** Public host-plus-toe metatarsal breadth and its foot-along interval; the fifth endpoint remains a cascade-transfer convention. */
    metatarsal?: {
      /** Fifth-to-first skin region along the foot axis, calibration mm. */
      span: [number, number];

      /** Public across support-plane distance, calibration mm. */
      breadth: number;

      /** Bare host's independent regional across support maxima after the common group scale, calibration mm; not one cut or the whole group's extrema. */
      supports: { lateral: number; medial: number };

      /** Calibration mm per retained dimensionless across observation. */
      transverseScale: number;
    };

    /** Whether the foot is the left (its lateral edge toward +Z) or the right. */
    side: "left" | "right";

    /** Control points and ring phases of every section, a multiple of 4. */
    order: number;

    /** Widest spacing between layers, mm. */
    gap: number;

    /** Authored dorsal outline only; its independent knots never resample either across outline. */
    dorsal?: IAutoMovieViewPart.IOutline;

    /** Actual complete leg owner, its original frame and available jets at the authored sagittal connection. */
    ankle?: AutoMovieHumanFootConnection.IAnkle;
  }

  /**
   * Build and loft the foot.
   *
   * @param input The heel, the axis, the length, the poles and the sites.
   * @returns The part, its loft and the diagnostics.
   */
  export function create(input: IInput): AutoMovieHumanSiteViewPart.IResult {
    return AutoMovieHumanSiteViewPart.loft(define(input));
  }

  /**
   * Prepare the final original part; preserve every unmodified edge function when dorsal-only stations are added.
   * The optional base must be the unmodified preparation of this same input.
   *
   * @evidence contracts/common.md#principled-implementation Replaces only front.positive on the original prepared part; emission stations union the old layers and dorsal knots without resampling any other original.
   * @evidence contracts/common.md#clear-and-simple-design One final part and its matching canonical-axis view serve parent readings, metrics and lofting.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not add global sites, rerun lateral/medial interpolation or use a mesh to infer the replacement.
   * @evidence contracts/common.md#meaningful-documentation States same-input base ownership and the distinction between edge source knots and emission stations.
   * @evidence contracts/performance.md#efficient-algorithms Performs one shared definition preparation unless supplied, then O(n log n) finite station union and view unit conversion.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the same-input base when the dorsal author already needed it; the returned final preparation owns subsequent source reads and loft.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns call-owned final records and borrows unchanged edge objects from the same original definition; no persistent cache exists.
   */
  export function define(input: IInput, base?: AutoMovieHumanSiteViewPart.IDefinition): AutoMovieHumanSiteViewPart.IDefinition {
    const declaration: AutoMovieHumanSiteViewPart.IInput = source(input);
    const prepared: AutoMovieHumanSiteViewPart.IDefinition = base ?? AutoMovieHumanSiteViewPart.define(declaration);
    if (prepared.part === null || input.dorsal === undefined) return prepared;
    const part: IAutoMovieViewPart = { ...prepared.part, front: { ...prepared.part.front, positive: input.dorsal }, stations: [...new Set([...prepared.part.stations, ...input.dorsal.knots.map((knot: IAutoMovieViewPart.IKnot): number => knot.station)])].sort((a: number, b: number): number => a - b) };
    return { part, view: AutoMovieHumanConstructionView.of(part, declaration.axis), diagnostics: prepared.diagnostics };
  }

  /**
   * Author the shared local scalar/section/frame declaration directly.
   * Dorsal replacement preserves the original side/plantar/fullness objects
   * and their parameter; station union affects only observation density.
   * No completed foot or raw surface supplies the toe boundary.
   */
  export function controls(input: IInput, base?: AutoMovieHumanSiteControls.IOutput): AutoMovieHumanSiteControls.IOutput {
    const declaration: AutoMovieHumanSiteViewPart.IInput = source(input);
    const prepared: AutoMovieHumanSiteControls.IOutput = base ?? AutoMovieHumanSiteControls.prepare(declaration);
    const original: AutoMovieHumanSiteControls.IControls | null = prepared.controls;
    if (original === null || input.dorsal === undefined) return prepared;
    const scalars: typeof original.scalars = {
      ...original.scalars,
      front: { ...original.scalars.front, positive: input.dorsal },
      stations: [...new Set([...original.scalars.stations,
        ...input.dorsal.knots.map((knot: IAutoMovieViewPart.IKnot): number => knot.station)])]
        .sort((a: number, b: number): number => a - b),
    };
    return { controls: { input: declaration, axis: original.axis, scalars,
      field: AutoMovieHumanSiteControls.native(input.name, scalars) },
      diagnostics: prepared.diagnostics };
  }

  /**
   * The base site declaration. define owns the final optional dorsal replacement
   * while preserving these complete independent side and plantar sources.
   *
   * @evidence contracts/common.md#principled-implementation Converts the actual foot's fixed floor frame, named edge laws, jets, ranges and closing planes into its single production source declaration.
   * @evidence contracts/common.md#clear-and-simple-design Separates the existing declaration from realization so input dimensions can read the same source.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not sample a section, rebuild a curve from skin or invent an observational geometry path.
   * @evidence contracts/common.md#meaningful-documentation States the shared declaration boundary and the left/right chart conversion.
   * @evidence contracts/performance.md#efficient-algorithms Copies n sites in O(n) time and space without solving fullness or lofting.
   * @evidence contracts/performance.md#reuse-equivalent-work Construction and source-dimension queries consume this identical owner.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns returned arrays; no cache, sampler or realized surface is retained.
   */
  export function source(input: IInput): AutoMovieHumanSiteViewPart.IInput {
    // The chart: u up and v = up x along, so the stations advance along
    // v x u = along (`AutoMovieViewAxis.straight`). With the toes
    // forward v points to the body's right: medial on the left foot, lateral
    // on the right. The laws give the left foot's edges as up, lateral, down,
    // medial, so the left foot's side edges swap into the chart and the
    // right's, its reflection (J6), stand as given.
    const up: Vec3 = [0, 1, 0];
    const v: Vec3 = [input.along[2], 0, -input.along[0]];
    const origin: Vec3 = [input.heel[0], input.height, input.heel[2]];
    const swap: (e: [number, number, number, number]) => [number, number, number, number] = (e: [number, number, number, number]): [number, number, number, number] => (input.side === "right" ? e : [e[0], -e[3], e[2], -e[1]]);
    return {
      name: input.name,
      axis: { type: "straight", origin: AutoMovieHumanConstructionView.point(origin), u: AutoMovieHumanConstructionView.direction(up), v: AutoMovieHumanConstructionView.direction(v) },
      sites: input.sites.map((s: { site: string; law: ISiteLaw }): AutoMovieHumanSiteViewPart.ISite => ({
        site: s.site,
        station: s.law.share * input.length,
        edges: swap(s.law.edges),
        fullness: s.law.fullness,
        ...(s.law.plantarJet === undefined ? {} : { jets: [undefined, undefined, s.law.plantarJet, undefined] as NonNullable<AutoMovieHumanSiteViewPart.ISite["jets"]> }),
      })),
      ...(input.plantarRange === undefined ? {} : { ranges: [undefined, undefined, input.plantarRange, undefined] as NonNullable<AutoMovieHumanSiteViewPart.IInput["ranges"]> }),
      pole: { end: "both", bottom: input.poles[0] * input.length, top: input.poles[1] * input.length },
      order: input.order,
      samples: input.order,
      gap: input.gap,
    };
  }
}
