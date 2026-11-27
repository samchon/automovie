import { AutoMovieMotionHumanInterrupt } from "../../compose/internal/AutoMovieMotionHumanInterrupt";

/*
 * Offset decay time of a cut out of a run into another locomotion or a stand,
 * seconds (a deliberate change of the whole body's action,
 * `AutoMovieMotionHumanInterrupt.BLENDS.deliberate`).
 */
export const BLEND: number = AutoMovieMotionHumanInterrupt.BLENDS.deliberate;

/*
 * Offset decay time of a cut from a run into a jump, seconds (provisional).
 */
export const TAKEOFF_BLEND: number = 0.15;

/*
 * The elbows' mean flexion while running, degrees: 1.61 ± 0.10 rad in natural
 * running (Yegian et al. 2019, J Exp Biol 222:jeb197228).
 */
export const ELBOW: number = (1.61 * 180) / Math.PI;

/*
 * The elbows' flexion swing amplitude about that mean, degrees: half the 38.8 ±
 * 12.6 degree range distance runners show (Tartaruga et al. 2012, Res Q Exerc
 * Sport 83:367).
 */
export const ELBOW_SWING: number = 38.8 / 2;

/*
 * The step frequency in pendulum units at a Froude number of zero (provisional
 * fit: 170 steps a minute at 2.9 m/s on the reference hip,
 * `walkRoot.REFERENCE_HIP`, Heiderscheit et al. 2011).
 */
export const CADENCE_BASE: number = 0.8;

/*
 * The step frequency's rise in pendulum units per unit Froude number
 * (provisional fit, rising toward a sprint, Cavagna et al. 1988).
 */
export const CADENCE_PER_FROUDE: number = 0.08;
