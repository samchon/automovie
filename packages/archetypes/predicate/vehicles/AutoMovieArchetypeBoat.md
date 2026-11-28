# src/vehicles/AutoMovieArchetypeBoat.ts#AutoMovieArchetypeBoat.IRowing.placement

## @evidence contracts/development/common.md#meaningful-documentation

The callback returns the floated root placement at a course second.

## @evidence contracts/development/implementation.md#principled-implementation

The native ride reads the course pose and applies its optional sea model at the same second. The boat's control articulation is independent of this root read.

## @evidence contracts/development/implementation.md#efficient-algorithms

The callback evaluates only the requested course root and optional sea transform. The paired socket reader handles the oar and contact sites.

# src/vehicles/AutoMovieArchetypeBoat.ts#AutoMovieArchetypeBoat.bind

## @evidence contracts/development/common.md#meaningful-documentation

The binding contract identifies native input, finite film seconds, both hold boundaries, and the refusal for an external ride or nonfinite start.

## @evidence contracts/development/implementation.md#principled-implementation

The binder checks for native samplers and a finite start before creating either callback. A clamp maps film seconds to nonnegative course seconds for both readers, including a finite start before zero. The still-water hold begins strictly after the scheduled end.

## @evidence contracts/development/implementation.md#efficient-algorithms

The two readers share a prepared clock and at most two holds. Each root read samples placement directly; a socket read checks membership in the finite set and samples the requested frame.

# src/vehicles/AutoMovieArchetypeBoat.ts#AutoMovieArchetypeBoat.create

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives the waterline origin, boat and seat directions, controls by kind, seed defaults and structured refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The dispatcher admits a saved kind and directs it to that kind's factory. Rowboat and canoe inputs are narrowed to their respective model names; launch construction uses its own fixed hull. The selected constructor owns admission of usable dimensions and emits the model with its own contacts.

## @evidence contracts/development/implementation.md#efficient-algorithms

The branch chooses one constructor before drawing or building geometry. Only that constructor creates the hull and its outfit.

# src/vehicles/AutoMovieArchetypeBoat.ts#AutoMovieArchetypeBoat.drive

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives the input in strokes per minute, measured interval and fractional output.

## @evidence contracts/development/implementation.md#principled-implementation

The function clamps the input to the measured Kleshnev rate range and converts the fitted percentage to a fraction.

## @evidence contracts/development/implementation.md#efficient-algorithms

A clamp and one fitted line compute the share directly.

# src/vehicles/AutoMovieArchetypeBoat.ts#AutoMovieArchetypeBoat.rate

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives the input in metres per second and the output in strokes per minute.

## @evidence contracts/development/implementation.md#principled-implementation

Dividing speed by the model's distance per stroke gives strokes per second. Multiplying by 60 converts to strokes per minute.

## @evidence contracts/development/implementation.md#efficient-algorithms

One fixed arithmetic expression reads the shared stroke distance.

# src/vehicles/AutoMovieArchetypeBoat.ts#AutoMovieArchetypeBoat.row

## @evidence contracts/development/common.md#meaningful-documentation

The operation explains the fixed-seat oar cycle, shared course time, catch cues, sea default and refusal when the boat lacks oars.

## @evidence contracts/development/implementation.md#principled-implementation

Distance determines stroke phase and local speed determines drive share inside the measured rate band. Each catch solves the course time at a whole stroke distance. Sweep and lift yield a placed oar frame, with an optional sea transform applied to the root.

## @evidence contracts/development/implementation.md#efficient-algorithms

The call prepares one course, oar geometry, articulation projection, and optional sea. Catch cues take forty bisection steps each. A socket read calculates its requested frame from elapsed time and the prepared projection when available; the full posed model is supplied only when requested on that route.

# src/vehicles/AutoMovieArchetypeBoat.ts#AutoMovieArchetypeBoat.AFFORDANCES

## @evidence contracts/development/common.md#meaningful-documentation

This list contains every address in the shared boat contact set. An instance supplies its own subset.

# src/vehicles/AutoMovieArchetypeBoat.ts#AutoMovieArchetypeBoat.BANDS

## @evidence contracts/development/common.md#meaningful-documentation

The table records permitted bands per boat kind and assigns provenance to reference and staged measurements.

# src/vehicles/AutoMovieArchetypeBoat.ts#AutoMovieArchetypeBoat.CANOE

## @evidence contracts/development/common.md#meaningful-documentation

The record gives the estimated fore and aft locations of the two canoe seat fronts from midships, in metres.

# src/vehicles/AutoMovieArchetypeBoat.ts#AutoMovieArchetypeBoat.DRAFT

## @evidence contracts/development/common.md#meaningful-documentation

The record gives a bottom depth below the waterline in metres. The model uses the canoe estimate and a cutter reference for the launch.

