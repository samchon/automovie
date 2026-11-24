import type { IAutoMovieMixFilmSound } from "@automovie/interface";
import {
  type IAutoMovieDrawScene,
  autoMovieVideoFrameRate,
  mixAutoMovieFilmSound,
} from "@automovie/render";

import type { AutoMovieInspectorPlayhead } from "./AutoMovieInspectorPlayhead.js";
import type { IAutoMovieInspectorSceneHost } from "./IAutoMovieInspectorSceneHost.js";
import { messageOfAutoMovieInspectorError } from "./messageOfAutoMovieInspectorError.js";

/**
 * Play a subject's soundtrack in step with the inspector's playhead: the same
 * master the delivery encodes.
 *
 * The subject's sound list is mixed by render's `mixAutoMovieFilmSound`, the
 * function the delivered render mixes it with, on the clock the render plans:
 * the exact rate `autoMovieVideoFrameRate` selects for the subject's `fps`,
 * `durationSeconds × fps` frames and the subject's `delivery.loudness`. Its
 * WAVE bytes are the soundtrack file the delivery encodes, and the host decodes
 * them. From then on, every playhead change that starts, stops, retimes or
 * moves playback stops the master, and while the playhead plays the master
 * starts again at the playhead's second and rate, so a seek, a rate change and
 * a restart from the end are heard where they are seen. Mixing and decoding
 * take a while, so the master may start after the first frame. A subject
 * without a sound list plays nothing.
 *
 * @param props The arrived subject, the host's sound, the playhead and where a
 *   refusal is reported.
 * @returns A release that stops the master, unsubscribes and frees it, and that
 *   keeps a master still being mixed from ever playing.
 */
export function syncAutoMovieInspectorSoundtrack(props: {
  /** The arrived subject, with its sound list. */
  instance: Pick<
    IAutoMovieDrawScene,
    "sound" | "fps" | "durationSeconds" | "delivery"
  >;

  /** The host's sound files and player. */
  sound: IAutoMovieInspectorSceneHost.ISound;

  /** The playhead the soundtrack follows, borrowed for its life. */
  playhead: AutoMovieInspectorPlayhead;

  /**
   * Report what the mix or the decoder refused, such as a missing file or a
   * receipt that does not match its line; the picture plays on in silence.
   */
  error: (message: string) => void;
}): () => void {
  const { instance, playhead } = props;
  if (instance.sound === undefined) return (): void => {};
  let released: boolean = false;
  let release: (() => void) | undefined;
  void start(props)
    .then((stop: () => void): void => {
      if (released) stop();
      else release = stop;
    })
    .catch((error: unknown): void => {
      if (!released) props.error(messageOfAutoMovieInspectorError(error));
    });
  return (): void => {
    released = true;
    release?.();
  };

  /** Mix and decode the master, then follow the playhead. */
  async function start(
    props: Parameters<typeof syncAutoMovieInspectorSoundtrack>[0],
  ): Promise<() => void> {
    const [numerator, denominator]: readonly [number, number] =
      autoMovieVideoFrameRate(instance.fps);
    const mixed: IAutoMovieMixFilmSound.IResult = await mixAutoMovieFilmSound({
      sound: instance.sound!,
      frameRate: { numerator, denominator },
      totalFrames: Math.round(instance.durationSeconds * instance.fps),
      read: props.sound.read,
      ...(instance.delivery?.loudness === undefined
        ? {}
        : { loudness: instance.delivery.loudness }),
    });
    const soundtrack: IAutoMovieInspectorSceneHost.ISoundtrack =
      await props.sound.load(mixed.wav);

    // Playback restarts only on a change a listener can hear: starting,
    // stopping, a new rate or a jump; advancing alone keeps it running.
    let heard: AutoMovieInspectorPlayhead.ISnapshot | null = null;
    const follow: () => void = (): void => {
      const now: AutoMovieInspectorPlayhead.ISnapshot = playhead.getSnapshot();
      if (
        heard !== null &&
        heard.playing === now.playing &&
        heard.rate === now.rate &&
        heard.jump === now.jump
      )
        return;
      heard = now;
      soundtrack.stop();
      if (now.playing) soundtrack.play(now.seconds, now.rate);
    };
    const unsubscribe: () => void = playhead.subscribe(follow);
    follow();
    return (): void => {
      unsubscribe();
      soundtrack.dispose();
    };
  }
}
