# src/weapons/AutoMovieArchetypeArmour.ts#AutoMovieArchetypeArmour.IParams.kind

## @evidence contracts/development/common.md#meaningful-documentation

Defines the shell and body segment. The factory checks the saved ID before calling a profile.

# src/weapons/AutoMovieArchetypeArmour.ts#AutoMovieArchetypeArmour.IParams.model

## @evidence contracts/development/common.md#meaningful-documentation

Names a record available to the selected kind. An unseeded request without this field uses that kind's first record.

# src/weapons/AutoMovieArchetypeArmour.ts#AutoMovieArchetypeArmour.IParams.measure

## @evidence contracts/development/common.md#meaningful-documentation

Uses metres for the applicable body dimensions. The selected profile admits only its finite positive required measurements and the cuirass's shoulder and waist order.

# src/weapons/AutoMovieArchetypeArmour.ts#AutoMovieArchetypeArmour.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

The scene ID is passed through to the builder. Omitting it gives the armour family ID.

# src/weapons/AutoMovieArchetypeArmour.ts#AutoMovieArchetypeArmour.IAssemblyParams.subject

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the wearer in each returned worn record. Assembly refuses an empty subject or one that duplicates a model ID.

# src/weapons/AutoMovieArchetypeArmour.ts#AutoMovieArchetypeArmour.IAssemblyParams.body

## @evidence contracts/development/common.md#meaningful-documentation

Supplies the canonical rest positions, bone records and measurements used to align each socket in its bone frame.

# src/weapons/AutoMovieArchetypeArmour.ts#AutoMovieArchetypeArmour.IAssemblyParams.pieces

## @evidence contracts/development/common.md#meaningful-documentation

The allowed bone keys select one corresponding source model per slot. Assembly refuses empty selections, unsupported assignments and repeated IDs.

# src/weapons/AutoMovieArchetypeArmour.ts#AutoMovieArchetypeArmour.IAssemblyPiece.model

## @evidence contracts/development/common.md#meaningful-documentation

Assembly passes through the source geometry and scene ID.

# src/weapons/AutoMovieArchetypeArmour.ts#AutoMovieArchetypeArmour.IAssemblyPiece.worn

## @evidence contracts/development/common.md#meaningful-documentation

Returns the subject, selected bone and rigid model offset expressed in that bone's rest frame.

# src/weapons/AutoMovieArchetypeArmour.ts#AutoMovieArchetypeArmour.Kind

## @evidence contracts/development/common.md#meaningful-documentation

The declaration identifies a kind as the choice of shell, catalogue and required body measurements. The named alternatives distinguish helmet silhouettes, torso pieces and each covered limb segment.

## @evidence contracts/development/design.md#principled-representation

Kinds are saved string IDs. The public factory checks the ID before choosing a producer. Each producer passes its kind to catalogue selection and fit admission.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The eight alternatives are the keys of the public producer map and catalogue. Body binding uses the same alternatives to admit the pieces allowed on each bone.

# src/weapons/AutoMovieArchetypeArmour.ts#AutoMovieArchetypeArmour.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

The type documents the sole `wear` socket as the centre of the covered body segment and names its up direction.

## @evidence contracts/development/design.md#principled-representation

Every completed piece adds a socket at its model origin. The assembly operation reads that socket before deriving the bone-relative placement.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Piece producers and the binding operation use the same socket key. A scene obtains the placement through the shared archetype affordance record.

# src/weapons/AutoMovieArchetypeArmour.ts#AutoMovieArchetypeArmour.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

The declaration gives metres for the envelope, plate and padding, and kilograms for mass. It explains which axis is the length of mail and how the plate gauge applies to unfitted walls.

## @evidence contracts/development/design.md#principled-representation

The six dimension IDs label catalogue figures and band draws. The draw session records units centrally and refuses conflicting fixed values. Fitted wall geometry can alter the represented shape while the saved dimensions retain the catalogue figures.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The factory result and the assembly model share the same dimension keys. Trunk placement reads the original model's height from that record.

# src/weapons/AutoMovieArchetypeArmour.ts#AutoMovieArchetypeArmour.Model

## @evidence contracts/development/common.md#meaningful-documentation

