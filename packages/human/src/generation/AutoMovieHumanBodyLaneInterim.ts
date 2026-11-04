import { AutoMovieLoftChain, type IAutoMovieLoftChain } from "@automovie/engine";
import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import { AutoMovieHumanBodyAnatomy } from "./AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanBodyPlaces } from "./AutoMovieHumanBodyPlaces";
import { AutoMovieHumanBreastFootprint } from "./AutoMovieHumanBreastFootprint";
import { AutoMovieHumanGlutealDome } from "./AutoMovieHumanGlutealDome";
import { AutoMovieHumanFootPlaces } from "./AutoMovieHumanFootPlaces";
import type { AutoMovieHumanBodyLane } from "./AutoMovieHumanBodyLane";
import type { AutoMovieHumanFootConstruction } from "./AutoMovieHumanFootConstruction";
import type { AutoMovieHumanSkeletonLaw } from "./AutoMovieHumanSkeletonLaw";
import type { AutoMovieHumanTrunkConstruction } from "./AutoMovieHumanTrunkConstruction";
import { AutoMovieHumanTrunkInguinalFold } from "./AutoMovieHumanTrunkInguinalFold";
import { AutoMovieHumanTrunkRows } from "./AutoMovieHumanTrunkRows";
import { AutoMovieHumanTrunkSolver } from "./AutoMovieHumanTrunkSolver";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanBodyMeasures } from "./IAutoMovieHumanBodyMeasures";
import type { IAutoMovieHumanTrunkSection } from "./IAutoMovieHumanTrunkSection";
import type { IAutoMovieHumanTrunkSolution } from "./IAutoMovieHumanTrunkSolution";
import { AutoMovieHumanArmBones } from "./arm/AutoMovieHumanArmBones";
import type { AutoMovieHumanArmWalk } from "./arm/AutoMovieHumanArmWalk";
import type { AutoMovieHumanFootPart } from "./foot/AutoMovieHumanFootPart";
import { AutoMovieHumanLegGirth } from "./leg/AutoMovieHumanLegGirth";
import { AutoMovieHumanLegLaws } from "./leg/AutoMovieHumanLegLaws";
import { AutoMovieHumanChainBox } from "./limb/AutoMovieHumanChainBox";
import type { AutoMovieHumanDigitWalk } from "./limb/AutoMovieHumanDigitWalk";
import type { AutoMovieHumanTrunkBuild } from "./trunk/AutoMovieHumanTrunkBuild";
import { AutoMovieHumanTrunkLaws } from "./trunk/AutoMovieHumanTrunkLaws";
import { AutoMovieHumanTrunkViews } from "./trunk/AutoMovieHumanTrunkViews";

type Vec3 = [number, number, number];

/**
 * The body lane's input for a person while some of its laws are still owed
 * (#3044's rule for priors the campaign has not yet replaced: read from the
 * construction that produces them today, listed as remaining, never refit).
 * Every owed value comes from one named accessor below, each reading today's
 * construction (the old trunk solve, the bind skeleton, the old foot frame
 * and prior, today's limb, foot, hand and digit chains) with no number of
 * its own, and each is swapped for its law the moment the input and laws
 * worker lands it (`log-body.md`, "Interim accessors").
 *
 * Published values and landed laws are read as they are: the trunk's boxes,
 * heights and back profile (`AutoMovieHumanTrunkViews`, `AutoMovieHumanTrunkLaws`),
 * the leg's tapes, sites, thigh depth and bone place (`AutoMovieHumanLegLaws`),
 * the foot's instep and ball lengths.
 */
export namespace AutoMovieHumanBodyLaneInterim {
  /** What the interim lane reads. */
  export interface IInput {
    /** The public input. */
    params: IAutoMovieHumanParameters;

    /** Calibration millimetres per world millimetre. */
    scale: number;

    /** Calibration stature, mm. */
    stature: number;

    /** The crotch's height, calibration mm. */
    crotch: number;

    /** The old trunk's inputs (`AutoMovieHumanBodyLaw` column). */
    trunk: AutoMovieHumanTrunkConstruction.IInputs;

    /** The neck chain `head`, which the old trunk solve stands under. */
    neck: IAutoMovieLoftChain;

    /** The feet's dimensions, calibration mm. */
    feet: AutoMovieHumanFootConstruction.IInputs;

