/**
 * Play a film's decoded master through Web Audio from a film second at a
 * transport rate.
 *
 * The master is the one soundtrack the delivery encodes, sample 0 at film
 * second 0, so one buffer source starts at once at offset `seconds` and plays
 * `rate` film seconds per wall second; its pitch moves with the rate, as a
 * review at another speed hears it. A second at or past the master's end plays
 * nothing. The returned stop releases the source once, so a pause, seek or rate
 * change stops and starts again from the new second.
 *
 * @param context The audio context the master was decoded in.
 * @param master The decoded master.
 * @param seconds The film second to start from, nonnegative.
 * @param rate Film seconds per wall second, positive.
 * @returns A function stopping the source once.
 */
export function playAutoMovieSoundtrack(
  context: BaseAudioContext,
  master: AudioBuffer,
  seconds: number,
  rate: number,
): () => void {
  if (!(rate > 0) || !Number.isFinite(rate) || !(seconds >= 0))
    throw new Error(
      `A soundtrack plays from a nonnegative second at a positive rate, not ${seconds} s at ${rate}`,
    );
  if (seconds >= master.duration) return (): void => {};
  const source: AudioBufferSourceNode = context.createBufferSource();
  source.buffer = master;
  source.playbackRate.value = rate;
  source.connect(context.destination);
  source.start(context.currentTime, seconds);
  let stopped: boolean = false;
  return (): void => {
    if (stopped) return;
    stopped = true;
    try {
      source.stop();
    } catch {
      // A source that already ended has nothing to stop.
    }
    source.disconnect();
  };
}