# src/vehicles/AutoMovieArchetypeBoat.ts#AutoMovieArchetypeBoat.ESTIMATES

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives dimensions, relative shares and ownership for staged structural and contact sizes.

# src/vehicles/AutoMovieArchetypeBoat.ts#AutoMovieArchetypeBoat.IOptions.sea

## @evidence contracts/development/common.md#meaningful-documentation

A supplied sea is used for timed flotation. Omitting it selects still water.

# src/vehicles/AutoMovieArchetypeBoat.ts#AutoMovieArchetypeBoat.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

The optional scene identifier defaults to `boat`.

# src/vehicles/AutoMovieArchetypeBoat.ts#AutoMovieArchetypeBoat.IParams.kind

## @evidence contracts/development/common.md#meaningful-documentation

The field selects the hull factory and per-kind dimension bands.

# src/vehicles/AutoMovieArchetypeBoat.ts#AutoMovieArchetypeBoat.IParams.layup

## @evidence contracts/development/common.md#meaningful-documentation

The field names a layup from the selected canoe hull's catalogue.

# src/vehicles/AutoMovieArchetypeBoat.ts#AutoMovieArchetypeBoat.IParams.model

## @evidence contracts/development/common.md#meaningful-documentation

The field selects a rowboat or canoe catalogue hull. The launch has its own profile.

# src/vehicles/AutoMovieArchetypeBoat.ts#AutoMovieArchetypeBoat.IRowRide.rowing

## @evidence contracts/development/common.md#meaningful-documentation

This optional member carries the native binding data for a generated course with a projected model.

# src/vehicles/AutoMovieArchetypeBoat.ts#AutoMovieArchetypeBoat.IRowing.boat

## @evidence contracts/development/common.md#meaningful-documentation

The field holds the rowboat's neutral model used by the carrier binder.

# src/vehicles/AutoMovieArchetypeBoat.ts#AutoMovieArchetypeBoat.IRowing.duration

## @evidence contracts/development/common.md#meaningful-documentation

The field gives the prepared course duration in seconds.

# src/vehicles/AutoMovieArchetypeBoat.ts#AutoMovieArchetypeBoat.IRowing.frame

## @evidence contracts/development/common.md#meaningful-documentation

The callback reads a single named affordance in world space at a course second.

# src/vehicles/AutoMovieArchetypeBoat.ts#AutoMovieArchetypeBoat.IRowing.stillEnd

## @evidence contracts/development/common.md#meaningful-documentation

The flag requests a terminal hold on still water.

# src/vehicles/AutoMovieArchetypeBoat.ts#AutoMovieArchetypeBoat.KINDS

## @evidence contracts/development/common.md#meaningful-documentation

The list is the complete set of saved kinds checked by the dispatcher.

# src/vehicles/AutoMovieArchetypeBoat.ts#AutoMovieArchetypeBoat.LAUNCH

## @evidence contracts/development/common.md#meaningful-documentation

The record preserves the five-thwart pulling boat row and its metre spacing and fall below the gunwale.

# src/vehicles/AutoMovieArchetypeBoat.ts#AutoMovieArchetypeBoat.LOCK

## @evidence contracts/development/common.md#meaningful-documentation

The staged height places the oarlock pivot above the gunwale in metres.

# src/vehicles/AutoMovieArchetypeBoat.ts#AutoMovieArchetypeBoat.PRODUCERS

## @evidence contracts/development/common.md#meaningful-documentation

The getters return existing dedicated hull factories by saved kind.

# src/vehicles/AutoMovieArchetypeBoat.ts#AutoMovieArchetypeBoat.RAIL

## @evidence contracts/development/common.md#meaningful-documentation

The staged gunwale thickness in metres also defines the boarding grip width.

# src/vehicles/AutoMovieArchetypeBoat.ts#AutoMovieArchetypeBoat.RATES

## @evidence contracts/development/common.md#meaningful-documentation

The lower and upper values are the measured drive-fit range in strokes per minute.

# src/vehicles/AutoMovieArchetypeBoat.ts#AutoMovieArchetypeBoat.ROWBOAT

## @evidence contracts/development/common.md#meaningful-documentation

The staged metre offsets place the forward thwart and the front of the stern seat.

# src/vehicles/AutoMovieArchetypeBoat.ts#AutoMovieArchetypeBoat.STROKE

## @evidence contracts/development/common.md#meaningful-documentation

The value is the staged fixed-seat stroke distance in metres used to derive phase and cadence.

# src/vehicles/AutoMovieArchetypeBoat.ts#AutoMovieArchetypeBoat.THWART

## @evidence contracts/development/common.md#meaningful-documentation

The estimated fore-aft depth of a thwart is in metres.

