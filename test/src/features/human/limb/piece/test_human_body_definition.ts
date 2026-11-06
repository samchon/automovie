import {
  AutoMovieViewCurves,
  type IAutoMovieViewPart,
} from "@automovie/engine";
import type { AutoMovieConstructionNode } from "@automovie/interface";

import { AutoMovieHumanBodyAnatomy } from "../../../../../../packages/human/src/generation/AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanBodyLaw } from "../../../../../../packages/human/src/generation/AutoMovieHumanBodyLaw";
import { AutoMovieHumanArmBones } from "../../../../../../packages/human/src/generation/arm/AutoMovieHumanArmBones";
import type { AutoMovieHumanSiteViewPart } from "../../../../../../packages/human/src/generation/limb/AutoMovieHumanSiteViewPart";
import { AutoMovieHumanSex } from "../../../../../../packages/human/src/typings/AutoMovieHumanSex";
import { HumanBodyDefinitionFrames } from "../../../internal/HumanBodyDefinitionFrames";
import { HumanBodyDefinitionLeg } from "../../../internal/HumanBodyDefinitionLeg";
import { HumanBodyDefinitionShoulder } from "../../../internal/HumanBodyDefinitionShoulder";
import { HumanBodyDefinitionTrunkSource } from "../../../internal/HumanBodyDefinitionTrunkSource";
import { HumanPeople } from "../../../internal/HumanPeople";

/**
 * The production definition exposes the actual anatomical tree before final
 * joins, retaining both hands' digits and both feet's toes for 2D inspection.
 *
 * Scenarios:
 * 1. The real generating head root is contained by identity in the production tree.
 * 2. Every anatomical body part has its own source view, including all fingers and toes.
 * 3. Each body view is the identical builder-owned source record; failed sources keep their diagnosis.
 * 4. Stature, neck and original diagnostics remain available without a rig or final skin.
 * 5. The actual trunk GH and arm lengths close neutral AR; each digit retains
 *    its generating hand's material direction and identical joint references.
 * 6. The hidden trunk closure retains signed source ranges and nonzero angle-pole tangents.
 * 7. The old upper chain copies the actual neck's world boundary and all six 2-jet vectors.
 * 8. Original arms-down deltoid-domain support closes public bideltoid while
 *    acromial Y/Z, AR, biceps tape and the hand's source/roll remain independent.
 * 9. The actual underbust source closes its tape with the retained thorax
 *    aspect ratio and ellipse template, independently of mass placement.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the shared production define entry and walks its actual tree. Reads trunk GH/rigid arm for the neutral caliper, hand material identity and actual roll endpoint/replay. Every toe's actual fixed foot-plane source is replayed through the same metre AST and its frames compared before any skin realization. Both production legs' original curves and actual trunk-derived placements are observed separately from the isolated limb question. The trunk's signed hull declarations and original critical/regular readings expose inter-knot cap inversion; its actual metre replay retains value and parameter jets. The old upper/actual neck boundary is read through the engine's independent world surface 2-jet, rather than accepting a copied metadata flag. The actual underbust section's four original edges and shoulder independently determine its depth, breadth and engine perimeter.
 * @evidence contracts/testing.md#independent-expectations Anatomical names require a trunk, paired masses, arms, legs, feet, five digits per hand and five toes per foot, with the identical head subtree. Public AR closes its straight measuring convention. Public acromial height/biacromial width remain bony named inputs, independently of the selected GH proxy. Actual outer scalar critical roots in the declared proximal-to-midshaft domain give symmetric arms-down B=2*(abs(GH.z)+radius); .3H is not the expected maximum. Actual biceps edges/fullness retain public G. Hand material/roll and fixed toe planes preserve their source. Trunk signs, nonzero closing parameter jets and regular neck p/s/t/ss/st/tt within1e-9 remain independent. Actual leg points stay in world median half-spaces; finite observations do not certify a moving span. Underbust retains the declared sex-specific caliper B:D ratio within1e-12, ELLIPSE within1e-8 and public G within1e-6mm; those are construction identities, not measured tissue or final skin claims.
 * @evidence contracts/testing.md#distinguishing-cases Uses every environment-selected person's bilateral inputs and reports all omitted names/diagnoses together. Both hands query before WJC, at WJC, inside the transition, at MCP and beyond it. A range that merely flattens an incorrect pole tangent fails the nonzero closure expectation. Retaining local coefficients while dropping the translated neck frame fails the actual world boundary; singular pole derivatives are kept distinct from this regular station.
 * @evidence contracts/testing.md#execution-ownership Runs one synchronous source definition per selected person and replays only its source converter; requests no final realization, duplicate Human generation, rig, viewer, GPU, process or scratch output. Original AP mass poles are checked against public span/depth and the same trunk source site, independently of the placement solver; final tape/merge acceptance is excluded.
 */
