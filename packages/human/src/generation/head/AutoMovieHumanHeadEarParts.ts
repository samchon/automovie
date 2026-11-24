import { AutoMovieLoftViewFullSource } from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanEar,
  IAutoMovieHumanHeadEarFrame,
  IAutoMovieHumanHeadEarPlate,
  IAutoMovieHumanHeadFeatures,
  IAutoMovieHumanHeadLayout,
  IAutoMovieHumanHeadPrior,
  IAutoMovieHumanPair,
  IAutoMovieLoftRelief,
  IAutoMovieLoftViewFullSource,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieHumanSeamUnion } from "../../lofting/AutoMovieHumanSeamUnion";
import { AutoMovieHumanHeadAnatomy } from "../AutoMovieHumanHeadAnatomy";
import { AutoMovieHumanHeadPrior } from "../AutoMovieHumanHeadPrior";
import { AutoMovieHumanHeadEarFrame } from "./AutoMovieHumanHeadEarFrame";
import { AutoMovieHumanHeadEarPlate } from "./AutoMovieHumanHeadEarPlate";
import { AutoMovieHumanHeadEarSurface } from "./AutoMovieHumanHeadEarSurface";

/**
 * Each auricle's actual measured plate owns the crests and conchal relief on
 * one skin. The whole auricle attaches to the head.
 *
 * @evidence contracts/common.md#principled-implementation Starts from each side's published dimensions and source plate. Cho's conchal dimensions and Zhu's rim-plane depth retain their independent definitions.
 * @evidence contracts/common.md#clear-and-simple-design Uses each plate's own chart for its anatomical regions and scalp join.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not fit a mesh, relocate the parent, or replace a failed juncture with a separate component.
 * @evidence contracts/common.md#meaningful-documentation Declares the origins of dimensions and the retained conventions for individual placement.
 * @evidence contracts/performance.md#efficient-algorithms Fixed guide preparation and one bounded plate-field construction per side.
 * @evidence contracts/performance.md#reuse-equivalent-work All regions share one source chart per side.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the composed source part and its fields.
 */
export namespace AutoMovieHumanHeadEarParts {
  /** Means of within-ear d10/d8 and d4/d2 in Liu et al. (2025), Parameters.csv. */
  const MIDDLE_HELIX_WIDTH_SHARE: number = 0.170707934;
  const TRIANGULAR_FOSSA_HEIGHT_SHARE: number = 0.2432290048;

