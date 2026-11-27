import type { IAutoMovieProductionAudioProbe } from "@automovie/interface";
import type * as Render from "@automovie/render";

import type { IAutoMovieDeliveryProfileFinding } from "./IAutoMovieDeliveryProfileFinding";
import type { IAutoMovieCliDeliveryProbe } from "../IAutoMovieCliDeliveryProbe";
import { readAutoMovieDeliveryProbe } from "./readAutoMovieDeliveryProbe";

/**
 * Check an encoded delivery file against the profiles it must carry, before it
 * is published.
 *
 * The file's boxes are read with `readAutoMovieDeliveryProbe`. The video track
 * is asserted against `resolveProductionVideoProfile` of the subject's raster
 * and the planned exact frame rate. With a soundtrack, the audio track is
 * asserted against the AAC profile; without one, the file must hold no audio
 * track, as the encoder's `-an` intends. Each asserter stops at its first
 * difference, so the result holds at most one finding per track; a file whose
 * boxes cannot be read gives one `probe` finding. The asserters and the sRGB
 * code points come from the production's own `render`, so the check is the one
 * the production's package defines.
 *
 * @param props.render The production's render package.
 * @param props.path The encoded candidate.
 * @param props.width The subject's raster width, pixels.
 * @param props.height The subject's raster height, pixels.
 * @param props.frameRate The planned exact frame rate, `[numerator,
 *   denominator]` frames per second.
 * @param props.audio Whether the encoder muxed a soundtrack.
 * @returns The findings, empty when the file conforms.
 */
export async function auditAutoMovieDeliveryProfile(props: {
  render: Pick<
    typeof Render,
    | "AUTOMOVIE_MP4_SRGB_COLOUR"
    | "AutoMovieRenderDelivery"
  >;
  path: string;
  width: number;
  height: number;
  frameRate: readonly [number, number];
  audio: boolean;
}): Promise<IAutoMovieDeliveryProfileFinding[]> {
  let probe: IAutoMovieCliDeliveryProbe;
  try {
    probe = await readAutoMovieDeliveryProbe(
      props.path,
      props.render.AUTOMOVIE_MP4_SRGB_COLOUR,
    );
  } catch (error) {
    return [
      {
        media: "video",
        field: "probe",
        expected: "a readable MP4 file",
        observed: error instanceof Error ? error.message : String(error),
      },
    ];
  }

  const findings: IAutoMovieDeliveryProfileFinding[] = [];
  const check: (media: "video" | "audio", task: () => void) => void = (
    media: "video" | "audio",
    task: () => void,
  ): void => {
    try {
      task();
    } catch (error) {
      const message: string =
        error instanceof Error ? error.message : String(error);
      const parts: RegExpExecArray | null = REFUSAL.exec(message);
      findings.push(
        parts === null
          ? { media, field: "probe", expected: "a check", observed: message }
          : {
              media,
              field: parts[2]!,
              expected: parts[3]!,
              observed: parts[4]!,
            },
      );
    }
  };
  check("video", (): void =>
    props.render.AutoMovieRenderDelivery.assertVideoProfile({
      expected: props.render.AutoMovieRenderDelivery.resolveVideoProfile({
        width: props.width,
        height: props.height,
        frameRate: {
          numerator: props.frameRate[0],
          denominator: props.frameRate[1],
        },
      }),
      actual: probe.video,
    }),
  );
  const audio: IAutoMovieProductionAudioProbe | null = probe.audio;
  if (props.audio && audio === null)
    findings.push({
      media: "audio",
      field: "track",
      expected: "one audio track",
      observed: "none",
    });
  else if (!props.audio && audio !== null)
    findings.push({
      media: "audio",
      field: "track",
      expected: "no audio track",
      observed: audio.codec,
    });
  else if (audio !== null)
    check("audio", (): void => props.render.AutoMovieRenderDelivery.assertAacProfile(audio));
  return findings;
}

/** The documented refusal form of both profile asserters. */
const REFUSAL: RegExp =
  /^unsupported-(video|audio)-profile\.([^:]+): expected ([\s\S]*), observed ([\s\S]*)\.$/u;
