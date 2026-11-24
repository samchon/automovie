import { AutoMovieLoftViewFullSource } from "@automovie/engine";
import type {
  IAutoMovieConstructionJoin,
  IAutoMovieConstructionNode,
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanDigitNails,
  IAutoMovieHumanNail,
  IAutoMovieLoftRelief,
  IAutoMovieLoftViewFullSource,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanCourseRuns } from "../conic/AutoMovieHumanCourseRuns";
import { AutoMovieHumanDigitNailSkin } from "./AutoMovieHumanDigitNailSkin";
import { AutoMovieHumanNail } from "./AutoMovieHumanNail";

/**
 * Fit and attach a nail using the digit's own original skin and positioned
 * distal frame.
 */
export namespace AutoMovieHumanDigitNails {
  /**
   * Mean fingernail thickness in women, mm, from Szymoniak-Lipska et al. 2021.
   * ESTIMATE for fold depth and lesser toes.
   */
  const PLATE: number = 0.38;

  /**
   * Jung et al. 2015 Table 1 provides the female finger breadth and
   * crown-radius ratios.
   */
  function finger(
    digit: string,
    width: number,
    radius: number,
    thickness: number,
  ): IAutoMovieHumanDigitNails.IRow {
    return {
      digit,
      proportions: {
        width,
        aspect: 0.91,
        radius,
        thickness,
        fold: PLATE,
        lunula: 1,
        wrap: 0.4,
      },
    };
  }

  /**
   * ESTIMATE from Jung's 0.73 finger width share and 0.91 finger aspect
   * transferred by MPFB2 CC0 ratios, measured in rule-basis.md. The bed's own
   * arc supplies the crown where no comparable radius has been published.
   */
  function toe(
    digit: string,
    aspect: number,
    thickness: number,
    wrap: number,
  ): IAutoMovieHumanDigitNails.IRow {
    return {
      digit,
      proportions: {
        width: 0.73,
        aspect,
        radius: null,
        thickness,
        fold: PLATE,
        lunula: 1,
        wrap,
      },
    };
  }

  /**
   * One proportions row per anatomical ray. Finger thickness is from
   * Szymoniak-Lipska Table 1, with Bellinato's digit I/II ratio transferred to
   * the thumb. Hallux thickness uses the women's left and right means from
   * López Ripado Table 3. Ha et al. 2024 measured the wrap shares over bone
   * height, so applying them to skin height is an ESTIMATE. One plate width is
   * the lunula radius in the absence of comparable data.
   *
   * Applying the female default dimensions to an unmeasured person of another
   * sex is an ESTIMATE. The width and radius ratios scale with that digit's own
   * measured skin chart. Plate thickness remains the cited default in mm.
   */
  export const ROWS: readonly IAutoMovieHumanDigitNails.IRow[] = [
    finger("finger.thumb", 13.2 / 18.8, 9.6 / 13.2, 0.41),
    finger("finger.index", 11.1 / 15.4, 7.4 / 11.1, 0.405),
    finger("finger.middle", 11.5 / 15.1, 7.3 / 11.5, 0.39),
    finger("finger.ring", 10.7 / 14.4, 6.8 / 10.7, 0.37),
    finger("finger.pinky", 8.8 / 12.0, 5.2 / 8.8, 0.355),
    toe("toe.big", 1.14, (0.57 + 0.6) / 2, 0.343),
    toe("toe.index", 1.48, PLATE, 0.317),
    toe("toe.middle", 1.48, PLATE, 0.317),
    toe("toe.ring", 1.48, PLATE, 0.317),
    toe("toe.little", 1.48, PLATE, 0.317),
  ];

  /**
   * The chord of the merge's blend either side of the fold's curve, mm: the
   * fold's rounding, a quarter of the bed's ramp.
   */
  export const CHORD_MM: number = 0.23;

  /**
   * Maximum combined bed and strip clipping in millimetres, as used by the
   * figure's nail gate.
   */
  export const CLIP_MM: number = 0.01;

  /** The physical extent of the aperture before the last articulation, mm. */
  const BEFORE_MM: number = 3;

  /** The plate's and the bed's names for a digit. */
  export function names(digit: string): { plate: string; bed: string } {
    return { plate: "nail." + digit, bed: "nailbed." + digit };
  }

