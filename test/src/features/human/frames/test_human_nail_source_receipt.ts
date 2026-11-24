import { AutoMovieHumanConicLoft, AutoMovieHumanF1Nails } from "@automovie/human";
import type { IAutoMovieHumanConicLoft, IAutoMovieHumanF1, IAutoMovieHumanF1Nails, IAutoMovieHumanSegmentFrame, IAutoMovieViewPart } from "@automovie/interface";

import { FamilyConicCaptureContext as Capture } from "../../../reference-conics/FamilyConicCaptureContext";
import { HumanNailFixture } from "../../internal/HumanNailFixture";

/**
 * The early ordinary failure receipt keeps this attempt's emitted nail source.
 *
 * Scenarios:
 * 1. A placed analytic digit emits its bed and exact twin before an independent attachment refuses.
 * 2. An attempt with only the contact observation reports source and mesh stages unavailable.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Fits and emits one digit through the production source adapter and checks the early ordinary receipt after its named contact gate refuses.
 * @evidence contracts/development/testing.md#independent-expectations The made digit has a cap at material station 26 and a world pole of [-40,0,20] mm, so its placed distal frame reads 20 mm. Its one bed must appear on each side.
 * @evidence contracts/development/testing.md#distinguishing-cases The same named refusal appears with and without a source observation. Only the attempt that reached the source producer can claim source rows, and neither can claim a whole mesh.
 * @evidence contracts/development/testing.md#execution-ownership One in-memory digit source and an explicit named refused-contact observation exercise the production gate and receipt. The test reaches neither the whole-body generator nor the raster.
 * @evidence contracts/development/common.md#meaningful-documentation Names the valid placed cap and the separate attachment refusal.
 */
export function test_human_nail_source_receipt(): void {
  const { failures, near, finish }: ReturnType<typeof HumanNailFixture.observations> = HumanNailFixture.observations();
  const { family, posed }: ReturnType<typeof HumanNailFixture.circularDigit> = HumanNailFixture.circularDigit();
  const frames: ReadonlyMap<string, IAutoMovieHumanSegmentFrame> = new Map([["index.distal", posed]]);
  const digits: IAutoMovieHumanF1.IDigit[] = [{ family, limb: "arm", knuckle: true }];
  const original: IAutoMovieViewPart = AutoMovieHumanConicLoft.part(family, [...family.knots]);
  const made: IAutoMovieHumanF1Nails.IMade = AutoMovieHumanF1Nails.createFrom(digits[0]!, frames, original);
  const nails: IAutoMovieHumanF1Nails.IMade[] = [made];
  const bedded: IAutoMovieViewPart = AutoMovieHumanF1Nails.addReliefs(original, family, [made.nail.bed]);
  const twin: IAutoMovieHumanConicLoft.IFamily = AutoMovieHumanConicLoft.mirror(
    { ...family, reliefs: [made.nail.bed] }, family.name + ".mirror");
  const twinOriginal: IAutoMovieViewPart = AutoMovieHumanConicLoft.part(
    { ...twin, reliefs: undefined }, [...twin.knots]);
  const twinBedded: IAutoMovieViewPart = AutoMovieHumanF1Nails.addReliefs(twinOriginal, twin, twin.reliefs!);
  const sources: Map<string, IAutoMovieViewPart> = new Map([
    [bedded.name, bedded], [twinBedded.name, twinBedded],
  ]);
  const refused: IAutoMovieHumanF1.IContactPremise = {
    name: "root.plate", hostFace: "trunk", partFace: "plate", kind: "refused",
    detail: "the independent contact supplies no closed component",
  };
  let loopSourceReads: number = 0;
  const declaration: Pick<IAutoMovieHumanF1.IConstructionWithNails, "root" | "sources" | "nails" | "contactPremises" | "loopSources"> = {
    root: { type: "source", name: family.name, source: family.name },
    sources,
    nails,
    contactPremises: (): readonly IAutoMovieHumanF1.IContactPremise[] => [refused],
    loopSources: (): ReturnType<IAutoMovieHumanF1.IConstructionWithNails["loopSources"]> => {
      loopSourceReads++;
      return new Map();
    },
  };
  const observed: Capture.IOrdinaryObservation = {};
  let refusal: string | null = null;
  try {
    Capture.observeOrdinaryPreparation({ body: { trunk: { name: "trunk" }, arm: { name: "arm" } }, digits, frames }, declaration,
      (observation: Capture.IOrdinaryObservation): void => { Object.assign(observed, observation); });
  } catch (error: unknown) {
    refusal = error instanceof Error ? error.message : String(error);
  }
  if (refusal === null || !refusal.includes(refused.name) || !refusal.includes(refused.detail))
    failures.push("the later named contact did not refuse its candidate");

  const receipt: ReturnType<typeof Capture.failedOrdinary> = Capture.failedOrdinary(observed);
  if (loopSourceReads !== 0 || receipt.isolatedArmscye?.kind !== "unavailable")
    failures.push("the independent refused contact requested an isolated realization");
  const source: NonNullable<typeof receipt.sources>[number] | undefined = receipt.sources?.[0];
  if (receipt.sources?.length !== 1 || source === undefined || receipt.sources !== observed.sources) {
    failures.push("the early refusal erased the emitted source row");
  } else {
    if (source.name !== family.name || source.closed !== true || source.emittedPoleStation !== 26 || !source.sharedOriginal ||
        source.bedInstances !== 1 || source.twinBeds !== 1 || source.exactReflection !== true)
      failures.push("the refused attempt did not retain its exact source, bed, and twin observations");
    if (typeof source.fittedTip !== "number" || !Number.isFinite(source.fittedTip))
      failures.push("the refused attempt lost the finite fitted tip");
    else near("the refused attempt's placed cap", source.fittedTip, 20, 1e-10);
    if (typeof source.clipped !== "number" || !Number.isFinite(source.clipped) || !Array.isArray(source.clippedIn))
      failures.push("the refused attempt lost the fitted relief's clipping observation");
  }
  if (receipt.sourceFindings?.length !== 0 || receipt.contactPremises?.[0] !== refused ||
      receipt.bare !== null || receipt.production !== null || receipt.operators !== null)
    failures.push("the receipt lost its contact or reported a later stage before the gate");

  const unreached: ReturnType<typeof Capture.failedOrdinary> = Capture.failedOrdinary({ contactPremises: [refused] });
  if (unreached.sources !== null || unreached.sourceFindings !== null || unreached.contactPremises?.[0] !== refused)
    failures.push("an attempt without a source observation reported source evidence");
  finish();
}
