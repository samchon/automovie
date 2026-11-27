import type {
  IAutoMovieAuditPhysicalOutcomes,
  IAutoMovieContactReceipt,
} from "@automovie/interface";

import { admitPhysicalOutcomes } from "./admitPhysicalOutcomes";

/**
 * Audit authored outcome promises against actual receipts and observed falls. A
 * missing hit is a failure with the action id and measured miss distance; a
 * geometric receipt cannot satisfy a solver-contact promise. Unexpected
 * contacts are returned too, so success cannot silently contain extra hits.
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
