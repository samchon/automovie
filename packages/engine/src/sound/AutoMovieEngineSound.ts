import type {
  IAutoMovieApplyInteriorAcousticResponse,
  IAutoMovieDeriveInteriorAcousticResponse,
  IAutoMovieDeriveProductionSoundPlan,
  IAutoMovieDeriveSoundPropagation,
  IAutoMovieDialogueExpressionLayers,
  IAutoMovieDialogueMouth,
  IAutoMovieDialogueVisemeCompilation,
  IAutoMovieDialogueVisemeTimeline,
  IAutoMovieHumanVisemeWeights,
  IAutoMovieJoinDialogueVisemes,
  IAutoMovieLoudnessMeter,
  IAutoMovieMasterProductionSound,
  IAutoMovieMeasureLipSyncLag,
  IAutoMovieProductionAcousticResponse,
  IAutoMovieProductionFrameRate,
  IAutoMovieProductionPhonemesToVisemes,
  IAutoMovieProductionSoundEvent,
  IAutoMovieProductionSoundPlan,
  IAutoMovieProductionSoundRaster,
  IAutoMovieProductionViseme,
  IAutoMovieRenderProductionSound,
  IAutoMovieRenderedProductionSound,
  IAutoMovieSampleDialogueExpression,
  IAutoMovieSampleDialogueMouth,
} from "@automovie/interface";

import { applyInteriorAcousticResponse as applyInteriorAcousticResponseImplementation } from "./internal/applyInteriorAcousticResponse";
import { assertProductionSoundRasterInput as assertProductionSoundRasterInputImplementation } from "./internal/assertProductionSoundRasterInput";
import { dialogueEnvelopeJaw as dialogueEnvelopeJawImplementation } from "./internal/dialogueEnvelopeJaw";
import { deriveInteriorAcousticResponse as deriveInteriorAcousticResponseImplementation } from "./internal/deriveInteriorAcousticResponse";
import { deriveSoundPropagation as deriveSoundPropagationImplementation } from "./internal/deriveSoundPropagation";
import { deriveProductionSoundPlan as deriveProductionSoundPlanImplementation } from "./internal/deriveProductionSoundPlan";
import { joinDialogueVisemes as joinDialogueVisemesImplementation } from "./internal/joinDialogueVisemes";
import { masterProductionSound as masterProductionSoundImplementation } from "./internal/masterProductionSound";
import { measureLipSyncLag as measureLipSyncLagImplementation } from "./internal/measureLipSyncLag";
import { productionDialogueFrameLevels as productionDialogueFrameLevelsImplementation } from "./internal/productionDialogueFrameLevels";
import { productionPhonemesToVisemes as productionPhonemesToVisemesImplementation } from "./internal/productionPhonemesToVisemes";
import { productionSoundEventTone as productionSoundEventToneImplementation } from "./internal/productionSoundEventTone";
import { productionSoundSpectrogram as productionSoundSpectrogramImplementation } from "./internal/productionSoundSpectrogram";
import { productionSoundWaveform as productionSoundWaveformImplementation } from "./internal/productionSoundWaveform";
import { productionSpeechEndFrame as productionSpeechEndFrameImplementation } from "./internal/productionSpeechEndFrame";
import { renderProductionSound as renderProductionSoundImplementation } from "./internal/renderProductionSound";
import { sampleDialogueExpression as sampleDialogueExpressionImplementation } from "./internal/sampleDialogueExpression";
import { sampleDialogueMouth as sampleDialogueMouthImplementation } from "./internal/sampleDialogueMouth";
import { sampleDialogueVisemeWeights as sampleDialogueVisemeWeightsImplementation } from "./internal/sampleDialogueVisemeWeights";
import { createLoudnessMeter as createLoudnessMeterImplementation } from "./internal/createLoudnessMeter";

/** Deterministic sound planning, synthesis, dialogue and analysis operations. */
export namespace AutoMovieEngineSound {
  /** Film clock consumed by sound frame calculations. */
  export type IFrameClock = {
    /** Film frames per second. */
    fps: number;
    /** Optional exact rational representation of the film rate. */
    frameRate?: IAutoMovieProductionFrameRate;
    /** Production sound sample rate, fixed at 48 kHz. */
    sampleRate: 48_000;
  };

  /** Exclusive film-frame span used for per-frame sound levels. */
  export type ILineFrames = {
    /** Inclusive first frame. */
    startFrame: number;
    /** Exclusive frame after the span. */
    endFrame: number;
  };

  /** Timeline and film frame used to sample viseme weights. */
  export type IVisemeFrame = {
    /** Borrowed joined dialogue viseme timeline. */
    timeline: IAutoMovieDialogueVisemeTimeline;
    /** Film-global frame, which may be fractional. */
    frame: number;
    /** Film frames per second. */
    fps: number;
  };
  /** Applies a declared room-path response to interleaved PCM. */
  export function applyInteriorAcousticResponse(
    props: IAutoMovieApplyInteriorAcousticResponse.IProps,
  ): Float32Array<ArrayBufferLike> {
    return applyInteriorAcousticResponseImplementation(props);
  }

  /** Checks raster input dimensions and PCM before a sound image is emitted. */
  export function assertRasterInput(
    pcm: Float32Array,
    width: number,
    height: number,
    source: string,
  ): void {
    return assertProductionSoundRasterInputImplementation(
      pcm,
      width,
      height,
      source,
    );
  }

