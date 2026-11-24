import { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanCourseRuns } from "../conic/AutoMovieHumanCourseRuns";
import { AutoMovieHumanNail } from "../nail/AutoMovieHumanNail";
import { AutoMovieLoftViewFullSource, bracketedRoot } from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionNode,
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanF1,
  IAutoMovieHumanF1Nails,
  IAutoMovieHumanNail,
  IAutoMovieHumanSegmentFrame,
  IAutoMovieLoftRelief,
  IAutoMovieLoftViewFullSource,
  IAutoMovieViewPart,
} from "@automovie/interface";

/**
 * f1's twenty nails: which distal segment each digit's nail stands on, how that segment's axes read as distal and dorsal, and the
 * digit's proportions with their sources. The law is `AutoMovieHumanNail.create`, the same for every row; a row holds only what
 * anatomy gives per ray.
 *
 * What a nail consumes of its digit, and nothing else: the distal segment's frame at the pose (its origin, the last joint's centre,
 * and two of its axes), and the digit family's own lofted skin from that joint to its tip. How the digit's root is built does not
 * enter.
 *
 * Sources, with how each was read:
 *
 * - Jung JW, Kim KS, Shin JH, Kwon YJ, Hwang JH, Lee SY. Fingernail configuration. Arch Plast Surg 2015;42(6):753-760, table 1 (read
 *   in the paper's table): 150 Korean women. Nail width between the lowest points of the lateral grooves over the breadth across the
 *   distal interphalangeal joint, from the two means: thumb 13.2 / 18.8, index 11.1 / 15.4, middle 11.5 / 15.1, ring 10.7 / 14.4,
 *   little 8.8 / 12.0. Radius of the plate at its crown, by radius gauges, over that width: 9.6 / 13.2, 7.4 / 11.1, 7.3 / 11.5,
 *   6.8 / 10.7, 5.2 / 8.8. Width over length from the proximal fold's groove to the fingertip: 0.91 for every finger of the women. f1 is
 *   a woman, which selects the women's rows.
 * - Szymoniak-Lipska M, Polańska A, Jenerowicz D, Lipski A, Żaba R, Adamski Z, Dańczak-Pazdrowska A. High-frequency ultrasonography
 *   and evaporimetry in non-invasive evaluation of the nail unit. Front Med 2021;8:686470: fingernail plate thickness of women by
 *   high-frequency ultrasound, index 0.405, middle 0.39, ring 0.37, little 0.355 mm (women's mean 0.38 mm). The thumb's 0.41 mm is an
 *   ESTIMATE: the index finger's value times Bellinato's thumb-to-index ratio, 0.405 x 0.48 / 0.47 (Bellinato F et al. Arch Dermatol
 *   Res 2023;315(3):593-600, right hand, digits I to V: 0.48, 0.47, 0.47, 0.45, 0.42 mm, sexes pooled).
 * - Palomo-Lopez P et al. Diagnostics 2020;10(3):147 (read as extracted text): 50 second toes, distal matrix width 8.80 mm and nail
 *   bed length 5.68 mm. Their ratio, 1.55, stands for a lesser toe's width over length as an ESTIMATE: Palomo-Lopez measure the
 *   matrix's width over the bed's length, not Jung's plate width over the length from the proximal fold's groove to the tip, which the
 *   law's `aspect` means.
 * - Ha GU, Kim JH, Ha D-L, Lee H, Lee S-J. J Dermatol 2024;51(8):1117-1119 (read as extracted text): on axial ultrasound the plate's
 *   lateral tip stands under its apex by a share of the height from the apex to the bottom of the distal phalanx: thumb 40.1 %, middle
 *   finger 40.2 %, hallux 34.3 %, third toe 31.7 %. `wrap` (0.40 fingers, 0.343 hallux, 0.317 lesser toes) takes those shares over the
 *   digit's skin height instead of its bone height, a looser bound than Ha's (ESTIMATE): the skin's height is the larger.
 *
 * Each is one number for every digit it applies to:
 *
 * - `fold`: the proximal fold's lip stands one fingernail plate's thickness over the plate (`PLATE`, 0.38 mm, the women's mean of
 *   Szymoniak-Lipska et al., ESTIMATE as the fold's height).
 * - `lunula`: the proximal fold's arc has a radius of one plate width.
 * - A toe's width share and width over length (`TOE_WIDTH`, `TOE_ASPECT`): no source relates a toenail's width to the toe's skin
 *   breadth; the fingers' values of the women (Jung's 0.73 mean share, 0.91 aspect) carried to the toes by the open asset's
 *   toe-to-finger ratios (rule-basis.md, "Measured on an open asset"), ESTIMATE. They replace 0.65, 1.55 (Palomo-Lopez's ratio above,
 *   a definition mismatch) and 1.1. The hallux's thickness is the intact plate's of women by longitudinal
 *   ultrasound, the mean of the right and the left foot, (0.57 + 0.60) / 2 = 0.585 mm (López Ripado O et al., Clinical Anatomy
 *   2024;37(3):366-374, table 3). It replaced an inherited 1.38 mm that had no source, three fingernail plates thick, which stood
 *   the plate's free edge and its proximal fold as a ledge. Free-edge clippings (Mingorance Álvarez et al., Biology 2021, table 1:
 *   0.452 and 0.591 mm) measure the cut edge, not the plate. Lesser toes take the fingernails' mean.
 */
