import { IAutoMovieFluidState } from "@automovie/interface";

/**
 * A stable 32-bit FNV-1a digest of one fluid state's exact bytes, as lowercase
 * hex.
 *
 * Two states digest alike only when every depth, velocity and ledger value is
 * bit-identical, so it is the compact evidence that a replay, a reordered seek,
 * or a second machine reproduced the reference state rather than merely a close
 * one.
 *
 * @evidence requirements/effects-and-simulation/clock-seek-and-determinism.md#effects-platform-determinism Records exact replay equality rather than an approximate visual match.
 * @evidence specifications/simulation-effects-and-sound/clocks-ordering-seek-and-checkpoints.md#numeric-platform-repeatability-class Provides a stable byte-level receipt for repeatability checks.
 * @author Samchon
 */
export const fluidStateDigest = (state: IAutoMovieFluidState): string => {
  const values = [
    state.step,
    ...state.depth,
    ...state.velocityX,
    ...state.velocityZ,
    state.volume,
    state.sourceVolume,
    state.drainVolume,
    state.outflowVolume,
  ];
  const view = new DataView(new ArrayBuffer(8));
  let hash = 0x811c9dc5;
  for (const value of values) {
    view.setFloat64(0, value, true);
    for (let byte = 0; byte < 8; ++byte) {
      hash = (hash ^ view.getUint8(byte)) >>> 0;
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
  }
  return hash.toString(16).padStart(8, "0");
};

/**
 * One face's velocity after this step's momentum update.
 *
 * `before`/`after` are the two cells the face separates in increasing index
 * order, an absent one already substituted by its dry ghost. The face is silent
 * — exactly zero, so a still lake stays still — when a wall or solid blocks it,
 * when neither side holds water, and when the only water present would have to
 * climb onto ground standing above its own free surface.
 */
const faceSpeed = (props: {
  previous: number;
  blocked: boolean;
  bedBefore: number;
  bedAfter: number;
  depthBefore: number;
  depthAfter: number;
  dry: number;
  gravity: number;
  dt: number;
  span: number;
  damping: number;
}): number => {
  if (props.blocked) return 0;
  const etaBefore = props.bedBefore + props.depthBefore;
  const etaAfter = props.bedAfter + props.depthAfter;
  const wetBefore = props.depthBefore > props.dry;
  const wetAfter = props.depthAfter > props.dry;
  if (wetBefore === false && etaAfter <= etaBefore) return 0;
  if (wetAfter === false && etaBefore <= etaAfter) return 0;
  return (
    (props.previous -
      (props.dt * props.gravity * (etaAfter - etaBefore)) / props.span) /
    props.damping
  );
};

/** Whether a declared source or drain is open at this step's start time. */
const active = (start: number, end: number | null, time: number): boolean =>
  time >= start && (end === null || time < end);

/** Whether every value of every array is a real number. */
const allFinite = (arrays: Float64Array[]): boolean => {
  for (const values of arrays)
    for (let index = 0; index < values.length; ++index)
      if (Number.isFinite(values[index]) === false) return false;
  return true;
};