    /** The bind skeleton. */
    skeleton: readonly AutoMovieHumanSkeletonLaw.IBone[];

    /** Today's whole body with its limb, foot, hand and digit chains. */
    old: IAutoMovieHumanBodyCalibration;
  }

  /** The fingers, as the skeleton and the chains name them. */
  const FINGERS: readonly ("Index" | "Middle" | "Ring" | "Little")[] = ["Index", "Middle", "Ring", "Little"];

  /**
   * The lane's input.
   *
   * @param input The person, the old constructions and the skeleton.
   * @returns The body lane's input.
   */
  export function of(input: IInput): AutoMovieHumanBodyLane.IInput {
    const measures: IAutoMovieHumanBodyMeasures = AutoMovieHumanBodyAnatomy.resolve(input.params);
    const solution: IAutoMovieHumanTrunkSolution = AutoMovieHumanTrunkSolver.solve({ inputs: input.trunk, stature: input.stature, crotch: input.crotch, neck: input.neck });
    const radius: number = foldRadius(solution);
    const bone = (name: string): AutoMovieHumanSkeletonLaw.IBone => {
      const found: AutoMovieHumanSkeletonLaw.IBone | undefined = input.skeleton.find((b: AutoMovieHumanSkeletonLaw.IBone): boolean => b.bone === name);
      if (found === undefined) throw new Error(`The skeleton lacks ${name}`);
      return found;
    };
    const chain = (name: string): IAutoMovieLoftChain => {
      const found: IAutoMovieLoftChain | undefined = input.old.chains.find((c: IAutoMovieLoftChain): boolean => c.name === name);
      if (found === undefined) throw new Error(`Today's body lacks the chain ${name}`);
      return found;
    };

    // The trunk: the published boxes and the landed laws, the owed values
    // read on the old trunk's solve.
    const ankles: number = (bone("leftFoot").position[0] + bone("rightFoot").position[0]) / 2;
    const placed: { cervicale: number; perineum: number } = places(measures, input.scale, ankles);
    const pending = (upper: AutoMovieHumanTrunkViews.ILaws["upper"]): AutoMovieHumanTrunkLaws.IPending => ({
      cervicale: placed.cervicale,
      perineum: placed.perineum,
      upper,
    });
    const first: AutoMovieHumanTrunkViews.ILaws = AutoMovieHumanTrunkLaws.of(measures, input.scale, pending([]));
    const laws: AutoMovieHumanTrunkViews.ILaws = AutoMovieHumanTrunkLaws.of(measures, input.scale, pending(upperSites(solution, first)));

    const side = (name: "left" | "right"): AutoMovieHumanBodyLane.ISide => {
      const hip: Vec3 = bone(`${name}UpperLeg`).position;
      const knee: Vec3 = bone(`${name}LowerLeg`).position;
      const ankle: Vec3 = bone(`${name}Foot`).position;
      const shoulder: Vec3 = bone(`${name}UpperArm`).position;
      const elbow: Vec3 = bone(`${name}LowerArm`).position;
      const wrist: Vec3 = bone(`${name}Hand`).position;
      const knuckle: Vec3 = bone(`${name}MiddleProximal`).position;
      const fold = (from: number, to: number): AutoMovieHumanBodyLane.IFold => ({ search: { phi: 0, from, to }, radius });

      // The arm and palm's sites, each box read on today's arm and palm.
      const arm: AutoMovieHumanArmWalk.ISiteLaw[] = armSites(chain(`arm.${name}`), chain(`hand.${name}.1`), shoulder, elbow, wrist, knuckle);
      const depth = (site: string): number => {
        const s: AutoMovieHumanArmWalk.ISiteLaw | undefined = arm.find((l: AutoMovieHumanArmWalk.ISiteLaw): boolean => l.site === site);
        return s === undefined ? 0 : s.edges[0] - s.edges[2];
      };
      const digit = (chainName: string, centres: Vec3[]): AutoMovieHumanBodyLane.IDigit => {
        const walk: AutoMovieHumanDigitWalk.IInput = digitWalk(chainName, chain(chainName), centres);
        return { digit: walk, fold: { search: { phi: 0, from: 0, to: 0.5 }, radius: walk.law("base").breadth / 2 } };
      };
      const toes: IAutoMovieLoftChain[] = [1, 2, 3, 4, 5].map((k: number): IAutoMovieLoftChain => chain(`toe.${name}.${k}`));
      return {
        leg: {
          bones: { hip, knee, ankle },
          law: AutoMovieHumanLegLaws.of(measures, input.scale, knee[1], ankle[1], ankleSite(knee[1], ankle[1]), input.crotch),
          trunk: fold(0, 0.5),
          foot: fold(1, 0.85),
        },
        arm: {
          bones: { shoulder, elbow, wrist },
          knuckle,
          reach: depth("knuckles") / 2,
          sites: arm,
          joints: { elbow: depth("elbow"), wrist: depth("wrist") },
          trunk: fold(0, 0.4),
        },
        foot: foot(name, chain(`foot.${name}`), toes, input.feet[name], ankle, measures, input.scale),
        fingers: [
          ...FINGERS.map((f: string): AutoMovieHumanBodyLane.IDigit => {
            const distal: AutoMovieHumanSkeletonLaw.IBone = bone(`${name}${f}Distal`);
            return digit(`finger.${name}.${f.toLowerCase()}`, [bone(`${name}${f}Proximal`).position, bone(`${name}${f}Intermediate`).position, distal.position, distal.tip ?? distal.position]);
          }),
          digit(`thumb.${name}`, [bone(`${name}ThumbMetacarpal`).position, bone(`${name}ThumbProximal`).position, bone(`${name}ThumbDistal`).position, bone(`${name}ThumbDistal`).tip ?? bone(`${name}ThumbDistal`).position]),
        ],
        toes: toes.map((toe: IAutoMovieLoftChain): AutoMovieHumanBodyLane.IDigit => {
          const a: Vec3 = AutoMovieLoftChain.axis(toe, toe.layers[0]!.y);
          const m: Vec3 = AutoMovieLoftChain.axis(toe, (toe.layers[0]!.y + toe.layers[toe.layers.length - 1]!.y) / 2);
          const e: Vec3 = AutoMovieLoftChain.axis(toe, toe.layers[toe.layers.length - 1]!.y);
          return digit(toe.name, [behind(a, m), m, e]);
        }),
      };
    };

    return {
      trunk: {
        views: AutoMovieHumanTrunkViews.of(measures, input.crotch, input.scale, laws),
        tapes: { chest: measures.chestCircumference * input.scale, hip: measures.hipCircumference * input.scale },
        breast: breast(solution, measures, input.scale, laws, radius),
        gluteal: gluteal(solution, measures, input.scale, laws, radius),
      },
      sides: { left: side("left"), right: side("right") },
      gap: AutoMovieHumanTrunkRows.MAX_GAP,
    };
  }

