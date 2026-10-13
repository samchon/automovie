import type { IAutoMovieMotion } from "@automovie/interface";
import { travelMotion } from "@automovie/engine";
import { run } from "./run";

/**
 * Bake nine 0.6-second run cycles along local +Z at an authored 2 metres per second, yielding a 5.4-second non-looping clip. This is deterministic root choreography, not a measured sprint, ground-contact simulation or guarantee of valid joint capacity.
 *
 * @evidence contracts/common.md#principled-implementation The existing travelMotion owner adds continuous global-time translation across repeated seams and preserves the run's articulation and incoming interpolation easing.
 * @evidence contracts/common.md#clear-and-simple-design Fixed cycle count and velocity name the current sprint example while one shared engine owner performs travel baking.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Speed and flight labels remain authored inputs; no population observation or no-slip constraint is inferred from the resulting root path.
 * @evidence contracts/common.md#meaningful-documentation The comment states exact cycles/duration, local axis, velocity units and unverified physical meaning.
 * @evidence contracts/performance.md#efficient-algorithms Five base keys over nine cycles produce thirty-seven keys after seam removal with O(CK) baking work/storage; later playback/FK/rendering stays consumer work.
 * @evidence contracts/performance.md#reuse-equivalent-work One base run supplies all repeated articulation and one carried stride period, while each output root is newly placed; no cross-call model/clip cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns travel keys/roots and borrowed base joint arrays for playback; this wrapper acquires no timer, worker, solver task or renderer handle.
 *
 * @author Samchon
 */
export const sprint: (sk: string) => IAutoMovieMotion = (sk: string): IAutoMovieMotion =>
  travelMotion("sprint", run(sk), 9, { x: 0, y: 0, z: 2.0 });
