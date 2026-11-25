import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionNode,
  IAutoMovieConstructionPort,
  IAutoMovieConstructionView,
  IAutoMovieHumanBodyLane,
  IAutoMovieHumanBodyTree,
  IAutoMovieHumanHandAttachment,
  IAutoMovieHumanNamedSource,
  IAutoMovieHumanSourceDefinition,
  IAutoMovieHumanSourceRealization,
  IAutoMovieHumanTrunkBuild,
  IAutoMovieLoftContract,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieHumanBodyPublication } from "./AutoMovieHumanBodyPublication";
import { AutoMovieHumanBodyTree } from "./AutoMovieHumanBodyTree";
import { AutoMovieHumanArmscyeOpening } from "./arm/AutoMovieHumanArmscyeOpening";
import { AutoMovieHumanDigitalSplit } from "./conic/AutoMovieHumanDigitalSplit";
import { AutoMovieHumanSkinDivide } from "./conic/AutoMovieHumanSkinDivide";
import { AutoMovieHumanTrunkBuild } from "./trunk/AutoMovieHumanTrunkBuild";

/**
 * The body lane's subtree (#3047 to #3051) as one construction tree realized by
 * the engine (`AutoMovieHumanBodyTree`): every part a view node built from its
 * views, junctions with their native construction operators, published as
 * chains and the realized body for the calibration, from the laws the caller
 * binds.
 *
 * Parts: the trunk with its breasts and gluteal masses
 * (`AutoMovieHumanTrunkBuild`), each leg as one walk over femur and tibia
 * (`AutoMovieHumanLegWalk`), each arm with its palm as one walk
 * (`AutoMovieHumanArmWalk`), each foot (`AutoMovieHumanFootPart`), each finger
 * and thumb as a joint-normal walk (`AutoMovieHumanDigitWalk`), and each toe in
 * its fixed foot-axis observation planes (`AutoMovieHumanToePart`).
 *
 * Joins, the part being the solid whose station lines leave the host across the
 * fold, the host the whole subtree built before it: masses after their trunk
 * and same-leg parents; each toe onto its foot, the leg onto that foot (seeded
 * at the ankle's front), and the leg with its foot onto the trunk (seeded at
 * the inguinal fold, R the caller's operational join softness, capped at half
 * the gap between the two hip centres so the two legs' rails never cross at the
 * perineum); each digit onto its arm's palm, and the arm with its hand through
 * the original torso's anatomical shoulder port. A digit's or a toe's web is
 * capped at half the gap to its nearest neighbour's base, so neighbouring webs'
 * rails never cross.
 *
 * Failed original definitions keep their diagnostics. Admitted originals remain
 * attempt leaves: the engine performs their lofts and names failed leaves/joins
 * and its rollback. A source tree is not a completed skin.
 */
