import { DEFAULT_HUMANOID_ROM } from "@automovie/engine";

/*
 * The wrist's extension limit, degrees: the hand's flexion range's far end
 * (`DEFAULT_HUMANOID_ROM`, flexion negative toward the back of the hand).
 */
export const WRIST: number = -DEFAULT_HUMANOID_ROM.leftHand!.flexion!.min;

/*
 * The knuckles' hyperextension limit, degrees (`DEFAULT_HUMANOID_ROM`, the
 * fingers' proximal joints).
 */
export const KNUCKLE: number = -DEFAULT_HUMANOID_ROM.leftIndexProximal!.flexion!.min;

/*
 * The thumb's interphalangeal extension limit, degrees
 * (`DEFAULT_HUMANOID_ROM`).
 */
export const THUMB_IP: number = -DEFAULT_HUMANOID_ROM.leftThumbDistal!.flexion!.min;

/*
 * Degrees the wrist is kept inside its limit.
 */
export const MARGIN: number = 5;

/*
 * The fingers' proximal joints, whose extension keeps the fingers flat as the
 * palm rises.
 */
export const FINGERS: readonly string[] = ["Index", "Middle", "Ring", "Little"];
