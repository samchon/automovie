"use client";

import { type ReactElement, type RefObject, useEffect, useRef } from "react";

import type { IPlaygroundAdapter } from "../../playground/IPlaygroundAdapter";

/**
 * Where the performance is drawn.
 *
 * The adapter mounts its drawing into this element and is unmounted when
 * the performance changes or the page leaves, which releases the scene and
 * its renderer.
 *
 * @param props The performance to draw.
 * @returns The stage.
 */
export function PlaygroundStage(props: {
  /** The performance. */
  performance: IPlaygroundAdapter.IPerformance;
}): ReactElement {
  const root: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
  useEffect((): (() => void) | undefined => {
    if (root.current === null) return undefined;
    const mounted: IPlaygroundAdapter.IMounted = props.performance.mount(
      root.current,
    );

    // The drawing is another React root, which React refuses to unmount
    // while this one is still rendering; it goes after the current task.
    return (): void => {
      setTimeout((): void => mounted.unmount(), 0);
    };
  }, [props.performance]);
  return (
    <section aria-label="Performance">
      <div ref={root} className="am-instrument" />
    </section>
  );
}