export namespace AutoMovieHumanF1Nails {

  // A toe's row has no crown radius, so its plate is its bed's own arc (`AutoMovieHumanNail.IProportions.radius`). None was found
  // for a lesser toe; the mean of the fingers' shares, tried as an estimate, set the plate's edges up to 1.3 mm under a back that
  // falls 0.9 mm over the same chord. For the hallux, Jung DJ 2015 (read as extracted text) gives a nail height of 3.3 mm at its tip
  // on a width of 13.8 to 16.1 mm, 0.21 to 0.24 of the width: a height at the free edge, where the law gives every plate its bed's
  // arc, and not a radius midway. Taken as one (0.7 of the width) it left the plate 1.1 mm flatter than its bed midway, its edges
  // that far over the skin (run 15-45-18). It stays as a check of the bed at the free edge.

  /** The fold's depth and the lesser toes' plate thickness, mm: the women's mean fingernail thickness (Szymoniak-Lipska et al. 2021), ESTIMATE for both uses. */
  const PLATE: number = 0.38;

  /**
   * Every toe's nail width over its skin breadth: Jung 2015's women's finger mean share, 0.73, carried to the toes by the open asset's
   * toe-to-finger ratio, which is one within its reading (rule-basis.md, "Measured on an open asset": the MPFB2 base mesh, commit
   * 9de0707f, CC0, method stated there). ESTIMATE.
   */
  const TOE_WIDTH: number = 0.73;

  /**
   * Toe nails' width over length: Jung's 0.91 for the fingers times the open asset's toe-to-finger aspect ratios (rule-basis.md,
   * "Measured on an open asset"), the lesser toes 1.48 and the hallux 1.14. ESTIMATE.
   */
  const TOE_ASPECT: { lesser: number; hallux: number } = { lesser: 1.48, hallux: 1.14 };

  const finger = (digit: string, segment: string, width: number, radius: number, thickness: number): IAutoMovieHumanF1Nails.IRow => ({
    digit,
    segment,
    hand: true,
    proportions: { width, aspect: 0.91, radius, thickness, fold: PLATE, lunula: 1, wrap: 0.4 },
  });
  const toe = (digit: string, segment: string, aspect: number, radius: number | null, thickness: number, wrap: number): IAutoMovieHumanF1Nails.IRow => ({
    digit,
    segment,
    hand: false,
    proportions: { width: TOE_WIDTH, aspect, radius, thickness, fold: PLATE, lunula: 1, wrap },
  });

  /** The rows, one per digit of a side. */
  export const ROWS: readonly IAutoMovieHumanF1Nails.IRow[] = [
    finger("finger.thumb", "thumb.distal", 13.2 / 18.8, 9.6 / 13.2, 0.41),
    finger("finger.index", "index.distal", 11.1 / 15.4, 7.4 / 11.1, 0.405),
    finger("finger.middle", "middle.distal", 11.5 / 15.1, 7.3 / 11.5, 0.39),
    finger("finger.ring", "ring.distal", 10.7 / 14.4, 6.8 / 10.7, 0.37),
    finger("finger.pinky", "pinky.distal", 8.8 / 12.0, 5.2 / 8.8, 0.355),
    toe("toe.big", "bigtoe.distal", TOE_ASPECT.hallux, null, (0.57 + 0.6) / 2, 0.343),
    toe("toe.index", "indextoe.distal", TOE_ASPECT.lesser, null, PLATE, 0.317),
    toe("toe.middle", "middletoe.distal", TOE_ASPECT.lesser, null, PLATE, 0.317),
    toe("toe.ring", "ringtoe.distal", TOE_ASPECT.lesser, null, PLATE, 0.317),
    toe("toe.little", "littletoe.distal", TOE_ASPECT.lesser, null, PLATE, 0.317),
  ];