  /**
   * Fit a standalone digit with its own original source on the probe's station
   * grid.
   *
   * @param digit The placed family and optional material chart.
   * @param frame The actual last joint's frame in world millimetres.
   */
  export function create(
    digit: IAutoMovieHumanDigitNails.IDigit,
    frame: IAutoMovieHumanNail.IFrame,
  ): IAutoMovieHumanDigitNails.IMade {
    const { family } = digit;
    const from: number = family.knots[0]!;
    const to: number = family.knots.at(-1)!;
    const count: number = Math.ceil(to - from) + 1;
    const stations: number[] = Array.from(
      { length: count },
      (_: unknown, i: number): number =>
        i === count - 1 ? to : from + ((to - from) * i) / (count - 1),
    );
    return createFrom(
      digit,
      frame,
      AutoMovieHumanConicLoft.part({ ...family, turn: undefined }, stations),
    );
  }

  /**
   * Fit the nail on the positioned digit's original source before adding its
   * relief.
   *
   * @param digit The positioned digit and its material-to-physical station map.
   * @param segment The actual last joint's frame in world millimetres.
   * @param original The digit's original direct view part before adding the
   *   nail.
   * @param setup Optional measured nail boundary and attachment bed depth.
   * @evidence contracts/development/implementation.md#principled-implementation The original view reader owns the physical cap and samples for the existing nail law.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Reads one digit, one frame, and one immutable source.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Source bounds and the physical station map govern the aperture without treating a tessellation as a new source.
   * @evidence contracts/development/implementation.md#efficient-algorithms Prepares one scalar reader and samples the existing bounded chart grid.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The emitted digit can reuse the exact axis and original scalar fields carried by the fit.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The result retains the immutable original and the existing nail record. The temporary fit grid belongs to this call.
   * @evidence contracts/development/common.md#meaningful-documentation States the source scope, station map, and frames.
   */
  export function createFrom(
    {
      family,
      digit = family.name,
      physicalStation,
    }: IAutoMovieHumanDigitNails.IDigit,
    segment: IAutoMovieHumanNail.IFrame,
    original: IAutoMovieViewPart,
    setup: IAutoMovieHumanNail.ISetup = {},
  ): IAutoMovieHumanDigitNails.IMade {
    if (original.name !== family.name)
      throw new Error(
        "nail: " + family.name + " received " + original.name + "'s source",
      );
    const surface: IAutoMovieLoftViewFullSource.IReader =
      AutoMovieLoftViewFullSource.create(original);
    const cap: IAutoMovieHumanConicLoft.ITip | null = family.tips?.[1] ?? null;
    requirePole(original, surface, cap?.tip);
    return fit(digit, segment, original, surface, setup, (): number => {
      // The fitted chart opens before the physical joint rather than before a
      // numerically equal station on a stretched material course.
      if (family.native !== undefined && physicalStation === undefined)
        throw new Error(
          "nail: " + family.name + " needs the native digit's course map",
        );
      const joint: number = AutoMovieHumanCourseRuns.joints(
        family.centres,
        family.halves,
      ).at(-2)!;
      return AutoMovieHumanDigitNailSkin.aperture(
        original.name,
        surface.domain,
        joint - BEFORE_MM,
        physicalStation,
      );
    });
  }

  /**
   * Fit the same plate and bed to a direct digit original and its own station
   * planes.
   */
  export function createOn(
    { digit, source, jointDistance }: IAutoMovieHumanDigitNails.IOriginal,
    segment: IAutoMovieHumanNail.IFrame,
    setup: IAutoMovieHumanNail.ISetup = {},
  ): IAutoMovieHumanDigitNails.IMade {
    const surface: IAutoMovieLoftViewFullSource.IReader =
      AutoMovieLoftViewFullSource.create(source);
    requirePole(source, surface);
    return fit(digit, segment, source, surface, setup, (): number =>
      AutoMovieHumanDigitNailSkin.aperture(
        source.name,
        surface.domain,
        -BEFORE_MM,
        jointDistance,
      ),
    );
  }

  /**
   * Admit the actual distal pole, checking a family-declared endpoint when
   * supplied.
   */
  function requirePole(
    original: IAutoMovieViewPart,
    surface: IAutoMovieLoftViewFullSource.IReader,
    tip?: number,
  ): void {
    if (
      (original.pole !== "top" && original.pole !== "both") ||
      (tip !== undefined && surface.domain[1] !== tip)
    )
      throw new Error(
        "nail: " +
          original.name +
          " source does not carry its completed distal pole",
      );
  }

