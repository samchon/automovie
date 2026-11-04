import { AutoMovieLoftChain, type AutoMovieLoftContract, type AutoMovieLoftFrame, type AutoMovieSolidJoin, type AutoMovieSolidVector, type IAutoMovieLoftChain, type IAutoMovieSolidSurface } from "@automovie/engine";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanArmWalk } from "./arm/AutoMovieHumanArmWalk";
import type { AutoMovieHumanArmBones } from "./arm/AutoMovieHumanArmBones";
import { AutoMovieHumanFootPart } from "./foot/AutoMovieHumanFootPart";
import type { AutoMovieHumanLegBones } from "./leg/AutoMovieHumanLegBones";
import { AutoMovieHumanLegWalk } from "./leg/AutoMovieHumanLegWalk";
import { AutoMovieHumanBranchMerges } from "./limb/AutoMovieHumanBranchMerges";
import { AutoMovieHumanDigitWalk } from "./limb/AutoMovieHumanDigitWalk";
import { AutoMovieHumanFoldJoin } from "./limb/AutoMovieHumanFoldJoin";
import { AutoMovieHumanFoldSeed } from "./limb/AutoMovieHumanFoldSeed";
import { AutoMovieHumanMergeEntry } from "./limb/AutoMovieHumanMergeEntry";
import type { AutoMovieHumanSiteViewPart } from "./limb/AutoMovieHumanSiteViewPart";
import { AutoMovieHumanTrunkBuild } from "./trunk/AutoMovieHumanTrunkBuild";

type Vec3 = AutoMovieSolidVector.Vec3;

/**
 * The body lane's subtree assembled (#3047 to #3051): every part built from
 * its views and every join made, published as chains and merge entries for
 * the calibration, from the laws the caller binds.
 *
 * Parts: the trunk with its breasts and gluteal masses
 * (`AutoMovieHumanTrunkBuild`), each leg as one walk over femur and tibia
 * (`AutoMovieHumanLegWalk`), each arm with its palm as one walk
 * (`AutoMovieHumanArmWalk`), each foot (`AutoMovieHumanFootPart`), each
 * finger, thumb and toe as one walk (`AutoMovieHumanDigitWalk`).
 *
 * Joins, each a solid merge along its fold (`AutoMovieHumanFoldJoin`), the
 * part being the solid whose station lines leave the host across the fold:
 * each leg onto the trunk (seeded at the inguinal fold, R the thigh's front
 * fat layer, capped at half the gap between the two legs' seeds so their
 * rails never cross at the perineum), each arm onto the trunk (seeded at the
 * axilla vault, R the arm's back fat layer and the chest's), each leg's
 * shank onto its foot (seeded at the ankle's front), the fingers onto the
 * arm's palm and the toes onto the foot (`AutoMovieHumanBranchMerges`).
 *
 * A part that fails is left out with its diagnostics, and every join that
 * names it is skipped, so the rest still assembles (`construction.md`:
 * generation never fails for a valid person).
 */
export namespace AutoMovieHumanBodyLane {
  /** A join's seed search and fold, calibration mm. */
  export interface IFold {
    /**
     * Where the seed is searched (`AutoMovieHumanFoldSeed`): the part's
     * phase, the shares of its station range from inside the host to
     * outside it, and the host's chart guess at the start.
     */
    search: { phi: number; from: number; to: number; host?: [number, number] };

    /** The fold's radius, mm. */
    radius: number;

    /** The widest chord either side, mm; absent, the lane's own cap for that join. */
    cap?: number;
  }

  /** One side's limbs and extremities. */
  export interface ISide {
    /** The leg's bones and its sites' laws. */
    leg: { bones: Pick<AutoMovieHumanLegBones.IBones, "hip" | "knee" | "ankle">; law: (site: string) => AutoMovieHumanLegWalk.ISiteLaw; trunk: IFold; foot: IFold };

    /** The arm's bones, the palm's last centre and reach, its sites' laws and joints, its fold onto the trunk. */
    arm: {
      bones: Pick<AutoMovieHumanArmBones.IBones, "shoulder" | "elbow" | "wrist">;
      knuckle: Vec3;
      reach: number;
      sites: AutoMovieHumanArmWalk.ISiteLaw[];
      joints: { elbow: number; wrist: number };
      trunk: IFold;
    };

    /** The foot. */
    foot: AutoMovieHumanFootPart.IInput;

