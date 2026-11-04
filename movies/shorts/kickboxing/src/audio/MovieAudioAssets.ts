import manifest from "../../assets/audio/manifest.json" with { type: "json" };
import type { AudioMix } from "./AudioMix";
import { AudioPcm } from "./AudioPcm";

/**
 * Fixed adopted PCM assets and content identities for both soundtrack consumers.
 *
 * @evidence contracts/common.md#implementation-and-ownership Vite resolves each explicit file URL into the actual deployment, while Node resolves the same URL to a local file. SHA-256 checks occur before the public Ingest decoder; acquisition and conversion never run during replay.
 * @evidence contracts/common.md#authoring-interface Metadata names retained sources and exact playback derivatives. Only assets needed by the current cue list are loaded; missing sources or altered bytes refuse preparation rather than silently substituting another sound.
 */
export namespace MovieAudioAssets {
  /**
   * One adopted playback file, linked to its source and rights in the manifest.
   *
   * @evidence contracts/common.md#implementation-and-ownership The digest identifies complete derivative bytes; original recording, creator, license and conversion provenance remain in assets/audio/manifest.json. A retained file is not a listening approval.
   * @evidence contracts/common.md#authoring-interface URL is a Vite-resolved browser asset URL or Node file URL. sha256 is lowercase hexadecimal. Decoded arrays are mono at 48 kHz with amplitude normalized by the public decoder.
   */
  export interface Asset {
    /** Stable lookup identity. */ id: AudioMix.Source;
    /** Actual consumer-specific location of the same fixed file. */ url: string;
    /** Complete playback derivative byte identity. */ sha256: string;
  }

  /** Explicit URLs let Vite copy the same retained derivatives into its build. */
  const urls: Readonly<Record<AudioMix.Source, string>> = {
    punch1: new URL("../../assets/audio/pcm/punch1.wav", import.meta.url).href,
    punch2: new URL("../../assets/audio/pcm/punch2.wav", import.meta.url).href,
    punch3: new URL("../../assets/audio/pcm/punch3.wav", import.meta.url).href,
    punch4: new URL("../../assets/audio/pcm/punch4.wav", import.meta.url).href,
    punch5: new URL("../../assets/audio/pcm/punch5.wav", import.meta.url).href,
    fight: new URL("../../assets/audio/pcm/fight.wav", import.meta.url).href,
    bell: new URL("../../assets/audio/pcm/bell.wav", import.meta.url).href,
    breath: new URL("../../assets/audio/pcm/breath.wav", import.meta.url).href,
    step: new URL("../../assets/audio/pcm/step.wav", import.meta.url).href,
    air: new URL("../../assets/audio/pcm/air.wav", import.meta.url).href,
    fall: new URL("../../assets/audio/pcm/fall.wav", import.meta.url).href,
    crowd: new URL("../../assets/audio/pcm/crowd.wav", import.meta.url).href,
    applause: new URL("../../assets/audio/pcm/applause.wav", import.meta.url)
      .href,
    down: new URL("../../assets/audio/pcm/down.wav", import.meta.url).href,
    neutral: new URL("../../assets/audio/pcm/neutral.wav", import.meta.url)
      .href,
    decision: new URL("../../assets/audio/pcm/decision.wav", import.meta.url)
      .href,
    count1: new URL("../../assets/audio/pcm/count1.wav", import.meta.url).href,
    count2: new URL("../../assets/audio/pcm/count2.wav", import.meta.url).href,
    count3: new URL("../../assets/audio/pcm/count3.wav", import.meta.url).href,
    count4: new URL("../../assets/audio/pcm/count4.wav", import.meta.url).href,
    count5: new URL("../../assets/audio/pcm/count5.wav", import.meta.url).href,
    count6: new URL("../../assets/audio/pcm/count6.wav", import.meta.url).href,
    count7: new URL("../../assets/audio/pcm/count7.wav", import.meta.url).href,
    count8: new URL("../../assets/audio/pcm/count8.wav", import.meta.url).href,
    count9: new URL("../../assets/audio/pcm/count9.wav", import.meta.url).href,
    count10: new URL("../../assets/audio/pcm/count10.wav", import.meta.url)
      .href,
  };

  /**
   * Resolve only the distinct sources actually referenced by a cue collection.
   *
   * @evidence contracts/common.md#implementation-and-ownership Each id is deduplicated before lookup. Missing metadata or a malformed digest refuses; source-byte verification belongs to decode after the actual consumer loads the URL.
   * @evidence contracts/common.md#authoring-interface Returned records are detached values ordered by source id. Supplying no cues returns no assets and does not allocate native or filesystem resources.
   */
  export function select(cues: readonly AudioMix.Cue[]): Asset[] {
    return [
      ...new Set(cues.map((cue: AudioMix.Cue): AudioMix.Source => cue.source)),
    ]
      .sort((left: AudioMix.Source, right: AudioMix.Source): number =>
        left < right ? -1 : left > right ? 1 : 0,
      )
      .map((id: AudioMix.Source): Asset => {
        const record: { id: string; sha256: string } | undefined =
          manifest.assets.find(
            (asset: { id: string }): boolean => asset.id === id,
          );
        if (record === undefined || !/^[a-f0-9]{64}$/u.test(record.sha256))
          throw new Error(`Missing adopted audio source: ${id}`);
        return { id, url: urls[id], sha256: record.sha256 };
      });
  }

  /**
   * Verify exact loaded bytes before interpreting them through public Ingest.
   *
   * @evidence contracts/common.md#implementation-and-ownership SHA-256 mismatch refuses before decoding. The consumer supplies its own fetched or read bytes, so this shared function imports no Node filesystem or browser-only transport.
   * @evidence contracts/common.md#authoring-interface Asset identifies the expected derivative. The returned mono samples belong to the caller; a successful digest or decoder result does not establish audible suitability.
   */
  export async function decode(
    asset: Asset,
    bytes: Uint8Array,
  ): Promise<Float32Array> {
    if ((await digest(bytes)) !== asset.sha256)
      throw new Error(`Audio derivative SHA-256 mismatch: ${asset.id}`);
    return AudioPcm.decode(bytes);
  }

  /**
   * Compute a portable SHA-256 without importing platform-specific modules.
   *
   * @evidence contracts/common.md#implementation-and-ownership Native Web Crypto hashes a detached byte copy; both current Node and secure localhost browser contexts provide this API. No mutable byte view is retained.
   * @evidence contracts/common.md#authoring-interface Returns exactly 64 lowercase hexadecimal characters. The caller decides whether the digest identifies cue JSON, an adopted asset or complete WAV output.
   */
  export async function digest(bytes: Uint8Array): Promise<string> {
    const digest: ArrayBuffer = await crypto.subtle.digest(
      "SHA-256",
      Uint8Array.from(bytes).buffer,
    );
    return Array.from(new Uint8Array(digest), (value: number): string =>
      value.toString(16).padStart(2, "0"),
    ).join("");
  }
}