  /**
   * Cervicale's and the perineum's forward places: forward of the ankle
   * centres' midpoint by their stature shares (`AutoMovieHumanBodyPlaces`,
   * estimated from the private reference set: no published source found).
   *
   * @param measures The person's measures, world mm.
   * @param scale Calibration millimetres per world millimetre.
   * @param ankles The two ankle centres' mean forward place, calibration mm.
   * @returns Both forward places, calibration mm.
   */
  export function places(measures: IAutoMovieHumanBodyMeasures, scale: number, ankles: number): { cervicale: number; perineum: number } {
    return {
      cervicale: ankles + AutoMovieHumanBodyPlaces.cervicale(measures) * scale,
      perineum: ankles + AutoMovieHumanBodyPlaces.perineum(measures) * scale,
    };
  }

  /**
   * Interim accessor: the trunk's sites above the chest (the axilla, the
   * shoulder point, the neck seat), each the old column's half width and
   * depth there, its front the landed back profile plus that depth, its
   * shoulder the old quadrants' superellipse read as a conic: a superellipse
   * `|x|^n + |z|^n = 1` crosses its box's diagonal at `2^(-1/n)` of the
   * corner and the conic at `(1 + r) / 2`, so `r = 2^(1 - 1/n) - 1` (the
   * ellipse's `sqrt(2) - 1` at `n = 2`), `n` the mean of the old front and
   * back squareness. The last site stands at the neck seat, the neck's
   * bottom ring, where the trunk takes the neck's ring by the head's down
   * event. Owed laws: the upper trunk's front profile, the neck base's box,
   * the acromion's soft tissue.
   */
  export function upperSites(solution: IAutoMovieHumanTrunkSolution, laws: AutoMovieHumanTrunkViews.ILaws): AutoMovieHumanTrunkViews.ILaws["upper"] {
    const heights: [string, number][] = [
      ["axilla", solution.landmarks.axilla],
      ["shoulder", solution.landmarks.shoulder[1]],
      ["neck", solution.seat.y],
    ];
    return heights.map(([site, y]: [string, number]): AutoMovieHumanTrunkViews.ILaws["upper"][number] => {
      const s: IAutoMovieHumanTrunkSection = solution.column.at(y);
      const n: number = (s.squareFront + s.squareBack) / 2;
      return { site, y, half: s.width, front: laws.back(y) + (s.front - s.back), shoulder: 2 ** (1 - 1 / n) - 1 };
    });
  }