Each literal names a Metropolitan Museum object record. The catalogue gives the values and the association with each kind.

## @evidence contracts/development/design.md#principled-representation

The saved IDs preserve record identity. The dispatcher checks alternative membership and the draw session selects the record in the chosen kind. A model from another kind fails at admission.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The shared model union covers the input and output provenance of each piece. The per-kind catalogue owns each record's numeric figures and default order.

# src/weapons/AutoMovieArchetypeArmour.ts#AutoMovieArchetypeArmour.IParams

## @evidence contracts/development/common.md#meaningful-documentation

The fields document the silhouette, catalogue choice, body-measure units and scene ID default. The fit field names required positive finite values, the shoulder-waist order and the meaning of fitted mail and gauntlet dimensions.

## @evidence contracts/development/design.md#principled-representation

The saved record combines required kind and optional model, body and dimension overrides. The factory routes by kind. The selected draw and fit boundaries check record membership, dimension bands and only the body measures consumed by that profile.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The input reuses the body measurement type and the armour dimension keys. Catalogue envelope generation and fitted generation use one public factory, with the presence of body measurements choosing the route.

# src/weapons/AutoMovieArchetypeArmour.ts#AutoMovieArchetypeArmour.IAssemblySlot

## @evidence contracts/development/common.md#meaningful-documentation

The type names the supported head, chest, hand, forearm and shank slots. The assembly operation documents the centre frame and piece rules for them.

## @evidence contracts/development/design.md#principled-representation

Each slot matches a canonical bone ID. The assembly validates each slot at runtime and checks its piece kind against the allowed choices for that segment.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The key names are the same ones the placement result gives to motion and rendering. Slots cover only bones that receive the existing armour types.

# src/weapons/AutoMovieArchetypeArmour.ts#AutoMovieArchetypeArmour.IAssemblyModel

## @evidence contracts/development/common.md#meaningful-documentation

The declaration identifies the required wear socket on a model of the shared armour dimensions.

## @evidence contracts/development/design.md#principled-representation

The alias preserves the archetype owner's geometry, measurements and affordance typing. The assembly checks each supplied model's family, identity and allowed slot before it reads the socket.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Model assembly keeps the source object. It adds a separate worn binding, leaving geometry and affordance access with the existing archetype.

# src/weapons/AutoMovieArchetypeArmour.ts#AutoMovieArchetypeArmour.IAssemblyWearer

## @evidence contracts/development/common.md#meaningful-documentation

The declaration specifies world rest points in metres, the bone hierarchy and the measures consumed by the selected pieces.

## @evidence contracts/development/design.md#principled-representation

The three fields keep the types of the canonical motion body. Assembly reads the needed joints and the bones along their rest hierarchy, refusing a missing record.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Placement uses rest positions, bone rotations and body dimensions. It needs neither live motion nor sampled pose APIs.

# src/weapons/AutoMovieArchetypeArmour.ts#AutoMovieArchetypeArmour.IAssemblyParams

## @evidence contracts/development/common.md#meaningful-documentation

The fields name the scene subject, its rest body and one piece per allowed bone. The assembly operation documents duplicate IDs and empty or incompatible selections.

## @evidence contracts/development/design.md#principled-representation

The partial record permits at most one model for each canonical slot. Assembly checks nonempty selection, distinct model and subject IDs, compatible models and the presence of needed rest measurements and records.

## @evidence contracts/development/design.md#minimal-and-owned-surface

An author supplies independent scene models and one body record. The assembly returns data for the existing worn placement path without requiring a render entity or scene.

# src/weapons/AutoMovieArchetypeArmour.ts#AutoMovieArchetypeArmour.IAssemblyPiece

## @evidence contracts/development/common.md#meaningful-documentation

The declaration distinguishes the original model from the bone-relative placement returned for that model. The field types preserve the model's ID and the motion binding contract.

## @evidence contracts/development/design.md#principled-representation

A result contains the original model and a worn record. Assembly derives the record for that model's confirmed subject and bone from both rest frames and the model's socket.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Scene composition receives the geometry object it already uses and a standard worn placement. Neither type is duplicated locally.

