import { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanNail } from "../nail/AutoMovieHumanNail";
import { AutoMovieLoftChain } from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionNode,
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanF1Nails,
  IAutoMovieHumanNail,
  IAutoMovieHumanSegmentFrame,
  IAutoMovieViewLoft,
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
 * - Bellinato F et al. Arch Dermatol Res 2023;315(3):593-600 (read as extracted text): fingernail plate thickness by ultrasound,
 *   right hand, digits I to V: 0.48, 0.47, 0.47, 0.45, 0.42 mm.
 * - Palomo-Lopez P et al. Diagnostics 2020;10(3):147 (read as extracted text): 50 second toes, distal matrix width 8.80 mm and nail
 *   bed length 5.68 mm, so a lesser toe's width over its length is 1.55.
 * - Ha GU, Kim JH, Ha D-L, Lee H, Lee S-J. J Dermatol 2024;51(8):1117-1119 (read as extracted text): on axial ultrasound the plate's each is one number for every digit it applies to:
 *
 * - `fold`: the proximal fold's lip stands one fingernail plate's thickness over the plate (0.46 mm, the mean of Bellinato's five).
 * - `lunula`: the proximal fold's arc has a radius of one plate width.
 * - A toe's width share: no source relates a toenail's width to the toe's skin breadth; the fingers' mean share of the women, 0.73,
 *   narrowed by the ratio of the hallux's published nail width (13.9 mm, women, Jung DJ et al. Arch Plast Surg 2015;42(2):207-213) to
 *   the thumb's (13.2 mm) over the ratio of their breadths is not computable without a published hallux breadth, so the toes take
 *   0.65, stated as an estimate.
 * - The hallux's width over length, 1.1, and the toes' plate thickness: a hallux plate of 1.38 mm is cited for women without its
 *   primary source; the lesser toes take the fingernails' mean. The 1.38 mm is the figure widely quoted for a woman's great toenail
 *   and attributed to Hamilton, Terada and Mestler, J Gerontol 1955, which was not read: it is an estimate here. Its check is the
 *   free edge's step on a median cut, which on f1's reference is about 0.7 mm, so it may be about twice too thick.
 */
export namespace AutoMovieHumanF1Nails {

  // A toe's row has no crown radius, so its plate is its bed's own arc (`AutoMovieHumanNail.IProportions.radius`). None was found
  // for a lesser toe; the mean of the fingers' shares, tried as an estimate, set the plate's edges up to 1.3 mm under a back that
  // falls 0.9 mm over the same chord. For the hallux, Jung DJ 2015 (read as extracted text) gives a nail height of 3.3 mm at its tip
  // on a width of 13.8 to 16.1 mm, 0.21 to 0.24 of the width: a height at the free edge, where the law gives every plate its bed's
  // arc, and not a radius midway. Taken as one (0.7 of the width) it left the plate 1.1 mm flatter than its bed midway, its edges
  // that far over the skin (run 15-45-18). It stays as a check of the bed at the free edge.

  /** The fold's depth and the fingernails' mean thickness, mm (Bellinato 2023). */
  const PLATE: number = 0.46;

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
    proportions: { width: 0.65, aspect, radius, thickness, fold: PLATE, lunula: 1, wrap },
  });

  /** The rows, one per digit of a side. */
  export const ROWS: readonly IAutoMovieHumanF1Nails.IRow[] = [
    finger("finger.thumb", "thumb.distal", 13.2 / 18.8, 9.6 / 13.2, 0.48),
    finger("finger.index", "index.distal", 11.1 / 15.4, 7.4 / 11.1, 0.47),
    finger("finger.middle", "middle.distal", 11.5 / 15.1, 7.3 / 11.5, 0.47),
    finger("finger.ring", "ring.distal", 10.7 / 14.4, 6.8 / 10.7, 0.45),
    finger("finger.pinky", "pinky.distal", 8.8 / 12.0, 5.2 / 8.8, 0.42),
    toe("toe.big", "bigtoe.distal", 1.1, null, 1.38, 0.343),
    toe("toe.index", "indextoe.distal", 8.8 / 5.68, null, PLATE, 0.317),
    toe("toe.middle", "middletoe.distal", 8.8 / 5.68, null, PLATE, 0.317),
    toe("toe.ring", "ringtoe.distal", 8.8 / 5.68, null, PLATE, 0.317),
    toe("toe.little", "littletoe.distal", 8.8 / 5.68, null, PLATE, 0.317),
  ];

  /** The chord of the merge's blend either side of the fold's curve, mm: the fold's rounding, a quarter of the bed's ramp. */
  export const CHORD_MM: number = 0.23;

  /** The net a digit's skin is read on for its nail: its station step, mm, its phases round, and how far before the last joint it starts, mm. */
  const SKIN: { station: number; phases: number; before: number } = { station: 0.25, phases: 360, before: 3 };

  /** The plate's and the bed's names for a digit. */
  export function names(digit: string): { plate: string; bed: string } {
    return { plate: "nail." + digit, bed: "nailbed." + digit };
  }

  /**
   * One digit's nail from its placed family and the frames at the pose.
   *
   * @param family The digit's family at the pose, without its bed.
   * @param frames Every segment's frame at the pose.
   */
  export function create(family: IAutoMovieHumanConicLoft.IFamily, frames: ReadonlyMap<string, IAutoMovieHumanSegmentFrame>): IAutoMovieHumanF1Nails.IMade {
    const row: IAutoMovieHumanF1Nails.IRow | undefined = ROWS.find((r: IAutoMovieHumanF1Nails.IRow): boolean => r.digit === family.name);
    if (row === undefined) throw new Error("f1 has no nail row for " + family.name);
    const frame: IAutoMovieHumanSegmentFrame | undefined = frames.get(row.segment);
    if (frame === undefined) throw new Error("f1 has no segment " + row.segment);
    const flip = (a: AutoMovieVector3Tuple): AutoMovieVector3Tuple => [-a[0], -a[1], -a[2]];
    const segment: IAutoMovieHumanNail.IFrame = row.hand ? { origin: frame.origin, distal: flip(frame.axes[1]), dorsal: flip(frame.axes[0]) } : { origin: frame.origin, distal: frame.axes[0], dorsal: frame.axes[1] };
    const from: number = family.knots[0]!;
    const to: number = family.knots.at(-1)!;
    const end: number = family.tips?.[1]?.tip ?? to;
    const count: number = Math.ceil(to - from) + 1;
    const loft: IAutoMovieViewLoft.IResult = AutoMovieHumanConicLoft.create(family, Array.from({ length: count }, (_: unknown, i: number): number => from + ((to - from) * i) / (count - 1)));
    if (loft.chain === null) throw new Error("f1's " + family.name + " does not loft for its nail");
    const chain: NonNullable<IAutoMovieViewLoft.IResult["chain"]> = loft.chain;
    const { plate, bed }: { plate: string; bed: string } = names(family.name);

    // The skin from a little before the last joint to the tip, read once on a net `SKIN.station` mm by `2 pi / SKIN.phases` rad and
    // bilinear between its points: the law asks for some hundred thousand points, and on a digit, whose skin turns on radii of 5 mm
    // and more, a chord that long stands `SKIN.station^2 / (8 * 5)`, 2 micrometres, off the skin.
    const centres: AutoMovieVector3Tuple[] = family.centres;
    let joint: number = 0;
    for (let k: number = 0; k + 2 < centres.length; ++k) joint += Math.hypot(centres[k + 1]![0] - centres[k]![0], centres[k + 1]![1] - centres[k]![1], centres[k + 1]![2] - centres[k]![2]);
    const first: number = Math.max(from, joint - SKIN.before);
    const rows: number = Math.ceil((end - first) / SKIN.station) + 1;
    const pitch: number = (end - first) / (rows - 1);
    const net: AutoMovieVector3Tuple[][] = Array.from({ length: rows }, (_, i) => {
      const station = i === rows - 1 ? end : first + pitch * i;
      const at = AutoMovieLoftChain.sampler(chain, station);
      return Array.from({ length: SKIN.phases }, (_, j) =>
        at((2 * Math.PI * j) / SKIN.phases),
      );
    });
    const point = (station: number, phase: number): readonly number[] => {
      const a: number = Math.max(0, Math.min(rows - 1, (station - first) / pitch));
      const i: number = Math.min(rows - 2, Math.floor(a));
      const turn: number = phase / (2 * Math.PI);
      const b: number = (turn - Math.floor(turn)) * SKIN.phases;
      const j: number = Math.floor(b) % SKIN.phases;
      const [s, t]: [number, number] = [a - i, b - Math.floor(b)];
      const [p, q, r, w]: number[][] = [net[i]![j]!, net[i]![(j + 1) % SKIN.phases]!, net[i + 1]![j]!, net[i + 1]![(j + 1) % SKIN.phases]!];
      return [0, 1, 2].map((k: number): number => (1 - s) * ((1 - t) * p![k]! + t * q![k]!) + s * ((1 - t) * r![k]! + t * w![k]!));
    };
    return { row, nail: AutoMovieHumanNail.create(plate, bed, segment, { point, first, tip: end }, row.proportions, 3 * CHORD_MM, TURN) };
  }
  /**
   * How far a digit's nail may turn about its long axis from its distal segment's frame, rad: the spread of the prior the skin's
   * levelling is weighed against (`AutoMovieHumanNail.create`).
   *
   * A nail's roll is the distal bone's, and the skin tells it only as far as the digit's back is flat across. No normal axial
   * rotation by ray was found published. This is the root mean square of seven nail tilts against their segments' frames read on
   * one person, f1's reference: 10 degrees on the index finger, 6 on the thumb, 16.5 on the little finger, 8 on the third toe, 1.8
   * on the ring finger, 1.4 on the middle finger and 2 on the big toe, which is 8.3 degrees. It is an estimate from one person, this
   * hand's little finger among the seven. It is a spread only: no digit's own tilt places that digit's nail. A digit whose back is
   * round keeps its segment's frame, which is known to miss by the digit's own axial turn until the frames carry it.
   */
  const TURN: number = 0.145;

  /**
   * The nails of one side's digits, each from its own digit and the frames, made once.
   *
   * @param families The digits' families at the pose, without their beds.
   * @param frames Every segment's frame at the pose.
   */
  export function all(families: readonly IAutoMovieHumanConicLoft.IFamily[], frames: ReadonlyMap<string, IAutoMovieHumanSegmentFrame>): IAutoMovieHumanF1Nails.IMade[] {
    return families.map((family: IAutoMovieHumanConicLoft.IFamily): IAutoMovieHumanF1Nails.IMade => create(family, frames));
  }

  /** Columns of a nail's join round its curve: the curve is some 40 mm long, so they stand 0.4 mm apart, under the bed's cell. */
  export const COLUMNS: number = 96;

  /**
   * A digit's family with its nail's bed: the family every reader of the digit takes, so the skin under the plate is the bed's.
   *
   * @param family The digit's family at the pose.
   * @param made Its nail.
   * @param close Whether the family is lofted for a close-up of the nail, with the free edge's strip; absent, the figure's level.
   */
  export function bedded(family: IAutoMovieHumanConicLoft.IFamily, made: IAutoMovieHumanF1Nails.IMade, close: boolean = false): IAutoMovieHumanConicLoft.IFamily {
    // The level. At the figure's cameras a hand 190 mm long fills 900 px, 0.21 mm a pixel, and a foot 0.28: the fold's wall, 1.84 mm,
    // reads and its net's 0.46 mm cell is the lofting rule's quarter of it, while the free edge's step, one thickness long, is two
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
          count: COLUMNS,
          rows: 4,
          tolerance: 1e-12,
          grazing: 0.04,
        };
      }
    return node;
  }
}