    /** The fingers and the thumb, each with its web's fold onto the palm. */
    fingers: IDigit[];

    /** The toes, each with its web's fold onto the forefoot. */
    toes: IDigit[];
  }

  /** What the lane is built from. */
  export interface IInput {
    /** The trunk's build. */
    trunk: AutoMovieHumanTrunkBuild.IInput;

    /** Both sides. */
    sides: Record<"left" | "right", ISide>;

    /** Widest spacing between layers of the limbs, mm. */
    gap: number;
  }

  /** The assembled subtree. */
  export interface IOutput {
    /** Every part's chain and every blend's. */
    chains: IAutoMovieLoftChain[];

    /** Every join's merge entry. */
    merges: IAutoMovieHumanBodyCalibration.IMerge[];

    /** Every broken premise. */
    diagnostics: AutoMovieLoftContract.IDiagnostic[];
  }

  /** A built part: its chain and its surface. */
  interface IBuilt {
    /** The chain. */
    chain: IAutoMovieLoftChain;

    /** Its surface. */
    surface: IAutoMovieSolidSurface;
  }

  /** A digit's input and its web's fold. */
  export interface IDigit {
    /** The digit. */
    digit: AutoMovieHumanDigitWalk.IInput;

    /** Its web's fold onto the host. */
    fold: IFold;
  }

  /** A built digit, or null where it failed, with its fold. */
  interface IBranch {
    /** The digit's part. */
    part: IBuilt | null;

    /** Its web's fold. */
    fold: IFold;
  }

  /** The joins' trace limits and sampling, as the trunk's masses take them (`AutoMovieHumanTrunkBuild`). */
  const LIMITS: { count: number; tolerance: number; grazing: number; columns: number } = { count: 64, tolerance: 1e-6, grazing: Math.asin(0.01), columns: 64 };

