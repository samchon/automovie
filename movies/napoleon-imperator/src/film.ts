/**
 * Frozen edit consumed by both browser playback and capture. Seconds address the
 * retained PCM mix; every cut lies on a 24 fps frame boundary.
 * @evidence contracts/common.md#implementation-and-ownership The preparation integration validates saved bytes and emits one untrimmed hard-cut clock; this type carries its actual consumers rather than claiming native compilation.
 * @evidence contracts/common.md#authoring-interface Each shot has a source H2 and measured start/duration; cues retain their exact take identity and candidate acceptance.
 */
export interface Film {
  title: string;
  fps: number;
  duration: number;
  frames: number;
  width: number;
  height: number;
  sourceSha256: string;
  audio: string;
  shots: Shot[];
  cues: Cue[];
}

/**
 * One continuous performance and its source unit, in output seconds.
 * @evidence contracts/common.md#implementation-and-ownership A stable stage selector and canonical source address join the frozen edit to executable performance.
 * @evidence contracts/common.md#authoring-interface start is inclusive; duration gives its exclusive boundary, except the viewer holds the final sampled frame at the end.
 */
export interface Shot {
  id: string;
  unit: string;
  caption: string;
  start: number;
  duration: number;
  source: string;
}

/**
 * An actual saved speech take placed without trimming or retiming.
 * @evidence contracts/common.md#implementation-and-ownership Original words and speaker remain attached to actual take intervals; no regenerated speech occurs in replay.
 * @evidence contracts/common.md#authoring-interface start/end use the film clock; acceptance remains candidate-unheard until listening occurs.
 */
export interface Cue {
  id: string;
  speaker: string;
  text: string;
  start: number;
  end: number;
  shot: string;
  acceptance: string;
}

/**
 * Resolve an output instant without retaining playback history.
 * @evidence contracts/common.md#implementation-and-ownership Validated bounded seconds select one actual untrimmed shot; invalid values fail rather than silently seek elsewhere.
 * @evidence contracts/common.md#authoring-interface Nonnegative finite seconds clamp only to the final frame; the return local time is relative to the selected shot.
 */
export function locate(
  film: Film,
  seconds: number,
): { shot: Shot; local: number; time: number } {
  if (!Number.isFinite(seconds) || seconds < 0)
    throw new RangeError("Film time must be finite and nonnegative");
  const time = Math.min(seconds, (film.frames - 1) / film.fps);
  // Starts come from integer frame cursors. Adding two divided durations can
  // round past the following cut, so starts alone own boundary selection.
  const shot = film.shots.findLast((entry) => time >= entry.start);
  if (!shot) throw new Error(`Uncovered film time ${time}`);
  return { shot, local: time - shot.start, time };
}
