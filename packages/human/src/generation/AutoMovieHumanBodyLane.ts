import type { AutoMovieLoftContract, AutoMovieLoftFrame, AutoMovieSolidBody, AutoMovieSolidVector, IAutoMovieLoftChain } from "@automovie/engine";
import type { AutoMovieConstructionNode, IAutoMovieConstructionView } from "@automovie/interface";
import { AutoMovieHumanBodyTree } from "./AutoMovieHumanBodyTree";
import { AutoMovieHumanArmWalk } from "./arm/AutoMovieHumanArmWalk";
import type { AutoMovieHumanArmBones } from "./arm/AutoMovieHumanArmBones";
import { AutoMovieHumanFootPart } from "./foot/AutoMovieHumanFootPart";
import { AutoMovieHumanToePart } from "./foot/AutoMovieHumanToePart";
import type { AutoMovieHumanLegBones } from "./leg/AutoMovieHumanLegBones";
import { AutoMovieHumanLegWalk } from "./leg/AutoMovieHumanLegWalk";
import type { AutoMovieHumanHeadLane } from "./head/AutoMovieHumanHeadLane";
import { AutoMovieHumanDigitWalk } from "./limb/AutoMovieHumanDigitWalk";
import type { AutoMovieHumanSiteViewPart } from "./limb/AutoMovieHumanSiteViewPart";
import { AutoMovieHumanTrunkBuild } from "./trunk/AutoMovieHumanTrunkBuild";
import type { IAutoMovieHumanTrunkViews } from "./trunk/IAutoMovieHumanTrunkViews";

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
 * finger and thumb as a joint-normal walk (`AutoMovieHumanDigitWalk`), and
 * each toe in its fixed foot-axis observation planes (`AutoMovieHumanToePart`).
 *
 * Joins, the part being the solid whose station lines leave the host across
 * the fold, the host the whole subtree built before it: the masses onto the
 * trunk; each toe onto its foot, the leg onto that foot (seeded at the
 * ankle's front), and the leg with its foot onto the trunk (seeded at the
 * inguinal fold, R the caller's operational join softness, capped at half the gap between
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
      /** Palmar base-crease locus from the person's independent palm length. */
      crease?: Vec3;
      /** Actual radial hand-across direction for the WJC-to-MCP3 material transition. */
      radial: Vec3;
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
    toes: IToe[];
  }

  /** What the lane is built from. */
  export interface IInput {
    /** Earlier anatomical source failures, retained verbatim before any tree or join operation. */
    diagnostics?: readonly AutoMovieLoftContract.IDiagnostic[];

    /** The trunk's build. */
    trunk: AutoMovieHumanTrunkBuild.IInput;

    /** Both sides. */
    sides: Record<"left" | "right", ISide>;

    /** Widest spacing between layers of the limbs, mm. */
    gap: number;

    /** The head's subtree and its fold onto the trunk (`AutoMovieHumanHeadLane`); absent, no head. */
    head?: AutoMovieHumanHeadLane.IOutput;
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

  /** The actual production tree and source diagnostics, before any solid realization. */
  export interface IDefinition {
    /** The assembled production tree; null when its trunk definition failed. */
    root: AutoMovieConstructionNode | null;
    /** The exact limits the production realization consumes. */
    limits: AutoMovieHumanBodyTree.ILimits;
    /** Source-builder and tree-assembly premises; final join diagnostics do not exist yet. */
    diagnostics: AutoMovieLoftContract.IDiagnostic[];
    /** Actual named builder results, including null admissions and views absent from the final tree. */
    sources: AutoMovieHumanSiteViewPart.ISource[];
  }

  /** A digit's input and its web's fold. */
  export interface IDigit {
    /** The digit. */
    digit: AutoMovieHumanDigitWalk.IInput;

    /** Its web's fold onto the host. */
    fold: IFold;
  }

  /**
   * A toe's foot-axis skin source and its declared fold onto the forefoot.
   *
   * @evidence contracts/common.md#principled-implementation Keeps the fixed foot-observation source separate from a finger's joint-normal input.
   * @evidence contracts/common.md#clear-and-simple-design One toe input and fold are sufficient for the existing branch assembly.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No final join success, skeletal registration or missing-source substitute is encoded.
   * @evidence contracts/common.md#meaningful-documentation States source-plane ownership and distinguishes the pending fold from a realized attachment.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This declaration owns no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The branch builder owns source construction and sharing.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The definition caller owns the record and its source input.
   */
  export interface IToe {
    /** Fixed observation-plane input, distinct from a finger's bone-normal walk. */
    toe: AutoMovieHumanToePart.IInput;

    /** The source attachment's fold declaration; final realization remains separate. */
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
   * Assemble and fully realize the body lane through its shared definition.
   *
   * @param input The trunk, both sides' parts and their folds.
   * @returns The chains, the realized body and the diagnostics.
   */
  export function create(input: IInput): IOutput {
    return realize(define(input));
  }

  /**
   * Realize the exact production root returned by define, without rebuilding its parts.
   *
   * @evidence contracts/common.md#principled-implementation Sends the supplied definition's identical root and limits to the existing body-tree realizer.
   * @evidence contracts/common.md#clear-and-simple-design Keeps full solid realization separate from source construction.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing trunk retains its real failure and empty publication; no fixture or substitute surface is made.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes definition diagnostics from new final-realization diagnostics.
   * @evidence contracts/performance.md#efficient-algorithms Performs one realization without rebuilding source lofts.
   * @evidence contracts/performance.md#reuse-equivalent-work Consumes the already assembled tree and source diagnostics.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Copies diagnostics before realization so the borrowed definition remains unmodified.
   */
  export function realize(definition: IDefinition): IOutput {
    const diagnostics: AutoMovieLoftContract.IDiagnostic[] = [...definition.diagnostics];
    if (definition.root === null) return publishable([], [], diagnostics);
    const realized: AutoMovieHumanBodyTree.IOutput = AutoMovieHumanBodyTree.realize("body", definition.root, definition.limits, diagnostics);
    return publishable(realized.chains, [realized.body], diagnostics);
  }

  /**
   * Build the production source parts and tree, without realizing joins or final skin.
   *
   * @evidence contracts/common.md#principled-implementation Runs the same anatomical source builders and fold declarations that create fully realizes.
   * @evidence contracts/common.md#clear-and-simple-design Returns one explicit production definition rather than a partial calibration.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses no alternative geometry, fixture, intermediate throw or fake successful body.
   * @evidence contracts/common.md#meaningful-documentation A null root and source diagnostics preserve construction failures; final joins have not run.
   * @evidence contracts/performance.md#efficient-algorithms Constructs each required source part once and assembles a linear-size tree.
   * @evidence contracts/performance.md#reuse-equivalent-work Source inspection and full production realization share this exact stage.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns call-owned definition records without caching a person or mesh.
   */
  export function define(input: IInput): IDefinition {
    const diagnostics: AutoMovieLoftContract.IDiagnostic[] = [...(input.diagnostics ?? [])];
    const sources: AutoMovieHumanSiteViewPart.ISource[] = [];
    const limits: AutoMovieHumanBodyTree.ILimits = { ...LIMITS, gap: input.gap };
    const view = (name: string, result: AutoMovieHumanSiteViewPart.IResult): IAutoMovieConstructionView | null => {
      sources.push({ name, result });
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

    // The trunk ends inside the head, rather than on an open neck ring.
    // A dome one inscribed neck-section radius high gives the fold host
    // surface above its crossing. Its pole lies on the head mass's own axis,
    // strictly below its crown, where every head outline encloses that axis.
    // The merge trims the hidden upper host region away along all its phases.
    const neck: IAutoMovieHumanTrunkViews.ISite | undefined = input.trunk.views.sites.at(-1);
    let trunkInput: AutoMovieHumanTrunkBuild.IInput = input.trunk;
    if (input.head !== undefined && neck !== undefined) {
      const y: number = neck.y + Math.min(neck.half, (neck.front - neck.back) / 2);
      if (y < input.head.skeleton.crown[1])
        trunkInput = { ...input.trunk, top: { x: input.head.skeleton.crown[0], y } };
      else
        diagnostics.push({ producer: "lane.trunk", level: 2, contract: "top closure", detail: `the neck dome at ${y} mm does not lie below the head crown at ${input.head.skeleton.crown[1]} mm` });
    }
    const trunk: AutoMovieHumanTrunkBuild.IOutput = AutoMovieHumanTrunkBuild.create(trunkInput);
    sources.push(...trunk.sources);
    diagnostics.push(...trunk.diagnostics);
    let root: AutoMovieConstructionNode | null = trunk.trunk;
    for (const mass of trunk.masses) if (root !== null) root = AutoMovieHumanBodyTree.join(root, mass, limits);

    // The head merged onto the trunk's top, inside the head mass's neck.
    if (input.head !== undefined && root !== null && trunk.trunk !== null)
      root = AutoMovieHumanBodyTree.join(
        root,
        { part: input.head.root, partFace: input.head.face, hostFace: trunk.trunk.name, search: input.head.search, radius: input.head.radius, cap: input.head.cap },
        limits,
      );

    // The legs' rails stay either side of the perineum.
    const hips: [Vec3, Vec3] = [input.sides.left.leg.bones.hip, input.sides.right.leg.bones.hip];
    const perineum: number = distance(hips[0], hips[1]) / 2;

    for (const name of ["left", "right"] as const) {
      const side: ISide = input.sides[name];

      // A host and its digits: each web capped at half the gap to its
      // nearest neighbour's base.
      const branches = (host: IAutoMovieConstructionView | null, list: readonly (IDigit | IToe)[]): AutoMovieConstructionNode | null => {
        let tree: AutoMovieConstructionNode | null = host;
        const baseOf = (source: IDigit | IToe): Vec3 => "toe" in source ? source.toe.centres[0]! : source.digit.centres[0]!;
        list.forEach((d: IDigit | IToe): void => {
          const digit: IAutoMovieConstructionView | null = "toe" in d ? view(d.toe.name, AutoMovieHumanToePart.create(d.toe)) : view(d.digit.name, AutoMovieHumanDigitWalk.create(d.digit));
          if (digit === null || tree === null || host === null) return;
          const base: Vec3 = baseOf(d);
          const nearest: number = Math.min(...list.filter((o: IDigit | IToe): boolean => o !== d).map((o: IDigit | IToe): number => distance(base, baseOf(o))));
          tree = AutoMovieHumanBodyTree.join(tree, fold(digit, digit.name, host.name, d.fold, Number.isFinite(nearest) ? nearest / 2 : d.fold.radius), limits);
        });
        return tree;
      };

      // The leg on its foot and toes, then onto the trunk.
      const leg: IAutoMovieConstructionView | null = view(`leg.${name}`, AutoMovieHumanLegWalk.create(`leg.${name}`, side.leg.bones, side.leg.law, input.gap));
      const foot: IAutoMovieConstructionView | null = view(side.foot.name, AutoMovieHumanFootPart.create(side.foot));
      const toes: AutoMovieConstructionNode | null = branches(foot, side.toes);
      if (leg !== null && root !== null && trunk.trunk !== null) {
        const lower: AutoMovieConstructionNode =
          foot === null || toes === null ? leg : AutoMovieHumanBodyTree.join(toes, fold(leg, leg.name, foot.name, side.leg.foot, side.leg.foot.radius), limits);
        root = AutoMovieHumanBodyTree.join(root, fold(lower, leg.name, trunk.trunk.name, side.leg.trunk, perineum), limits);
      }

      // The arm with its hand onto the trunk.
      const arm: IAutoMovieConstructionView | null = view(
        `arm.${name}`,
        AutoMovieHumanArmWalk.create(`arm.${name}`, side.arm.bones, side.arm.knuckle, side.arm.reach, side.arm.sites, side.arm.joints, input.gap, side.arm.crease, side.arm.radial),
      );
      const fingers: AutoMovieConstructionNode | null = branches(arm, side.fingers);
      if (arm !== null && fingers !== null && root !== null && trunk.trunk !== null) root = AutoMovieHumanBodyTree.join(root, fold(fingers, arm.name, trunk.trunk.name, side.arm.trunk, side.arm.trunk.radius), limits);
    }
    return { root, limits, diagnostics, sources };
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
