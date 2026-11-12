import type { IAutoMovieContactReceipt } from "@automovie/interface";

import type { IAutoMovieMark } from "../geometry/IAutoMovieMark";

/**
 * Turn the solved contacts acting at one second into inspection marks: one arrow per contact, at the contact point along its normal, as long as the mean force times a stated scale.
 *
 * A receipt acts at `seconds` when the solver measured it: its latest completed step at or before `seconds`, within that step's duration, has a positive finite impulse and no positive separation. The arrow starts at that step's point and runs along its normal, from the first collider toward the second, for `metresPerNewton` times the step's mean force, its impulse over its duration. Geometric receipts, which assert no impulse, draw nothing.
 *
 * The mark has kind `contact`, label `contact force`, colour teal `00c2a8` and path `<body>/<bone>/contact/<receipt id>` of the first collider, in world metres and unanchored.
 *
 * It throws for a scale that is not positive and finite and for an acting step without a positive duration.
 *
 * @param props.receipts Contact episodes, as the composition's contact measurement and the solver record them.
 * @param props.seconds The drawn film second.
 * @param props.metresPerNewton Arrow length per newton of mean force.
 * @returns One mark per acting contact, in the receipts' order.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States when a contact acts, how the arrow's place, direction and length follow from the step, what geometric receipts draw, the kind, label, colour, path and frame, and both refusals.
 * @evidence contracts/development/implementation.md#principled-implementation A step's mean force is its normal impulse over its duration, so the arrow's length is a force on a stated scale; a step is read only once completed at or before the drawn second, so a still never shows a later impulse.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the receipts, each scanned from its last step back to the drawn second.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The scale is the caller's stated parameter, and a step without a duration is refused instead of given an arbitrary length.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the receipts' steps in the worst case; each receipt stops at its latest step at or before the second.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure conversion of one second.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh marks and keeps nothing.
 */
export function markAutoMovieContacts(props: {
  receipts: readonly IAutoMovieContactReceipt[];
  seconds: number;
  metresPerNewton: number;
}): IAutoMovieMark[] {
  if (!(Number.isFinite(props.metresPerNewton) && props.metresPerNewton > 0))
    throw new Error(
      `markAutoMovieContacts: metres per newton ${props.metresPerNewton} is not positive and finite`,
    );
  const marks: IAutoMovieMark[] = [];
  for (const receipt of props.receipts) {
    if (receipt.source !== "solver") continue;
    const steps: NonNullable<IAutoMovieContactReceipt["samples"]> =
      receipt.samples ?? [];
    let step: (typeof steps)[number] | undefined;
    for (let i: number = steps.length - 1; i >= 0; i--)
      if (steps[i]!.seconds <= props.seconds + 1e-9) {
        step = steps[i];
        break;
      }
    if (
      step === undefined ||
      !(step.impulse > 0 && Number.isFinite(step.impulse)) ||
      step.separation > 0
    )
      continue;
    if (!(step.duration > 0))
      throw new Error(
        `markAutoMovieContacts: contact ${receipt.id} has a step without a positive duration`,
      );
    if (props.seconds - step.seconds >= step.duration) continue;
    const length: number =
      (step.impulse / step.duration) * props.metresPerNewton;
    marks.push({
      path: `${receipt.a.body}/${receipt.a.bone}/contact/${receipt.id}`,
      kind: "contact",
      label: "contact force",
      color: 0x00c2a8,
      shape: {
        type: "arrows",
        origins: [step.point.x, step.point.y, step.point.z],
        vectors: [
          step.normal.x * length,
          step.normal.y * length,
          step.normal.z * length,
        ],
      },
      flagged: false,
      anchor: null,
    });
  }
  return marks;
}
