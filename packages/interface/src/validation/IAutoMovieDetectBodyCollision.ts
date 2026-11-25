import type { IAutoMovieCollisionActor } from "./IAutoMovieCollisionActor";

/** Pairwise capsule sampling inputs for body-contact advice. */
export namespace IAutoMovieDetectBodyCollision {
  /**
   * Two borrowed actor descriptions sampled from time zero through the shorter
   * motion duration, including its endpoint. Strict capsule penetration creates
   * contact events; touching alone does not. sampleRate and every capsule's rig
   * reachability, distinct endpoints and radius are checked before sampling;
   * full motion/skeleton admission remains upstream.
   *
   * Without physicsIntent, contacts produce warnings and a deepest-contact
   * response only after both bodies supply positive finite mass and finite
   * restitution in [0,1]. Missing/invalid response quantities retain contacts
   * but yield findings and null response. Delegated sampling or response errors
   * can still throw. Inputs are unchanged and sampled pose maps are not
   * retained.
   */
  export type IProps = {
    /**
     * First borrowed actor; event actor id comes from its node and its resolved
     * motion positions must share the second actor's frame.
     */
    a: IAutoMovieCollisionActor;

    /**
     * Second borrowed actor; event target id and suggested recoil bone come
     * from this actor.
     */
    b: IAutoMovieCollisionActor;

    /**
     * Finite positive samples per second, default 24. Invalid input returns
     * validation findings with no events or response.
     */
    sampleRate?: number | undefined;

    /**
     * Any defined string, including empty, suppresses physics warnings and
     * response while retaining sampled events and structural admission. Text is
     * not interpreted.
     */
    physicsIntent?: string | undefined;

    /**
     * Recoil flexion degrees per kg*m/s of impulse, default 0.05. Forwarded
     * without a local gate; response generation throws unless the gain is
     * finite and nonnegative. No-response paths never check it.
     */
    gainDegPerImpulse?: number | undefined;

    /**
     * Prefix for diagnostic locations, default "$input"; this is a reporting
     * path rather than a node id.
     */
    path?: string | undefined;
  };
}