export namespace AutoMovieHumanBodyLane {
  /**
   * The joins' trace limits: 64 traced points and blend columns per fold; a
   * curve gap far under the sections' own representation error (about 0.01 mm);
   * and the least angle between the two skins, asin(0.01), under which that
   * error `e` moves the curve by `e / sin(alpha)` past 1 mm.
   */
  const LIMITS: Omit<IAutoMovieHumanBodyTree.ILimits, "gap"> = {
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
  export function create(
    input: IAutoMovieHumanBodyLane.IInput,
  ): IAutoMovieHumanBodyLane.IOutput {
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
  export function realize(
    definition: IAutoMovieHumanBodyLane.IDefinition,
  ): IAutoMovieHumanBodyLane.IOutput {
    const diagnostics: IAutoMovieLoftContract.IDiagnostic[] = [
      ...definition.diagnostics,
    ];
    if (definition.root === null)
      return AutoMovieHumanBodyPublication.of([], [], diagnostics);
    const realized: IAutoMovieHumanBodyTree.IOutput =
      AutoMovieHumanBodyTree.realize(
        "body",
        definition.root,
        definition.limits,
        diagnostics,
        definition.sourceParts,
        definition.loopSources,
        definition.digitalSources,
      );
    return AutoMovieHumanBodyPublication.of(
      realized.chains,
      [realized.body],
      diagnostics,
    );
  }

  /**
   * Build the production source parts and tree, without realizing joins or
   * final skin.
   *
   * @evidence contracts/common.md#principled-implementation Runs the same anatomical source builders and fold declarations that create fully realizes.
   * @evidence contracts/common.md#clear-and-simple-design Returns one explicit production definition rather than a partial calibration.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses no alternative geometry, fixture, intermediate throw or fake successful body.
   * @evidence contracts/common.md#meaningful-documentation A null root and source diagnostics preserve construction failures; final joins have not run.
   * @evidence contracts/performance.md#efficient-algorithms Constructs each required source part once and assembles a linear-size tree.
   * @evidence contracts/performance.md#reuse-equivalent-work Source inspection and full production realization share this exact stage.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns call-owned definition records without caching a person or mesh.
   */
  export function define(
    input: IAutoMovieHumanBodyLane.IInput,
  ): IAutoMovieHumanBodyLane.IDefinition {
    const preparedDiagnostics: number = input.diagnostics?.length ?? 0;
    const diagnostics: IAutoMovieLoftContract.IDiagnostic[] = [
      ...(input.diagnostics ?? []),
    ];
    const sources: IAutoMovieHumanNamedSource[] = [];
    const limits: IAutoMovieHumanBodyTree.ILimits = {
      ...LIMITS,
      gap: input.gap,
    };
    const view: (
      name: string,
      result: IAutoMovieHumanSourceRealization,
    ) => IAutoMovieConstructionView | null = (
      name: string,
      result: IAutoMovieHumanSourceRealization,
    ): IAutoMovieConstructionView | null => {
      sources.push({ name, result });
      diagnostics.push(...result.diagnostics);
      return result.view;
    };
    const original: (
      name: string,
      definition: IAutoMovieHumanSourceDefinition,
    ) => IAutoMovieConstructionView | null = (
      name: string,
      definition: IAutoMovieHumanSourceDefinition,
    ): IAutoMovieConstructionView | null =>
      view(name, { ...definition, loft: null });
    const fold: (
      part: IAutoMovieConstructionNode,
      partFace: string,
      hostFace: string,
      f: IAutoMovieHumanBodyLane.IFold,
      cap: number,
    ) => IAutoMovieHumanBodyTree.IFold = (
      part: IAutoMovieConstructionNode,
      partFace: string,
      hostFace: string,
      f: IAutoMovieHumanBodyLane.IFold,
      cap: number,
    ): IAutoMovieHumanBodyTree.IFold => ({
      part,
      partFace,
      hostFace,
      search: { phase: f.search.phi, from: f.search.from, to: f.search.to },
      radius: f.radius,
      cap: f.cap ?? cap,
    });

    // Exterior domains stop at the shared regular neck. The retained source
    // support above it preserves the original lower polynomial, not a dome.
    const trunk: IAutoMovieHumanTrunkBuild.IOutput =
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
    let root: IAutoMovieConstructionNode | null = trunk.trunk;
    const shoulder = input.trunk.views.shoulder;
    const torso: IAutoMovieViewPart | null | undefined = trunk.sources
      .filter(
        ({ name }: IAutoMovieHumanNamedSource): boolean =>
          name === trunk.trunk?.name,
      )
      .at(-1)?.result.part;
    let opening: ReturnType<
      typeof AutoMovieHumanArmscyeOpening.production
    > | null = null;
    if (shoulder !== undefined && torso !== undefined && torso !== null) {
      try {
        opening = AutoMovieHumanArmscyeOpening.production(torso, shoulder);
      } catch (error: unknown) {
        diagnostics.push({
          producer: "port.shoulders",
          level: 3,
          contract: "armscye parent source",
          detail: error instanceof Error ? error.message : String(error),
        });
      }
    }

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
    const hips: [AutoMovieVector3Tuple, AutoMovieVector3Tuple] = [
      input.sides.left.leg.bones.hip,
      input.sides.right.leg.bones.hip,
    ];
    const perineum: number = distance(hips[0], hips[1]) / 2;
    const handAttachments: IAutoMovieHumanHandAttachment.IConnection[] = [];
    type Digital = Exclude<
      ReturnType<typeof AutoMovieHumanDigitalSplit.prepare>,
      string
    >;
    const fans: Digital[] = [];
    const digital = (
      kind: "hand" | "foot",
      host: IAutoMovieConstructionView | null,
      parent: IAutoMovieViewPart | null,
      list: readonly (
        | IAutoMovieHumanBodyLane.IDigit
        | IAutoMovieHumanBodyLane.IToe
      )[],
      up: AutoMovieVector3Tuple,
    ): IAutoMovieConstructionNode | null => {
      const owned = list.flatMap((entry) => {
        const name = "toe" in entry ? entry.toe.name : entry.digit.name;
        const [first, second] =
          "toe" in entry
            ? entry.toe.centres.slice(1)
            : [
                entry.digit.attachment?.joint ?? entry.digit.centres[0],
                entry.digit.centres[1],
              ];
        const node = original(name, entry.definition);
        const part = entry.definition.part;
        return node === null ||
          part === null ||
          first === undefined ||
          second === undefined
          ? []
          : [{ node, part, bounds: { part: name, first, second } }];
      });
      if (host === null || parent === null) return host;
      if (
        owned.length !== list.length ||
        list.length !== (kind === "hand" ? 4 : 5)
      )
        return host;
      let reason: string;
      try {
        const fan = AutoMovieHumanDigitalSplit.prepare(
          parent,
          kind,
          owned,
          up,
          host,
          owned.map(({ node }) => node),
        );
        if (typeof fan !== "string") {
          fans.push(fan);
          return fan.node;
        }
        reason = fan;
      } catch (error: unknown) {
        reason = error instanceof Error ? error.message : String(error);
      }
      diagnostics.push({
        producer: `fan.${parent.name}`,
        level: 3,
        contract: "native digital split",
        detail: reason,
      });
      return host;
    };

    for (const name of ["left", "right"] as const) {
      const side: IAutoMovieHumanBodyLane.ISide = input.sides[name];

      // The leg on its foot and toes, then onto the trunk.
      const lowerSources: Pick<
        IAutoMovieHumanBodyLane.ISide,
        "foot" | "footDefinition" | "toes"
      > = side.prepareFoot?.() ?? side;
      const leg: IAutoMovieConstructionView | null = original(
        `leg.${name}`,
        trunk.legs?.[name] ?? side.leg.definition,
      );
      const foot: IAutoMovieConstructionView | null = original(
        lowerSources.foot.name,
        lowerSources.footDefinition,
      );
      const toes: IAutoMovieConstructionNode | null = digital(
        "foot",
        foot,
        lowerSources.footDefinition.part,
        lowerSources.toes,
        [0, 1, 0],
      );
      if (leg !== null && root !== null && trunk.trunk !== null) {
        const lower: IAutoMovieConstructionNode =
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
      const upperSources: Pick<
        IAutoMovieHumanBodyLane.ISide,
        "arm" | "fingers"
      > = side.prepareArm?.() ?? side;
      const armSource: IAutoMovieHumanSourceDefinition =
        upperSources.arm.definition;
      const arm: IAutoMovieConstructionView | null = original(
        `arm.${name}`,
        armSource,
      );
      const digits: IAutoMovieHumanBodyLane.IDigit[] = upperSources.fingers;
      for (const { digit } of digits)
        if (digit.attachment !== undefined)
          handAttachments.push(digit.attachment);
      const fingersOnly = digits.filter(({ digit }): boolean =>
        digit.name.startsWith("finger."),
      );
      const palm = (
        entry: IAutoMovieHumanBodyLane.IDigit,
      ): AutoMovieHumanSkinDivide.IDigit => ({
        part: entry.digit.name,
        first: (entry.digit.attachment?.joint ?? entry.digit.centres[0])!,
        second: entry.digit.centres[1]!,
      });
      const up =
        fingersOnly.length === 4
          ? AutoMovieHumanSkinDivide.palmNormal(
              upperSources.arm.bones.wrist,
              palm(fingersOnly[0]!),
              palm(fingersOnly[3]!),
            )
          : ([0, 1, 0] satisfies AutoMovieVector3Tuple);
      let fingers = digital("hand", arm, armSource.part, fingersOnly, up);
      const thumb = digits.find(({ digit }): boolean =>
        digit.name.startsWith("thumb."),
      );
      if (thumb !== undefined) {
        const node = original(thumb.digit.name, thumb.definition);
        if (arm !== null && fingers !== null && node !== null) {
          const nearest = Math.min(
            ...fingersOnly.map(({ digit }): number =>
              distance(digit.centres[0]!, thumb.digit.centres[0]!),
            ),
          );
          fingers = AutoMovieHumanBodyTree.join(
            fingers,
            fold(
              node,
              node.name,
              arm.name,
              thumb.fold,
              Number.isFinite(nearest) ? nearest / 2 : thumb.fold.radius,
            ),
            limits,
          );
        }
      }
      if (
        arm !== null &&
        fingers !== null &&
        root !== null &&
        trunk.trunk !== null
      ) {
        if (shoulder === undefined)
          root = AutoMovieHumanBodyTree.join(
            root,
            fold(
              fingers,
              arm.name,
              trunk.trunk.name,
              upperSources.arm.trunk,
              upperSources.arm.trunk.radius,
            ),
            limits,
          );
        else if (opening !== null && armSource.part !== null) {
          try {
            const port: IAutoMovieConstructionPort = opening(
              armSource.part,
              name,
            );
            root = { ...port, host: root, part: fingers };
          } catch (error: unknown) {
            diagnostics.push({
              producer: `port.${arm.name}`,
              level: 3,
              contract: "armscye child source",
              detail: error instanceof Error ? error.message : String(error),
            });
          }
        }
      }
    }
    // Composite mass parents already contain the same leg originals here.
    for (const mass of trunk.masses) {
      if (root === null) break;
      const fold: IAutoMovieHumanBodyTree.IFold | null =
        AutoMovieHumanBodyTree.massFold(mass, sources, diagnostics);
      if (fold !== null) root = AutoMovieHumanBodyTree.join(root, fold, limits);
    }
    const sourceParts: ReadonlyMap<string, IAutoMovieViewPart> =
      AutoMovieHumanBodyTree.context(input.head?.source.sources, sources);
    diagnostics.push(...(input.diagnostics?.slice(preparedDiagnostics) ?? []));
    root = AutoMovieHumanBodyTree.sources(root, sourceParts, diagnostics);
    return {
      root,
      limits,
      diagnostics,
      sources,
      handAttachments,
      sourceParts,
      digitalSources: {
        splitParentCuts: new Map(fans.map(({ node, cut }) => [node.name, cut])),
        splitChildRails: new Map(
          fans.map(({ node, rails }) => [node.name, rails]),
        ),
        splitPrepared: new Map(
          fans.map(({ node, bands }) => [node.name, bands]),
        ),
      },
      ...(input.head === undefined
        ? {}
        : { loopSources: input.head.loopSources }),
    };
  }

  /** The distance of two points, mm. */
  function distance(
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): number {
    return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  }
}