  /**
   * The profile of today's trunk masses as the mass part's knots: today's
   * domes rise as the bump `h = A (1 - rho^2)^3` over their footprint
   * (`AutoMovieHumanTrunkFeatureProfile.bump`), so at the share `a` of the
   * amplitude the footprint's radius has shrunk to `rho = sqrt(1 - a^(1/3))`,
   * the same share on every edge.
   */
  const DOME: AutoMovieHumanTrunkBuild.IMassLaw["profile"] = [0.25, 0.5, 0.75, 0.95].map(
    (a: number): AutoMovieHumanTrunkBuild.IMassLaw["profile"][number] => {
      const rho: number = Math.sqrt(1 - a ** (1 / 3));
      return { at: a, shares: [rho, rho, rho, rho] };
    },
  );

  /**
   * Interim accessor: the left breast's law from today's breast pieces: its
   * axis through today's bust point (`IAutoMovieHumanTrunkLandmarks.bustPoint`),
   * its footprint today's (`AutoMovieHumanBreastFootprint`: the lateral half
   * width a share of the bust point's place off the midline, the lower reach
   * to the inframammary fold and the upper reach a multiple of it), its
   * profile today's dome. The amplitude is the published outline difference:
   * the chest depth less the chest wall's at the underbust
   * (`AutoMovieHumanChestWall`), so the base and the breast never count the
   * bust twice; none where it is not positive. Owed laws: the breast's
   * footprint and profile.
   */
  export function breast(
    solution: IAutoMovieHumanTrunkSolution,
    measures: IAutoMovieHumanBodyMeasures,
    scale: number,
    laws: AutoMovieHumanTrunkViews.ILaws,
    fold: number,
  ): AutoMovieHumanTrunkBuild.IMassLaw | null {
    const l: IAutoMovieHumanTrunkSolution["landmarks"] = solution.landmarks;
    const wall: number = laws.chestWall(measures.underbustCircumference * scale).depth;
    const amplitude: number = measures.chestDepth * scale - wall;
    if (!(amplitude > 0)) return null;
    const width: number = solution.column.at(l.bust).width;
    const print: AutoMovieHumanBreastFootprint.IFootprint = AutoMovieHumanBreastFootprint.create(Math.min(0.8 * width, (measures.bustPointWidth * scale) / 2), l.bust - l.fold);
    return {
      target: [l.bustPoint[0], l.bustPoint[1], l.bustPoint[2]],
      up: [0, 1, 0],
      footprint: [print.upper, print.half, print.lower, print.half],
      amplitude,
      profile: DOME,
      shoulder: Math.SQRT2 - 1,
      fold,
    };
  }

  /**
   * Interim accessor: the left gluteal mass's law from today's gluteal
   * pieces: its centre on the base's back at the buttock point's height,
   * across at today's apex share of the half width
   * (`AutoMovieHumanGlutealDome.LATERAL`), its footprint today's (from
   * `MEDIAL` to `OUTER` of the half width across, from the crotch up to
   * iliocristale), its profile today's dome. The amplitude is the published
   * outline difference, the buttock depth less the natural waist's (#3047).
   * Owed laws: the gluteal mass's footprint and profile.
   */
  export function gluteal(
    solution: IAutoMovieHumanTrunkSolution,
    measures: IAutoMovieHumanBodyMeasures,
    scale: number,
    laws: AutoMovieHumanTrunkViews.ILaws,
    fold: number,
  ): AutoMovieHumanTrunkBuild.IMassLaw | null {
    const l: IAutoMovieHumanTrunkSolution["landmarks"] = solution.landmarks;
    const amplitude: number = (measures.buttockDepth - measures.waistDepth) * scale;
    if (!(amplitude > 0)) return null;
    const width: number = solution.column.at(l.buttock).width;
    const D: typeof AutoMovieHumanGlutealDome = AutoMovieHumanGlutealDome;
    return {
      target: [laws.back(l.buttock), l.buttock, D.LATERAL * width],
      up: [0, 1, 0],
      footprint: [l.iliocristale - l.buttock, (D.OUTER - D.LATERAL) * width, l.buttock - l.crotch, (D.LATERAL - D.MEDIAL) * width],
      amplitude,
      profile: DOME,
      shoulder: Math.SQRT2 - 1,
      fold,
    };
  }

