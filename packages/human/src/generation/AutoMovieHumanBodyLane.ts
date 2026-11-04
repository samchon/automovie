import type { AutoMovieHumanLoftContract } from "../lofting/AutoMovieHumanLoftContract";
import type { AutoMovieHumanSolidJoin } from "../lofting/AutoMovieHumanSolidJoin";
import type { AutoMovieHumanSolidVector } from "../lofting/AutoMovieHumanSolidVector";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanSolidSurface } from "../lofting/IAutoMovieHumanSolidSurface";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanArmWalk } from "./arm/AutoMovieHumanArmWalk";
import type { AutoMovieHumanArmBones } from "./arm/AutoMovieHumanArmBones";
import { AutoMovieHumanFootPart } from "./foot/AutoMovieHumanFootPart";
import type { AutoMovieHumanLegBones } from "./leg/AutoMovieHumanLegBones";
import { AutoMovieHumanLegWalk } from "./leg/AutoMovieHumanLegWalk";
import { AutoMovieHumanBranchMerges } from "./limb/AutoMovieHumanBranchMerges";
import { AutoMovieHumanDigitWalk } from "./limb/AutoMovieHumanDigitWalk";
import { AutoMovieHumanFoldJoin } from "./limb/AutoMovieHumanFoldJoin";
import { AutoMovieHumanMergeEntry } from "./limb/AutoMovieHumanMergeEntry";
import type { AutoMovieHumanSiteViewPart } from "./limb/AutoMovieHumanSiteViewPart";
import { AutoMovieHumanTrunkBuild } from "./trunk/AutoMovieHumanTrunkBuild";

type Vec3 = AutoMovieHumanSolidVector.Vec3;

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
  /** A join's seed and fold, calibration mm. */
  export interface IFold {
    /** The fold's landmark on both skins. */
    landmark: Vec3;

    /** Chart guesses of its foot on the part and on the host. */
    guess: { part: [number, number]; host: [number, number] };

    /** The fold's radius, mm. */
    radius: number;

    /** The widest chord either side, mm; absent, the lane's own cap for that join. */
    cap?: number;
  }

  /** One side's limbs and extremities. */
  export interface ISide {
    /** The leg's bones and its sites' laws. */
    leg: { bones: AutoMovieHumanLegBones.IBones; law: (site: string) => AutoMovieHumanLegWalk.ISiteLaw; trunk: IFold; foot: IFold };

    /** The arm's bones, the palm's last centre and reach, its sites' laws and joints, its fold onto the trunk. */
    arm: {
      bones: AutoMovieHumanArmBones.IBones;
      knuckle: Vec3;
      reach: number;
      law: (site: string) => AutoMovieHumanArmWalk.ISiteLaw;
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
    chains: IAutoMovieHumanLoftChain[];

    /** Every join's merge entry. */
    merges: IAutoMovieHumanBodyCalibration.IMerge[];

    /** Every broken premise. */
    diagnostics: AutoMovieHumanLoftContract.IDiagnostic[];
  }

  /** A built part: its chain and its surface. */
  interface IBuilt {
    /** The chain. */
    chain: IAutoMovieHumanLoftChain;

    /** Its surface. */
    surface: IAutoMovieHumanSolidSurface;
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
    const diagnostics: AutoMovieHumanLoftContract.IDiagnostic[] = [];
    const chains: IAutoMovieHumanLoftChain[] = [];
    const merges: IAutoMovieHumanBodyCalibration.IMerge[] = [];

    // A built part's chain and surface, or null with its diagnostics.
    const built = (result: AutoMovieHumanSiteViewPart.IResult): IBuilt | null => {
      diagnostics.push(...result.diagnostics);
      const chain: IAutoMovieHumanLoftChain | null = result.loft?.chain ?? null;
      const surface: IAutoMovieHumanSolidSurface | null = result.loft?.surface ?? null;
      if (chain === null || surface === null) return null;
      chains.push(chain);
      return { chain, surface };
    };

    // One fold join, published.
    const join = (part: IBuilt, host: IBuilt, fold: IFold, cap: number): void => {
      const result: AutoMovieHumanSolidJoin.IResult = AutoMovieHumanFoldJoin.create({
        part: part.surface,
        host: host.surface,
        landmark: fold.landmark,
        guess: fold.guess,
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

    // The legs' seeds stand either side of the perineum: half their gap caps
    // both legs' chords, so the two host rails never cross.
    const seeds: Vec3[] = (["left", "right"] as const).map((s: "left" | "right"): Vec3 => input.sides[s].leg.trunk.landmark);
    const perineum: number = Math.hypot(seeds[0]![0] - seeds[1]![0], seeds[0]![1] - seeds[1]![1], seeds[0]![2] - seeds[1]![2]) / 2;

    for (const name of ["left", "right"] as const) {
      const side: ISide = input.sides[name];

      // The parts of the side.
      const leg: IBuilt | null = built(AutoMovieHumanLegWalk.create(`leg.${name}`, side.leg.bones, side.leg.law, input.gap));
      const arm: IBuilt | null = built(AutoMovieHumanArmWalk.create(`arm.${name}`, side.arm.bones, side.arm.knuckle, side.arm.reach, side.arm.law, side.arm.joints, input.gap));
      const foot: IBuilt | null = built(AutoMovieHumanFootPart.create(side.foot));
      const digits = (list: IDigit[]): IBranch[] => list.map((d: IDigit): IBranch => ({ part: built(AutoMovieHumanDigitWalk.create(d.digit)), fold: d.fold }));
      const fingers: IBranch[] = digits(side.fingers);
      const toes: IBranch[] = digits(side.toes);

      // The joins of the side, each skipped where a part is missing.
      if (leg !== null && host !== null) join(leg, host, side.leg.trunk, perineum);
      if (arm !== null && host !== null) join(arm, host, side.arm.trunk, side.arm.trunk.radius);
      if (leg !== null && foot !== null) join(leg, foot, side.leg.foot, side.leg.foot.radius);
      const branches = (on: IBuilt | null, list: IBranch[]): void => {
        if (on === null) return;
        const out: AutoMovieHumanBranchMerges.IOutput = AutoMovieHumanBranchMerges.create(
          on,
          list.flatMap((b: IBranch): AutoMovieHumanBranchMerges.IBranch[] =>
            b.part === null ? [] : [{ chain: b.part.chain, surface: b.part.surface, landmark: b.fold.landmark, guess: b.fold.guess, radius: b.fold.radius }],
          ),
          { ...LIMITS, gap: input.gap },
          diagnostics,
        );
        chains.push(...out.chains);
        merges.push(...out.merges);
      };
      branches(arm, fingers);
      branches(foot, toes);
    }
    return { chains, merges, diagnostics };
  }
}