  /** The chord of the merge's blend either side of the fold's curve, mm: the fold's rounding, a quarter of the bed's ramp. */
  export const CHORD_MM: number = 0.23;

  /** The skin net's chart station step in mm, phase count, and distance in physical arclength before the last joint. */
  const SKIN: { station: number; phases: number; before: number } = { station: 0.25, phases: 360, before: 3 };

  /** The plate's and the bed's names for a digit. */
  export function names(digit: string): { plate: string; bed: string } {
    return { plate: "nail." + digit, bed: "nailbed." + digit };
  }

  /**
   * Fit a standalone digit with its own original source on the probe's station grid.
   *
   * @param family The digit's family at the pose, without its bed.
   * @param frames Every segment's frame at the pose.
   * @param physicalStation The native digit's chart station to placed course arclength, both in mm.
   */
  export function create(
    family: IAutoMovieHumanConicLoft.IFamily,
    frames: ReadonlyMap<string, IAutoMovieHumanSegmentFrame>,
    physicalStation?: IAutoMovieHumanF1.IDigit["physicalStation"],
  ): IAutoMovieHumanF1Nails.IMade {
    const from: number = family.knots[0]!;
    const to: number = family.knots.at(-1)!;
    const count: number = Math.ceil(to - from) + 1;
    const stations: number[] = Array.from({ length: count }, (_: unknown, i: number): number =>
      i === count - 1 ? to : from + ((to - from) * i) / (count - 1));
    return createFrom({ family, physicalStation }, frames,
      AutoMovieHumanConicLoft.part({ ...family, turn: undefined }, stations));
  }