  /**
   * Use the same fitted net, material shape and clipping receipt for both
   * source paths.
   */
  function fit(
    digit: string,
    segment: IAutoMovieHumanNail.IFrame,
    original: IAutoMovieViewPart,
    surface: IAutoMovieLoftViewFullSource.IReader,
    setup: IAutoMovieHumanNail.ISetup,
    open: () => number,
  ): IAutoMovieHumanDigitNails.IMade {
    const clinical: IAutoMovieHumanDigitNails.IRow | undefined = ROWS.find(
      (r): boolean => r.digit === digit,
    );
    if (clinical === undefined)
      throw new Error("nail: no proportion row for " + digit);
    const margin =
      setup.groove === undefined
        ? null
        : AutoMovieHumanDigitNailSkin.measuredGroove(
            setup.groove,
            segment,
            CLIP_MM,
          );
    const row: IAutoMovieHumanDigitNails.IRow =
      margin === null || margin.fold === null
        ? clinical
        : {
            ...clinical,
            proportions: {
              ...clinical.proportions,
              fold: Math.min(clinical.proportions.fold, margin.fold),
            },
          };
    const { plate, bed }: { plate: string; bed: string } = names(original.name);
    const first: number = open();
    const nail = AutoMovieHumanNail.create(
      plate,
      bed,
      segment,
      AutoMovieHumanDigitNailSkin.net(surface, first),
      row.proportions,
      3 * CHORD_MM,
      TURN,
      { ...setup, grooveRoom: margin?.side ?? setup.grooveRoom },
    );
    const { clipped, clippedAt, clippedIn } = nail.readings;
    const support: IAutoMovieHumanDigitNails.ISupport = {
      domain: [...surface.domain],
      aperture: first,
      clipped,
      clippedAt,
      clippedIn,
      limit: CLIP_MM,
      admitted: Number.isFinite(clipped) && clipped <= CLIP_MM,
    };
    return { row, original, nail, support };
  }

  /**
   * How far a digit's nail may turn about its long axis from its distal
   * segment's frame, rad: the spread of the prior the skin's levelling is
   * weighed against (`AutoMovieHumanNail.create`).
   *
   * A nail's roll is the distal bone's, and the skin tells it only as far as
   * the digit's back is flat across. The spread is the root mean square of the
   * fingers' normal axial rotations measured by Clarke et al. 2012 (Orthopaedic
   * Proceedings 94-B SUPP III:85, abstract only read), 0.183 rad (10.5
   * degrees). The toes take the same value as an ESTIMATE: no toe's axial
   * rotation was found published. The supplied segment supplies the direction
   * for a round dorsal surface.
   */
  const TURN: number = 0.183;

  /** Add relief display rows without replacing the actual original field. */
  export const addReliefs = AutoMovieHumanDigitNailSkin.addReliefs;

