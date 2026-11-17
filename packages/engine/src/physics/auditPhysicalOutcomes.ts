import type { IAutoMovieAuditPhysicalOutcomes, IAutoMovieContactReceipt } from "@automovie/interface";


import { admitPhysicalOutcomes } from "./admitPhysicalOutcomes";

/**
 * Audit authored outcome promises against actual receipts and observed falls.
 * A missing hit is a failure with the action id and measured miss distance;
 * a geometric receipt cannot satisfy a solver-contact promise. Unexpected
 * contacts are returned too, so success cannot silently contain extra hits.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Audit authored outcome promises against actual receipts and observed falls) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Audit authored outcome promises against actual receipts and observed falls) directly over its typed inputs (`input`) as nested iteration of depth 3 (for-of over input.actions; filter over input.contacts; some over receipt.samples), delegating to `admitPhysicalOutcomes`, `Math.abs`, `used.add`, `input.missDistance`, `Number.isFinite`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 81 lines and 7 top-level statements that reuses `admitPhysicalOutcomes`, `Math.abs`, `used.add`, `input.missDistance`, `Number.isFinite` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 1 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`; the dominant cost is nested iteration of depth 3 (for-of over input.actions; filter over input.contacts; some over receipt.samples), performed once per call with 7 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 7 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function auditPhysicalOutcomes(
  input: IAutoMovieAuditPhysicalOutcomes.IInput,
): IAutoMovieAuditPhysicalOutcomes.IFinding[] {
  admitPhysicalOutcomes(input);
  const findings: IAutoMovieAuditPhysicalOutcomes.IFinding[] = [];
  const used: Set<string> = new Set();
  for (const action of input.actions) {
    const contacts: IAutoMovieContactReceipt[] = input.contacts.filter(
      (receipt: (typeof input.contacts)[number]): boolean =>
        receipt.source === action.source &&
        receipt.separation <= 0 &&
        receipt.seconds <= action.seconds + action.tolerance &&
        receipt.endSeconds >= action.seconds - action.tolerance &&
        ((receipt.a.body === action.actor &&
          receipt.b.body === action.target &&
          action.actorShapes.includes(receipt.a.shape) &&
          action.targetShapes.includes(receipt.b.shape)) ||
          (receipt.b.body === action.actor &&
            receipt.a.body === action.target &&
            action.actorShapes.includes(receipt.b.shape) &&
            action.targetShapes.includes(receipt.a.shape))) &&
        (action.source !== "solver" ||
          (receipt.samples
            ? receipt.samples.some(
                (
                  sample: NonNullable<
                    IAutoMovieContactReceipt["samples"]
                  >[number],
                ): boolean =>
                  Math.abs(sample.seconds - action.seconds) <=
                    action.tolerance &&
                  sample.impulse > 0 &&
                  sample.separation <= 0,
              )
            : (receipt.impulse ?? 0) > 0)),
    );
    for (const receipt of contacts) used.add(receipt.id);
    if (action.expected === "contact" && contacts.length === 0) {
      const distance: number = input.missDistance(action);
      if (!Number.isFinite(distance))
        throw new Error("Invalid physical outcome miss distance");
      findings.push({
        actionId: action.id,
        kind: "missed-contact",
        seconds: action.seconds,
        missDistance: distance,
        message: `Action ${action.id}: required ${action.source} contact absent`,
      });
    }
    if (action.expected === "miss" && contacts.length > 0)
      findings.push({
        actionId: action.id,
        kind: "unexpected-contact",
        seconds: contacts[0]!.seconds,
        missDistance: 0,
        message: `Action ${action.id}: contact contradicted scripted miss`,
      });
  }
  for (const fall of input.falls) {
    const observed: number | undefined = input.observedFalls[fall.body];
    if (
      observed === undefined ||
      Math.abs(observed - fall.seconds) > fall.tolerance
    )
      findings.push({
        actionId: fall.id,
        kind: "wrong-fall",
        seconds: observed ?? fall.seconds,
        missDistance: null,
        message: `Action ${fall.id}: fall outside declared timing window`,
      });
  }
  for (const receipt of input.contacts)
    if (!used.has(receipt.id) && !input.allowUnplanned(receipt))
      findings.push({
        actionId: receipt.id,
        kind: "unplanned-contact",
        seconds: receipt.seconds,
        missDistance: 0,
        message: `Unplanned contact ${receipt.id}`,
      });
  return findings;
}
