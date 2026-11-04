import { type AutoMovieLoftContract, type AutoMovieLoftFrame, type AutoMovieSolidJoin, AutoMovieSolidFoot, AutoMovieSolidVector, type IAutoMovieLoftChain, type IAutoMovieSolidSurface } from "@automovie/engine";
import type { IAutoMovieHumanBodyCalibration } from "../IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanFoldJoin } from "../limb/AutoMovieHumanFoldJoin";
import { AutoMovieHumanMassPart } from "../limb/AutoMovieHumanMassPart";
import { AutoMovieHumanMergeEntry } from "../limb/AutoMovieHumanMergeEntry";
import type { AutoMovieHumanSiteViewPart } from "../limb/AutoMovieHumanSiteViewPart";
import { AutoMovieHumanTrunkTape } from "./AutoMovieHumanTrunkTape";
import { AutoMovieHumanTrunkViewPart } from "./AutoMovieHumanTrunkViewPart";
import type { IAutoMovieHumanTrunkViews } from "./IAutoMovieHumanTrunkViews";

type Vec3 = AutoMovieSolidVector.Vec3;
const { add, scale } = AutoMovieSolidVector;

/**
 * The trunk subtree built and joined (#3047): the base lofted from its views,
 * the breasts and the gluteal masses as parts of their own on it, the base's
 * fullness at the chest and the buttock solved on the merged skin, and each
 * mass merged onto the base along its fold.
 *
 * Order. The masses stand on the base's surface and the chest and hip tapes
 * wrap base and masses together, so the build closes the two in two passes:
 * the base with the ellipse's shoulder at those two sites, the masses on it,
 * the two shoulders solved on the hull of the base's section and the masses'
 * level cuts (`AutoMovieHumanTrunkTape`), then the base again with them and
 * the masses again on it. A mass's place reads only the base's outlines near
 * its centre, which the shoulder moves little, so the second pass closes the
 * tapes to the rounding of the first.
 *
 * Masses. Each side is the same construction from the left side's law
 * mirrored (J6): the target point and the up direction reflected in the
 * median plane, the footprint and profile kept in their up, lateral, down
 * and medial naming, and the side's lateral direction (+Z on the left, -Z on
 * the right) handed to the part, which reads off its own frame which chart
 * side is lateral. Each stands on the base at the foot of its target (the
 * bust point, the buttock's most posterior point), along the base's normal
 * there.
 *
 * Folds. Each mass merges onto the base by `AutoMovieHumanFoldJoin`, seeded
 * at its footprint's lower edge on the base, its fold radius the caller's fat
 * layer, its width capped at half its smallest footprint edge (a fillet wider
 * than that swallows the mass) and at the gap from its footprint's medial edge
 * to the median plane (beyond it the pair's rails cross: the cleavage and the
 * cleft are corners the two-part merge does not close, operator gap 3). A
 * pair that reaches the median plane is reported and left unjoined.
 */
export namespace AutoMovieHumanTrunkBuild {
  /** A mass's law on the left side, in calibration mm. */
  export interface IMassLaw {
    /** The world point the mass's axis passes through, on the left. */
    target: Vec3;

    /** The up direction of its footprint. */
    up: Vec3;

    /** Footprint edges at the base, along up, lateral, down and medial, mm. */
    footprint: [number, number, number, number];

    /** Apex height over the base, mm: an outline difference from inputs. */
    amplitude: number;

    /** Profile: shares of the amplitude with the shares of the edges left there, as `AutoMovieHumanMassPart`. */
    profile: AutoMovieHumanMassPart.IInput["profile"];

    /** Sourced conic shoulder of its sections. */
    shoulder: number;

    /** The fold's radius under it: its fat layer, mm. */
    fold: number;
  }

  /** What the build reads. */
  export interface IInput {
    /** The base's views (`AutoMovieHumanTrunkViews.of`). */
    views: IAutoMovieHumanTrunkViews;

    /** The tapes that wrap the merged skin, mm: the chest over the breasts, the hip over the gluteal masses. */
    tapes: { chest: number; hip: number };

    /** The breasts' law, or null where the amplitude leaves none. */
    breast: IMassLaw | null;

    /** The gluteal masses' law, or null. */
    gluteal: IMassLaw | null;
  }

  /** What the build publishes. */
  export interface IOutput {
    /** The base's chain, or null when it cannot be lofted. */
    trunk: IAutoMovieLoftChain | null;

    /** The base's surface, the host of the limbs' and the neck's merges, or null with the chain. */
    surface: IAutoMovieSolidSurface | null;

    /** The masses' chains and the blends' chains. */
    chains: IAutoMovieLoftChain[];

    /** One merge entry per joined mass. */
    merges: IAutoMovieHumanBodyCalibration.IMerge[];

    /** Every broken premise. */
    diagnostics: AutoMovieLoftContract.IDiagnostic[];
  }

  /** Traced points over each fold. */
  const COUNT: number = 64;