  /**
   * The two auricular sources and their scalp attachment declarations.
   *
   * @param plan Landmark skeleton.
   * @param mass Actual head source.
   * @param ears Own-side ear measurements in world mm.
   * @param tops Optional top heights in calibration mm.
   * @evidence contracts/common.md#principled-implementation Positions each fold relative to its own native plate and joins the plate at its existing scalp guide.
   * @evidence contracts/common.md#clear-and-simple-design One source per side owns the actual concha and crest fields. The explicit view is the underlying guide-only caliper declaration.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not move scalp contact, change anthropometry, or admit a disconnected ridge skin.
   * @evidence contracts/common.md#meaningful-documentation Records the units and the individual rather than bilateral measurement basis.
   * @evidence contracts/performance.md#efficient-algorithms Original scalp and plate readers keep their preparation cost. Guide preparation feeds one fixed-size depth composition without contact inversions for individual folds.
   * @evidence contracts/performance.md#reuse-equivalent-work One prepared frame and plate serve every region on a side.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Source fields remain caller-owned.
   */
  export function of(
    plan: IAutoMovieHumanHeadLayout,
    mass: IAutoMovieViewPart,
    ears: IAutoMovieHumanPair<IAutoMovieHumanEar>,
    tops?: IAutoMovieHumanPair<number>,
  ): IAutoMovieHumanHeadFeatures.IFeature[] {
    const prior: IAutoMovieHumanHeadPrior.IEar =
      AutoMovieHumanHeadPrior.PRIOR.ear;
    const female: boolean = plan.sex === 1;
    const sex: 0 | 1 = female ? 0 : 1;
    const head: IAutoMovieLoftViewFullSource.IReader =
      AutoMovieLoftViewFullSource.create(mass);
    return ([1, -1] as const).map(
      (sign): IAutoMovieHumanHeadFeatures.IFeature => {
        const side: string = sign > 0 ? "left" : "right";
        const f: IAutoMovieHumanHeadEarFrame.IFrame =
          AutoMovieHumanHeadEarFrame.of(
            plan,
            mass,
            sign,
            sign > 0 ? ears.left : ears.right,
            sign > 0 ? tops?.left : tops?.right,
          );
        const diameter: number = prior.ridge * f.breadth;
        const radius: number = diameter / 2;
        const lamella: number = prior.rim * f.breadth;
        const plate: IAutoMovieHumanHeadEarPlate.IOutput =
          AutoMovieHumanHeadEarPlate.of(plan, mass, f, side, head);
        const low: number = plate.bottom;
        const high: number = plate.top;
        const middleHelixRadius: number =
          (MIDDLE_HELIX_WIDTH_SHARE * f.breadth) / 2;
        const upperHelixRadius: number =
          (AutoMovieHumanHeadEarPlate.UPPER_HELIX_WIDTH_SHARE * f.breadth) / 2;
        const end: number = low + prior.lobule[sex] * (high - low);
        const helix: AutoMovieVector3Tuple[] = insetHelix(
          [
            plate.point(plate.attachment, false),
            plate.point(high, true),
            plate.point(plate.attachment, true),
            plate.point(plate.tragion, true),
            plate.point((plate.tragion + end) / 2, true),
            plate.point(end, true),
          ],
          plate,
          middleHelixRadius,
          upperHelixRadius,
        );
        const inner = (at: number, offset: number): AutoMovieVector3Tuple => {
          const point: AutoMovieVector3Tuple = plate.point(at, true);
          return [
            point[0] - offset * plate.across[0],
            point[1],
            point[2] - offset * plate.across[2],
          ];
        };
        // ESTIMATE: the mean ear and concha breadths start at the same anterior
        // support. Their difference locates the posterior antihelical course.
        const conchalBreadth: number = female
          ? sign > 0
            ? 18.2
            : 18.1
          : sign > 0
            ? 18.7
            : 18.8;
        const offset: number =
          f.breadth *
          (1 - conchalBreadth / AutoMovieHumanHeadAnatomy.EAR.breadth[sex]);
        const fork: number = (plate.tragion + plate.attachment) / 2;
        const fossaTop: number = Math.min(
          high - upperHelixRadius,
          fork + TRIANGULAR_FOSSA_HEIGHT_SHARE * (high - low),
        );
        const shared: AutoMovieVector3Tuple = inner(fork, offset);
        // Hunter et al. place the crus helicis across half to two thirds of
        // the concha. Use its midrange for the free end of this course.
        const rootHeight: number = Math.min(
          fork,
          plate.tragion + middleHelixRadius,
        );
        const rootFront: AutoMovieVector3Tuple = plate.point(rootHeight, false);
        const rootBack: AutoMovieVector3Tuple = inner(
          rootHeight + radius / 2,
          offset,
        );
        const rootTip: AutoMovieVector3Tuple = [
          rootFront[0] + (7 / 12) * (rootBack[0] - rootFront[0]),
          rootBack[1],
          rootFront[2] + (7 / 12) * (rootBack[2] - rootFront[2]),
        ];
        const courses: AutoMovieHumanHeadEarSurface.ICourse[] = [
          {
            name: "ear.helix." + side,
            points: helix,
            halfWidths: [middleHelixRadius, upperHelixRadius],
            fade: "end",
          },
          {
            name: "ear.crus.helicis." + side,
            points: [
              rootFront,
              [
                (rootFront[0] + rootTip[0]) / 2,
                rootHeight + radius,
                (rootFront[2] + rootTip[2]) / 2,
              ],
              rootTip,
            ],
            fade: "end",
          },
          {
            name: "ear.antihelix." + side,
            points: [inner(end, offset), inner(plate.tragion, offset), shared],
            fade: "start",
          },
          {
            name: "ear.crus.superior." + side,
            points: [
              shared,
              inner((fork + fossaTop) / 2, offset),
              inner(fossaTop, offset),
            ],
            fade: "end",
          },
          {
            name: "ear.crus.inferior." + side,
            points: [
              shared,
              inner(plate.attachment, offset + diameter),
              plate.point(plate.attachment, false),
            ],
            fade: "end",
          },
        ];

        const sense: 1 | -1 = dot(plate.normal, f.n) > 0 ? 1 : -1;
        const outward: AutoMovieVector3Tuple = [
          sense * plate.normal[0],
          0,
          sense * plate.normal[2],
        ];
        const top: AutoMovieVector3Tuple = plate.point(high, true);
        const bottom: AutoMovieVector3Tuple = plate.point(low, true);
        const chord: AutoMovieVector3Tuple = [
          (top[0] - bottom[0]) / f.length,
          (top[1] - bottom[1]) / f.length,
          (top[2] - bottom[2]) / f.length,
        ];
        const normalComponent: number = dot(chord, outward);
        const projected: AutoMovieVector3Tuple = [
          chord[0] - normalComponent * outward[0],
          chord[1],
          chord[2] - normalComponent * outward[2],
        ];
        const length: number = Math.hypot(...projected);
        if (!(length > 0 && Number.isFinite(length)))
          throw new Error(
            "Concha long direction has no projection into its own rim plane",
          );

        // ESTIMATE: centre the conchal span at the tragion, between the
        // superior rim and intertragic notch, halfway toward the antihelix.
        const at: number = plate.tragion;
        const front: AutoMovieVector3Tuple = plate.point(at, false);
        const back: AutoMovieVector3Tuple = inner(at, offset);
        const rim: AutoMovieVector3Tuple = [
          (front[0] + back[0]) / 2 + lamella * outward[0],
          at,
          (front[2] + back[2]) / 2 + lamella * outward[2],
        ];
        const reliefs: IAutoMovieLoftRelief[] = AutoMovieHumanHeadEarSurface.of(
          plate,
          head,
          AutoMovieHumanSeamUnion.width(f.length, lamella),
          outward,
          f.breadth,
          radius,
          lamella,
          courses,
          {
            name: "ear.concha." + side,
            rim,
            along: [
              projected[0] / length,
              projected[1] / length,
              projected[2] / length,
            ],
            length: (female ? (sign > 0 ? 27.0 : 27.4) : 28.0) * plan.scale,
            breadth: conchalBreadth * plan.scale,
            // Zhu et al., Table I, adult female left and right rim-plane-to-floor depths.
            depth: (sign > 0 ? 9.65 : 9.53) * plan.scale,
          },
        );
        const chart: IAutoMovieLoftRelief = reliefs[0]!;
        const spans: number = chart.rows - 3;
        const pitch: number = (high - low) / spans;
        const stations: number[] = [...plate.part.stations];
        // Keep the measured plate's own rows and resolve each live cubic
        // span. A plate row within half a span already covers that knot.
        for (let i: number = 1; i < spans; i++) {
          const station: number = low + i * pitch;
          if (
            plate.part.stations.every(
              (s: number): boolean => Math.abs(s - station) > pitch / 2,
            )
          )
            stations.push(station);
        }
        stations.sort((a: number, b: number): number => a - b);
        return {
          part: {
            ...plate.part,
            stations,
            // Two half-windows per turn and an integral number of phase
            // samples in each conic quarter.
            samples: Math.max(
              plate.part.samples,
              4 * Math.ceil((chart.columns - 3) / 2),
            ),
            reliefs,
          },
          view: plate.view,
          join: "merge",
          seed: plate.point(plate.tragion, false),
          contact: plate.tragion,
          // The fillet works across the attached wall's half-thickness.
          size: [f.length, lamella],
          parent: "head.mass",
          elongated: true,
          // Start at the actual tragal intersection on the outward sheet.
          // Both source curves move regularly there.
          search: {
            phase: tragalPhase(plate, head, sense, sign),
            from: (plate.tragion - low) / (high - low),
            to: 1,
          },
        };
      },
    );
  }

