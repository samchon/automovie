import type { AutoMovieLoftContract, AutoMovieLoftFrame, AutoMovieSolidBody, AutoMovieSolidVector, IAutoMovieLoftChain } from "@automovie/engine";
import type { AutoMovieConstructionNode, IAutoMovieConstructionView } from "@automovie/interface";
import { AutoMovieHumanBodyTree } from "./AutoMovieHumanBodyTree";
import { AutoMovieHumanArmWalk } from "./arm/AutoMovieHumanArmWalk";
import type { AutoMovieHumanArmBones } from "./arm/AutoMovieHumanArmBones";
import { AutoMovieHumanFootPart } from "./foot/AutoMovieHumanFootPart";
import type { AutoMovieHumanLegBones } from "./leg/AutoMovieHumanLegBones";
import { AutoMovieHumanLegWalk } from "./leg/AutoMovieHumanLegWalk";
import { AutoMovieHumanDigitWalk } from "./limb/AutoMovieHumanDigitWalk";
import type { AutoMovieHumanSiteViewPart } from "./limb/AutoMovieHumanSiteViewPart";
import { AutoMovieHumanTrunkBuild } from "./trunk/AutoMovieHumanTrunkBuild";

type Vec3 = AutoMovieSolidVector.Vec3;

/**
 * The body lane's subtree (#3047 to #3051) as one construction tree realized
 * by the engine (`AutoMovieHumanBodyTree`): every part a view node built from
 * its views, every join a merge node with a search seed and fold widths,
 * published as chains and the realized body for the calibration, from the laws
 * the caller binds.
 *
 * Parts: the trunk with its breasts and gluteal masses
 * (`AutoMovieHumanTrunkBuild`), each leg as one walk over femur and tibia
 * (`AutoMovieHumanLegWalk`), each arm with its palm as one walk
 * (`AutoMovieHumanArmWalk`), each foot (`AutoMovieHumanFootPart`), each
 * finger, thumb and toe as one walk (`AutoMovieHumanDigitWalk`).
 *
 * Joins, the part being the solid whose station lines leave the host across
 * the fold, the host the whole subtree built before it: the masses onto the
 * trunk; each toe onto its foot, the leg onto that foot (seeded at the
 * ankle's front), and the leg with its foot onto the trunk (seeded at the
 * inguinal fold, R the thigh's front fat layer, capped at half the gap between
 * the two hip centres so the two legs' rails never cross at the perineum);
 * each digit onto its arm's palm, and the arm with its hand onto the trunk
 * (seeded at the axilla vault). A digit's or a toe's web is capped at half
 * the gap to its nearest neighbour's base, so neighbouring webs' rails never
 * cross.
 *
 * A part that fails is left out with its diagnostics, and every join that
 * names it is skipped, so the rest still assembles (`construction.md`:
 * generation never fails for a valid person); the engine leaves out a join
 * that cannot keep its premises with its part's subtree, and names it.
 */
export namespace AutoMovieHumanBodyLane {
  /** A join's seed search and fold, calibration mm. */
  export interface IFold {
    /** Where the seed is searched: the part's phase and the shares of its station range from inside the host to outside it. */
    search: { phi: number; from: number; to: number };

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

    /** The realized body of trimmed faces, every face a chain of `chains`. */
    bodies: AutoMovieSolidBody.IPublished[];

    /** Every broken premise. */
    diagnostics: AutoMovieLoftContract.IDiagnostic[];
  }

  /** A digit's input and its web's fold. */
  export interface IDigit {
    /** The digit. */
    digit: AutoMovieHumanDigitWalk.IInput;

    /** Its web's fold onto the host. */
    fold: IFold;
  }

  /**
   * The joins' trace limits: 64 traced points and blend columns per fold; a
   * curve gap far under the sections' own representation error (about
   * 0.01 mm); and the least angle between the two skins, asin(0.01), under
   * which that error `e` moves the curve by `e / sin(alpha)` past 1 mm.
   */
  const LIMITS: Omit<AutoMovieHumanBodyTree.ILimits, "gap"> = { count: 64, tolerance: 1e-6, grazing: Math.asin(0.01) };