  /** Computes a dialogue jaw opening from one frame's linear RMS level. */
  export function dialogueEnvelopeJaw(level: number): number {
    return dialogueEnvelopeJawImplementation(level);
  }

  /** Derives the selected room-path response from a request and profile. */
  export function deriveInteriorAcousticResponse(
    props: IAutoMovieDeriveInteriorAcousticResponse.IProps,
  ): IAutoMovieProductionAcousticResponse {
    return deriveInteriorAcousticResponseImplementation(props);
  }

  /** Derives distance, arrival and spectral propagation for a sound cue. */
  export function deriveSoundPropagation(
    props: IAutoMovieDeriveSoundPropagation.IProps,
  ): NonNullable<IAutoMovieProductionSoundEvent["propagation"]> {
    return deriveSoundPropagationImplementation(props);
  }

  /** Lowers production events and authored cues onto the film sound clock. */
  export function deriveProductionSoundPlan(
    props: IAutoMovieDeriveProductionSoundPlan.IProps,
  ): IAutoMovieProductionSoundPlan {
    return deriveProductionSoundPlanImplementation(props);
  }

  /** Binds timed visemes to the uniquely resolved dialogue speaker. */
  export function joinDialogueVisemes(
    props: IAutoMovieJoinDialogueVisemes.IProps,
  ): IAutoMovieDialogueVisemeCompilation {
    return joinDialogueVisemesImplementation(props);
  }

  /** Masters a rendered mix to its integrated loudness and true-peak targets. */
  export function masterProductionSound(
    props: IAutoMovieMasterProductionSound.IProps,
  ): IAutoMovieRenderedProductionSound {
    return masterProductionSoundImplementation(props);
  }

  /** Measures the relative timing of one dialogue line's mouth and level. */
  export function measureLipSyncLag(
    props: IAutoMovieMeasureLipSyncLag.IProps,
  ): IAutoMovieMeasureLipSyncLag.IResult {
    return measureLipSyncLagImplementation(props);
  }

  /** Samples one dialogue line's linear RMS level on its film-frame clock. */
  export function dialogueFrameLevels(
    clock: IFrameClock,
    line: ILineFrames,
    samples: ArrayLike<number>,
  ): Float64Array {
    return productionDialogueFrameLevelsImplementation(clock, line, samples);
  }

  /** Maps admitted IPA phoneme chunks to timed production visemes. */
  export function phonemesToVisemes(
    props: IAutoMovieProductionPhonemesToVisemes.IProps,
  ): IAutoMovieProductionViseme[] {
    return productionPhonemesToVisemesImplementation(props);
  }

  /** Returns the deterministic tone assigned to one production sound event. */
  export function soundEventTone(
    kind: IAutoMovieProductionSoundEvent["kind"],
    t: number,
    normalized: number,
    noise: number,
  ): number {
    return productionSoundEventToneImplementation(kind, t, normalized, noise);
  }

  /** Produces a spectrogram raster from mono or stereo production PCM. */
  export function soundSpectrogram(
    pcm: Float32Array<ArrayBufferLike>,
    width?: number,
    height?: number,
  ): IAutoMovieProductionSoundRaster {
    return productionSoundSpectrogramImplementation(pcm, width, height);
  }

  /** Produces a waveform raster from mono or stereo production PCM. */
  export function soundWaveform(
    pcm: Float32Array<ArrayBufferLike>,
    width?: number,
    height?: number,
  ): IAutoMovieProductionSoundRaster {
    return productionSoundWaveformImplementation(pcm, width, height);
  }

  /** Converts an admitted speech sample count to its exclusive end frame. */
  export function speechEndFrame(
    clock: IFrameClock,
    startFrame: number,
    samples: number,
  ): number {
    return productionSpeechEndFrameImplementation(clock, startFrame, samples);
  }

  /** Renders an admitted production sound plan into fresh stereo PCM. */
  export function renderProductionSound(
    props: IAutoMovieRenderProductionSound.IProps,
  ): IAutoMovieRenderedProductionSound {
    return renderProductionSoundImplementation(props);
  }

  /** Samples one actor's dialogue expression at an arbitrary film second. */
  export function sampleDialogueExpression(
    props: IAutoMovieSampleDialogueExpression.IProps,
  ): IAutoMovieDialogueExpressionLayers {
    return sampleDialogueExpressionImplementation(props);
  }

  /** Samples one actor's dialogue mouth at an arbitrary film second. */
  export function sampleDialogueMouth(
    props: IAutoMovieSampleDialogueMouth.IProps,
  ): IAutoMovieDialogueMouth {
    return sampleDialogueMouthImplementation(props);
  }

  /** Samples the viseme weights active at an arbitrary film second. */
  export function sampleDialogueVisemeWeights(
    props: IVisemeFrame,
  ): IAutoMovieHumanVisemeWeights {
    return sampleDialogueVisemeWeightsImplementation(props);
  }
  /** Create a streaming ITU-R BS.1770-5 meter for mono or stereo PCM. */
  export function createLoudnessMeter(channels: 1 | 2): IAutoMovieLoudnessMeter {
    return createLoudnessMeterImplementation(channels);
  }

}