  /**
   * Assemble the body lane.
   *
   * @param input The trunk, both sides' parts and their folds.
   * @returns The chains, the merges and the diagnostics.
   */
  export function create(input: IInput): IOutput {
    const diagnostics: AutoMovieLoftContract.IDiagnostic[] = [];
    const chains: IAutoMovieLoftChain[] = [];
    const merges: IAutoMovieHumanBodyCalibration.IMerge[] = [];

    // A built part's chain and surface, or null with its diagnostics.
    const built = (result: AutoMovieHumanSiteViewPart.IResult): IBuilt | null => {
      diagnostics.push(...result.diagnostics);
      const chain: IAutoMovieLoftChain | null = result.loft?.chain ?? null;
      const surface: IAutoMovieSolidSurface | null = result.loft?.surface ?? null;
      if (chain === null || surface === null) return null;
      chains.push(chain);
      return { chain, surface };
    };

    // A fold's seed on the built part and host.
    const seed = (part: IBuilt, host: IBuilt, fold: IFold): AutoMovieHumanFoldSeed.ISeed | null => {
      const first: number = part.chain.layers[0]!.y;
      const last: number = part.chain.layers[part.chain.layers.length - 1]!.y;
      const at = (share: number): number => first + share * (last - first);
      const start: Vec3 = part.surface.jet(at(fold.search.from), fold.search.phi).p as Vec3;
      const found: AutoMovieHumanFoldSeed.ISeed | null = AutoMovieHumanFoldSeed.of(part.surface, host.surface, fold.search.phi, at(fold.search.from), at(fold.search.to), fold.search.host ?? nearest(host.chain, start), LIMITS.tolerance);
      if (found === null) diagnostics.push({ producer: `fold.${part.chain.name}.${host.chain.name}`, level: 6, contract: "seed", detail: `the part's station line at phase ${fold.search.phi} does not leave the host between shares ${fold.search.from} and ${fold.search.to}` });
      return found;
    };

    // One fold join, published.
    const join = (part: IBuilt, host: IBuilt, fold: IFold, cap: number, found: AutoMovieHumanFoldSeed.ISeed | null = seed(part, host, fold)): void => {
      if (found === null) return;
      const result: AutoMovieSolidJoin.IResult = AutoMovieHumanFoldJoin.create({
        part: part.surface,
        host: host.surface,
        landmark: found.landmark,
        guess: found.guess,
        radius: (): number => fold.radius,
        cap: (): number => fold.cap ?? cap,
        count: LIMITS.count,
        tolerance: LIMITS.tolerance,
        grazing: LIMITS.grazing,
      });
      diagnostics.push(...result.diagnostics);
      if (result.join === null) return;
      const entry: AutoMovieHumanMergeEntry.IEntry | null = AutoMovieHumanMergeEntry.of(`blend.${part.chain.name}.${host.chain.name}`, host.chain.name, part.chain.name, result.join, LIMITS.columns, input.gap, false, diagnostics);
      if (entry === null) return;
      chains.push(entry.chain);
      merges.push(entry.merge);
    };

    // The trunk and its masses.
    const trunk: AutoMovieHumanTrunkBuild.IOutput = AutoMovieHumanTrunkBuild.create(input.trunk);
    diagnostics.push(...trunk.diagnostics);
    if (trunk.trunk !== null) chains.push(trunk.trunk);
    chains.push(...trunk.chains);
    merges.push(...trunk.merges);
    const host: IBuilt | null = trunk.trunk !== null && trunk.surface !== null ? { chain: trunk.trunk, surface: trunk.surface } : null;

    // Every side's parts first: the legs' seeds are needed together.
    const parts: Record<"left" | "right", { leg: IBuilt | null; arm: IBuilt | null; foot: IBuilt | null; fingers: IBranch[]; toes: IBranch[] }> = {
      left: build("left"),
      right: build("right"),
    };
    function build(name: "left" | "right"): { leg: IBuilt | null; arm: IBuilt | null; foot: IBuilt | null; fingers: IBranch[]; toes: IBranch[] } {
      const side: ISide = input.sides[name];
      const digits = (list: IDigit[]): IBranch[] => list.map((d: IDigit): IBranch => ({ part: built(AutoMovieHumanDigitWalk.create(d.digit)), fold: d.fold }));
      return {
        leg: built(AutoMovieHumanLegWalk.create(`leg.${name}`, side.leg.bones, side.leg.law, input.gap)),
        arm: built(AutoMovieHumanArmWalk.create(`arm.${name}`, side.arm.bones, side.arm.knuckle, side.arm.reach, side.arm.sites, side.arm.joints, input.gap)),
        foot: built(AutoMovieHumanFootPart.create(side.foot)),
        fingers: digits(side.fingers),
        toes: digits(side.toes),
      };
    }

    // The legs' seeds stand either side of the perineum: half their gap caps
    // both legs' chords, so the two host rails never cross.
    const legSeeds: Record<"left" | "right", AutoMovieHumanFoldSeed.ISeed | null> = {
      left: parts.left.leg !== null && host !== null ? seed(parts.left.leg, host, input.sides.left.leg.trunk) : null,
      right: parts.right.leg !== null && host !== null ? seed(parts.right.leg, host, input.sides.right.leg.trunk) : null,
    };
    const a: Vec3 | undefined = legSeeds.left?.landmark;
    const b: Vec3 | undefined = legSeeds.right?.landmark;
    const perineum: number = a !== undefined && b !== undefined ? Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) / 2 : input.sides.left.leg.trunk.radius;