  /** Interim accessor: every fold's radius, the old crotch fold's softness (`AutoMovieHumanTrunkInguinalFold.softness`). Owed law: the subcutaneous layer at each fold. */
  export function foldRadius(solution: IAutoMovieHumanTrunkSolution): number {
    return AutoMovieHumanTrunkInguinalFold.softness(solution.pitch, AutoMovieHumanTrunkRows.MAX_GAP);
  }

  /** Interim accessor: the ankle's least girth's height, the old shank law's least row (`AutoMovieHumanLegGirth.SHANK`). Owed law: the least-girth site. */
  export function ankleSite(knee: number, ankle: number): number {
    let least: readonly [number, number] = AutoMovieHumanLegGirth.SHANK[0]!;
    for (const row of AutoMovieHumanLegGirth.SHANK) if (row[1] < least[1]) least = row;
    return knee - least[0] * (knee - ankle);
  }

  /**
   * Interim accessor: the arm's and palm's site boxes read on today's arm and
   * palm chains (`AutoMovieHumanChainBox`): the biceps midway acromion to
   * olecranon (from the glenohumeral centre `(1/2 - ACROMION) / (1 - ACROMION
   * - RADIALE)` of the humerus, de Leva's shares in `AutoMovieHumanArmBones`),
   * the elbow at its centre, the wrist at stylion (`STYLION_WRIST` short of the
   * wrist centre), the knuckles at the third metacarpal's head. A site whose
   * point falls outside today's section is left out. Owed laws: the deltoid's
   * site and box, the forearm's site and bone place, the palm's thickness.
   */
  export function armSites(arm: IAutoMovieLoftChain, palm: IAutoMovieLoftChain, shoulder: Vec3, elbow: Vec3, wrist: Vec3, knuckle: Vec3): AutoMovieHumanArmWalk.ISiteLaw[] {
    const biceps: number = (1 / 2 - AutoMovieHumanArmBones.ACROMION) / (1 - AutoMovieHumanArmBones.ACROMION - AutoMovieHumanArmBones.RADIALE);
    const forearm: number = distance(wrist, elbow);
    const places: [string, number, number, Vec3, Vec3, IAutoMovieLoftChain][] = [
      ["biceps", 1, biceps, shoulder, elbow, arm],
      ["elbow", 2, 0, elbow, wrist, arm],
      ["wrist", 2, 1 - AutoMovieHumanArmBones.STYLION_WRIST / forearm, elbow, wrist, arm],
      ["knuckles", 3, 1, wrist, knuckle, palm],
    ];
    return places.flatMap(([site, b, share, from, to, on]: [string, number, number, Vec3, Vec3, IAutoMovieLoftChain]): AutoMovieHumanArmWalk.ISiteLaw[] => {
      const point: Vec3 = lerp(from, to, share);
      const [u, v]: [Vec3, Vec3] = chart(from, to, [1, 0, 0]);
      const box: AutoMovieHumanChainBox.IBox | null = AutoMovieHumanChainBox.at(on, point, u, v);
      return box === null ? [] : [{ site, bone: b, share, edges: box.edges, fullness: { shoulder: box.shoulder } }];
    });
  }