  /**
   * Fit the nail on the positioned digit's original source before adding its relief.
   *
   * @param digit The positioned digit and its material-to-physical station map.
   * @param frames Every segment's frame at the pose.
   * @param original The digit's original direct view part before adding the nail.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The original view reader owns the physical cap and samples for the existing nail law.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Reads one digit, one frame, and one immutable source.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Source bounds and the physical station map govern the aperture without treating a tessellation as a new source.
   * @evidence contracts/development/implementation.md#efficient-algorithms Prepares one scalar reader and samples the existing bounded chart grid.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The emitted digit can reuse the exact axis and original scalar fields carried by the fit.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The result retains the immutable original and the existing nail record. The temporary fit grid belongs to this call.
   * @evidence contracts/development/common.md#meaningful-documentation States the source scope, station map, and frames.
   */
  export function createFrom(
    { family, physicalStation }: Pick<IAutoMovieHumanF1.IDigit, "family" | "physicalStation">,
    frames: ReadonlyMap<string, IAutoMovieHumanSegmentFrame>,
    original: IAutoMovieViewPart,
  ): IAutoMovieHumanF1Nails.IMade {
    if (original.name !== family.name)
      throw new Error("f1's " + family.name + " nail received " + original.name + "'s source");
    const surface: IAutoMovieLoftViewFullSource.IReader = AutoMovieLoftViewFullSource.create(original);
    const [from, end]: readonly [number, number] = surface.domain;
    const cap: IAutoMovieHumanConicLoft.ITip | null = family.tips?.[1] ?? null;
    if (cap !== null && (end !== cap.tip || (original.pole !== "top" && original.pole !== "both")))
      throw new Error("f1's " + family.name + " nail source does not carry its distal pole");
    const row: IAutoMovieHumanF1Nails.IRow | undefined = ROWS.find((r: IAutoMovieHumanF1Nails.IRow): boolean => r.digit === family.name);
    if (row === undefined) throw new Error("f1 has no nail row for " + family.name);
    const frame: IAutoMovieHumanSegmentFrame | undefined = frames.get(row.segment);
    if (frame === undefined) throw new Error("f1 has no segment " + row.segment);
    const flip = (a: AutoMovieVector3Tuple): AutoMovieVector3Tuple => [-a[0], -a[1], -a[2]];
    const segment: IAutoMovieHumanNail.IFrame = row.hand ? { origin: frame.origin, distal: flip(frame.axes[1]), dorsal: flip(frame.axes[0]) } : { origin: frame.origin, distal: frame.axes[0], dorsal: frame.axes[1] };
    const { plate, bed }: { plate: string; bed: string } = names(family.name);

    // Open the skin chart three physical mm before the last joint's rounded course station, or at the first admitted ring.
    // The native course reads these same planes in material stations. Invert its declared map inside the digit's chart.
    if (family.native !== undefined && physicalStation === undefined)
      throw new Error("f1's " + family.name + " nail needs the native digit's course map");
    const joint: number = AutoMovieHumanCourseRuns.joints(family.centres, family.halves).at(-2)!;
    const opening: number = joint - SKIN.before;
    let first: number = Math.max(from, opening);
    if (physicalStation !== undefined && physicalStation !== AutoMovieHumanCourseRuns.identity) {
      if (opening <= physicalStation(from)) first = from;
      else {
        if (!(opening < physicalStation(end)))
          throw new Error("f1's " + family.name + " nail aperture is past the skin's tip");
        first = bracketedRoot((station: number): number => physicalStation(station) - opening, from, end, 1e-9);
      }
    }
    if (!(first < end)) throw new Error("f1's " + family.name + " nail aperture is past the skin's tip");

    // The bilinear net keeps its uniform chart pitch. In the ordinary arclength chart a 0.25 mm chord on a 5 mm radius
    // stands about 2 micrometres off the skin. Native length transport can change the net's physical spacing.
    const rows: number = Math.ceil((end - first) / SKIN.station) + 1;
    const pitch: number = (end - first) / (rows - 1);
    const ring = (station: number): AutoMovieVector3Tuple[] =>
      Array.from({ length: SKIN.phases }, (_: unknown, j: number): AutoMovieVector3Tuple =>
        surface.point(station, (2 * Math.PI * j) / SKIN.phases));
    const net: AutoMovieVector3Tuple[][] = Array.from({ length: rows }, (_: unknown, i: number): AutoMovieVector3Tuple[] =>
      ring(i === rows - 1 ? end : first + pitch * i));

    // Keep the fitted chart itself. The bed may also use the original owning
    // skin between the actual first ring and this chart's first ring.
    const leading: number = Math.ceil((first - from) / SKIN.station);
    const leadPitch: number = leading === 0 ? 0 : (first - from) / leading;
    const proximal: NonNullable<IAutoMovieHumanNail.ISkin["proximal"]> = Array.from({ length: leading }, (_, i: number) => {
      const station: number = from + leadPitch * i;
      return { station, ring: ring(station) };
    });
    const point = (station: number, phase: number): readonly number[] => {
      const behind: boolean = leading !== 0 && station < first;
      const rowCount: number = behind ? leading + 1 : rows;
      const a: number = Math.max(0, Math.min(rowCount - 1, behind ? (station - from) / leadPitch : (station - first) / pitch));
      const i: number = Math.min(rowCount - 2, Math.floor(a));
      const turn: number = phase / (2 * Math.PI);
      const b: number = (turn - Math.floor(turn)) * SKIN.phases;
      const j: number = Math.floor(b) % SKIN.phases;
      const [s, t]: [number, number] = [a - i, b - Math.floor(b)];
      const at: readonly AutoMovieVector3Tuple[] = behind ? proximal[i]!.ring : net[i]!;
      const next: readonly AutoMovieVector3Tuple[] = behind
        ? i + 1 === leading ? net[0]! : proximal[i + 1]!.ring
        : net[i + 1]!;
      const [p, q, r, w]: number[][] = [at[j]!, at[(j + 1) % SKIN.phases]!, next[j]!, next[(j + 1) % SKIN.phases]!];
      return [0, 1, 2].map((k: number): number => (1 - s) * ((1 - t) * p![k]! + t * q![k]!) + s * ((1 - t) * r![k]! + t * w![k]!));
    };
    return { row, original, nail: AutoMovieHumanNail.create(plate, bed, segment, { point, first, tip: end, grid: net, proximal }, row.proportions, 3 * CHORD_MM, TURN) };
  }
  /**
   * How far a digit's nail may turn about its long axis from its distal segment's frame, rad: the spread of the prior the skin's
   * levelling is weighed against (`AutoMovieHumanNail.create`).
   *
   * A nail's roll is the distal bone's, and the skin tells it only as far as the digit's back is flat across. The spread is the root
   * mean square of the fingers' normal axial rotations measured by Clarke et al. 2012 (Orthopaedic Proceedings 94-B SUPP III:85,
   * abstract only read), 0.183 rad (10.5 degrees). The toes take the same value as an ESTIMATE: no toe's axial rotation was found
   * published. It replaces 0.145 rad, the root mean square of seven tilts read on f1's reference (F1-FITTED). It is a spread only: no
   * digit's own tilt places that digit's nail. A digit whose back is round keeps its segment's frame, which is known to miss by the
   * digit's own axial turn until the frames carry it.
   */
  const TURN: number = 0.183;

