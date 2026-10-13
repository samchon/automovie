/**
 * A coarse body-region **mask**: which part of the rig a motion drives. The builder composes motions that own **disjoint** regions _concurrently_ (locomote the legs while the arms gesture and the head tracks a target) instead of forcing them to take turns; motions that **share** a region must sequence. This is the layered-blend-per-bone discipline: a base layer plus region-scoped overrides that don't collide.
 *
 * A closed set (not a free description) is deliberate: across many parallel generations a fixed partition converges where prose ("the upper body", "arms and chest") would drift. The regions are chosen disjoint-and-covering so any pair is unambiguously either composable or conflicting:
 *
 * - `lowerBody`: hips/root + both legs (locomotion, stance, kicks).
 * - `upperBody`: spine + both arms + hands (gestures, reaches, punches).
 * - `head`: neck + head (look-at, nods, shakes).
 * - `face`: expression/morph channels (emotes).
 * - `fullBody`: the whole rig (jumps, knockdowns, whole-body staggers, and the
 *   shipped gaits). It co-occurs with another region only while their surviving
 *   content stays disjoint (a full-body gait beside a head-only look-at); a
 *   shared root, bone, or expression conflicts.
 *
 * (A finer split, `leftArm` / `rightArm` so a one-armed wave and a carry compose, is a later additive when a scene needs it; `upperBody` covers the common case for now.)
 *
 * @evidence contracts/common.md#principled-implementation Closed regions classify motion channels for masking and layering, while actual surviving root, bone and expression ownership determines whether concurrent content conflicts.
 * @evidence contracts/common.md#clear-and-simple-design Coarse limb/head/expression groups provide a bounded authoring vocabulary with fullBody spanning the rig rather than requiring arbitrary prose masks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Region names alone do not guarantee disjoint content, especially fullBody overlaps; composition must inspect the masked surviving channels rather than permit concurrency by label only.
 * @evidence contracts/common.md#meaningful-documentation Defines each region's channels and the fullBody exception requiring actual disjoint surviving content.
 * @author Samchon
 */
export type AutoMovieBodyRegion =
  | "lowerBody"
  | "upperBody"
  | "head"
  | "face"
  | "fullBody";
