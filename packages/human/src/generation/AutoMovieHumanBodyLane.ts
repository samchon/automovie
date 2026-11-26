import { AutoMovieSolidVector as Vec } from "@automovie/engine";
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
import { AutoMovieHumanPelvicSplit } from "./conic/AutoMovieHumanPelvicSplit";
import { AutoMovieHumanSkinDivide } from "./conic/AutoMovieHumanSkinDivide";
import { AutoMovieHumanFootConnection } from "./foot/AutoMovieHumanFootConnection";
import { AutoMovieHumanThenarPort } from "./hand/AutoMovieHumanThenarPort";
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
 * at the ankle's front), and both lower branches through one trunk-owned split
 * at the pelvis; the thumb through a local port on the continuing palm, the
 * fingers through its terminal split, and the full arm through the original
 * torso's anatomical shoulder port.
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
    const view = (
      name: string,
      result: IAutoMovieHumanSourceRealization,
    ): IAutoMovieConstructionView | null => {
      sources.push({ name, result });
      diagnostics.push(...result.diagnostics);
      return result.view;
    };
    const original = (
      name: string,
      definition: IAutoMovieHumanSourceDefinition,
    ): IAutoMovieConstructionView | null =>
      view(name, { ...definition, loft: null });
    const fold = (
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

    const handAttachments: IAutoMovieHumanHandAttachment.IConnection[] = [];
    type Prepared =
      | ReturnType<typeof AutoMovieHumanDigitalSplit.prepare>
      | ReturnType<typeof AutoMovieHumanPelvicSplit.production>;
    const splits: Exclude<Prepared, string>[] = [];
    const digital = (
      kind: "hand" | "foot",
      host: IAutoMovieConstructionNode | null,
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
          splits.push(fan);
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

    const sides = ["left", "right"] as const;
    const legs: (AutoMovieHumanPelvicSplit.IBranch & {
      fold: IAutoMovieHumanBodyTree.IFold;
    })[] = [];
    // The previous two joins are the declared fallback of an inadmissible split.
    const perineum: number =
      Vec.norm(
        Vec.sub(
          input.sides.left.leg.bones.hip,
          input.sides.right.leg.bones.hip,
        ),
      ) / 2;
    for (const name of sides) {
      const side: IAutoMovieHumanBodyLane.ISide = input.sides[name];
      const lowerSources: Pick<
        IAutoMovieHumanBodyLane.ISide,
        "foot" | "footDefinition" | "toes"
      > = side.prepareFoot?.() ?? side;
      const stock = trunk.legs?.[name] ?? side.leg.definition;
      const leg = original(`leg.${name}`, stock);
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
      if (leg !== null && stock.part !== null && trunk.trunk !== null) {
        const ankle = AutoMovieHumanFootConnection.ankleFold(lowerSources.foot);
        const ankleFold = { ...side.leg.foot, ...ankle };
        const lower: IAutoMovieConstructionNode =
          foot === null || toes === null
            ? leg
            : AutoMovieHumanBodyTree.join(
                toes,
                fold(
                  leg,
                  leg.name,
                  foot.name,
                  ankleFold,
                  ankleFold.radius,
                ),
                limits,
              );
        legs.push({
          part: stock.part,
          branch: lower,
          fold: fold(
            lower,
            leg.name,
            trunk.trunk.name,
            side.leg.trunk,
            perineum,
          ),
        });
      }

    }
    if (root !== null) {
      const [left, right] = legs;
      const pelvis =
        torso !== undefined &&
        torso !== null &&
        left !== undefined &&
        right !== undefined
          ? AutoMovieHumanPelvicSplit.production(
              torso,
              root,
              left,
              right,
              input.trunk.nativeGluteal === true
                ? { gluteal: input.trunk.gluteal }
                : undefined,
            )
          : "Both original lower branches and the torso are required";
      if (typeof pelvis === "string") {
        diagnostics.push({
          producer: "split.pelvis",
          level: 3,
          contract: "native pelvic split",
          detail: pelvis,
        });
        for (const { fold: low } of legs)
          root = AutoMovieHumanBodyTree.join(root, low, limits);
      } else {
        splits.push(pelvis);
        for (const part of pelvis.parts) {
          const original = sources.find(({ name }) => name === part.name);
          if (original !== undefined) original.result.part = part;
        }
        root = pelvis.node;
      }
    }
    for (const name of sides) {
      const side = input.sides[name];
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
      const thumb = digits.find(({ digit }): boolean =>
        digit.name.startsWith("thumb."),
      );
      const thumbNode =
        thumb === undefined
          ? null
          : original(thumb.digit.name, thumb.definition);
      const thumbPart = thumb?.definition.part ?? null;
      let parent: IAutoMovieConstructionNode | null = arm;
      if (
        arm !== null &&
        armSource.part !== null &&
        thumbNode !== null &&
        thumbPart !== null &&
        thumb?.digit.attachment !== undefined
      ) {
        try {
          const source = AutoMovieHumanThenarPort.source(
            armSource.part,
            thumbPart,
            thumb.digit.attachment,
          );
          if (typeof source === "string") {
            diagnostics.push({
              producer: `port.${thumbNode.name}`,
              level: 3,
              contract: "native thenar contact",
              detail: source,
            });
          } else {
            parent = AutoMovieHumanThenarPort.node(
              source,
              arm,
              arm.name,
              thumbNode,
              thumbNode.name,
            );
          }
        } catch (error: unknown) {
          diagnostics.push({
            producer: `port.${thumbNode.name}`,
            level: 3,
            contract: "native thenar contact",
            detail: error instanceof Error ? error.message : String(error),
          });
        }
      }
      let fingers = digital("hand", parent, armSource.part, fingersOnly, up);
      if (
        arm !== null &&
        fingers !== null &&
        parent === arm &&
        thumb !== undefined &&
        thumbNode !== null
      ) {
        const nearest = Math.min(
          ...fingersOnly.map(({ digit }): number =>
            Vec.norm(Vec.sub(digit.centres[0]!, thumb.digit.centres[0]!)),
          ),
        );
        fingers = AutoMovieHumanBodyTree.join(
          fingers,
          fold(
            thumbNode,
            thumbNode.name,
            arm.name,
            thumb.fold,
            Number.isFinite(nearest) ? nearest / 2 : thumb.fold.radius,
          ),
          limits,
        );
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
        splitParentCuts: new Map(
          splits.map(({ node, cut }) => [node.name, cut]),
        ),
        splitChildRails: new Map(
          splits.map(({ node, rails }) => [node.name, rails]),
        ),
        splitPrepared: new Map(
          splits.map(({ node, bands }) => [node.name, bands]),
        ),
      },
      ...(input.head === undefined
        ? {}
        : { loopSources: input.head.loopSources }),
    };
  }
}