  /**
   * The nails of one side's digits, each from its own digit and the frames, made once.
   *
   * @param digits The placed digits with their course maps, or ordinary placed families, without their beds.
   * @param frames Every segment's frame at the pose.
   */
  export function all(
    digits: readonly (IAutoMovieHumanConicLoft.IFamily | IAutoMovieHumanF1.IDigit)[],
    frames: ReadonlyMap<string, IAutoMovieHumanSegmentFrame>,
  ): IAutoMovieHumanF1Nails.IMade[] {
    return digits.map((digit): IAutoMovieHumanF1Nails.IMade =>
      "family" in digit
        ? create(digit.family, frames, digit.physicalStation)
        : create(digit, frames),
    );
  }

  /** Insert only display samples inside existing intervals, preserving endpoints exactly. */
  function refined(
    stations: readonly number[],
    step: (from: number, to: number) => number,
  ): number[] {
    return stations.flatMap((to: number, i: number): number[] => {
      if (i === 0) return [to];
      const from: number = stations[i - 1]!;
      const cuts: number = Math.max(1, Math.ceil((to - from) / step(from, to)));
      return Array.from({ length: cuts }, (_: unknown, k: number): number =>
        k + 1 === cuts ? to : from + ((to - from) * (k + 1)) / cuts);
    });
  }

  /**
   * Add reliefs and their display rows to the existing positioned digit.
   *
   * The direct view field reads its own outline knots. Its axial and phase display rows carry no shape authority.
   * Original cap rows stay in the list and additional rows split their intervals where a relief needs them.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Only the sampling lists and reliefs change on the original direct view part.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Splits existing station intervals at the finest intersecting relief's row pitch and delegates angular turn sampling.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the original axis, scalar controls, closure and native material authority. Adds no replacement source or tolerance.
   * @evidence contracts/development/implementation.md#efficient-algorithms One pass over original station intervals and bounded relief windows before the existing angular sampler.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The source that drove the fit retains every generating definition at emission.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Borrows immutable source data and allocates only feature and display lists.
   * @evidence contracts/development/common.md#meaningful-documentation Names the two display clocks and their independence from the original cap and scalar controls.
   */
  export function addReliefs(
    original: IAutoMovieViewPart,
    family: IAutoMovieHumanConicLoft.IFamily,
    added: readonly IAutoMovieLoftRelief[],
  ): IAutoMovieViewPart {
    const reliefs: IAutoMovieLoftRelief[] = [...(original.reliefs ?? []), ...added];
    const stations: number[] = refined(original.stations, (from: number, to: number): number =>
      Math.min(Infinity, ...added.filter((relief: IAutoMovieLoftRelief): boolean =>
        relief.stations[0] < to && relief.stations[1] > from).map((relief: IAutoMovieLoftRelief): number =>
        (relief.stations[1] - relief.stations[0]) / (relief.rows - 3))));
    const sampling: IAutoMovieHumanConicLoft.IFamily = { ...family, reliefs };
    const samples: number = original.phases?.length ??
      Math.max(original.samples, AutoMovieHumanConicLoft.phaseCount(sampling, 0));
    const source: IAutoMovieViewPart = { ...original, stations, reliefs, samples };
    const [bottom, top]: [IAutoMovieHumanConicLoft.ITip | null, IAutoMovieHumanConicLoft.ITip | null] = family.tips ?? [null, null];
    const wall: number[] = stations.filter((s: number): boolean =>
      (bottom === null || bottom.from <= s) && (top === null || s <= top.from));
    return AutoMovieHumanConicLoft.sampled(sampling, source, wall);
  }

  /** Columns of a nail's join round its curve: the curve is some 40 mm long, so 96 columns stand 0.4 mm apart; the join takes more where the bed's cell is finer (`attach`). */
  export const COLUMNS: number = 96;

  /** The length of a nail's fold curve the join's columns are counted on, mm: the plate's outline round the folds and the free edge. */
  const CURVE_MM: number = 40;

