import { AutoMovieConstructionViews, type IAutoMovieViewPart } from "@automovie/engine";
import type { AutoMovieConstructionNode, IAutoMovieConstructionView } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import type { IHumanDebugDocument } from "../../../../../../packages/human/debug/contracts/IHumanDebugDocument";
import { HumanDebugPieceHeadParts } from "../../../../../../packages/human/debug/pieces/head/HumanDebugPieceHeadParts";
import { AutoMovieHumanBodyAnatomy } from "../../../../../../packages/human/src/generation/AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanBodyLaw } from "../../../../../../packages/human/src/generation/AutoMovieHumanBodyLaw";
import { AutoMovieHumanHeadPrior } from "../../../../../../packages/human/src/generation/AutoMovieHumanHeadPrior";
import { AutoMovieHumanNeckSource } from "../../../../../../packages/human/src/generation/AutoMovieHumanNeckSource";
import type { IAutoMovieHumanBodyCalibration } from "../../../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanHeadLayout } from "../../../../../../packages/human/src/generation/IAutoMovieHumanHeadLayout";
import type { IAutoMovieHumanHeadInputs } from "../../../../../../packages/human/src/generation/IAutoMovieHumanHeadInputs";
import type { IAutoMovieHumanParameters } from "../../../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { AutoMovieHumanHeadAnchors } from "../../../../../../packages/human/src/generation/head/AutoMovieHumanHeadAnchors";
import { AutoMovieHumanHeadLane } from "../../../../../../packages/human/src/generation/head/AutoMovieHumanHeadLane";
import { AutoMovieHumanHeadLayout } from "../../../../../../packages/human/src/generation/head/AutoMovieHumanHeadLayout";
import { HumanPeople } from "../../../internal/HumanPeople";
import { nclose } from "../../../internal/nclose";

/**
 * The head's globe records belong to the sockets in its construction tree.
 * The planned lid margin's centre meets each socket cutter's inner pole;
 * it cannot keep the seat of a discarded, different radial head.
 *
 * Scenarios:
 * 1. f1's two socket poles agree with their own globe/margin frames within 1e-8 mm of conversion precision; both side-specific attachment records are finite.
 * 2. The attachment observer rejects zero, negative and nonfinite scale, an unrepresentable profile window, and a missing side's globe with a named failure.
 * 3. The real head.parts:mass entry produces its raw head document from the same public inputs without invoking whole-person calibration.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds the production head lane from f1's public inputs, converts the emitted tree's actual socket views through the engine and reads each inner pole against its published globe frame. A globe left at the retired radial head's seat fails.
 * @evidence contracts/testing.md#independent-expectations The socket cutter ends at the planned margin seat by the head part's contract; the margin centre is marginForward ahead of and globeRise below its globe. The 1e-8 mm allowance covers floating-point metre/millimetre conversion, not an anatomical displacement. This establishes frame consistency, not anatomical validity of the retained radius or recess priors, or existence of a realized lid.
 * @evidence contracts/testing.md#distinguishing-cases Both asymmetric f1 sides are read separately; invalid scales, loss of a representable height window and a missing side exercise the observer's explicit failures. Whole-skin crown and head realization are owned by human_head_on_trunk.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by --include human_head_lane_records; only f1 is built, with no body realization, host, browser or GPU. The standalone raw-head consumer's calibration callback throws if called, so its boundary is observed directly.
 */
export function test_human_head_lane_records(): void {
  const params: IAutoMovieHumanParameters = HumanPeople.params("f1");
  const inputs: IAutoMovieHumanHeadInputs = AutoMovieHumanBodyLaw.headInputs(params);
  const neck: AutoMovieHumanNeckSource.IOutput = AutoMovieHumanNeckSource.of(inputs, AutoMovieHumanBodyLaw.limbInputs(params).legs.scale);
  const lane: AutoMovieHumanHeadLane.IOutput = AutoMovieHumanHeadLane.create(inputs, AutoMovieHumanBodyAnatomy.sexOf(params), neck);
  const plan: IAutoMovieHumanHeadLayout = AutoMovieHumanHeadLayout.create(neck, inputs);
  const face: AutoMovieHumanHeadPrior.IFace = AutoMovieHumanHeadPrior.PRIOR.face;
  const failures: string[] = [];
  const views: Map<string, IAutoMovieConstructionView> = new Map();
  collect(lane.root, views);
  for (const eye of lane.eyes) {
    const node: IAutoMovieConstructionView | undefined = views.get(`orbit.${eye.side}`);
    if (node === undefined) {
      failures.push(`${eye.side}: no socket view in the production tree`);
      continue;
    }
    const part: IAutoMovieViewPart | string = AutoMovieConstructionViews.part(node);
    if (typeof part === "string") {
      failures.push(`${eye.side}: ${part}`);
      continue;
    }
    const pole: [number, number, number] = part.axis.at(part.stations[part.stations.length - 1]!).origin;
    const margin: [number, number, number] = [eye.centre[0] + face.marginForward * plan.scale, eye.centre[1] - face.globeRise * plan.scale, eye.centre[2]];
    const gap: number = Math.hypot(...pole.map((v: number, i: number): number => v - margin[i]!));
    console.log(`head socket ${eye.side}: pole=[${pole.join(",")}], margin centre=[${margin.join(",")}], gap=${gap} mm`);
    if (!nclose(gap, 0, 1e-8)) failures.push(`${eye.side}: margin centre is ${gap} mm from its own socket pole`);
    if (!lane.landmarks.exocanthion[eye.side].every(Number.isFinite)) failures.push(`${eye.side}: nonfinite exocanthion`);
  }
  for (const scale of [0, -1, Infinity, NaN, Number.MIN_VALUE]) {
    try {
      AutoMovieHumanHeadAnchors.of({ ...plan, scale }, lane.eyes);
      failures.push(`attachment observer accepted scale ${scale}`);
    } catch (error) {
      if (!/Head attachment/.test((error as Error).message)) failures.push(`scale ${scale}: unnamed observation failure ${(error as Error).message}`);
    }
  }
  try {
    AutoMovieHumanHeadAnchors.of(plan, lane.eyes.filter((eye: IAutoMovieHumanBodyCalibration.IEye): boolean => eye.side === "left"));
    failures.push("attachment observer accepted no right globe");
  } catch (error) {
    if (!/no right globe/.test((error as Error).message)) failures.push(`missing right globe: ${(error as Error).message}`);
  }
  const document: IHumanDebugDocument = HumanDebugPieceHeadParts.build({
    alias: "f1",
    parameters: params,
    calibration: (): IAutoMovieHumanBodyCalibration => { throw new Error("Standalone head parts requested whole-person calibration"); },
  }, "mass");
  if (!document.parts.length || document.parts.some((part: IHumanDebugDocument.IPart): boolean => !part.id.startsWith("human.skin.head.mass/"))) failures.push("standalone head.parts:mass did not return only the head-mass document");
  console.log(`head standalone raw consumer: parts=${document.parts.length}, piece=${String(document.provenance.piece)}, whole-calibration calls=0`);
  TestValidator.predicate(failures.join("\n"), failures.length === 0);
}

/** Read the tree's published views without realizing or replacing any node. */
function collect(node: AutoMovieConstructionNode, views: Map<string, IAutoMovieConstructionView>): void {
  if (node.type === "view") views.set(node.name, node);
  else {
    collect(node.host, views);
    if (node.type !== "trim") collect(node.part, views);
  }
}