# src/weapons/AutoMovieArchetypeArmour.ts#AutoMovieArchetypeArmour.create

## @evidence contracts/development/common.md#meaningful-documentation

The contract states the unseeded choice, band defaults, units, local orientation, fit implications and structured refusals. The saved catalogue envelope and wall approximations are described separately from the pieces' visible fits.

## @evidence contracts/development/implementation.md#principled-implementation

The selected kind determines which profile constructs the shell then validates the record, drawn values and consumed body dimensions. The piece's cavity comes from that profile and the fit. Every result places its wear socket at the origin. A collar, brim or wall that cannot enclose its requested fit fails at the geometry owner. The form and joints tests measure the emitted shell's gauge and connectivity.

## @evidence contracts/development/implementation.md#efficient-algorithms

Dispatch builds eight fixed entries and uses one producer. The selected producer prepares one draw and one shell profile, then emits the cells needed by that piece. Cost follows the selected shell's cell construction plus one builder insertion per cell. Intermediate records and builder state are local to the call.

# src/weapons/AutoMovieArchetypeArmour.ts#AutoMovieArchetypeArmour.assembleCostumeArmour

## @evidence contracts/development/common.md#meaningful-documentation

The doc identifies the supported bone centres, their local orientation and the returned binding frame. It states that the source model remains independent and names the invalid-selection and missing-data refusals.

## @evidence contracts/development/implementation.md#principled-implementation

One slot is checked against the model's kind. The placement maps the wear socket onto the covered segment's centre with up along the limb or trunk. Composing inverse bone rest, covered frame and inverse wear frame expresses the model in the bone's rest basis, so the existing worn path can attach the piece in later poses.

## @evidence contracts/development/implementation.md#efficient-algorithms

There are at most eight slot entries and one identity set per assembly call. Each slot reads its own body measurements and traverses its ancestor chain to compose rest rotation. No geometry is rebuilt and the temporary frames and identity checks are released when the call ends or throws.

# src/weapons/AutoMovieArchetypeArmour.ts#AutoMovieArchetypeArmour.PRODUCERS

## @evidence contracts/development/common.md#meaningful-documentation

Every kind key resolves a public factory lazily. The three helmet silhouettes share the same helmet producer with the caller supplying its kind.

# src/weapons/AutoMovieArchetypeArmour.ts#AutoMovieArchetypeArmour.KINDS

## @evidence contracts/development/common.md#meaningful-documentation

The array lists the accepted kind IDs for callers that need to present or check a runtime choice.

# src/weapons/AutoMovieArchetypeArmour.ts#AutoMovieArchetypeArmour.UNITS

## @evidence contracts/development/common.md#meaningful-documentation

The table assigns metres to geometry and kilograms to mass. The draw session uses it to label both bands and saved figures.

# src/weapons/AutoMovieArchetypeArmour.ts#AutoMovieArchetypeArmour.MODELS

## @evidence contracts/development/common.md#meaningful-documentation

The catalogue documentation names the source records and identifies substituted envelope depths for cuirass and mail. The data helper converts source centimetres and grams to metres and kilograms. The first model within a kind is its unseeded choice.

# src/weapons/AutoMovieArchetypeArmour.ts#AutoMovieArchetypeArmour.GLANCE

## @evidence contracts/development/common.md#meaningful-documentation

The documentation gives degrees from the surface normal and describes the recorded value as provisional. The producer attaches the value only to plate metadata. The current outcome implementation does not use it to decide flight or melee results.

# src/weapons/AutoMovieArchetypeArmour.ts#AutoMovieArchetypeArmour.BANDS

## @evidence contracts/development/common.md#meaningful-documentation

The table identifies which variants draw plate thickness and which draw padding. Limb bands carry the provisional flag because their thickness range is transferred from breastplate evidence. Mail derives its equivalent wall instead of drawing a thickness band.

# src/weapons/AutoMovieArchetypeArmour.ts#AutoMovieArchetypeArmour.bone

## @evidence contracts/development/common.md#meaningful-documentation

The doc states the default left side for limb pieces. The wired rule selects the head for helmets, chest for torso armour, and the named hand, forearm or shank on the requested side.
