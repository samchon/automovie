import type {
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";

/*
 * Every grip and worn/mounted span on one prop in film order: the spans the
 * performance prepared (`IAutoMovieMotionHumanPerformanceState.grips`), or,
 * while the schedule is resolved, those its placed actions give now.
 * Parameter self: The performance.
 * Parameter subject: The prop whose spans are read.
 * Returns: The spans.
 */
export function HumanPerformanceGrips(
  self: IAutoMovieMotionHumanPerformanceState,
  subject: string,
): IAutoMovieMotionHumanPerformanceState.IGrip[] {
  return self.grips.get(subject) ?? HumanPerformanceGrips.assemble(self, subject);
}

/*
 * The assembly of a prop's spans.
 */
export namespace HumanPerformanceGrips {
  /*
   * Collect every grip and worn/mounted span on one prop in film order from
   * the placed actions, their holds, wears and mounts and the prop's own
   * declaration, with no offset yet.
   * Parameter self: The performance.
   * Parameter subject: The prop whose spans are collected.
   * Returns: The spans.
   */
  export function assemble(
    self: IAutoMovieMotionHumanPerformanceState,
    subject: string,
  ): IAutoMovieMotionHumanPerformanceState.IGrip[] {
    return collect(self, subject);
  }
}

/*
 * The spans of HumanPerformanceGrips.assemble.
 */
function collect(
  self: IAutoMovieMotionHumanPerformanceState,
  subject: string,
): IAutoMovieMotionHumanPerformanceState.IGrip[] {
  const out: IAutoMovieMotionHumanPerformanceState.IGrip[] = [];
  const worn: IAutoMovieMotionHumanPerformanceState.IGrip[] = [];

  const definition: IAutoMovieMotionHumanProp | undefined =
    self.props.get(subject);
  // A fixture bears the hands that grip it and is never carried by them.
  if (definition?.fixed === true) return out;
  const declared: IAutoMovieMotionHumanProp.IWorn | undefined =
    definition?.worn;
  if (declared !== undefined)
    worn.push({
      subject: declared.subject,
      side: "right",
      bone: declared.bone,
      from: -Infinity,
      to: Infinity,
      offset: declared.offset,
    });
  const mounted: IAutoMovieMotionHumanProp.IMounted | undefined =
    definition?.mounted;
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
              subject: w.wearer ?? person.performer.subject,
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
              mount: {
                prop: m.onto,
                point: m.point,
                ...(m.offset === undefined ? {} : { seated: true }),
              },
              from,
              to: Infinity,
              ...(m.offset === undefined ? {} : { offset: m.offset }),
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

  // A worn span lasts until the first grip, wear or mount that starts
  // after it: a prop rides one carrier at a time.
  const carriers: IAutoMovieMotionHumanPerformanceState.IGrip[] = [
    ...out,
    ...worn,
  ];
  for (const w of worn)
    for (const g of carriers)
      if (g.from > w.from + 1e-9 && g.from < w.to) w.to = g.from;
  // Likewise a hand's hold ends where a wear or a mount that starts
  // within it takes the prop: a prop set on a socket or a bone is carried
  // by it alone from then on, not by the hand that let it go.
  for (const g of out)
    for (const w of worn)
      if (w.from > g.from + 1e-9 && w.from < g.to) g.to = w.from;
  out.push(...worn);
  out.sort(
    (
      a: IAutoMovieMotionHumanPerformanceState.IGrip,
      b: IAutoMovieMotionHumanPerformanceState.IGrip,
    ): number => a.from - b.from,
  );
  return out;
}