  /**
   * Assemble the body lane.
   *
   * @param input The trunk, both sides' parts and their folds.
   * @returns The chains, the realized body and the diagnostics.
   */
  export function create(input: IInput): IOutput {
    const diagnostics: AutoMovieLoftContract.IDiagnostic[] = [];
    const limits: AutoMovieHumanBodyTree.ILimits = { ...LIMITS, gap: input.gap };
    const view = (result: AutoMovieHumanSiteViewPart.IResult): IAutoMovieConstructionView | null => {
      diagnostics.push(...result.diagnostics);
      return result.view;
    };
    const fold = (part: AutoMovieConstructionNode, partFace: string, hostFace: string, f: IFold, cap: number): AutoMovieHumanBodyTree.IFold => ({
      part,
      partFace,
      hostFace,
      search: { phase: f.search.phi, from: f.search.from, to: f.search.to },
      radius: f.radius,
      cap: f.cap ?? cap,
    });

    // The trunk and its masses.
    const trunk: AutoMovieHumanTrunkBuild.IOutput = AutoMovieHumanTrunkBuild.create(input.trunk);
    diagnostics.push(...trunk.diagnostics);
    if (trunk.trunk === null) return publishable([], [], diagnostics);
    let root: AutoMovieConstructionNode = trunk.trunk;
    for (const mass of trunk.masses) root = AutoMovieHumanBodyTree.join(root, mass, limits);

    // The legs' rails stay either side of the perineum.
    const hips: [Vec3, Vec3] = [input.sides.left.leg.bones.hip, input.sides.right.leg.bones.hip];
    const perineum: number = distance(hips[0], hips[1]) / 2;

    for (const name of ["left", "right"] as const) {
      const side: ISide = input.sides[name];

      // A host and its digits: each web capped at half the gap to its
      // nearest neighbour's base.
      const branches = (host: IAutoMovieConstructionView, list: IDigit[]): AutoMovieConstructionNode => {
        let tree: AutoMovieConstructionNode = host;
        list.forEach((d: IDigit): void => {
          const digit: IAutoMovieConstructionView | null = view(AutoMovieHumanDigitWalk.create(d.digit));
          if (digit === null) return;
          const base: Vec3 = d.digit.centres[0]!;
          const nearest: number = Math.min(...list.filter((o: IDigit): boolean => o !== d).map((o: IDigit): number => distance(base, o.digit.centres[0]!)));
          tree = AutoMovieHumanBodyTree.join(tree, fold(digit, digit.name, host.name, d.fold, Number.isFinite(nearest) ? nearest / 2 : d.fold.radius), limits);
        });
        return tree;
      };

      // The leg on its foot and toes, then onto the trunk.
      const leg: IAutoMovieConstructionView | null = view(AutoMovieHumanLegWalk.create(`leg.${name}`, side.leg.bones, side.leg.law, input.gap));
      const foot: IAutoMovieConstructionView | null = view(AutoMovieHumanFootPart.create(side.foot));
      if (leg !== null) {
        const lower: AutoMovieConstructionNode =
          foot === null ? leg : AutoMovieHumanBodyTree.join(branches(foot, side.toes), fold(leg, leg.name, foot.name, side.leg.foot, side.leg.foot.radius), limits);
        root = AutoMovieHumanBodyTree.join(root, fold(lower, leg.name, trunk.trunk.name, side.leg.trunk, perineum), limits);
      }

      // The arm with its hand onto the trunk.
      const arm: IAutoMovieConstructionView | null = view(
        AutoMovieHumanArmWalk.create(`arm.${name}`, side.arm.bones, side.arm.knuckle, side.arm.reach, side.arm.sites, side.arm.joints, input.gap),
      );
      if (arm !== null) root = AutoMovieHumanBodyTree.join(root, fold(branches(arm, side.fingers), arm.name, trunk.trunk.name, side.arm.trunk, side.arm.trunk.radius), limits);
    }
    const realized: AutoMovieHumanBodyTree.IOutput = AutoMovieHumanBodyTree.realize("body", root, limits, diagnostics);
    return publishable(realized.chains, [realized.body], diagnostics);
  }

  /**
   * The chains and bodies that can be published: a chain holding a
   * non-finite number in any layer (a section, a slope, a curvature, a plane
   * or its station derivatives) is left out with one diagnostic, and every
   * body naming it with it, because the skin's station bisection over such a
   * chain never meets its tolerance (`construction.md`: a piece that cannot
   * keep its contract records one diagnostic and the figure is still made).
   *
   * @param chains The built chains.
   * @param bodies The realized bodies; one naming a chain left out is left out with it.
   * @param diagnostics Where each dropped chain and body is recorded.
   * @returns The finite chains and the bodies whose chains all remain.
   */
  function publishable(
    chains: IAutoMovieLoftChain[],
    bodies: AutoMovieSolidBody.IPublished[],
    diagnostics: AutoMovieLoftContract.IDiagnostic[],
  ): IOutput {
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
    return {
      chains: kept,
      bodies: bodies.filter((b: AutoMovieSolidBody.IPublished): boolean => {
        const lost: string[] = b.faces.map((f: AutoMovieSolidBody.IPublished["faces"][number]): string => f.chain).filter((n: string): boolean => dropped.has(n));
        if (lost.length === 0) return true;
        diagnostics.push({ producer: `lane.${b.name}`, level: 6, contract: "finite chain", detail: `the body names ${lost.join(", ")}, chains left out, so it is left out` });
        return false;
      }),
      diagnostics,
    };
  }

  /** The distance of two points, mm. */
  function distance(a: Vec3, b: Vec3): number {
    return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  }
}