  /** Blend columns of each fold, a multiple of 4. */
  const COLUMNS: number = 64;

  /** Section controls and ring phases of a mass. */
  const MASS_ORDER: number = 128;

  /**
   * Largest gap accepted on a fold's curve and foot, mm: far under the
   * sections' own representation error (about 0.01 mm).
   */
  const TOLERANCE: number = 1e-6;

  /**
   * Least angle between the two skins along a fold, radians: where they meet
   * at angle `alpha`, the sections' representation error `e` (0.01 mm) moves
   * the curve by `e / sin(alpha)`, which stays under 1 mm only while
   * `alpha >= asin(0.01)`. Derived.
   */
  const GRAZING: number = Math.asin(0.01);

  /**
   * Build the trunk subtree.
   *
   * @param input The views, the merged tapes and the masses' laws.
   * @returns The chains, the merges and the diagnostics.
   */
  export function create(input: IInput): IOutput {
    const diagnostics: AutoMovieLoftContract.IDiagnostic[] = [];
    const out = (trunk: IAutoMovieLoftChain | null, surface: IAutoMovieSolidSurface | null, chains: IAutoMovieLoftChain[], merges: IAutoMovieHumanBodyCalibration.IMerge[]): IOutput => ({ trunk, surface, chains, merges, diagnostics });

    // Pass 1: the base with the ellipse's shoulders, the masses on it.
    const first: AutoMovieHumanSiteViewPart.IResult = AutoMovieHumanTrunkViewPart.create(input.views);
    if (first.loft === null || first.loft.surface === null) {
      diagnostics.push(...first.diagnostics);
      return out(null, null, [], []);
    }
    const masses1: IMass[] = masses(input, first.loft.surface, []);

    // The tapes over the merged skin set the base's shoulders at the chest and
    // the buttock; the base again with them.
    const solved: IAutoMovieHumanTrunkViews = {
      ...input.views,
      sites: input.views.sites.map((s: IAutoMovieHumanTrunkViews.ISite): IAutoMovieHumanTrunkViews.ISite => {
        const kind: "breast" | "gluteal" | null = s.site === "chest" ? "breast" : s.site === "buttock" ? "gluteal" : null;
        if (kind === null) return s;
        const depth: number = (s.front - s.back) / 2;
        const tape: AutoMovieHumanTrunkTape.IResult = AutoMovieHumanTrunkTape.solve({
          producer: `view.trunk ${s.site}`,
          y: s.y,
          origin: [(s.front + s.back) / 2, 0],
          box: { extents: [depth, s.half, depth, s.half] },
          masses: masses1.filter((m: IMass): boolean => m.kind === kind).map((m: IMass): AutoMovieHumanTrunkTape.IMass => ({ surface: m.surface, stations: m.stations })),
          tape: kind === "breast" ? input.tapes.chest : input.tapes.hip,
        });
        diagnostics.push(...tape.diagnostics);
        return tape.shoulder === null ? s : { ...s, fullness: { shoulder: tape.shoulder } };
      }),
    };
    const base: AutoMovieHumanSiteViewPart.IResult = AutoMovieHumanTrunkViewPart.create(solved);
    diagnostics.push(...base.diagnostics);
    const trunk: IAutoMovieLoftChain | null = base.loft?.chain ?? null;
    const host: IAutoMovieSolidSurface | null = base.loft?.surface ?? null;
    if (trunk === null || host === null) return out(null, null, [], []);

    // Pass 2: the masses on the solved base, each merged along its fold.
    const chains: IAutoMovieLoftChain[] = [];
    const merges: IAutoMovieHumanBodyCalibration.IMerge[] = [];
    for (const m of masses(input, host, diagnostics)) {
      chains.push(m.chain);
      const join: AutoMovieSolidJoin.IResult = AutoMovieHumanFoldJoin.create({
        part: m.surface,
        host,
        landmark: m.fold,
        guess: { part: [m.footprintStation, Math.PI], host: m.hostGuess },
        radius: (): number => m.law.fold,
        cap: (): number => m.cap,
        count: COUNT,
        tolerance: TOLERANCE,
        grazing: GRAZING,
      });
      diagnostics.push(...join.diagnostics);
      if (join.join === null) continue;
      const entry: AutoMovieHumanMergeEntry.IEntry | null = AutoMovieHumanMergeEntry.of(`blend.${m.chain.name}`, trunk.name, m.chain.name, join.join, COLUMNS, AutoMovieHumanTrunkViewPart.GAP, false, diagnostics);
      if (entry === null) continue;
      chains.push(entry.chain);
      merges.push(entry.merge);
    }
    return out(trunk, host, chains, merges);
  }

  /** A built mass. */
  interface IMass {
    /** Which pair it belongs to. */
    kind: "breast" | "gluteal";

    /** Its law, this side's. */
    law: IMassLaw;

    /** Its chain. */
    chain: IAutoMovieLoftChain;

    /** Its surface. */
    surface: IAutoMovieSolidSurface;

