import type {
  IAutoMovieContactReceipt,
  IAutoMovieMark,
  IAutoMovieMarkContacts,
  IAutoMoviePhysicalOwnershipEvent,
} from "@automovie/interface";

/**
 * Turn the solved contacts acting at one second into inspection marks: for each contact, one arrow per collider at the contact point, along the force that collider receives, as long as the mean force times a stated scale.
 *
 * A receipt acts at `seconds` when the solver measured it: its latest completed step at or before `seconds`, within that step's duration, has a positive finite impulse and no positive separation. Both arrows start at that step's point and are `metresPerNewton` times the step's mean force, its impulse over its duration, long. The first collider's arrow points against the step's normal and the second collider's along it, because the normal runs from the first toward the second and each is pushed away from the other. Geometric receipts, which assert no impulse, draw nothing.
 *
 * Each mark has kind `contact`, label `contact force`, colour teal `00c2a8` and the path `<body>/<bone>/contact/<receipt id>` of the collider it acts on, first collider first, in world metres and unanchored, so selecting a body selects the force it received whatever order the receipt names the pair in. A collider's mark is flagged when `ownership` shows its segment dynamic at the step, its segment's latest event at or before the step being `dynamic`, and the step states that it received none of the solved impulse, as when an exaggerated mode's response rounds the impulse to zero: the solver measured a force that body never felt. The compliant solver gives a static or kinematic side no impulse by design and states zero for it, so such a side, including a segment without history such as the floor, is never flagged; a step without the statement is a direct native measurement and is not flagged; without `ownership` no mark is flagged, because a stated zero alone cannot tell a rounded dynamic body from a static one.
 *
 * A rigid impact arrests a body within one step, so its mean force can be tens of times its resting weight and no single scale draws both inside a frame. With `maximumLength`, an arrow that would be longer keeps its direction and is drawn at that length under kind `contact/clamped`, colour dark teal `007a6a` and label `contact force clamped at <length> m (at least <length / metresPerNewton> N)`, so a clamped arrow is never read at its drawn length; `marks=contact` still selects it, because the kind lies beneath `contact`. Clamping is not an anomaly and leaves the flag to the transfer rule.
 *
 * It throws for a scale or a maximum length that is not positive and finite and for an acting step without a positive duration.
 *
 * @param props.receipts Contact episodes, as the composition's contact measurement and the solver record them.
 * @param props.seconds The drawn film second.
 * @param props.metresPerNewton Arrow length per newton of mean force.
 * @param props.maximumLength Optional longest drawn arrow in metres.
 * @param props.ownership Optional ownership history of the same performance, which decides which sides are dynamic.
 * @returns Two marks per acting contact, in the receipts' order.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States when a contact acts, how each arrow's place, direction and length follow from the step, what geometric receipts draw, the kind, label, colour, path and frame, when a mark is flagged and why static, kinematic and unowned sides are not, how and why an arrow is clamped and labelled, and the refusals.
 * @evidence contracts/development/implementation.md#principled-implementation A step's mean force is its normal impulse over its duration, and by reaction the two colliders receive it in opposite directions, so each arrow is the force on the body its path names; a step is read only once completed at or before the drawn second, so a still never shows a later impulse. Only a dynamic segment can be owed a transferred impulse, and the cache's causal ownership is what says which segments were dynamic at that step.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the receipts, each scanned from its last step back to the drawn second, then one mark per side; ownership is grouped by segment only when a stated zero needs it.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The scale and the clamp are the caller's stated parameters, a clamped arrow changes kind and label instead of passing for its true length, a step without a duration is refused instead of given an arbitrary length, and no side is chosen by its name: the receipt's canonical pair order decides nothing but the order of the two marks.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the receipts' steps in the worst case; each receipt stops at its latest step at or before the second. Ownership is grouped once per call, linear in its events, and each stated zero scans only its own segment's events back to the step.
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
  const maximum: number | undefined = props.maximumLength;
  if (maximum !== undefined && !(Number.isFinite(maximum) && maximum > 0))
    throw new Error(
      `markAutoMovieContacts: maximum length ${maximum} is not positive and finite`,
    );
  const clamped: string =
    maximum === undefined
      ? ""
      : `contact force clamped at ${maximum} m (at least ${Number((maximum / props.metresPerNewton).toPrecision(3))} N)`;
  let segments: Map<string, IAutoMoviePhysicalOwnershipEvent[]> | undefined;
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
    const scaled: number =
      (step.impulse / step.duration) * props.metresPerNewton;

    // Past the stated maximum the arrow keeps its direction and declares its clamp in its kind.
    const clamp: boolean = maximum !== undefined && scaled > maximum;
    const length: number = clamp ? maximum! : scaled;

    // The normal runs from a toward b, so a is pushed against it and b along it.
    for (const side of ["a", "b"] as const) {
      const sign: number = side === "a" ? -length : length;
      marks.push({
        path: `${receipt[side].body}/${receipt[side].bone}/contact/${receipt.id}`,
        kind: clamp ? "contact/clamped" : "contact",
        label: clamp ? clamped : "contact force",
        color: clamp ? 0x007a6a : 0x00c2a8,
        shape: {
          type: "arrows",
          origins: [step.point.x, step.point.y, step.point.z],
          vectors: [
            step.normal.x * sign,
            step.normal.y * sign,
            step.normal.z * sign,
          ],
        },
        // A stated zero is an anomaly only for a side that was dynamic and so was owed the impulse.
        flagged:
          step.appliedImpulse?.[side] === 0 &&
          dynamic(receipt[side].body, receipt[side].bone, step.seconds),
        anchor: null,
      });
    }
  }
  return marks;

  /** Whether the segment's latest ownership event at or before `seconds` is dynamic; no history means static. */
  function dynamic(body: string, bone: string, seconds: number): boolean {
    if (props.ownership === undefined) return false;
    segments ??= group(props.ownership);
    const events: IAutoMoviePhysicalOwnershipEvent[] =
      segments.get(`${body}\u0000${bone}`) ?? [];
    for (let i: number = events.length - 1; i >= 0; i--)
      if (events[i]!.seconds <= seconds + 1e-9)
        return events[i]!.kind === "dynamic";
    return false;
  }
}

/** Ownership events grouped by segment, each group in producer order. */
function group(
  events: readonly IAutoMoviePhysicalOwnershipEvent[],
): Map<string, IAutoMoviePhysicalOwnershipEvent[]> {
  const grouped: Map<string, IAutoMoviePhysicalOwnershipEvent[]> = new Map();
  for (const event of events) {
    const key: string = `${event.body}\u0000${event.bone}`;
    const list: IAutoMoviePhysicalOwnershipEvent[] = grouped.get(key) ?? [];
    list.push(event);
    grouped.set(key, list);
  }
  return grouped;
}
