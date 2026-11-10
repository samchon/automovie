/**
 * The closed set of contacts an object can declare independently of its rig.
 *
 * Every frame follows one convention: `+Y` points out of the contact, away
 * from the object, so whatever comes to the contact (a hand, a sitter's
 * seat, an object set down) arrives travelling along `-Y`. Kinds whose
 * contact is a line run that line along the frame's `+X`.
 *
 * Contact roles:
 *
 * - `"stack-top"`: a face another object can rest on, such as a crate lid or table top. Only this kind carries extent; propSupportFace uses its frame and full placement matrix for support geometry. The separate rigid-only affordanceSupportContacts helper currently has test callers, not a wired topple pipeline.
 * - `"handle"`: a grab point that seats a hand frame (a mug handle, a sword grip). The hand approaches along `-Y`, its palm facing `-Y` into the object, and wraps the axis `+X`, the thumb side toward `+X`; `grip` and `aperture` say how it holds and how wide the hand opens. The digits curl until they touch the object, solved by the engine's finger curl, never authored.
 * - `"socket"`: a receptacle another object's contact frame plugs into (a torch sconce, a peg hole, a bottle mouth).
 * - `"hook"`: a hanging point (a lantern ring, a coat peg).
 * - `"seat"`: a place a person sits (a chair, a bench, a stool, a wall top). The frame sits at the middle of the sitting surface's front edge, `+Y` up out of the surface, `+Z` the way the sitter faces; the surface runs `depth` metres back along `-Z`, and `back`, when present, is the backrest's height above it. The seat's height is where the frame stands in the world.
 * - `"surface"`: a face a body lies, leans, places or writes on (a bed, a desk top, a floor patch). The frame is the face's centre, `+Y` out of it.
 * - `"bar"`: a rod held or hung from (a rail, a rung, a pull-up bar), its axis along `+X`, `length` metres long centred on the frame; it is gripped like a handle.
 * - `"ledge"`: an edge a body climbs or steps onto (a wall top, a step nose, a window sill), the edge along `+X` and `length` metres long, `+Y` up out of the top, `+Z` out from the face below.
 * - `"hinge"`: the axis a leaf turns about (a door, a lid), at a point of the axis with `+Y` along it and `+X` toward the leaf's grip; `travel` is the largest opening, degrees.
 * - `"slider"`: a part that slides (a drawer, a sliding door), the frame at its grip, travelling `travel` metres along `+X`.
 * - `"knob"`: a part turned about its axis (a door knob, a dial, a tap), `+Y` out along the axis; `travel` is the largest turn, degrees.
 * - `"button"`: a part pressed (a doorbell, a switch, a key), pressed along `-Y` by `travel` metres.
 *
 * @evidence contracts/development/design.md#principled-representation Contact semantics distinguish a supporting face from point and line contacts under one frame convention (`+Y` out of the contact, a line along `+X`), the convention game-engine interaction markers use (Unreal sockets, Final IK InteractionObject targets); affordance validation requires an extent only for stack-top, and prop relation validation selects stack-top, socket or hook according to the relation kind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Twelve literals discriminate the existing affordance record rather than assigning behavior from descriptive names; the seat, bar, ledge and articulated kinds are the environment contacts human action laws approach (#3201 A8), and their few dimensions are optional fields of that record.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Table, grip and lantern examples do not select runtime branches; a support relation with the wrong affordance kind is refused instead of relabelled to fit.
 * @evidence contracts/development/common.md#meaningful-documentation States the shared frame convention and every kind's role, frame and the fields it reads; live stack-top placement support and the separate contact-helper wiring limit.
 */
export type AutoMovieAffordanceKind =
  | "stack-top"
  | "handle"
  | "socket"
  | "hook"
  | "seat"
  | "surface"
  | "bar"
  | "ledge"
  | "hinge"
  | "slider"
  | "knob"
  | "button";
