import type {
  IAutoMovieContactReceipt,
  IAutoMovieMark,
  IAutoMovieMarkContacts,
} from "@automovie/interface";

/**
 * Turn the solved contacts acting at one second into inspection marks: for each contact, one arrow per collider at the contact point, along the force that collider receives, as long as the mean force times a stated scale.
 *
 * A receipt acts at `seconds` when the solver measured it: its latest completed step at or before `seconds`, within that step's duration, has a positive finite impulse and no positive separation. Both arrows start at that step's point and are `metresPerNewton` times the step's mean force, its impulse over its duration, long. The first collider's arrow points against the step's normal and the second collider's along it, because the normal runs from the first toward the second and each is pushed away from the other. Geometric receipts, which assert no impulse, draw nothing.
 *
 * Each mark has kind `contact`, label `contact force`, colour teal `00c2a8` and the path `<body>/<bone>/contact/<receipt id>` of the collider it acts on, first collider first, in world metres and unanchored, so selecting a body selects the force it received whatever order the receipt names the pair in. A collider's mark is flagged when the step states the impulse each side actually received and that collider received none, as when an exaggerated mode's response rounds a solved impulse to zero: the solver measured a force that body never felt. A step without that statement is a direct native measurement and is not flagged.
 *
 * It throws for a scale that is not positive and finite and for an acting step without a positive duration.
 *
 * @param props.receipts Contact episodes, as the composition's contact measurement and the solver record them.
 * @param props.seconds The drawn film second.
 * @param props.metresPerNewton Arrow length per newton of mean force.
 * @returns Two marks per acting contact, in the receipts' order.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States when a contact acts, how each arrow's place, direction and length follow from the step, what geometric receipts draw, the kind, label, colour, path and frame, when a mark is flagged, and both refusals.
 * @evidence contracts/development/implementation.md#principled-implementation A step's mean force is its normal impulse over its duration, and by reaction the two colliders receive it in opposite directions, so each arrow is the force on the body its path names; a step is read only once completed at or before the drawn second, so a still never shows a later impulse.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the receipts, each scanned from its last step back to the drawn second, then one mark per side.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The scale is the caller's stated parameter, a step without a duration is refused instead of given an arbitrary length, and no side is chosen by its name: the receipt's canonical pair order decides nothing but the order of the two marks.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the receipts' steps in the worst case; each receipt stops at its latest step at or before the second.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure conversion of one second.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh marks and keeps nothing.
 */
export function markAutoMovieContacts(
  props: IAutoMovieMarkContacts.IProps,
): IAutoMovieMark[] {
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

    // The normal runs from a toward b, so a is pushed against it and b along it.
    for (const side of ["a", "b"] as const) {
      const sign: number = side === "a" ? -length : length;
      marks.push({
        path: `${receipt[side].body}/${receipt[side].bone}/contact/${receipt.id}`,
        kind: "contact",
        label: "contact force",
        color: 0x00c2a8,
        shape: {
          type: "arrows",
          origins: [step.point.x, step.point.y, step.point.z],
          vectors: [
            step.normal.x * sign,
            step.normal.y * sign,
            step.normal.z * sign,
          ],
        },
        flagged: step.appliedImpulse?.[side] === 0,
        anchor: null,
      });
    }
  }
  return marks;
}
