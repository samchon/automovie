import type { IAutoMovieCollisionActor } from "./IAutoMovieCollisionActor";

/**
 * Pairwise capsule sampling inputs for body-contact advice.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Pairwise capsule sampling inputs for body-contact advice. Nested contracts define the relevant units, ownership and failure states.
 * @evidence contracts/development/design.md#principled-representation Canonical actors combine compatible geometric frames with sample frequency and response gain.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The detector consumes one pair and returns canonical contact/advice records without a physics world.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Sampled penetration and a heuristic response are not continuous collision or installed motion guarantees.
 */
export namespace IAutoMovieDetectBodyCollision {
  /**
   * Two borrowed actor descriptions sampled from time zero through the shorter motion duration, including its endpoint. Strict capsule penetration creates contact events; touching alone does not. sampleRate and every capsule's rig reachability, distinct endpoints and radius are checked before sampling; full motion/skeleton admission remains upstream.
   *
   * Without physicsIntent, contacts produce warnings and a deepest-contact response only after both bodies supply positive finite mass and finite restitution in [0,1]. Missing/invalid response quantities retain contacts but yield findings and null response. Delegated sampling or response errors can still throw. Inputs are unchanged and sampled pose maps are not retained.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines sampling clock, contact predicate, defaults, response-only admission and failure/ownership behavior.
   * @evidence contracts/development/design.md#principled-representation Canonical actors carry skeleton, motion and capsule geometry in compatible frames; rates are samples per second and response gain is degrees per impulse.
   * @evidence contracts/development/design.md#minimal-and-owned-surface detectBodyCollision joins existing actor/contact/response contracts; no native physics world or installed film collision host is represented.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Sampling is not continuous collision proof, and response velocity uses nominal rate even at a truncated last interval; absent body parameters are never invented.
   */
  export type IProps = {
    /** First borrowed actor; event actor id comes from its node and its resolved motion positions must share the second actor's frame. */
    a: IAutoMovieCollisionActor;

    /** Second borrowed actor; event target id and suggested recoil bone come from this actor. */
    b: IAutoMovieCollisionActor;

    /** Finite positive samples per second, default 24. Invalid input returns validation findings with no events or response. */
    sampleRate?: number | undefined;

    /** Any defined string, including empty, suppresses physics warnings and response while retaining sampled events and structural admission. Text is not interpreted. */
    physicsIntent?: string | undefined;

    /** Recoil flexion degrees per kg*m/s of impulse, default 0.05. Forwarded without a local gate; response generation throws unless the gain is finite and nonnegative. No-response paths never check it. */
    gainDegPerImpulse?: number | undefined;

    /** Prefix for diagnostic locations, default "$input"; this is a reporting path rather than a node id. */
    path?: string | undefined;
  };
}
