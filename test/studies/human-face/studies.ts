/**
 * Numerical study inventory consumed by the playground's face editor. These
 * imported JSON documents retain their own versioned basis, reference identity,
 * and millimetre anatomy; package code contains no named-person catalogue.
 * The registry does not fit, validate, mutate or accept the documents. The
 * editor admits a selected document through the human package's document owner.
 * review.md records artifact-specific observations, including experiments that
 * these canonical documents cannot replay. Updating a study or its source basis
 * requires a fresh export and observation rather than inheriting an old verdict.
 */
import alanRickman from "./alan-rickman.json";
import danielRadcliffe from "./daniel-radcliffe.json";
import emmaWatson from "./emma-watson.json";
import generatedBlackBoy01 from "./generated-black-boy-01.json";
import generatedBlackGirl01 from "./generated-black-girl-01.json";
import generatedKoreanBoy01 from "./generated-korean-boy-01.json";
import generatedKoreanGirl01 from "./generated-korean-girl-01.json";
import generatedWhiteBoy01 from "./generated-white-boy-01.json";
import generatedWhiteGirl01 from "./generated-white-girl-01.json";
import kimMinJung from "./kim-min-jung.json";
import leeTaeRi from "./lee-tae-ri.json";
import maggieSmith from "./maggie-smith.json";
import michaelGambon from "./michael-gambon.json";
import miriamMargolyes from "./miriam-margolyes.json";
import ohSeungYoon from "./oh-seung-yoon.json";
import parkEunBin from "./park-eun-bin.json";
import type { humanFaceStudyReview } from "./review";
import rupertGrint from "./rupert-grint.json";
import yooSeungHo from "./yoo-seung-ho.json";

/**
 * Selected numerical face documents used by the actual playground editor.
 * The package contains no named people; this study owns their input choices
 * and keeps the documents portable. The editor admits each document when read.
 * Source images, input quality and per-view observations remain separate.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-review Binds the editor's actual nineteen saved inputs to their separate source inventories, capture observations and unaccepted likeness verdicts.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-review Keeps the imported document identity attached to each artifact-specific review rather than treating successful construction as visual acceptance.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-skin-condition Supplies separate resting-fold and tissue-descent settings for four older-person studies without assigning age morphology to every input.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-skin-condition Loads the same bounded skin documents in the editor, with explicit regional amounts and independent current-expression creasing.
 *
 * @evidence studies/human-face/review.md#optical-population-2026-09-17 Records the eleven-document optical adoption, retained alternatives, actual editor replay and explicit remaining anatomical limits.
 * @evidence studies/human-face/review.md#oral-joint-space-2026-09-16 Retains the four named parent studies used by the joint oral investigation; replacement cavity meshes, numerical improvements and remaining render/tissue limitations are separately identified experiments rather than outputs replayed by these documents.
 *
 * @evidence studies/human-face/review.md#alan-rickman Connects the current aperture override removal to its measured boundary, thirteen-view comparison and separately audited built-in editor, while retaining the earlier face-only record.
 * @evidence studies/human-face/review.md#daniel-radcliffe Supplies the daniel-radcliffe replay document whose selected source, rendered artifact and nine inspected views are recorded here.
 * @evidence studies/human-face/review.md#emma-watson Connects the current RGB-only study to its held-out comparison, thirteen-view inspection and separate built-in editor export, while retaining the earlier face-only record.
 * @evidence studies/human-face/review.md#generated-black-boy-01 Connects the current upper-crown and mandibular-row update to its source replay, ten inspected views and separately retained historical hair and face records.
 * @evidence studies/human-face/review.md#generated-black-girl-01 Connects this study's partial optical adoption to the four changed construction controls, exact replay, 27 directly inspected views, retained limitations and preceding artifact-specific observations.
 * @evidence studies/human-face/review.md#generated-korean-boy-01 Connects this study's partial optical adoption to the four changed construction controls, exact replay, 27 directly inspected views, retained limitations and preceding artifact-specific observations.
 * @evidence studies/human-face/review.md#generated-korean-girl-01 Supplies the generated-korean-girl-01 replay document whose selected source, rendered artifact and nine inspected views are recorded here.
 * @evidence studies/human-face/review.md#generated-white-boy-01 Supplies the generated-white-boy-01 replay document whose selected source, rendered artifact and nine inspected views are recorded here.
 * @evidence studies/human-face/review.md#generated-white-girl-01 Supplies the generated-white-girl-01 replay document whose selected source, rendered artifact and nine inspected views are recorded here.
 * @evidence studies/human-face/review.md#kim-min-jung Supplies the kim-min-jung replay document whose selected source, rendered artifact and nine inspected views are recorded here.
 * @evidence studies/human-face/review.md#lee-tae-ri Connects the measured opening override removal to current multi-angle and expression inspection while retaining the historical chin-frame record.
 * @evidence studies/human-face/review.md#maggie-smith Supplies the maggie-smith replay document whose selected source, rendered artifact and nine inspected views are recorded here.
 * @evidence studies/human-face/review.md#michael-gambon Supplies the michael-gambon replay document whose selected source, rendered artifact and nine inspected views are recorded here.
 * @evidence studies/human-face/review.md#miriam-margolyes Connects this study's partial optical adoption to the four changed construction controls, exact replay, 27 directly inspected views, retained limitations and preceding artifact-specific observations.
 * @evidence studies/human-face/review.md#oh-seung-yoon Supplies the oh-seung-yoon replay document whose selected source, rendered artifact and nine inspected views are recorded here.
 * @evidence studies/human-face/review.md#park-eun-bin Supplies the park-eun-bin replay document whose selected source, rendered artifact and nine inspected views are recorded here.
 * @evidence studies/human-face/review.md#rupert-grint Supplies the rupert-grint replay document whose selected source, rendered artifact and nine inspected views are recorded here.
 * @evidence studies/human-face/review.md#yoo-seung-ho Connects this study's partial optical adoption to the four changed construction controls, exact replay, 27 directly inspected views, retained limitations and preceding artifact-specific observations.
 * @evidence {@link humanFaceStudyReview} Retains the shared construction-source inspection for these independent numerical face documents.
 */
export const humanFaceStudyDocuments: Readonly<Record<string, unknown>> = {
  "alan-rickman": alanRickman,
  "daniel-radcliffe": danielRadcliffe,
  "emma-watson": emmaWatson,
  "generated-black-boy-01": generatedBlackBoy01,
  "generated-black-girl-01": generatedBlackGirl01,
  "generated-korean-boy-01": generatedKoreanBoy01,
  "generated-korean-girl-01": generatedKoreanGirl01,
  "generated-white-boy-01": generatedWhiteBoy01,
  "generated-white-girl-01": generatedWhiteGirl01,
  "kim-min-jung": kimMinJung,
  "lee-tae-ri": leeTaeRi,
  "maggie-smith": maggieSmith,
  "michael-gambon": michaelGambon,
  "miriam-margolyes": miriamMargolyes,
  "oh-seung-yoon": ohSeungYoon,
  "park-eun-bin": parkEunBin,
  "rupert-grint": rupertGrint,
  "yoo-seung-ho": yooSeungHo,
};