  /** Find the parent crossing of the original outward tragal section. */
  function tragalPhase(
    plate: IAutoMovieHumanHeadEarPlate.IOutput,
    head: IAutoMovieLoftViewFullSource.IReader,
    sense: 1 | -1,
    side: 1 | -1,
  ): number {
    const { frame, phase } = plate.section(plate.tragion);
    if (phase === null) throw new Error("Ear has no regular tragal section");
    const scalp = head.pointAt(plate.tragion);
    const gap = (parameter: number): number => {
      const { p } = phase(parameter);
      const x: number = frame.origin[0] + p[0] * frame.u[0] + p[1] * frame.v[0];
      const z: number = frame.origin[2] + p[0] * frame.u[2] + p[1] * frame.v[2];
      return (
        side *
        (z - scalp(AutoMovieHumanHeadEarPlate.sectionPhase(scalp, x, side))[2])
      );
    };
    let inward: number = Math.PI;
    let outward: number = Math.PI - sense * Math.PI;
    if (!(gap(inward) < 0) || gap(outward) < 0)
      throw new Error(
        "Ear tragal section does not bracket its outward scalp crossing",
      );
    for (;;) {
      const middle: number = (inward + outward) / 2;
      if (middle === inward || middle === outward) return middle;
      if (gap(middle) < 0) inward = middle;
      else outward = middle;
    }
  }