    /** Its first and last station, mm. */
    stations: [number, number];

    /** The station of its footprint at the base's surface, mm. */
    footprintStation: number;

    /** The fold's seed landmark: the footprint's lower edge on the base. */
    fold: Vec3;

    /** The base's chart guess at the landmark. */
    hostGuess: [number, number];

    /** The fold's width cap, mm. */
    cap: number;
  }

  /**
   * Both sides of every mass on a base.
   *
   * @param input The laws.
   * @param host The base's surface.
   * @param diagnostics Where a failed mass is recorded; a pass that only reads the masses for the tapes passes a list it drops.
   * @returns The masses that built.
   */
  function masses(input: IInput, host: IAutoMovieSolidSurface, diagnostics: AutoMovieLoftContract.IDiagnostic[]): IMass[] {
    const out: IMass[] = [];
    const pairs: ["breast" | "gluteal", IMassLaw | null][] = [
      ["breast", input.breast],
      ["gluteal", input.gluteal],
    ];
    for (const [kind, law] of pairs) {
      if (law === null) continue;

      // A pair whose footprints reach the median plane meets itself there:
      // the corner the two-part merge does not close.
      const clearance: number = law.target[2] - law.footprint[3];
      if (!(clearance > 0)) {
        diagnostics.push({ producer: `mass.${kind}`, level: 3, contract: "pair", detail: `the footprint's medial edge ${law.footprint[3]} mm reaches the median plane from ${law.target[2]} mm: the pair meets itself, a corner left open` });
        continue;
      }
      for (const side of ["left", "right"] as const) {
        const own: IMassLaw = side === "left" ? law : mirror(law);
        const name: string = `${kind}.${side}`;
        const foot: AutoMovieSolidFoot.IFoot | null = AutoMovieSolidFoot.of(host, own.target, guess(own.target), TOLERANCE);
        if (foot === null) {
          diagnostics.push({ producer: `mass.${name}`, level: 3, contract: "centre", detail: `no foot of the target [${own.target.join(", ")}] on the base` });
          continue;
        }
        const built: AutoMovieHumanSiteViewPart.IResult = AutoMovieHumanMassPart.create({
          name,
          host,
          centre: [foot.u, foot.v],
          up: own.up,
          lateral: [0, 0, side === "left" ? 1 : -1],
          footprint: own.footprint,
          amplitude: own.amplitude,
          profile: own.profile,
          shoulder: own.shoulder,
          order: MASS_ORDER,
          samples: MASS_ORDER,
          gap: AutoMovieHumanTrunkViewPart.GAP,
        });
        diagnostics.push(...built.diagnostics);
        if (built.loft?.chain === null || built.loft?.chain === undefined || built.loft.surface === null || built.part === null) continue;
        const stations: number[] = built.part.stations;
        const footprintStation: number = built.part.front.positive.knots.find((k: { site: string }): boolean => k.site === "footprint")!.station;

        // The fold's landmark: the base under the footprint's lower edge.
        const frame: AutoMovieLoftFrame.IFrame = built.part.axis.at(footprintStation);
        const low: Vec3 = add(frame.origin as Vec3, scale(frame.u as Vec3, -own.footprint[2]));
        const onBase: AutoMovieSolidFoot.IFoot | null = AutoMovieSolidFoot.of(host, low, [foot.u, foot.v], TOLERANCE);
        if (onBase === null) {
          diagnostics.push({ producer: `mass.${name}`, level: 3, contract: "fold", detail: "no foot of the footprint's lower edge on the base" });
          continue;
        }
        out.push({
          kind,
          law: own,
          chain: built.loft.chain,
          surface: built.loft.surface,
          stations: [stations[0]!, stations[stations.length - 1]!],
          footprintStation,
          fold: onBase.point as Vec3,
          hostGuess: [onBase.u, onBase.v],
          cap: Math.min(Math.min(...own.footprint) / 2, clearance),
        });
      }
    }
    return out;
  }

  /**
   * A left law on the right side (J6): the target and up reflected in the
   * median plane; the edges keep their lateral and medial naming.
   *
   * @param law The left side's law.
   * @returns The right side's.
   */
  function mirror(law: IMassLaw): IMassLaw {
    const flip = (p: Vec3): Vec3 => [p[0], p[1], -p[2]];
    return { ...law, target: flip(law.target), up: flip(law.up) };
  }

  /**
   * The base's chart guess for a world point: its height as the station and
   * its polar angle about the vertical through the body frame's origin as the
   * phase (the base is level, `u` +X and `v` +Z). Its axis stands within a
   * few centimetres of that vertical, so the guess falls in the target's
   * region and the foot's Newton steps close the rest.
   *
   * @param p The point.
   * @returns `[station, phase]`.
   */
  function guess(p: Vec3): [number, number] {
    const phase: number = Math.atan2(p[2], p[0]);
    return [p[1], phase < 0 ? phase + 2 * Math.PI : phase];
  }
}
