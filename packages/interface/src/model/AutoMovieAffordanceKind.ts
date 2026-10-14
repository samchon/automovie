/**
 * The closed set of contacts an object can declare independently of its rig.
 *
 * Four contact roles distinguish authored support and attachment intent:
 *
 * - `"stack-top"`: a face another object can rest on, such as a crate lid or table top. Only this kind carries extent; propSupportFace uses its frame and full placement matrix for support geometry. The separate rigid-only affordanceSupportContacts helper currently has test callers, not a wired topple pipeline.
 * - `"handle"`: a grab point that seats a hand frame (a mug handle, a sword grip). Finger-level wrap IK is a later pass.
 * - `"socket"`: a receptacle another object's contact frame plugs into (a torch sconce, a peg hole, a bottle mouth).
 * - `"hook"`: a hanging point (a lantern ring, a coat peg).
 *
 * @evidence contracts/common.md#principled-implementation Contact semantics distinguish a supporting face from three point contacts; affordance validation requires an extent only for stack-top, and prop relation validation selects stack-top, socket or hook according to the relation kind.
 * @evidence contracts/common.md#clear-and-simple-design Four literals discriminate the existing affordance record rather than assigning behavior from descriptive names; contact frames and the supporting footprint remain on that record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Table, grip and lantern examples do not select runtime branches; a support relation with the wrong affordance kind is refused instead of relabelled to fit.
 * @evidence contracts/common.md#meaningful-documentation Explains all four contact roles, live stack-top placement support and the separate contact-helper wiring limit; handle contact supplies no finger-wrap IK.
 * @author Samchon
 */
export type AutoMovieAffordanceKind =
  | "stack-top"
  | "handle"
  | "socket"
  | "hook";
