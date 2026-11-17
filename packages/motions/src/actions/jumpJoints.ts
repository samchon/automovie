import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { stand } from "./stand";

/**
 * The jump's relaxed hands, upright trunk and arm swing at their authored
 * flexions. Push, flight and their endpoint readers use this same table.
 * The prepare companion binds the unchanged relaxed/upright prefix for
 * repeated push and landing samples without retaining a sampled posture.
 *
 * @param body The actual body whose resting fingers and arm separation are read.
 * @param upright The jump's upright clinical joints.
 * @param left The left shoulder flexion, degrees.
 * @param right The right shoulder flexion, degrees.
 * @returns A fresh clinical joint record and arm tuples.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States shared phases, clinical degree inputs and fresh table/arm ownership; prepare's detailed companion docs define the unchanged body/upright premise, changing inputs and caller-owned prefix lifetime.
 * @evidence contracts/development/implementation.md#principled-implementation Cold and prepared writers merge the same relaxed/upright prefix in original precedence, then share the original shoulder flexions at standing abduction and elbow flexion 12 plus one third of shoulder flexion.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Cold calls read stand's abduction and merge a fresh table; prepare binds that unchanged prefix/separation once and copies the prefix per query. Both delegate four assignments to the same private numerical owner.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Changes no clinical joint, arm rate, range, contact or result freshness. A changed prepared body/upright prefix requires new preparation; no fitted goal or sampled posture is reused.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cold calls copy relaxed/upright entries and write four arm tuples. Prepare pays one O(J) fixed prefix merge, replacing repeated two-table spreads and relaxed/abduction lookups; each query still copies all J prefix members and creates four fresh arm tuples. Stand retains its existing body-dependent first-use work; speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Both paths share write and stand's existing body owner. Only explicitly unchanged relaxed/upright inputs fix prepared prefix membership, tuple values and arm separation; current shoulder samples and original elbow arithmetic remain evaluated without a time key or previous result.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Cold calls retain nothing. The prepared caller owns one bounded prefix record borrowing unchanged clinical tuples plus one scalar until release. Every result owns its table and four arm tuples; no posture, workspace, loan, history or external handle enters the retained writer.
 */
export function jumpJoints(
  body: IHumanBody,
  upright: IHumanPosture["joints"],
  left: number,
  right: number,
): IHumanPosture["joints"] {
  const abduction: number = stand.abduction(body);
  return write({ ...stand.relaxed(body), ...upright }, abduction, left, right);
}

/**
 * Fixed-prefix companion of the same jump joint-table owner.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The companion documents its unchanged body/upright lifetime, degree inputs and fresh table/arm ownership.
 * @evidence contracts/development/design.md#principled-representation The existing clinical joint record and one arm-separation scalar describe the fixed prefix; each query adds the same four actual arm tuples.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only prepare is added to the existing callable jumpJoints owner for its actual push and landing consumers; no root barrel or action parameter changes.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No pose, fit, time key or resolved flag is represented; explicit unchanged inputs govern fixed-prefix reuse and the cold function remains available.
 */
export namespace jumpJoints {
  /**
   * Bind the jump's unchanged relaxed/upright joint prefix for arm samples.
   * The caller keeps this body's relaxed posture and upright table unchanged
   * until it releases the returned writer.
   *
   * @param body The actual fixed body owning relaxed hands and arm separation.
   * @param upright The unchanged upright clinical table.
   * @returns A reader of left/right shoulder flexions in degrees, returning a fresh table and four fresh arm tuples with the original borrowed unchanged joint tuples.
   *
   * Abduction and the merged relaxed/upright prefix prepare once in original
   * precedence. Each query copies all J prefix members and shares the cold
   * writer's four original shoulder/elbow assignments, retaining fresh arm
   * tuples and ordinary borrowed unchanged clinical tuples. Speedup is
   * unmeasured; only the two-table merge and fixed stand lookups are shared.
   *
   * Changing the fixed body/upright inputs requires new preparation. The
   * caller releases one bounded prefix record and one scalar with its plan;
   * no clinical range, rate, goal, sample result, workspace, loan, time
   * history or external handle is replaced or retained by this reader.
   */
  export function prepare(
    body: IHumanBody,
    upright: IHumanPosture["joints"],
  ): (left: number, right: number) => IHumanPosture["joints"] {
    const abduction: number = stand.abduction(body);
    const prefix: IHumanPosture["joints"] = { ...stand.relaxed(body), ...upright };
    return (left: number, right: number): IHumanPosture["joints"] =>
      write({ ...prefix }, abduction, left, right);
  }
}

/** Fill only the original four arm entries of a caller-owned fresh table, in their original order. */
function write(joints: IHumanPosture["joints"], abduction: number, left: number, right: number): IHumanPosture["joints"] {
  joints.leftUpperArm = [left, abduction, 0];
  joints.rightUpperArm = [right, abduction, 0];
  joints.leftLowerArm = [12 + left / 3, 0, 0];
  joints.rightLowerArm = [12 + right / 3, 0, 0];
  return joints;
}