  /**
   * Legacy family adapter for callers that have yet to prepare their original view source.
   *
   * @param family The digit's family at the pose.
   * @param made Its nail.
   * @param close Whether the family is lofted for a close-up of the nail, with the free edge's strip; absent, the figure's level.
   */
  export function bedded(family: IAutoMovieHumanConicLoft.IFamily, made: IAutoMovieHumanF1Nails.IMade, close: boolean = false): IAutoMovieHumanConicLoft.IFamily {
    // The level. At the figure's cameras a hand 190 mm long fills 900 px, 0.21 mm a pixel, and a foot 0.28: the fold's wall, 1.84 mm,
    // reads and its net's cell is the lofting rule's quarter of its narrowest transition (AutoMovieHumanNail), while the free edge's step, one thickness long, is two
    // pixels and cannot be told from the bed's slope. So the figure lofts the bed alone; the strip, whose 0.12 mm rows ask the cap
    // for 100 to 160 rings, is the close-up's.
    const nets: IAutoMovieHumanNail.INail["bed"][] = close ? [made.nail.bed, made.nail.strip] : [made.nail.bed];
    const reliefs: IAutoMovieHumanConicLoft.IFamily["reliefs"] = [...(family.reliefs ?? []), ...nets];
    const end: IAutoMovieHumanConicLoft.ITip | null = family.tips?.[1] ?? null;
    if (end === null) return { ...family, reliefs };

    // A net shows only what the rings sample, and a digit's layers are cut to a net's rows only along its wall: inside the cap the
    // rings are the cap's own, `rings` of them at equal steps of the root of the distance to the pole, so a distance `d` before the
    // pole of a cap `H` long they stand `2 sqrt(H d) / (rings + 1)` apart. The cap takes as many as keep them within each nail net's
    // row spacing at that net's farthest station inside the cap, where they stand widest.
    const length: number = end.tip - end.from;
    const asked: number = Math.max(
      end.rings ?? 0,
      ...nets.map((relief: IAutoMovieHumanNail.INail["bed"]): number => {
        const far: number = Math.min(length, end.tip - relief.stations[0]);
        return far > 0 ? Math.ceil((2 * Math.sqrt(length * far) * (relief.rows - 3)) / (relief.stations[1] - relief.stations[0])) - 1 : 0;
      }),
    );
    return { ...family, reliefs, tips: [family.tips?.[0] ?? null, asked > 0 ? { ...end, rings: asked } : end] };
  }

  /**
   * The plates merged onto a tree that holds their digits, both sides: each plate, and its reflection in the median plane, is a view
   * part of its own lofted at the bed's cell, joined to its digit's face by the traced merge with curvature widths.
   *
   * @param root The tree, whose faces include every bedded digit and its twin under the names given.
   * @param sources The tree's sources; each plate's is added.
   * @param nails The nails of one side.
   * @param twin The name of a family's reflection.
   */
  export function attach(root: IAutoMovieConstructionNode, sources: Map<string, IAutoMovieViewPart>, nails: readonly IAutoMovieHumanF1Nails.IMade[], twin: (name: string) => string): IAutoMovieConstructionNode {
    let node: IAutoMovieConstructionNode = root;
    for (const made of nails)
      for (const side of [1, -1]) {
        const plate: IAutoMovieHumanConicLoft.IFamily = side > 0 ? made.nail.plate : AutoMovieHumanConicLoft.mirror(made.nail.plate, twin(made.nail.plate.name));
        const cell: number = (made.nail.bed.stations[1] - made.nail.bed.stations[0]) / (made.nail.bed.rows - 3);
        const last: number = plate.knots[plate.knots.length - 1]!;
        const count: number = Math.ceil(last / cell) + 1;
        sources.set(plate.name, AutoMovieHumanConicLoft.part(plate, Array.from({ length: count }, (_: unknown, i: number): number => (i === count - 1 ? last : (last * i) / (count - 1)))));
        node = {
          type: "join",
          kind: "merge",
          name: "fold." + plate.name,
          host: node,
          part: { type: "source", name: plate.name, source: plate.name },
          seed: { type: "search", partFace: plate.name, hostFace: side > 0 ? made.row.digit : twin(made.row.digit), phase: 0, from: 0, to: 0.7 },
          parameter: { type: "arc" },
          partWidth: { type: "curvature", share: 0.5, cap: CHORD_MM / 1000, end: null },
          hostWidth: { type: "curvature", share: 0.5, cap: CHORD_MM / 1000, end: null },
          continuity: "G2",
          // At least one column a bed's cell along the curve, so the fold's corners are traced as finely as the bed draws them.
          count: Math.max(COLUMNS, 4 * Math.ceil(CURVE_MM / (4 * cell))),
          rows: 4,
          tolerance: 1e-12,
          grazing: 0.04,
        };
      }
    return node;
  }
}
