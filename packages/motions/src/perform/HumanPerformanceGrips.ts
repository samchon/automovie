import type {
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";


/**
 * Assemble a prop's grip, worn and mounted spans in the existing film order.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Owns the grip-list assembly and existing resolved-state cache read by prop holding, soft props and flights through HumanPerformanceRead.grips.
 * @evidence contracts/development/design.md#principled-representation Reuses placed segments, holds and the existing IGrip records with film-second endpoints and borrowed offsets.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One assembly operation serves the existing reader; prop placement and grip-offset seating remain with their existing owners.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Preserves fixture exclusion, worn/mounted spans, declared contact windows and existing cache policy rather than replacing a grip with a hand snapshot.
 */
export namespace HumanPerformanceGrips {
  /**
   * Read every grip and worn/mounted span on one prop in film order.
   * Placement records remain unchanged during this synchronous assembly.
   *
   * @param self The resolved state and its existing grip cache.
   * @param subject The prop whose spans are collected.
   * @returns The cached list or the newly assembled list with existing ownership.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States prop identity, placement stability, fixture exclusion and the cached-or-assembled grip list.
   * @evidence contracts/development/implementation.md#principled-implementation Converts each authored wear/mount/contact share to its original film second, clips contacts to placed spans and ends worn spans by the existing later-start rule before the stable start-time sort.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the existing cache, handle a fixture, collect each person's wears, mounts, holds and contacts in their original group order, then close worn spans and sort once.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves duplicate spans, equal-time insertion order, all 1e-9 allowances, inHand callbacks, staged capture identity and numerical endpoints. Cache reads and writes retain their original resolving policy, including the early cached return.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each person's S carrier/overlay references are copied once instead of three times, with all authored wear/mount/contact and hold scans retained. Closing W worn spans against G collected grips costs O(W(G+W)), then O((G+W) log(G+W)) sorting; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The three ordered scans borrow one unchanged per-person segment snapshot within this call. Existing completed lists remain in the state's gripCache; no new cache, invalidation policy or pose/FK memo is introduced.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Temporary segment arrays release with this call; existing span records and seated offsets remain in the resolved-state cache until that state is released. Cache population follows requested subject strings with no eviction here; ordinary consumers use declared props, but this signature imposes no cardinality bound. Cached arrays stay borrowed and a new array transfers to the same existing owner on publication.
   */
  export function of(
    self: IAutoMovieMotionHumanPerformanceState,
    subject: string,
  ): IAutoMovieMotionHumanPerformanceState.IGrip[] {
    const known: IAutoMovieMotionHumanPerformanceState.IGrip[] | undefined =
      self.gripCache.get(subject);
    if (known !== undefined) return known;
    const out: IAutoMovieMotionHumanPerformanceState.IGrip[] = [];
    const worn: IAutoMovieMotionHumanPerformanceState.IGrip[] = [];

    const definition: IAutoMovieMotionHumanProp | undefined = self.props.get(subject);
    // A fixture bears the hands that grip it and is never carried by them.
    if (definition?.fixed === true) {
      if (!self.resolving) self.gripCache.set(subject, out);
      return out;
    }
    const declared: IAutoMovieMotionHumanProp.IWorn | undefined = definition?.worn;
    if (declared !== undefined)
      worn.push({
        subject: declared.subject,
        side: "right",
        bone: declared.bone,
        from: -Infinity,
        to: Infinity,
        offset: declared.offset,
      });
    const mounted: IAutoMovieMotionHumanProp.IMounted | undefined = definition?.mounted;
    if (mounted !== undefined)
      worn.push({
        subject: mounted.prop,
        side: "right",
        mount: { prop: mounted.prop, point: mounted.point },
        from: -Infinity,
        to: Infinity,
        offset: mounted.offset,
      });
    for (const person of self.people.values()) {
      const segments: readonly IAutoMovieMotionHumanSegment[] = [
        ...person.segments,
        ...person.overlays,
      ];
      for (const segment of segments)
        for (const w of segment.plan.wears ?? [])
          if (w.prop === subject) {
            const from: number = segment.start + w.from * segment.plan.duration;
            if (from >= segment.entryTime - 1e-9 && from <= segment.end + 1e-9)
              worn.push({
                subject: person.performer.subject,
                side: "right",
                bone: w.bone,
                from,
                to: Infinity,
              });
          }

      // A prop set on another prop's socket rides it like a worn one.
      for (const segment of segments)
        for (const m of segment.plan.mounts ?? [])
          if (m.prop === subject) {
            const from: number = segment.start + m.from * segment.plan.duration;
            if (from >= segment.entryTime - 1e-9 && from <= segment.end + 1e-9)
              worn.push({
                subject: person.performer.subject,
                side: "right",
                mount: { prop: m.onto, point: m.point },
                from,
                to: Infinity,
              });
          }
      for (const held of person.holds)
        if (held.prop === subject)
          out.push({
            subject: person.performer.subject,
            side: held.side,
            from: held.from,
            to: held.until,
            ...(held.capture === undefined ? {} : { capture: held.capture }),
          });
      for (const segment of segments)
        for (const c of segment.plan.contacts)
          if (
            c.kind === "grip" &&
            c.support.kind === "prop" &&
            c.support.carries !== false &&
            c.support.subject === subject &&
            (c.part === "leftHand" || c.part === "rightHand")
          ) {
            const from: number = Math.max(
              segment.entryTime,
              segment.start + c.from * segment.plan.duration,
            );
            const to: number = Math.min(
              segment.end,
              segment.start + c.to * segment.plan.duration,
            );
            if (to >= from)
              out.push({
                subject: person.performer.subject,
                side: c.part === "leftHand" ? "left" : "right",
                from,
                to,
                ...(c.inHand === undefined ? {} : { inHand: c.inHand }),
              });
          }
    }

    // A worn span lasts until the first grip that starts after it.
    for (const w of worn) {
      for (const g of out)
        if (g.from > w.from + 1e-9 && g.from < w.to) w.to = g.from;
      out.push(w);
    }
    out.sort(
      (
        a: IAutoMovieMotionHumanPerformanceState.IGrip,
        b: IAutoMovieMotionHumanPerformanceState.IGrip,
      ): number => a.from - b.from,
    );
    if (!self.resolving) self.gripCache.set(subject, out);
    return out;
  }
}
