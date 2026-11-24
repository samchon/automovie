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
 * 5. Each hand span's grip socket where it closed (`IGrip.closure`), which the
 *    holder's own posture reads its prop on;
 * 6. The hit record (`HumanPerformanceHits.solve`) and each soft prop's lattice
 *    (`HumanPerformanceSoft.prepare`).
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

  // Each hand span's grip socket where it closed, on the prepared display:
  // what the holder's own posture reads the prop on.
  for (const grips of self.grips.values())
    for (const grip of grips)
      if (grip.bone === undefined && grip.mount === undefined)
        grip.closure = HumanPerformanceRead.hand(
          self,
          grip.subject,
          grip.side,
          grip.from,
        );

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
