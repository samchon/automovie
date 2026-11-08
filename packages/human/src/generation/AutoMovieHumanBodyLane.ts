import type {
  AutoMovieLoftContract,
  AutoMovieSolidBody,
  AutoMovieSolidVector,
  IAutoMovieLoftChain,
  IAutoMovieViewPart,
} from "@automovie/engine";
import type {
  AutoMovieConstructionNode,
  IAutoMovieConstructionView,
} from "@automovie/interface";

import { AutoMovieHumanBodyPublication } from "./AutoMovieHumanBodyPublication";
import { AutoMovieHumanBodyTree } from "./AutoMovieHumanBodyTree";
import type { AutoMovieHumanArmBones } from "./arm/AutoMovieHumanArmBones";
import type { AutoMovieHumanArmWalk } from "./arm/AutoMovieHumanArmWalk";
import type { AutoMovieHumanFootPart } from "./foot/AutoMovieHumanFootPart";
import { AutoMovieHumanToePart } from "./foot/AutoMovieHumanToePart";
import type { AutoMovieHumanHandAttachment } from "./hand/AutoMovieHumanHandAttachment";
import type { AutoMovieHumanHeadLane } from "./head/AutoMovieHumanHeadLane";
import type { AutoMovieHumanLegBones } from "./leg/AutoMovieHumanLegBones";
import type { AutoMovieHumanLegWalk } from "./leg/AutoMovieHumanLegWalk";
import { AutoMovieHumanDigitWalk } from "./limb/AutoMovieHumanDigitWalk";
import { AutoMovieHumanSiteViewPart } from "./limb/AutoMovieHumanSiteViewPart";
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
 * finger and thumb as a joint-normal walk (`AutoMovieHumanDigitWalk`), and
 * each toe in its fixed foot-axis observation planes (`AutoMovieHumanToePart`).
 *
 * Joins, the part being the solid whose station lines leave the host across
 * the fold, the host the whole subtree built before it: masses after their
 * trunk and same-leg parents; each toe onto its foot, the leg onto that foot (seeded at the
 * ankle's front), and the leg with its foot onto the trunk (seeded at the
 * inguinal fold, R the caller's operational join softness, capped at half the gap between
 * the two hip centres so the two legs' rails never cross at the perineum);
 * each digit onto its arm's palm, and the arm with its hand onto the trunk
 * (seeded at the axilla vault). A digit's or a toe's web is capped at half
 * the gap to its nearest neighbour's base, so neighbouring webs' rails never
 * cross.
 *
 * Failed original definitions keep their diagnostics. Admitted originals
 * remain attempt leaves: the engine performs their lofts and names failed
 * leaves/joins and its rollback. A source tree is not a completed skin.
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
    leg: {
      bones: Pick<AutoMovieHumanLegBones.IBones, "hip" | "knee" | "ankle">;
      law: AutoMovieHumanLegWalk.ILaw;
      definition: AutoMovieHumanLegWalk.IDefinition;
      /** Publish the actual leg consuming this final/trial parent's named hip source. */
      bind(
        parent: AutoMovieHumanSiteViewPart.IDefinition,
        station: number,
      ): AutoMovieHumanLegWalk.IDefinition;
      trunk: IFold;
      foot: IFold;
    };

    /** The arm's bones, the palm's last centre and reach, its sites' laws and joints, its fold onto the trunk. */
    arm: {
      /** Identical normalized original shared by this loft and hand attachments. */
      definition: AutoMovieHumanSiteViewPart.IDefinition;
      bones: Pick<
        AutoMovieHumanArmBones.IBones,
        "shoulder" | "elbow" | "wrist"
      >;
      knuckle: Vec3;
      /** Palmar base-crease locus from the person's independent palm length. */
      crease?: Vec3;
      /** Actual radial hand-across direction for the WJC-to-MCP3 material transition. */
      radial: Vec3;
      reach: number;
      /** Downward upper-arm measuring convention and proximal source domain. */
      measuring: AutoMovieHumanArmWalk.IMeasuring;
      sites: AutoMovieHumanArmWalk.ISiteLaw[];
      joints: { elbow: number; wrist: number };
      trunk: IFold;
    };

    /** The foot. */
    foot: AutoMovieHumanFootPart.IInput;
    /** Same final foot original consumed by its loft and toe contact readers. */
    footDefinition: AutoMovieHumanSiteViewPart.IDefinition;

    /** The fingers and the thumb, each with its web's fold onto the palm. */
    fingers: IDigit[];
    /** Actual digit factory keys; enumeration does not evaluate their geometry. */
    digitNames: readonly string[];
    /** Prepare just this actual digit original; other digits are not evaluated. */
    digit(name: string): IDigit | undefined;

    /** The toes, each with its web's fold onto the forefoot. */
    toes: IToe[];
    /** Names from the same foot-placement rows consumed by the toe producer. */
    toeNames: readonly string[];
  }

  /** What the lane is built from. */
  export interface IInput {
    /** Earlier anatomical source failures, retained verbatim before any tree or join operation. */
    diagnostics?: readonly AutoMovieLoftContract.IDiagnostic[];

    /** The trunk's build. */
    trunk: AutoMovieHumanTrunkBuild.IInput;
    /** Same already prepared trunk/tape-pass result, when an original reader evaluated it first. */
    preparedTrunk?: AutoMovieHumanTrunkBuild.IOutput;
    /** Actually requested raw originals from this same preparation context. */
    preparedSources?: ReadonlyMap<string, AutoMovieHumanSiteViewPart.IResult>;

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
    /** Actual immutable millimetre originals resolved by source leaves during this realization. */
    sourceParts: ReadonlyMap<string, IAutoMovieViewPart>;
    /** Actual consumed hand contact records, retaining the same parent original and anatomical joint separately. */
    handAttachments: AutoMovieHumanHandAttachment.IConnection[];
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
    /** Same prepared original consumed by both the selected reader and production raw loft. */
    definition: AutoMovieHumanSiteViewPart.IDefinition;
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
    /** Same final fixed-chart original consumed by production and selected readers. */
    definition: AutoMovieHumanSiteViewPart.IDefinition;
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
  const LIMITS: Omit<AutoMovieHumanBodyTree.ILimits, "gap"> = {
    count: 64,
    tolerance: 1e-6,
    grazing: Math.asin(0.01),
  };

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
   * Realize the exact production root without redefining its originals.
   *
   * @evidence contracts/common.md#principled-implementation Sends the supplied definition's identical root and limits to the existing body-tree realizer.
   * @evidence contracts/common.md#clear-and-simple-design Keeps full solid realization separate from source construction.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing trunk retains its real failure and empty publication; no fixture or substitute surface is made.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes definition diagnostics from new final-realization diagnostics.
   * @evidence contracts/performance.md#efficient-algorithms Requests one engine realization of the source leaves rather than preceding it with unrequested body raw lofts. Explicit inspection raw is separate and is not an engine preloft cache.
   * @evidence contracts/performance.md#reuse-equivalent-work Consumes the already assembled tree and source diagnostics.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Copies diagnostics before realization so the borrowed definition remains unmodified.
   */
  export function realize(definition: IDefinition): IOutput {
    const diagnostics: AutoMovieLoftContract.IDiagnostic[] = [
      ...definition.diagnostics,
    ];
    if (definition.root === null)
      return AutoMovieHumanBodyPublication.of([], [], diagnostics);
    const realized: AutoMovieHumanBodyTree.IOutput =
      AutoMovieHumanBodyTree.realize(
        "body",
        definition.root,
        definition.limits,
        diagnostics,
        definition.sourceParts,
      );
    return AutoMovieHumanBodyPublication.of(
      realized.chains,
      [realized.body],
      diagnostics,
    );
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
    const preparedDiagnostics: number = input.diagnostics?.length ?? 0;
    const diagnostics: AutoMovieLoftContract.IDiagnostic[] = [
      ...(input.diagnostics ?? []),
    ];
    const sources: AutoMovieHumanSiteViewPart.ISource[] = [];
    const limits: AutoMovieHumanBodyTree.ILimits = {
      ...LIMITS,
      gap: input.gap,
    };
    const view: (
      name: string,
      result: AutoMovieHumanSiteViewPart.IResult,
    ) => IAutoMovieConstructionView | null = (
      name: string,
      result: AutoMovieHumanSiteViewPart.IResult,
    ): IAutoMovieConstructionView | null => {
      sources.push({ name, result });
      diagnostics.push(...result.diagnostics);
      return result.view;
    };
    const original: (
      name: string,
      definition: AutoMovieHumanSiteViewPart.IDefinition,
    ) => IAutoMovieConstructionView | null = (
      name: string,
      definition: AutoMovieHumanSiteViewPart.IDefinition,
    ): IAutoMovieConstructionView | null =>
      view(
        name,
        input.preparedSources?.get(name) ?? { ...definition, loft: null },
      );
    const fold: (
      part: AutoMovieConstructionNode,
      partFace: string,
      hostFace: string,
      f: IFold,
      cap: number,
    ) => AutoMovieHumanBodyTree.IFold = (
      part: AutoMovieConstructionNode,
      partFace: string,
      hostFace: string,
      f: IFold,
      cap: number,
    ): AutoMovieHumanBodyTree.IFold => ({
      part,
      partFace,
      hostFace,
      search: { phase: f.search.phi, from: f.search.from, to: f.search.to },
      radius: f.radius,
      cap: f.cap ?? cap,
    });

    // Exterior domains stop at the shared regular neck. The retained source
    // support above it preserves the original lower polynomial, not a dome.
    const trunk: AutoMovieHumanTrunkBuild.IOutput =
      input.preparedTrunk ??
      AutoMovieHumanTrunkBuild.define(
        AutoMovieHumanTrunkBuild.withHead(
          input.trunk,
          input.head === undefined
            ? undefined
            : {
                part: input.head.source.massPart,
                crown: input.head.skeleton.crown,
              },
          diagnostics,
        ),
      );
    sources.push(...trunk.sources);
    diagnostics.push(...trunk.diagnostics);
    let root: AutoMovieConstructionNode | null = trunk.trunk;

    // Both originals already own the same whole regular boundary and jets.
    if (input.head !== undefined && root !== null && trunk.trunk !== null)
      root = {
        type: "continue",
        name: `continue.${input.head.face}.${trunk.trunk.name}`,
        host: root,
        hostFace: trunk.trunk.name,
        hostEnd: "top",
        part: input.head.root,
        partFace: input.head.face,
        partEnd: "bottom",
      };

    // The legs' rails stay either side of the perineum.
    const hips: [Vec3, Vec3] = [
      input.sides.left.leg.bones.hip,
      input.sides.right.leg.bones.hip,
    ];
    const perineum: number = distance(hips[0], hips[1]) / 2;

    for (const name of ["left", "right"] as const) {
      const side: ISide = input.sides[name];

      // A host and its digits: each web capped at half the gap to its
      // nearest neighbour's base.
      const branches: (
        host: IAutoMovieConstructionView | null,
        list: readonly (IDigit | IToe)[],
      ) => AutoMovieConstructionNode | null = (
        host: IAutoMovieConstructionView | null,
        list: readonly (IDigit | IToe)[],
      ): AutoMovieConstructionNode | null => {
        let tree: AutoMovieConstructionNode | null = host;
        const baseOf: (source: IDigit | IToe) => Vec3 = (
          source: IDigit | IToe,
        ): Vec3 =>
          "toe" in source ? source.toe.centres[0]! : source.digit.centres[0]!;
        list.forEach((d: IDigit | IToe): void => {
          const digit: IAutoMovieConstructionView | null =
            "toe" in d
              ? original(d.toe.name, d.definition)
              : original(d.digit.name, d.definition);
          if (digit === null || tree === null || host === null) return;
          const base: Vec3 = baseOf(d);
          const nearest: number = Math.min(
            ...list
              .filter((o: IDigit | IToe): boolean => o !== d)
              .map((o: IDigit | IToe): number => distance(base, baseOf(o))),
          );
          tree = AutoMovieHumanBodyTree.join(
            tree,
            fold(
              digit,
              digit.name,
              host.name,
              d.fold,
              Number.isFinite(nearest) ? nearest / 2 : d.fold.radius,
            ),
            limits,
          );
        });
        return tree;
      };

      // The leg on its foot and toes, then onto the trunk.
      const leg: IAutoMovieConstructionView | null = original(
        `leg.${name}`,
        side.leg.definition,
      );
      const foot: IAutoMovieConstructionView | null = original(
        side.foot.name,
        side.footDefinition,
      );
      const toes: AutoMovieConstructionNode | null = branches(foot, side.toes);
      if (leg !== null && root !== null && trunk.trunk !== null) {
        const lower: AutoMovieConstructionNode =
          foot === null || toes === null
            ? leg
            : AutoMovieHumanBodyTree.join(
                toes,
                fold(
                  leg,
                  leg.name,
                  foot.name,
                  side.leg.foot,
                  side.leg.foot.radius,
                ),
                limits,
              );
        root = AutoMovieHumanBodyTree.join(
          root,
          fold(lower, leg.name, trunk.trunk.name, side.leg.trunk, perineum),
          limits,
        );
      }

      // The arm with its hand onto the trunk.
      const arm: IAutoMovieConstructionView | null = original(
        `arm.${name}`,
        side.arm.definition,
      );
      const fingers: AutoMovieConstructionNode | null = branches(
        arm,
        side.fingers,
      );
      if (
        arm !== null &&
        fingers !== null &&
        root !== null &&
        trunk.trunk !== null
      )
        root = AutoMovieHumanBodyTree.join(
          root,
          fold(
            fingers,
            arm.name,
            trunk.trunk.name,
            side.arm.trunk,
            side.arm.trunk.radius,
          ),
          limits,
        );
    }
    // Composite mass parents already contain the same leg originals here.
    for (const mass of trunk.masses) {
      if (root === null) break;
      const fold: AutoMovieHumanBodyTree.IFold | null =
        AutoMovieHumanBodyTree.massFold(mass, sources, diagnostics);
      if (fold !== null) root = AutoMovieHumanBodyTree.join(root, fold, limits);
    }
    const handAttachments: AutoMovieHumanHandAttachment.IConnection[] = [
      "left",
      "right",
    ].flatMap((side: string): AutoMovieHumanHandAttachment.IConnection[] =>
      input.sides[side as "left" | "right"].fingers.flatMap(
        (digit: IDigit): AutoMovieHumanHandAttachment.IConnection[] =>
          digit.digit.attachment === undefined ? [] : [digit.digit.attachment],
      ),
    );
    const sourceParts: ReadonlyMap<string, IAutoMovieViewPart> =
      AutoMovieHumanBodyTree.context(input.head?.source.sources, sources);
    diagnostics.push(...(input.diagnostics?.slice(preparedDiagnostics) ?? []));
    root = AutoMovieHumanBodyTree.sources(root, sourceParts, diagnostics);
    return { root, limits, diagnostics, sources, handAttachments, sourceParts };
  }

  /** The distance of two points, mm. */
  function distance(a: Vec3, b: Vec3): number {
    return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  }
}