export function test_human_body_definition(): void {
  const defects: string[] = [];
  for (const name of HumanPeople.names()) {
    const params: ReturnType<typeof HumanPeople.params> =
      HumanPeople.params(name);
    const input: AutoMovieHumanBodyLaw.ILimbInputs =
      AutoMovieHumanBodyLaw.limbInputs(params);
    const definition: AutoMovieHumanBodyLaw.IDefinition =
      AutoMovieHumanBodyLaw.define(params);
    const names: Set<string> = new Set();
    let sameHead: boolean = false;
    const visit = (node: AutoMovieConstructionNode): void => {
      if (node === definition.head.root) {
        sameHead = true;
        return;
      }
      if (node.type === "view") {
        names.add(node.name);
        if (
          !definition.lane.sources.some(
            (source: AutoMovieHumanSiteViewPart.ISource): boolean =>
              source.result.view === node,
          )
        )
          defects.push(
            `${name}: ${node.name} is not its original builder-owned source view`,
          );
      } else {
        visit(node.host);
        if (node.type !== "trim") visit(node.part);
      }
    };
    if (definition.lane.root !== null) visit(definition.lane.root);
    const expected: string[] = ["trunk", "gluteal.left", "gluteal.right"];
    if (AutoMovieHumanBodyAnatomy.sexOf(params) === AutoMovieHumanSex.Female)
      expected.push("breast.left", "breast.right");
    for (const side of ["left", "right"] as const) {
      expected.push(
        `leg.${side}`,
        `foot.${side}`,
        `arm.${side}`,
        `thumb.${side}`,
      );
      for (const digit of ["index", "middle", "ring", "little"])
        expected.push(`finger.${side}.${digit}`);
      for (let toe: number = 1; toe <= 5; toe++)
        expected.push(`toe.${side}.${toe}`);
    }
    for (const part of expected)
      if (!names.has(part))
        defects.push(`${name}: production source tree lacks ${part}`);
    if (!sameHead)
      defects.push(
        `${name}: the production tree does not contain its generating head root by identity`,
      );
    if (!(definition.stature > 0 && Number.isFinite(definition.stature)))
      defects.push(`${name}: definition stature is not finite and positive`);
    if (definition.neckChain.layers.length === 0)
      defects.push(`${name}: the generating neck chain is empty`);
    else HumanBodyDefinitionFrames.neckBoundary(name, definition, defects);
    for (const source of definition.lane.sources)
      if (source.result.part === null && source.result.diagnostics.length === 0)
        defects.push(
          `${name}: unavailable ${source.name} lost its original diagnosis`,
        );
    for (const source of definition.lane.sources)
      if (source.name.startsWith("toe."))
        HumanBodyDefinitionFrames.toeFrame(
          `${name}/${source.name}`,
          source.result,
          defects,
        );
    for (const source of definition.lane.sources)
      if (source.name === "leg.left" || source.name === "leg.right")
        HumanBodyDefinitionLeg.productionMedian(
          `${name}/${source.name}`,
          source.result,
          source.name === "leg.left" ? 1 : -1,
          defects,
        );
    const trunk: IAutoMovieViewPart | null | undefined = definition.lane.sources
      .filter(
        (source: AutoMovieHumanSiteViewPart.ISource): boolean =>
          source.name === "trunk",
      )
      .at(-1)?.result.part;
    if (trunk !== null && trunk !== undefined) {
      const sites: {
        site: string;
        station: number;
        points: (AutoMovieViewCurves.IReading | string)[];
      }[] = [];
      const curves: AutoMovieViewCurves.ICurve[] =
        AutoMovieViewCurves.create(trunk).curves;
      for (const knot of trunk.front.positive.knots)
        sites.push({
          site: knot.site,
          station: knot.station,
          points: curves.map(
            (
              curve: AutoMovieViewCurves.ICurve,
            ): AutoMovieViewCurves.IReading | string =>
              AutoMovieViewCurves.at(curve, trunk.axis, knot.station),
          ),
        });
      console.log(
        JSON.stringify({
          person: name,
          trunkSiteAudit: {
            originalSites: sites,
            oldLandmarks: definition.standing.trunk,
            publicResolved: AutoMovieHumanBodyAnatomy.resolve(params),
          },
        }),
      );
      HumanBodyDefinitionTrunkSource.massApex(
        name,
        definition,
        trunk,
        params,
        defects,
      );
      HumanBodyDefinitionTrunkSource.trunkSpan(
        name,
        definition.lane.sources
          .filter(
            (source: AutoMovieHumanSiteViewPart.ISource): boolean =>
              source.name === "trunk",
          )
          .at(-1)!.result,
        defects,
      );
      HumanBodyDefinitionTrunkSource.underbustSource(
        name,
        trunk,
        AutoMovieHumanBodyAnatomy.resolve(params),
        input.arms.scale,
        defects,
      );
    }
    const upper: (typeof definition.skeleton)[number] =
      definition.skeleton.find(
        (bone: (typeof definition.skeleton)[number]): boolean =>
          bone.bone === "leftUpperArm",
      )!;
    const elbow: (typeof definition.skeleton)[number] =
      definition.skeleton.find(
        (bone: (typeof definition.skeleton)[number]): boolean =>
          bone.bone === "leftLowerArm",
      )!;
    const acromion: [number, number, number] =
      definition.standing.trunk!.shoulder;
    const humerus: number = Math.hypot(
      ...elbow.position.map(
        (value: number, axis: number): number => value - upper.position[axis]!,
      ),
    );
    const neutralAR: number =
      acromion[1] -
      upper.position[1] +
      humerus +
      AutoMovieHumanArmBones.RADIALE * input.arms.upper;
    if (Math.abs(neutralAR - input.arms.upper) > 1e-9)
      defects.push(
        `${name}: production trunk GH and rigid arm do not close neutral AR: ${neutralAR} instead of ${input.arms.upper} mm`,
      );
    const measures: ReturnType<typeof AutoMovieHumanBodyAnatomy.resolve> =
      AutoMovieHumanBodyAnatomy.resolve(params);
    if (
      Math.abs(acromion[1] - measures.acromialHeight * input.arms.scale) >
        1e-6 ||
      Math.abs(
        acromion[2] - (measures.biacromialBreadth * input.arms.scale) / 2,
      ) > 1e-6
    )
      defects.push(`${name}: GH proxy moved the public acromion Y/Z datum`);
    for (const side of ["left", "right"] as const) {
      const hand: AutoMovieHumanBodyLaw.IDefinition["hands"]["left"] =
        definition.hands[side];
      for (const [digit, source] of [
        ...Object.entries(hand.fingers),
        ["Thumb", hand.thumb],
      ] as [string, typeof hand.thumb][]) {
        const base: (typeof definition.skeleton)[number] =
          definition.skeleton.find(
            (bone: (typeof definition.skeleton)[number]): boolean =>
              bone.bone ===
              `${side}${digit === "Thumb" ? "ThumbMetacarpal" : `${digit}Proximal`}`,
          )!;
        if (base.position !== source.centres[0])
          defects.push(
            `${name}/${side}${digit}: bind joint lost its actual source reference`,
          );
        const partName: string =
          digit === "Thumb"
            ? `thumb.${side}`
            : `finger.${side}.${digit.toLowerCase()}`;
        const view: AutoMovieHumanSiteViewPart.IResult["view"] =
          definition.lane.sources.find(
            (attempt: AutoMovieHumanSiteViewPart.ISource): boolean =>
              attempt.name === partName,
          )?.result.view ?? null;
        if (view?.axis.type !== "jointed")
          defects.push(
            `${name}/${partName}: source material axis is unavailable`,
          );
        else if (
          [view.axis.up.x, view.axis.up.y, view.axis.up.z].some(
            (value: number, axis: number): boolean =>
              value !== source.dorsal[axis],
          )
        )
          defects.push(
            `${name}/${partName}: original material dorsal was reconstructed instead of retained`,
          );
      }
    }
    // These actual world frames support the palm-chart audit; they are
    // observations, not a new roll oracle or a reference-fit target.
    for (const side of ["left", "right"] as const) {
      const source: AutoMovieHumanSiteViewPart.ISource | undefined =
        definition.lane.sources.find(
          (item: AutoMovieHumanSiteViewPart.ISource): boolean =>
            item.name === `arm.${side}`,
        );
      if (source !== undefined && source.result.part !== null) {
        const part: NonNullable<AutoMovieHumanSiteViewPart.IResult["part"]> =
          source.result.part;
        HumanBodyDefinitionFrames.materialFrame(
          `${name}/arm.${side}`,
          source.result,
          definition.hands[side].frame.across,
          defects,
        );
        HumanBodyDefinitionShoulder.shoulderSource(
          `${name}/arm.${side}`,
          source.result,
          side,
          definition,
          input,
          defects,
        );
        const edges: number[] = [
          part.front.positive,
          part.side.positive,
          part.front.negative,
          part.side.negative,
        ].map(
          (outline: (typeof part.front)["positive"]): number =>
            outline.knots.find(
              (knot: (typeof outline.knots)[number]): boolean =>
                knot.site === "knuckles",
            )?.value ?? NaN,
        );
        const radialBreadth: number = edges[0]! - edges[2]!;
        const palmarDepth: number = edges[1]! - edges[3]!;
        const radialCenter: number = (edges[0]! + edges[2]!) / 2;
        if (
          !edges.every(Number.isFinite) ||
          Math.abs(radialBreadth - input.arms[side].breadth) > 1e-9
        )
          defects.push(
            `${name}/arm.${side}: radial u does not own public palm breadth`,
          );
        if (Math.abs(radialCenter - definition.hands[side].radialCenter) > 1e-9)
          defects.push(
            `${name}/arm.${side}: palm lost its source packing centre`,
          );
        const cap: [number, number, number] = part.axis.at(
          part.stations.at(-1)!,
        ).origin;
        const reach: number = Math.hypot(
          ...cap.map(
            (value: number, axis: number): number =>
              value - definition.hands[side].crease[axis]!,
          ),
        );
        if (Math.abs(reach - palmarDepth / 2) > 1e-6)
          defects.push(
            `${name}/arm.${side}: distal cap ${reach} mm uses the wrong anatomical dimension instead of palmar half-depth ${palmarDepth / 2} mm`,
          );
        console.log(
          JSON.stringify({
            person: name,
            part: source.name,
            radialBreadth,
            publicBreadth: input.arms[side].breadth,
            radialCenter,
            palmarDepth,
            capReach: reach,
          }),
        );
        for (const site of ["wrist", "knuckles"] as const) {
          const knot: (typeof part.front.positive.knots)[number] | undefined =
            part.front.positive.knots.find(
              (item: (typeof part.front.positive.knots)[number]): boolean =>
                item.site === site,
            );
          if (knot !== undefined)
            console.log(
              JSON.stringify({
                person: name,
                part: source.name,
                site,
                station: knot.station,
                frame: part.axis.at(knot.station),
                handFrame: definition.hands[side].frame,
                sourceDorsal: definition.hands[side].fingers.Middle.dorsal,
                skeleton: definition.skeleton.filter(
                  (bone: (typeof definition.skeleton)[number]): boolean =>
                    [
                      `${side}Hand`,
                      `${side}IndexProximal`,
                      `${side}MiddleProximal`,
                      `${side}LittleProximal`,
                    ].includes(bone.bone),
                ),
              }),
            );
        }
      }
    }
    console.log(
      JSON.stringify({
        person: name,
        sourceParts: [...names],
        sourceAttempts: definition.lane.sources.length,
        sameHead,
        stature: definition.stature,
        diagnostics: definition.diagnostics,
        headDiagnostics: definition.head.source.diagnostics,
        stage: "source-definition",
        finalRealization: "not-run",
      }),
    );
  }
  if (defects.length !== 0)
    throw new Error(
      `Production source definition findings:\n${defects.join("\n")}`,
    );
}
