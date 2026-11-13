"use client";

import { useEffect, useState } from "react";

import { SceneClock } from "../../scenes/SceneClock";
import { SceneCard } from "./SceneCard";

/**
 * A film clock that starts playing once the page is in the browser, unless
 * the visitor asked for reduced motion.
 *
 * The clock is made paused, so the server's render and the browser's first
 * render agree whatever the visitor's preference, and only then starts.
 *
 * @returns The clock, the same one for the component's life.
 */
export function useSceneClock(): SceneClock {
  const [clock] = useState<SceneClock>((): SceneClock => new SceneClock(false));
  useEffect((): void => {
    if (!clock.playing && !SceneCard.reduced()) clock.toggle();
  }, [clock]);
  return clock;
}
