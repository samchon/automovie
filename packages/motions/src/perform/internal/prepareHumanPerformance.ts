import type {
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";

import { HumanPerformanceGrips } from "./HumanPerformanceGrips";
import { HumanPerformanceHits } from "./HumanPerformanceHits";
import { HumanPerformanceHold } from "./HumanPerformanceHold";
import { HumanPerformanceObject } from "./HumanPerformanceObject";
import { HumanPerformanceRead } from "./HumanPerformanceRead";
import { HumanPerformanceSoft } from "./HumanPerformanceSoft";
import { HumanPreparedPlayback } from "./HumanPreparedPlayback";
import { HumanPropFlight } from "./HumanPropFlight";
import { HumanSegmentCarry } from "./HumanSegmentCarry";
import { prepareHumanGripHand } from "./prepareHumanGripHand";
import { prepareHumanPerformanceOrder } from "./prepareHumanPerformanceOrder";
import { prepareHumanSegment } from "./prepareHumanSegment";

/*
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
 *    (`prepareHumanPerformanceOrder`), followed by participant body contact
 *    verification on the prepared records;
 * 5. Each hand span's hand course (`prepareHumanGripHand`), which a held prop is
 *    read on from then on;
 * 6. The hit record (`HumanPerformanceHits.solve`) and each soft prop's lattice
 *    (`HumanPerformanceSoft.prepare`).
 *
 * No display read recurses through a held prop, by dependency and not by a
 * guard. Once prepared, a held prop's frame reads its span's hand course (step
 * 5), which evaluates no posture. A law's display (its plan's `posture` or a
 * primitive's `write`) reads a prop's frame in ten places, and each reads the
 * support the performer rides or sits on, never a prop its own hand holds:
 * sitCarried its carrier (`subject`, which it does not hold), and
 * HumanFloatBeside, HumanHoldHandles, HumanLanceCouch, HumanLeadHorse,
 * HumanLunge (two), HumanMounted, HumanSabre and HumanTendHorse the prop they
 * ride (`params.on`), while the props they hold are a lance, a sabre, a whip
 * and a tool (`params.tool.prop`), none of them `on`. A law reads a held prop
 * (`AutoMovieMotionHumanHeld.of`) only while it plans.
 *
 * Step 5 solves the hand courses one span at a time. A span whose course is not
 * yet filled is read on its holder's live hand, and that hand is the holder's
 * prepared display: it reads only the supports its holder rides, so a read
 * reaches another span only through a support carried by another performer's
 * hand (sitCarried's carrier), and from there that carrier's display, which
 * again reads only what its own performer rides. Each step goes from a rider to
 * the one who carries it, so the reads end at a performer who rides nothing
 * carried by hand, and none returns to the span being solved: no performer is
 * carried, through others' hands, by the prop its own hand holds. The live hand
 * and the course it is later read on agree within the course's millimetre. *
 * Parameter self: The resolved performance, every action placed.
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

  for (const person of self.people.values())
    for (const segment of [...person.segments, ...person.overlays])
      segment.plan.verifyDisplayed?.((seconds, requested) =>
        HumanPerformanceRead.bones(
          self,
          person.performer.subject,
          seconds,
          requested,
        ),
      );

  // A carry and its contact often declare the same hand interval. Lay its
  // course once and attach it to each grip that will read it during playback.
  const handSpans: Map<string, IAutoMovieMotionHumanPerformanceState.IGrip[]> =
    new Map();
  for (const grips of self.grips.values())
    for (const grip of grips)
      if (grip.bone === undefined && grip.mount === undefined) {
        const to: number = Math.min(grip.to, self.duration);
        const key: string = `${grip.subject}/${grip.side}/${grip.from}/${to}`;
        const span: IAutoMovieMotionHumanPerformanceState.IGrip[] =
          handSpans.get(key) ?? [];
        span.push(grip);
        handSpans.set(key, span);
      }
  for (const span of handSpans.values()) {
    const hand: ReturnType<typeof prepareHumanGripHand> = prepareHumanGripHand(
      self,
      span[0]!,
    );
    for (const grip of span) grip.hand = hand;
  }

  self.hits = HumanPerformanceHits.solve(self);
  for (const prop of self.props.values())
    if (soft(prop))
      self.soft.set(
        prop.subject,
        HumanPerformanceSoft.prepare(self, prop.subject),
      );
}

/*
 * Whether a prop declares a soft domain.
 */
function soft(prop: IAutoMovieMotionHumanProp): boolean {
  return prop.soft !== undefined;
}
