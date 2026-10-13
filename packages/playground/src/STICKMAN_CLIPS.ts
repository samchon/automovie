import type { IAutoMovieMotion } from "@automovie/interface";
import { jumpingJack } from "./jumpingJack";
import { wave } from "./wave";
import { walk } from "./walk";
import { hop } from "./hop";
import { turn } from "./turn";
import { run } from "./run";
import { dance } from "./dance";
import { kick } from "./kick";
import { combo } from "./combo";
import { stroll } from "./stroll";
import { sprint } from "./sprint";
import { shadowbox } from "./shadowbox";

/**
 * Construct the existing twelve-name selectable motion catalogue for one compatible stick-rig identity. All clips are built eagerly, including composed and traveling routines; selecting one later does not imply the unused ones avoided construction. The catalogue supplies choreography rather than clinical or visual admission.
 *
 * @evidence contracts/common.md#principled-implementation Closed authored catalogue names map to their actual clip producers with the same skeleton identity, preserving the page's supported selection set.
 * @evidence contracts/common.md#clear-and-simple-design One map binds the current selectable examples while each clip owns its construction and the page owns selection, player and renderer lifetime.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No unsupported selection is invented here and catalogue availability does not prove every component's ROM, contact, imported-rig compatibility or observed appearance.
 * @evidence contracts/common.md#meaningful-documentation The comment states the exact catalogue population, eager construction and admission limits.
 * @evidence contracts/performance.md#efficient-algorithms Construction includes every producer's total key/pose work, repeated component builds and travel/sequence passes, requiring O(k) resulting data for the fixed catalogue's total key population; actual rendering cost belongs to the selected player.
 * @evidence contracts/performance.md#reuse-equivalent-work All entries share the supplied skeleton name and each producer's documented local vocabulary; separate entry construction retains independent mutable clip records rather than a hidden global catalogue cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The page retains twelve clip records while its selector/player needs them; externally retained maps remain caller-owned. The catalogue starts no clock, worker or GPU allocation and has no cross-call retained history.
 *
 * @author Samchon
 */
export const STICKMAN_CLIPS: (sk: string) => Record<string, IAutoMovieMotion> = (
  sk: string,
): Record<string, IAutoMovieMotion> => ({
  jumpingJack: jumpingJack(sk),
  wave: wave(sk),
  walk: walk(sk),
  run: run(sk),
  hop: hop(sk),
  kick: kick(sk),
  dance: dance(sk),
  turn: turn(sk),
  combo: combo(sk),
  shadowbox: shadowbox(sk),
  stroll: stroll(sk),
  sprint: sprint(sk),
});