  /**
   * Interim accessor: a foot's sites' boxes read on today's foot chain
   * (`AutoMovieHumanChainBox`), on the foot's axis by its estimated yaw and
   * ankle place (`AutoMovieHumanFootPlaces`) through the ankle centre: the
   * heel half-way to the ankle's place, the
   * ankle's place, the instep (`instepLength`) and the ball
   * (`ballOfFootLength`), closing at the heel (pternion) and at the toes'
   * first rings, the farthest along the foot. Sites closer than the layer
   * spacing to the one before are one site. The axis stands at half the
   * lowest dorsum over the floor among the sites, read about today's
   * sections' own axis points. Owed laws: the foot's yaw, the ankle's place,
   * the dorsum's heights, the forefoot's end.
   */
  export function foot(
    name: "left" | "right",
    old: IAutoMovieLoftChain,
    toes: readonly IAutoMovieLoftChain[],
    d: AutoMovieHumanFootConstruction.IDimensions,
    ankle: Vec3,
    measures: IAutoMovieHumanBodyMeasures,
    scale: number,
  ): AutoMovieHumanFootPart.IInput {
    // The foot's axis turned out by its yaw, the heel behind the ankle
    // centre by the ankle's place along the foot (`AutoMovieHumanFootPlaces`,
    // estimated from the private reference set: no published source found).
    const sign: number = name === "left" ? 1 : -1;
    const yaw: number = (AutoMovieHumanFootPlaces.YAW * Math.PI) / 180;
    const along: Vec3 = [Math.cos(yaw), 0, sign * Math.sin(yaw)];
    const back: number = AutoMovieHumanFootPlaces.ankle(d.length / scale) * scale;
    const heel: Vec3 = [ankle[0] - along[0] * back, 0, ankle[2] - along[2] * back];
    const up: Vec3 = [0, 1, 0];
    const v: Vec3 = [along[2], 0, -along[0]];
    const at = (share: number, h: number): Vec3 => [heel[0] + along[0] * share * d.length, h, heel[2] + along[2] * share * d.length];
    const share = (p: Vec3): number => ((p[0] - heel[0]) * along[0] + (p[2] - heel[2]) * along[2]) / d.length;

    // The sites by rising share, merged where closer than a layer apart.
    const named: [string, number][] = [
      ["heel", back / d.length / 2],
      ["ankle", back / d.length],
      ["instep", (measures.instepLength * scale) / d.length],
      ["ball", (measures.ballOfFootLength * scale) / d.length],
    ];
    named.sort((p: [string, number], q: [string, number]): number => p[1] - q[1]);
    const kept: [string, number][] = [];
    for (const s of named) if (kept.length === 0 || (s[1] - kept[kept.length - 1]![1]) * d.length > AutoMovieHumanTrunkRows.MAX_GAP) kept.push(s);
    const end: number = Math.max(...toes.map((t: IAutoMovieLoftChain): number => share(AutoMovieLoftChain.axis(t, t.layers[0]!.y))));

    // The axis's height: half the lowest dorsum, read about today's axes.
    const dorsum: number[] = kept.flatMap(([, s]: [string, number]): number[] => {
      const b: AutoMovieHumanChainBox.IBox | null = AutoMovieHumanChainBox.at(old, at(s, d.ankle), up, v, true);
      return b === null ? [] : [b.centre[1] + b.edges[0]];
    });
    const height: number = dorsum.length === 0 ? d.ankle / 2 : Math.min(...dorsum) / 2;

    // Each site's box about the new axis, its sides in the law's order (up,
    // lateral, down, medial): the chart's v is medial on the left foot.
    const sites: { site: string; law: AutoMovieHumanFootPart.ISiteLaw }[] = kept.flatMap(([site, s]: [string, number]): { site: string; law: AutoMovieHumanFootPart.ISiteLaw }[] => {
      const b: AutoMovieHumanChainBox.IBox | null = AutoMovieHumanChainBox.at(old, at(s, height), up, v);
      if (b === null) return [];
      const e: [number, number, number, number] = b.edges;
      const edges: [number, number, number, number] = name === "left" ? [e[0], -e[3], e[2], -e[1]] : e;
      return [{ site, law: { share: s, edges, fullness: { shoulder: b.shoulder } } }];
    });
    return { name: `foot.${name}`, heel, along, height, length: d.length, poles: [0, Math.max(end, kept[kept.length - 1]![1] + AutoMovieHumanTrunkRows.MAX_GAP / d.length)], sites, side: name, order: 128, gap: AutoMovieHumanTrunkRows.MAX_GAP };
  }

