import type {
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";

import { HumanPerformanceGrips } from "./HumanPerformanceGrips";
import { HumanPerformanceHits } from "./HumanPerformanceHits";
import { HumanPerformanceHold } from "./HumanPerformanceHold";
import { HumanPerformanceObject } from "./HumanPerformanceObject";
import { HumanPerformanceSoft } from "./HumanPerformanceSoft";
import { HumanPreparedPlayback } from "./HumanPreparedPlayback";
import { HumanPropFlight } from "./HumanPropFlight";
import { HumanSegmentCarry } from "./HumanSegmentCarry";
import { prepareHumanGripHand } from "./prepareHumanGripHand";
import { prepareHumanPerformanceOrder } from "./prepareHumanPerformanceOrder";
import { prepareHumanSegment } from "./prepareHumanSegment";

/**
 * Prepare a resolved performance so that every later read is a pure function of
 * its film second: solve, once, every record its readers evaluate, each after
 * what it reads.
 *
 * The plans were solved on the final stops and flights already
 * (`prepareHumanPerformancePlans`). Then, in order:
 *
 * 1. Each plan's event-dependent native playback (`HumanPreparedPlayback`);
 * 2. Each prop's articulation writers (`HumanPerformanceObject.collect`) and its
 *    grip, worn and mounted spans with the offset each keeps from its start, in
 *    film order, so a span's offset reads the prop as the spans before it carry
 *    it (`HumanPerformanceHold.seat`);
 * 3. Each prop's flights (`HumanPropFlight.sweep`);
 * 4. Each action's display record (`prepareHumanSegment`) and the carries of the
 *    holds it ends, in the depth-first order of the people's reads
 *    (`prepareHumanPerformanceOrder`);
 * 5. Each hand span's hand course (`prepareHumanGripHand`), which a held prop is
 *    read on from then on;
 * 6. The hit record (`HumanPerformanceHits.solve`) and each soft prop's lattice
 *    (`HumanPerformanceSoft.prepare`).
 *
 * No display read recurses through a held prop by dependency, not by a guard:
 * once prepared, a held prop's frame reads its span's hand course (step 5),
 * which evaluates no posture. The hand course itself is solved on the holder's
 * prepared display, which would recurse only if a law's display (its plan's
 * `posture` or a primitive's `write`) read the prop its own hand holds. None
 * does: scanning every plan `posture` and `write` in the laws for a prop's
 * frame read (`.prop(...).frame(`, a reader's `.frame(` at the second) finds
 * ten, in sitCarried, HumanFloatBeside, HumanHoldHandles, HumanLanceCouch,
 * HumanLeadHorse, HumanLunge (two), HumanMounted, HumanSabre and
 * HumanTendHorse, and each reads the support the performer rides or sits on
 * (`params.on`, the carrier), which no hand of theirs holds; a law reads a held
 * prop (`AutoMovieMotionHumanHeld.of`) only while it plans.
 *
 * @param self The resolved performance, every action placed.
 */
export function prepareHumanPerformance(
  self: IAutoMovieMotionHumanPerformanceState,
): void {
  for (const person of self.people.values())
    for (const segment of [...person.segments, ...person.overlays])
      HumanPreparedPlayback.prepare(segment.plan);

  for (const prop of self.props.values())
    self.writers.set(prop.subject, HumanPerformanceObject.collect(self, prop));
  for (const prop of self.props.values()) {
    const grips: IAutoMovieMotionHumanPerformanceState.IGrip[] =
      HumanPerformanceGrips.assemble(self, prop.subject);
    self.grips.set(prop.subject, grips);
    for (const grip of grips)
      if (grip.offset === undefined)
        grip.offset = HumanPerformanceHold.seat(
          self,
          prop.subject,
          grips,
          grip,
        );
  }
  for (const prop of self.props.values())
    self.flights.set(prop.subject, HumanPropFlight.sweep(self, prop.subject));

  prepareHumanPerformanceOrder(
    self.people.values(),
    (
      person: IAutoMovieMotionHumanSegment.IPerson,
    ): readonly IAutoMovieMotionHumanSegment[] => person.segments,
    (
      person: IAutoMovieMotionHumanSegment.IPerson,
      segment: IAutoMovieMotionHumanSegment,
    ): void => {
      prepareHumanSegment(person, segment);

      // A hold's carry is captured where its holding action ended, once the
      // actions up to there are prepared.
      for (const held of person.holds)
        if (
          held.carry === undefined &&
          Math.max(held.from, held.source.end) <= segment.end + 1e-9
        )
          held.carry = HumanSegmentCarry.capture(person, held);
    },
  );

  // Each hand span's hand course, on the actions just prepared: from here
  // on a held prop is read on it, never on the holder's live posture.
  for (const grips of self.grips.values())
    for (const grip of grips)
      if (grip.bone === undefined && grip.mount === undefined)
        grip.hand = prepareHumanGripHand(self, grip);

  self.hits = HumanPerformanceHits.solve(self);
  for (const prop of self.props.values())
    if (soft(prop))
      self.soft.set(
        prop.subject,
        HumanPerformanceSoft.prepare(self, prop.subject),
      );
}

/** Whether a prop declares a soft domain. */
function soft(prop: IAutoMovieMotionHumanProp): boolean {
  return prop.soft !== undefined;
}
