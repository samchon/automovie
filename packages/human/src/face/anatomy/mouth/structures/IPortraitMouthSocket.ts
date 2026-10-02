/**
 * Subject-owned oral boundaries. Upper and lower curves share their endpoints
 * and run from negative to positive X. No landmark identity belongs to the
 * replaceable mouth implementation.
 *
 * @evidence contracts/common.md#principled-implementation The socket names the closed outer vermilion loop and the two inner-lip curves as host vertex identities with shared endpoints, which is what the lip band, the aperture and the interior need to be built from one definition; the seed selects the connected band for material ownership.
 * @evidence contracts/common.md#clear-and-simple-design Four members, each a boundary the mouth needs; no landmark identity belongs to the replaceable mouth implementation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The type carries data only: no special case, foreign mutation or compensating path exists in it.
 * @evidence contracts/common.md#meaningful-documentation Each member states its order and direction, and the type states that the boundaries are subject-owned.
 * @evidence contracts/modeling.md#spatial-conventions Members are host vertex identities, not coordinates; the curves run from negative to positive X in the host frame and the outer loop follows the boundary order.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The type binds the boundaries of one part, the lips, and is not a part or a group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The type is a topological binding and defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The type emits no primitive.
 * @evidence contracts/modeling.md#shared-boundaries This is the one definition of the boundaries both sides consume: the outer loop is the cutaneous-vermilion border shared with the surrounding skin, and the upper and lower curves share their two corner identities, so the lips, the aperture and the interior meet without a gap. A socket whose curves do not share endpoints or advance strictly in X is refused by the sampler, and a change to the host topology requires a new socket.
 * @evidenceExclude contracts/modeling.md#rendered-observation The type owns no part, group or joint.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The socket carries no anatomical value; it names host vertices.
 * @evidenceExclude contracts/anatomy.md#permitted-range The type admits nothing; the consumers refuse a socket whose curves do not close, share corners or advance in X.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The socket is a topological binding of a subject to its host and shapes nothing; every value that shapes the mouth is a named dimension in `IPortraitMouthShape`.
 * @author Samchon
 */
export interface IPortraitMouthSocket {
  /** Closed outer vermilion loop, in boundary order. */
  outer: number[];

  /** Upper inner lip from negative to positive X. */
  upper: number[];

  /** Lower inner lip in the same direction. */
  lower: number[];

  /** A vertex strictly inside the connected vermilion band. */
  lipSeed: number;
}
