# src/vehicles/AutoMovieArchetypeDinghy.ts#AutoMovieArchetypeDinghy.create

## @evidence contracts/development/common.md#meaningful-documentation

The comment locates the waterline and two standing sites, explains the control carriers, labels the estimates and states fixed-value admission.

## @evidence contracts/development/implementation.md#principled-implementation

Thin section cells keep the cockpit open. The deck, mast and stern controls share one hull frame. The boom carries the clew, the sheet's trailing guide joints carry the hand site, and the extension's lift rides its swing on the rudder.

## @evidence contracts/development/implementation.md#efficient-algorithms

The factory uses one draw and a finite set of hull sections. It prepares the joints and their part lists once so later articulation need only pose the requested state.

# src/vehicles/AutoMovieArchetypeDinghy.ts#AutoMovieArchetypeDinghy.BANDS

## @evidence contracts/development/common.md#meaningful-documentation

The record distinguishes published hull figures from the complete mass with an estimated 9 kg rig.

# src/vehicles/AutoMovieArchetypeDinghy.ts#AutoMovieArchetypeDinghy.EXTENSION

## @evidence contracts/development/common.md#meaningful-documentation

The constant gives the staged pivot-to-tip length in metres.

# src/vehicles/AutoMovieArchetypeDinghy.ts#AutoMovieArchetypeDinghy.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

The optional scene ID defaults to `dinghy`.

# src/vehicles/AutoMovieArchetypeDinghy.ts#AutoMovieArchetypeDinghy.UNITS

## @evidence contracts/development/common.md#meaningful-documentation

The envelope uses metres and the combined mass uses kilograms.

# src/vehicles/AutoMovieArchetypeDinghy.ts#AutoMovieArchetypeDinghy.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

The comment groups footwell standing surfaces, control joints, line guides and grip sites.

## @evidence contracts/development/design.md#principled-representation

The helm and crew stands are bounded surfaces. `mainSheet` rides its sheet joints, and `tiller` rides the extension attached to the rudder. The hand sites therefore follow the returned actuation graph.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The model owns control identities and known geometry, while the sailing plan owns phase and articulation values.

# src/vehicles/AutoMovieArchetypeDinghy.ts#AutoMovieArchetypeDinghy.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

The keys identify hull length, beam and mass including the rig.

## @evidence contracts/development/design.md#principled-representation

The fixed hull figures scale the envelope. The mass combines a published hull figure and a staged rig estimate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The builder owns the complete prop measurement and keeps rig geometry estimates with the recipe.

# src/vehicles/AutoMovieArchetypeDinghy.ts#AutoMovieArchetypeDinghy.IParams

## @evidence contracts/development/common.md#meaningful-documentation

The inputs identify a subject and any exact reference values.

## @evidence contracts/development/design.md#principled-representation

Fixed dimensions must equal their catalogue bands, including the model's estimated complete mass.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The supported values let callers carry fixed reference measures without independently altering the connected controls.