  /** Offset the measured outer rim to the retained circular crest centre. */
  function insetHelix(
    boundary: AutoMovieVector3Tuple[],
    plate: IAutoMovieHumanHeadEarPlate.IOutput,
    middleRadius: number,
    upperRadius: number,
  ): AutoMovieVector3Tuple[] {
    const middle: number = (plate.top + plate.bottom) / 2;
    const front: AutoMovieVector3Tuple = plate.point(middle, false);
    const back: AutoMovieVector3Tuple = plate.point(middle, true);
    const inside: AutoMovieVector3Tuple = [
      (front[0] + back[0]) / 2,
      middle,
      (front[2] + back[2]) / 2,
    ];
    return boundary.map(
      (point: AutoMovieVector3Tuple, i: number): AutoMovieVector3Tuple => {
        if (i === 1) return [point[0], point[1] - upperRadius, point[2]];
        const before: AutoMovieVector3Tuple = boundary[Math.max(0, i - 1)]!;
        const after: AutoMovieVector3Tuple =
          boundary[Math.min(boundary.length - 1, i + 1)]!;
        const tangent: AutoMovieVector3Tuple = [
          after[0] - before[0],
          after[1] - before[1],
          after[2] - before[2],
        ];
        const n: AutoMovieVector3Tuple = plate.normal;
        const inward: AutoMovieVector3Tuple = [
          -n[2] * tangent[1],
          n[2] * tangent[0] - n[0] * tangent[2],
          n[0] * tangent[1],
        ];
        const length: number = Math.hypot(...inward);
        if (!(length > 0))
          throw new Error("Helix rim has no inward course direction");
        const toInside: AutoMovieVector3Tuple = [
          inside[0] - point[0],
          inside[1] - point[1],
          inside[2] - point[2],
        ];
        const offset: number =
          (dot(inward, toInside) >= 0 ? middleRadius : -middleRadius) / length;
        return [
          point[0] + offset * inward[0],
          point[1] + offset * inward[1],
          point[2] + offset * inward[2],
        ];
      },
    );
  }

  function dot(a: AutoMovieVector3Tuple, b: AutoMovieVector3Tuple): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
}
