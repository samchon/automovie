import { type AutoMovieLoftContract, AutoMovieSolidFoot, type AutoMovieSolidVector, type IAutoMovieLoftChain, type IAutoMovieSolidSurface } from "@automovie/engine";
import type { IAutoMovieConstructionView } from "@automovie/interface";
import type { AutoMovieHumanBodyTree } from "../AutoMovieHumanBodyTree";
import { AutoMovieHumanMassPart } from "../limb/AutoMovieHumanMassPart";
import type { AutoMovieHumanSiteViewPart } from "../limb/AutoMovieHumanSiteViewPart";
import { AutoMovieHumanTrunkTape } from "./AutoMovieHumanTrunkTape";
import { AutoMovieHumanTrunkViewPart } from "./AutoMovieHumanTrunkViewPart";
import type { IAutoMovieHumanTrunkViews } from "./IAutoMovieHumanTrunkViews";

type Vec3 = AutoMovieSolidVector.Vec3;

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
 * bust point, the buttock's most posterior point), along the base's normal levelled
 * there.
 *
 * Folds. Each mass is a fold onto the base for the body's construction tree
 * (`AutoMovieHumanBodyTree`), its seed searched along the mass's lower station
 * line (the footprint's lower edge) from inside the base out, its fold radius the caller's fat
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
    /** The base's view node, or null when it cannot be lofted. */
    trunk: IAutoMovieConstructionView | null;

    /** Each mass's fold onto the base, for the body's tree. */
    masses: AutoMovieHumanBodyTree.IFold[];

    /** Every broken premise. */
    diagnostics: AutoMovieLoftContract.IDiagnostic[];
  }

  /** Section controls and ring phases of a mass. */
  const MASS_ORDER: number = 128;

  /**
   * Largest gap accepted on a fold's curve and foot, mm: far under the
   * sections' own representation error (about 0.01 mm).
   */
  const TOLERANCE: number = 1e-6;

  /**
   * Build the trunk subtree.
   *
   * @param input The views, the merged tapes and the masses' laws.
   * @returns The chains, the merges and the diagnostics.
   */
  export function create(input: IInput): IOutput {
    const diagnostics: AutoMovieLoftContract.IDiagnostic[] = [];
    const out = (trunk: IAutoMovieConstructionView | null, masses: AutoMovieHumanBodyTree.IFold[]): IOutput => ({ trunk, masses, diagnostics });

    // Pass 1: the base with the ellipse's shoulders, the masses on it.
    const first: AutoMovieHumanSiteViewPart.IResult = AutoMovieHumanTrunkViewPart.create(input.views);
    if (first.loft === null || first.loft.surface === null) {
      diagnostics.push(...first.diagnostics);
      return out(null, []);
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
    const host: IAutoMovieSolidSurface | null = base.loft?.surface ?? null;
    if (base.view === null || host === null) return out(null, []);

    // Pass 2: the masses on the solved base, each a fold onto it whose seed
    // is searched along the mass's lower station line (phase pi, the
    // footprint's lower edge) from inside the base out to the apex.
    const folds: AutoMovieHumanBodyTree.IFold[] = masses(input, host, diagnostics).map(
      (m: IMass): AutoMovieHumanBodyTree.IFold => ({
        part: m.view,
        partFace: m.chain.name,
        hostFace: AutoMovieHumanTrunkViewPart.NAME,
        search: { phase: Math.PI, from: 0, to: 1 },
        radius: m.law.fold,
        cap: m.cap,
      }),
    );
    return out(base.view, folds);
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

    /** Its view node. */
    view: IAutoMovieConstructionView;

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
          level: true,
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
            if (built.view === null) continue;
        const stations: number[] = built.part.stations;
        out.push({
          kind,
          law: own,
          chain: built.loft.chain,
          surface: built.loft.surface,
          view: built.view,
          stations: [stations[0]!, stations[stations.length - 1]!],
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
