import { HumanRefusal } from "../../law/HumanRefusal";

/**
 * The refusal of a goal whose continued arm lost every swivel connected to its
 * seed that takes the hand's asked turn (`IAutoMovieSwivelSeed.vanished`),
 * told apart from every other refusal by its class, so a plan-time query of the
 * arc continuation (`HumanLimbFit.continues`) reads it as no fit and throws
 * every other.
 */
export class HumanLimbVanishedRefusal extends HumanRefusal {}