  /**
   * Interim accessor: a digit's site laws read on today's digit chain
   * (`AutoMovieHumanChainBox`, about today's sections' own axis points), its
   * dorsal direction today's chain frame's `u` at its first section, its tip
   * today's pole past the distal end, or half the distal end's depth where
   * today's chain has none. A site today's chain cannot box takes its
   * neighbour's law. Owed laws: the digits' breadths, depths and pulp.
   */
  export function digitWalk(name: string, old: IAutoMovieLoftChain, centres: Vec3[]): AutoMovieHumanDigitWalk.IInput {
    const dorsal: Vec3 = AutoMovieLoftChain.frame(old, old.layers[0]!.y).u;
    const points: [string, Vec3, Vec3, Vec3][] = [["base", centres[0]!, centres[0]!, centres[1]!]];
    for (let k: number = 0; k + 1 < centres.length; k++) {
      points.push([`shaft ${k}`, lerp(centres[k]!, centres[k + 1]!, 0.5), centres[k]!, centres[k + 1]!]);
      points.push([k + 2 < centres.length ? `joint ${k + 1}` : "end", centres[k + 1]!, centres[k]!, centres[k + 1]!]);
    }
    const laws: Map<string, AutoMovieHumanDigitWalk.ISiteLaw> = new Map();
    let last: AutoMovieHumanDigitWalk.ISiteLaw | null = null;
    const missing: string[] = [];
    for (const [site, p, from, to] of points) {
      const [u, v]: [Vec3, Vec3] = chart(from, to, dorsal);
      const b: AutoMovieHumanChainBox.IBox | null = AutoMovieHumanChainBox.at(old, p, u, v, true);
      if (b === null) {
        if (last !== null) laws.set(site, last);
        else missing.push(site);
        continue;
      }
      const depth: number = b.edges[0] - b.edges[2];
      last = { breadth: b.edges[1] - b.edges[3], depth, dorsal: b.edges[0] / depth, shoulder: b.shoulder };
      laws.set(site, last);
      for (const m of missing.splice(0)) laws.set(m, last);
    }
    const end: Vec3 = centres[centres.length - 1]!;
    const tip: number = old.pole !== undefined ? distance(old.pole.point, end) : 0;
    return {
      name,
      centres,
      dorsal,
      // A dome over a section of depth D turns round over about D / 2 (a
      // hemisphere's reach), so the tip never stands nearer than that.
      tip: Math.max(tip, (laws.get("end")?.depth ?? 0) / 2),
      law: (site: string): AutoMovieHumanDigitWalk.ISiteLaw => {
        const found: AutoMovieHumanDigitWalk.ISiteLaw | undefined = laws.get(site);
        if (found === undefined) throw new Error(`Today's ${name} boxes no site at all`);
        return found;
      },
      order: 64,
      gap: 1,
    };
  }

  /**
   * A chart square to the segment from `from` to `to`: `u` the given
   * direction made square to it, `v = d x u` (as `AutoMovieHumanJointedAxis`).
   *
   * @param from Segment start.
   * @param to Segment end.
   * @param toward The direction `u` leans to.
   * @returns `[u, v]`.
   */
  function chart(from: Vec3, to: Vec3, toward: Vec3): [Vec3, Vec3] {
    const L: number = distance(to, from);
    const d: Vec3 = [(to[0] - from[0]) / L, (to[1] - from[1]) / L, (to[2] - from[2]) / L];
    const k: number = toward[0] * d[0] + toward[1] * d[1] + toward[2] * d[2];
    const r: Vec3 = [toward[0] - k * d[0], toward[1] - k * d[1], toward[2] - k * d[2]];
    const n: number = Math.hypot(...r);
    const u: Vec3 = [r[0] / n, r[1] / n, r[2] / n];
    return [u, [d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0]]];
  }

  /**
   * A toe's base inside the forefoot: back from today's first ring along the
   * toe's line by half the toe's first segment, so the toe runs into its host.
   *
   * @param first Today's first ring's axis point.
   * @param next The next centre along the toe.
   * @returns The base.
   */
  function behind(first: Vec3, next: Vec3): Vec3 {
    return [first[0] - (next[0] - first[0]) / 2, first[1] - (next[1] - first[1]) / 2, first[2] - (next[2] - first[2]) / 2];
  }

  /** A point between two. */
  function lerp(a: Vec3, b: Vec3, t: number): Vec3 {
    return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1]), a[2] + t * (b[2] - a[2])];
  }

  /** The distance of two points. */
  function distance(a: Vec3, b: Vec3): number {
    return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  }
}
