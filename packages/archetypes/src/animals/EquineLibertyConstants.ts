import type { IAutoMovieVector3 } from "@automovie/interface";
import { AutoMovieArchetypeFrame } from "../core";
import type { AutoMovieArchetypeEquineLibertyCue } from "./AutoMovieArchetypeEquineLibertyCue";
import { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";

/** The authored posture parameters and limb types shared by the liberty rows. */
export namespace EquineLibertyConstants {
/** A limb end of the body. */
export type End = "Fore" | "Hind";

/**
 * The humerus's slope below horizontal in a kneel or bow, as a share of its
 * length dropped: authored.
 */
export const HUMERUS_DROP: number = 0.6;

/**
 * A stretched foreleg's reach, as a share of its four bars' summed length:
 * authored.
 */
export const STRETCH: number = 0.9;

/**
 * The relative carpal fold of a knelt foreleg, degrees: the forearm upright
 * over the cannon lying on the floor.
 */
export const KNEEL_FOLD: number = 90;

/** The kinds of the liberty rows. */
export const KINDS: ReadonlySet<string> = new Set<
  AutoMovieArchetypeEquineLibertyCue.Row["kind"]
>(["bow", "kneel", "sit"]);

/**
 * Closed-form passes settling a sitting hock's height against its tibia's
 * slope: authored.
 */
export const SETTLE: number = 6;

/** The zero vector. */
export const ZERO: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

/** The trunk's motion at a share of a pose. */
export type Trunk = (share: number) => AutoMovieArchetypeFrame.IMotion;

/** A fore limb. */
export type Fore = Extract<AutoMovieArchetypeQuadrupedBody.Limb, `${string}Fore`>;
}
