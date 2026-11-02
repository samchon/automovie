import { performance } from "node:perf_hooks";

import { test_human_engine_pose } from "../human/test_human_engine_pose";
import { test_human_mouth } from "../human/test_human_mouth";
import { test_human_skin_binding } from "../human/test_human_skin_binding";

import { HumanAnatomy } from "./HumanAnatomy";
import { HumanAnatomyAudit } from "./HumanAnatomyAudit";
import { HumanCurveAudit } from "./HumanCurveAudit";
import { HumanPeople } from "./HumanPeople";

/** Additional observations from the same cached person as the anatomy audits. */
export namespace HumanCampaignInspection {
  /** Independent audits retain their findings even if another audit throws. */
  export interface IOutput {
    /** Elapsed observation time, excluding the preceding anatomy checks. */
    milliseconds: number;

    /** All curve, placement, thigh and meshed hand/foot findings. */
    curves: HumanCurveAudit.IHumanCurveFinding[];

    /** Bind/neutral contrast separates construction from straightening effects. */
    hands: {
      /** Arm whose hand is observed. */
      side: "left" | "right";
      /** Generated source surface before neutral straightening. */
      bind: ReturnType<typeof HumanAnatomyAudit.handAt>;
      /** The same surface under the actual neutral consumer. */
      neutral: ReturnType<typeof HumanAnatomyAudit.handAt>;
    }[];

    /** Maintained consumer assertions run on this worker's same cached person. */
    consumerTests: {
      /** Existing discoverable test, whose default still checks all nine people. */
      name: string;
      /** Complete assertion outcome for this alias without stopping later tests. */
      passed: boolean;
      /** Assertion wall time in milliseconds. */
      milliseconds: number;
      /** Original failed assertion or exception, with its stack. */
      error?: string;
    }[];

    /** Failed observation paths, distinct from measured anatomical failures. */
    errors: {
      /** Observation that could not finish. */
      category: string;
      /** Preserved exception stack or thrown value. */
      error: string;
    }[];
  }

  /**
   * Run each maintained curve audit once and read both hand poses without
   * repeating body calibration. Run the maintained engine-pose, binding and
   * mouth assertions on the same person too, retaining each failed assertion.
   * The full nine-worker campaign preserves their default person coverage;
   * none of these calls changes a limit or stops a later observation.
   */
  export function measure(alias: string): IOutput {
    const started: number = performance.now();
    const result: IOutput = { milliseconds: 0, curves: [], hands: [], consumerTests: [], errors: [] };
    const person: HumanPeople.IPerson = HumanPeople.person(alias);
    const height: number = person.params.body.controls.height.value!;
    const mandible: number = person.params.head.mandibularWidth * person.body.stature / height / 2;
    const audits: [string, () => HumanCurveAudit.IHumanCurveFinding[]][] = [
      ["curves", (): HumanCurveAudit.IHumanCurveFinding[] => HumanCurveAudit.auditHumanCurves(alias, person.body, /./, mandible)],
      ["thigh", (): HumanCurveAudit.IHumanCurveFinding[] => HumanCurveAudit.auditHumanThigh(alias, person.body, height, person.params.body.controls.thigh.value!)],
      ["placement", (): HumanCurveAudit.IHumanCurveFinding[] => HumanCurveAudit.auditHumanPlacement(alias, person.body, height)],
      ["hand-skin", (): HumanCurveAudit.IHumanCurveFinding[] => HumanCurveAudit.auditHumanHand(alias, person.body)],
      ["foot-skin", (): HumanCurveAudit.IHumanCurveFinding[] => HumanCurveAudit.auditHumanFoot(alias, person.body)],
    ];
    for (const [category, audit] of audits) {
      try { result.curves.push(...audit()); }
      catch (error) { result.errors.push({ category, error: errorText(error) }); }
    }
    for (const side of ["left", "right"] as const) {
      try {
        result.hands.push({
          side,
          bind: HumanAnatomyAudit.handAt(HumanAnatomy.bind(alias), side),
          neutral: HumanAnatomyAudit.handAt(HumanAnatomy.posed(alias, {}), side),
        });
      } catch (error) { result.errors.push({ category: `${side}-hand-poses`, error: errorText(error) }); }
    }
    const consumers: [string, (aliases: readonly string[]) => void][] = [
      ["test_human_engine_pose", test_human_engine_pose],
      ["test_human_skin_binding", test_human_skin_binding],
      ["test_human_mouth", test_human_mouth],
    ];
    for (const [name, test] of consumers) {
      const began: number = performance.now();
      try {
        test([alias]);
        result.consumerTests.push({ name, passed: true, milliseconds: performance.now() - began });
      } catch (error) {
        result.consumerTests.push({ name, passed: false, milliseconds: performance.now() - began, error: errorText(error) });
      }
    }
    result.milliseconds = performance.now() - started;
    return result;
  }
}

/** Preserve a thrown diagnostic without assuming its value is an Error. */
function errorText(error: unknown): string {
  return error instanceof Error ? error.stack ?? error.message : String(error);
}
