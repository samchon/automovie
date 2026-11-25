import type { IAutoMovieVector3 } from "@automovie/interface";
import { type AutoMovieArchetypeRide } from "../core";
import type { AutoMovieArchetypeEquineExpressionCue } from "./AutoMovieArchetypeEquineExpressionCue";
import { EquineExpressionAdmission } from "./EquineExpressionAdmission";

/**
 * Grazing chew rate, Hz: 47.1 chews per minute by sound recorder (Taylor,
 * Lancaster and Ellis 2025, Animals 15:2273, Table 1).
 */
export const CHEW_HZ: number = 47.1 / 60;

/**
 * Peak jaw opening of a chew, degrees: authored, no source read gives the
 * coarse jaw's angle.
 */
export const CHEW_DEGREES: number = 6;

/** A held-open jaw, degrees: authored. */
export const OPEN_DEGREES: number = 15;

/** A yawn's jaw opening, degrees: authored. */
export const YAWN_DEGREES: number = 35;

/** A slack lower lip's drop of the jaw, degrees: authored. */
export const SLACK_DEGREES: number = 4;

/** A curled upper lip's turn, degrees: authored. */
export const CURL_DEGREES: number = 45;

/** A neck shake's rate, Hz, and roll, degrees: authored. */
export const SHAKE: Readonly<{ hertz: number; degrees: number }> = {
  hertz: 3,
  degrees: 25,
};

/**
 * Each head carriage's neck and head pitch, degrees, positive lowering:
 * authored poses.
 */
export const CARRIAGES: Readonly<
  Record<
    AutoMovieArchetypeEquineExpressionCue.HeadCarriage,
    readonly [number, number]
  >
> = {
  doze: [25, 10],
  flehmen: [-10, -40],
  yawn: [5, -25],
};

/** A tail swish's rate, Hz, and swing, degrees: authored. */
export const SWISH: Readonly<{ hertz: number; degrees: number }> = {
  hertz: 1,
  degrees: 30,
};

/**
 * Each ear carriage's direction for the left ear in the rest model's space,
 * mirrored for the right: authored poses for EquiFACS EAD101 (forward), EAD104
 * (lateral, back) and EAD103 (pinned).
 */
export const EARS: Readonly<
  Record<AutoMovieArchetypeEquineExpressionCue.EarCarriage, IAutoMovieVector3>
> = {
  forward: { x: 0.15, y: 0.75, z: 0.65 },
  lateral: { x: 1, y: 0.45, z: 0 },
  droop: { x: 1, y: -0.15, z: 0.15 },
  back: { x: 0.3, y: 0.6, z: -0.75 },
  pinned: { x: 0.2, y: 0.2, z: -1 },
};

/**
 * Each tail carriage's raise, degrees: authored. A swish keeps the hang and
 * swings.
 */
export const TAILS: Readonly<
  Record<AutoMovieArchetypeEquineExpressionCue.TailCarriage, number>
> = {
  raised: 40,
  clamped: -15,
  swish: 0,
};

/** A held cue with its channel. */
export type Held = EquineExpressionAdmission.Held;

/** Any cue on the head channel. */
export type Heading = EquineExpressionAdmission.Heading;

/** A named instant of a ride. */
export type Instant = AutoMovieArchetypeRide.IRide<string, string>["instants"][number];