  /**
   * Legacy family adapter for callers that have yet to prepare their original
   * view source.
   *
   * @param family The digit's family at the pose.
   * @param made Its nail.
   * @param close Whether the family is lofted for a close-up of the nail, with
   *   the free edge's strip; absent, the figure's level.
   */
  export function bedded(
    family: IAutoMovieHumanConicLoft.IFamily,
    made: Pick<IAutoMovieHumanDigitNails.IMade, "nail">,
    close: boolean = false,
  ): IAutoMovieHumanConicLoft.IFamily {
    // Include the strip's free-edge detail when the caller requests it.
    const nets: IAutoMovieHumanNail.INail["bed"][] = close
      ? [made.nail.bed, made.nail.strip]
      : [made.nail.bed];
    const reliefs: IAutoMovieHumanConicLoft.IFamily["reliefs"] = [
      ...(family.reliefs ?? []),
      ...nets,
    ];
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
        return far > 0
          ? Math.ceil(
              (2 * Math.sqrt(length * far) * (relief.rows - 3)) /
                (relief.stations[1] - relief.stations[0]),
            ) - 1
          : 0;
      }),
    );
    return {
      ...family,
      reliefs,
      tips: [
        family.tips?.[0] ?? null,
        asked > 0 ? { ...end, rings: asked } : end,
      ],
    };
  }

  /** Use the bed's physical cell to evaluate the plate source for attachment. */
  export function attachmentPlate(
    plate: IAutoMovieHumanConicLoft.IFamily,
    bed: IAutoMovieLoftRelief,
  ): IAutoMovieViewPart {
    const last: number = plate.knots.at(-1)!;
    const count: number = Math.ceil(last / bedPitch(bed)) + 1;
    return AutoMovieHumanConicLoft.part(
      plate,
      Array.from({ length: count }, (_: unknown, i: number): number =>
        i === count - 1 ? last : (last * i) / (count - 1),
      ),
    );
  }

  /** The station interval between two consecutive bed control sites. */
  function bedPitch(bed: IAutoMovieLoftRelief): number {
    return (bed.stations[1] - bed.stations[0]) / (bed.rows - 3);
  }

  /**
   * Merge each plate onto its existing digit, using the bed's cell to sample
   * the join. Supply a naming function to also attach the reflected
   * counterpart.
   *
   * @param root The tree with the bedded digit faces and any requested
   *   counterparts.
   * @param sources The tree's sources; each plate's is added.
   * @param nails The nails of one side.
   * @param contact The declared contact between the plate and bedded digit. The
   *   curve length is in millimetres. The engine owns the seed, physical
   *   tolerance in metres and grazing angle in radians.
   * @param twin The name of a family's reflection.
   */
  export function attach(
    root: IAutoMovieConstructionNode,
    sources: Map<string, IAutoMovieViewPart>,
    nails: readonly Pick<
      IAutoMovieHumanDigitNails.IMade,
      "nail" | "original"
    >[],
    contact: (
      plate: IAutoMovieViewPart,
      digit: IAutoMovieViewPart,
    ) => Pick<IAutoMovieConstructionJoin, "seed" | "tolerance" | "grazing"> &
      Partial<Pick<IAutoMovieConstructionJoin, "parameter" | "loop">> & {
        curveLength: number;
      },
    twin?: (name: string) => string,
  ): IAutoMovieConstructionNode {
    let node: IAutoMovieConstructionNode = root;
    const added: IAutoMovieViewPart[] = [];
    for (const made of nails)
      for (const side of twin === undefined ? [1] : [1, -1]) {
        const plate: IAutoMovieHumanConicLoft.IFamily =
          side > 0
            ? made.nail.plate
            : AutoMovieHumanConicLoft.mirror(
                made.nail.plate,
                twin!(made.nail.plate.name),
              );
        const cell: number = bedPitch(made.nail.bed);
        const plateSource: IAutoMovieViewPart = attachmentPlate(
          plate,
          made.nail.bed,
        );
        const digitName: string =
          side > 0 ? made.original.name : twin!(made.original.name);
        const digit: IAutoMovieViewPart | undefined = sources.get(digitName);
        if (digit === undefined)
          throw new Error("nail: missing bedded digit " + digitName);
        const { seed, tolerance, grazing, curveLength, parameter, loop } =
          contact(plateSource, digit);
        if (
          seed.partFace !== plate.name ||
          seed.hostFace !== digitName ||
          ![tolerance, grazing, curveLength].every(
            (value): boolean => Number.isFinite(value) && value > 0,
          )
        )
          throw new Error("nail: invalid measured contact for " + plate.name);
        added.push(plateSource);
        node = {
          type: "join",
          kind: "merge",
          name: "fold." + plate.name,
          host: node,
          part: { type: "source", name: plate.name, source: plate.name },
          seed,
          parameter: parameter ?? { type: "arc" },
          ...(loop === undefined ? {} : { loop }),
          partWidth: {
            type: "curvature",
            share: 0.5,
            cap: CHORD_MM / 1000,
            end: null,
          },
          hostWidth: {
            type: "curvature",
            share: 0.5,
            cap: CHORD_MM / 1000,
            end: null,
          },
          continuity: "G2",
          // Match the measured curve's spacing to the bed. The join interface
          // requires at least eight columns and a multiple of four.
          count: Math.max(8, 4 * Math.ceil(curveLength / (4 * cell))),
          rows: 4,
          tolerance,
          grazing,
        };
      }
    for (const plate of added) sources.set(plate.name, plate);
    return node;
  }
}