# src/vehicles/AutoMovieArchetypeBoat.ts#AutoMovieArchetypeBoat.TRANSOM

## @evidence contracts/development/common.md#meaningful-documentation

The staged transom width is a share of the overall beam.

# src/vehicles/AutoMovieArchetypeBoat.ts#AutoMovieArchetypeBoat.UNITS

## @evidence contracts/development/common.md#meaningful-documentation

The record associates every shared dimension with metres or kilograms.

# src/vehicles/AutoMovieArchetypeBoat.ts#AutoMovieArchetypeBoat.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

The declaration names shared standing and boarding sites and the type-specific seats and oar controls.

## @evidence contracts/development/design.md#principled-representation

This is a union across the three kinds. Construction emits only sites belonging to its actual hull. The rowboat's lift and hand sites follow their oarlock articulation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Common readers use this family address set and obtain present sites from the returned instance.

# src/vehicles/AutoMovieArchetypeBoat.ts#AutoMovieArchetypeBoat.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

The comment describes hull dimensions in metres and empty-hull mass in kilograms, including each kind's special dimensions.

## @evidence contracts/development/design.md#principled-representation

Per-kind draw bands and catalogue records restrict the shared key set at construction. Rowboat blade length and width are derived from beam.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The common dimension names let hull and ride constructors share values while each branch owns which values apply.

# src/vehicles/AutoMovieArchetypeBoat.ts#AutoMovieArchetypeBoat.IOptions

## @evidence contracts/development/common.md#meaningful-documentation

The option is the optional sea on which the boat rides.

## @evidence contracts/development/design.md#principled-representation

A supplied sea builds a float transform for the timed pose; the absent case keeps the native still-water placement.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The existing sea model owns wave parameters, with one reference in the ride settings.

# src/vehicles/AutoMovieArchetypeBoat.ts#AutoMovieArchetypeBoat.IParams

## @evidence contracts/development/common.md#meaningful-documentation

The parameters state how the kind, optional catalogue choices, scene ID and per-kind dimensions are used.

## @evidence contracts/development/design.md#principled-representation

Shared optional numeric and catalogue fields permit unavailable combinations in the public type. Rowboat and canoe check model and applicable bands at the construction boundary. The launch dispatcher drops the supplied model field, and layup admission belongs to the selected hull.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The saved compatibility input keeps the common scene and draw fields together. Dedicated hull factories and their catalogues own the geometry.

# src/vehicles/AutoMovieArchetypeBoat.ts#AutoMovieArchetypeBoat.IRowRide

## @evidence contracts/development/common.md#meaningful-documentation

The result distinguishes its ordinary ride reads and optional native data used to bind them to film seconds.

## @evidence contracts/development/design.md#principled-representation

A native course and available archetype projection supply `rowing`. An externally supplied course plan has no native binding data.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result reuses the public ride contract. The optional native component carries only what the film-clock binder requires.

# src/vehicles/AutoMovieArchetypeBoat.ts#AutoMovieArchetypeBoat.IRowing

## @evidence contracts/development/common.md#meaningful-documentation

The members name the rest hull, course-time root and socket reads, duration and still-water end hold.

## @evidence contracts/development/design.md#principled-representation

One course owns the duration and time frame for both samplers. `stillEnd` comes from whether a sea motion is present.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The rowboat ride owns the prepared course and samplers, while `bind` maps only the film clock and its holds.

# src/vehicles/AutoMovieArchetypeBoat.ts#AutoMovieArchetypeBoat.Kind

## @evidence contracts/development/common.md#meaningful-documentation

The declaration names the fixed-seat rowboat, tandem canoe and Navy pulling boat branches.

## @evidence contracts/development/design.md#principled-representation

Saved kinds are admitted by the shared list before factory selection. Each branch owns its own catalogue and available contacts.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One kind selects the installed hull and outfit without asking consumers to choose construction parts.

# src/vehicles/AutoMovieArchetypeBoat.ts#AutoMovieArchetypeBoat.Layup

## @evidence contracts/development/common.md#meaningful-documentation

The declaration names layup IDs used to choose a canoe's recorded mass.

## @evidence contracts/development/design.md#principled-representation

The shared union covers different canoe hulls. The draw admits only choices found in the selected hull's layup catalogue.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The hull-specific catalogue owns compatibility and mass figures.

# src/vehicles/AutoMovieArchetypeBoat.ts#AutoMovieArchetypeBoat.Model

## @evidence contracts/development/common.md#meaningful-documentation

The declaration names the reference rowboat and canoe catalogue hulls.

## @evidence contracts/development/design.md#principled-representation

The saved model union spans rowboat and canoe. Each corresponding branch validates its subset. The launch uses its own profile instead of consulting this field.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The shared saved input retains legacy model names; dedicated hull constructors own the narrower choices.
