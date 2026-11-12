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
 * - `"handle"`: a grab point that seats a hand frame (a mug handle, a sword grip). The hand approaches along `-Y`, its palm facing `-Y` into the object, and wraps the axis `+X`, the thumb side toward `+X`; `grip` and `aperture` say how it holds and how wide the hand opens, and `length`, when present, is how far the grip runs along `+X`, centred on the frame. The digits curl until they touch the object, solved by the engine's finger curl, never authored.
 * - `"socket"`: a receptacle another object's contact frame plugs into (a torch sconce, a peg hole, a bottle mouth).
 * - `"hook"`: a hanging point (a lantern ring, a coat peg).
 * - `"seat"`: a place a person sits (a chair, a bench, a stool, a wall top). The frame sits at the middle of the sitting surface's front edge, `+Y` up out of the surface, `+Z` the way the sitter faces; the surface runs `depth` metres back along `-Z` and, when `width` is present, `width` metres along `+X` centred on the frame, and `back`, when present, is the backrest's height above it. The seat's height is where the frame stands in the world.
 * - `"surface"`: a face a body lies, leans, places or writes on (a bed, a desk top, a floor patch). The frame is the face's centre, `+Y` out of it; `width` along `+X` and `depth` along `+Z`, when present, give its rectangle centred on the frame.
 * - `"bar"`: a rod held or hung from (a rail, a rung, a pull-up bar), its axis along `+X`, `length` metres long centred on the frame; it is gripped like a handle.
 * - `"ledge"`: an edge a body climbs or steps onto (a wall top, a step nose, a window sill), the edge along `+X` and `length` metres long, `+Y` up out of the top, `+Z` out from the face below.
 * - `"hinge"`: the axis a leaf turns about (a door, a lid), at a point of the axis with `+Y` along it and `+X` toward the leaf's grip; `travel` is the largest opening, degrees, turned about `+Y` by the right-hand rule.
 * - `"slider"`: a part that slides (a drawer, a sliding door), the frame at its grip, travelling `travel` metres along `+X`.
 * - `"knob"`: a part turned about its axis (a door knob, a dial, a tap), `+Y` out along the axis; `travel` is the largest turn, degrees, about `+Y` by the right-hand rule.
 * - `"button"`: a part pressed (a doorbell, a switch, a key), pressed along `-Y` by `travel` metres.
 * - `"trigger"`: a part pulled by one finger (a firearm's trigger, a spray lever), the frame on its finger face with `+Y` out of that face, so the fingertip's pad comes to it along `-Y`, and `+X` along the finger lying across it, toward the fingertip of a right hand; it is pulled along `-Y` by `travel` metres. It differs from a `button` in what holds it: the finger curls round it from a hand that already grips the object.
 * - `"crank"`: an arm turned about an axle (a bicycle crank, a winch handle), the frame at the axle's centre with `+Y` out along the axle and the arm reaching `radius` metres along `+X` at rest, where the hand or foot site sits; it turns about `+Y` by the right-hand rule, without limit when `travel` is absent.
 * - `"wheel"`: a rim turned about its centre (a steering wheel, a valve wheel), the frame at the rim's centre with `+Y` out along the axis toward whoever turns it and the rim `radius` metres out in the frame's XZ plane; `travel` is the largest turn to either side, degrees, about `+Y` by the right-hand rule.
 * - `"pedal"`: a plate a foot presses (a car's pedal, a bicycle's pedal), the frame at the plate's centre with `+Y` out of the plate toward the sole and `+X` across the foot; `width` along `+X` and `depth` along `+Z` give the plate, and `travel`, when present, is how far it is pressed along `-Y`, metres. A pedal that rides a `crank` goes round with it and keeps its own orientation, as a pedal on its spindle does.
 * - `"stirrup"`: a hanging foot support (a saddle's stirrup), the frame at the middle of the tread with `+Y` up out of it and `+X` across the foot; `width` is the tread's width along `+X` and `length`, when present, the length of the strap it hangs from, straight up along `+Y` at rest.
 * - `"rein"`: a held strap (a rein, a lead rope, a leash), the frame at the middle of the held run with `+X` along the strap toward what it leads; `length` is the held run centred on the frame and `aperture` the strap's width across the grip.
 * - `"aperture"`: an opening a body passes through (a door frame, a car door's opening, a window), the frame at the middle of its bottom edge with `+Y` up out of the threshold, `+X` along the threshold and `+Z` the way through; `width` along `+X` and `height` along `+Y` give the opening.
 *
 * @evidence contracts/development/design.md#principled-representation Contact semantics distinguish a supporting face from point and line contacts under one frame convention (`+Y` out of the contact, a line along `+X`), the convention game-engine interaction markers use (Unreal sockets, Final IK InteractionObject targets); affordance validation requires an extent only for stack-top, and prop relation validation selects stack-top, socket or hook according to the relation kind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Nineteen literals discriminate the existing affordance record rather than assigning behavior from descriptive names; the seat, bar, ledge and articulated kinds are the environment contacts human action laws approach (#3201 A8), the trigger, crank, wheel, pedal, stirrup, rein and aperture kinds are the contacts of the archetypes people operate, ride and pass through (#3368), and their few dimensions are optional fields of that record.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Table, grip and lantern examples do not select runtime branches; a support relation with the wrong affordance kind is refused instead of relabelled to fit.
 * @evidence contracts/development/common.md#meaningful-documentation States the shared frame convention and every kind's role, frame, turning sense and the fields it reads; live stack-top placement support and the separate contact-helper wiring limit.
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
  | "button"
  | "trigger"
  | "crank"
  | "wheel"
  | "pedal"
  | "stirrup"
  | "rein"
  | "aperture";