    for (const name of ["left", "right"] as const) {
      const side: ISide = input.sides[name];
      const { leg, arm, foot, fingers, toes } = parts[name];

      // The joins of the side, each skipped where a part is missing.
      if (leg !== null && host !== null) join(leg, host, side.leg.trunk, perineum, legSeeds[name]);
      if (arm !== null && host !== null) join(arm, host, side.arm.trunk, side.arm.trunk.radius);
      if (leg !== null && foot !== null) join(leg, foot, side.leg.foot, side.leg.foot.radius);
      const branches = (on: IBuilt | null, list: IBranch[]): void => {
        if (on === null) return;
        const out: AutoMovieHumanBranchMerges.IOutput = AutoMovieHumanBranchMerges.create(
          on,
          list.flatMap((branch: IBranch): AutoMovieHumanBranchMerges.IBranch[] => {
            if (branch.part === null) return [];
            const found: AutoMovieHumanFoldSeed.ISeed | null = seed(branch.part, on, branch.fold);
            return found === null ? [] : [{ chain: branch.part.chain, surface: branch.part.surface, landmark: found.landmark, guess: found.guess, radius: branch.fold.radius }];
          }),
          { ...LIMITS, gap: input.gap },
          diagnostics,
        );
        chains.push(...out.chains);
        merges.push(...out.merges);
      };
      branches(arm, fingers);
      branches(foot, toes);
    }
    return publishable(chains, merges, diagnostics);
  }

  /**
   * The chains and merges that can be published: a chain holding a
   * non-finite number in any layer (a section, a slope, a curvature, a plane
   * or its station derivatives) is left out with one diagnostic, and every
   * merge naming it with it, because the skin's station bisection over such a
   * chain never meets its tolerance (`construction.md`: a piece that cannot
   * keep its contract records one diagnostic and the figure is still made).
   *
   * @param chains The built chains.
   * @param merges The built merges.
   * @param diagnostics Where each dropped chain and merge is recorded.
   * @returns The finite chains and the merges whose chains all remain.
   */
  function publishable(chains: IAutoMovieLoftChain[], merges: IAutoMovieHumanBodyCalibration.IMerge[], diagnostics: AutoMovieLoftContract.IDiagnostic[]): IOutput {
    const finite = (values: readonly number[] | undefined): boolean => values === undefined || values.every(Number.isFinite);
    const plane = (f: AutoMovieLoftFrame.IFrame | undefined): boolean => f === undefined || [...f.origin, ...f.u, ...f.v].every(Number.isFinite);
    const sound = (c: IAutoMovieLoftChain): boolean =>
      c.layers.every(
        (l: IAutoMovieLoftChain.ILayer): boolean =>
          Number.isFinite(l.y) && finite(l.coefficients) && finite(l.slopes) && finite(l.curvatures) && finite(l.lift) && finite(l.liftSlopes) && plane(l.frame) && plane(l.frameSlopes) && plane(l.frameCurvatures),
      );
    const dropped: Set<string> = new Set();
    const kept: IAutoMovieLoftChain[] = chains.filter((c: IAutoMovieLoftChain): boolean => {
      if (sound(c)) return true;
      dropped.add(c.name);
      diagnostics.push({ producer: `lane.${c.name}`, level: 6, contract: "finite chain", detail: `${c.name} holds a non-finite number in a layer and is left out` });
      return false;
    });
    const joined: IAutoMovieHumanBodyCalibration.IMerge[] = merges.filter((m: IAutoMovieHumanBodyCalibration.IMerge): boolean => {
      const numbers: boolean = Number.isFinite(m.length) && m.across.every((a: [number, number]): boolean => a.every(Number.isFinite)) && (m.partAcross ?? []).every((a: [number, number]): boolean => a.every(Number.isFinite));
      if (numbers && !dropped.has(m.blend) && !dropped.has(m.host) && !dropped.has(m.part)) return true;
      diagnostics.push({ producer: `lane.${m.blend}`, level: 6, contract: "finite chain", detail: `the merge of ${m.part} onto ${m.host} names a chain left out` });
      return false;
    });
    return {
      chains: kept.filter((c: IAutoMovieLoftChain): boolean => !c.name.startsWith("blend.") || joined.some((m: IAutoMovieHumanBodyCalibration.IMerge): boolean => m.blend === c.name)),
      merges: joined,
      diagnostics,
    };
  }

  /**
   * A host's chart guess for a world point: the host layer whose plane's
   * origin stands nearest the point, and the point's polar angle about that
   * origin in the plane's axes (the phase of a view-lofted chain, `rule:
   * "polar"`). A guess only: the seed's foot points refine it by Newton.
   *
   * @param host The host chain.
   * @param p The point, mm.
   * @returns `[station, phase]`.
   */
  function nearest(host: IAutoMovieLoftChain, p: Vec3): [number, number] {
    let best: number = host.layers[0]!.y;
    let gap: number = Infinity;
    for (const layer of host.layers) {
      const o: Vec3 = AutoMovieLoftChain.frame(host, layer.y).origin;
      const d: number = Math.hypot(o[0] - p[0], o[1] - p[1], o[2] - p[2]);
      if (d < gap) {
        gap = d;
        best = layer.y;
      }
    }
    const f: AutoMovieLoftFrame.IFrame = AutoMovieLoftChain.frame(host, best);
    const r: Vec3 = [p[0] - f.origin[0], p[1] - f.origin[1], p[2] - f.origin[2]];
    const phase: number = Math.atan2(r[0] * f.v[0] + r[1] * f.v[1] + r[2] * f.v[2], r[0] * f.u[0] + r[1] * f.u[1] + r[2] * f.u[2]);
    return [best, phase < 0 ? phase + 2 * Math.PI : phase];
  }
}
