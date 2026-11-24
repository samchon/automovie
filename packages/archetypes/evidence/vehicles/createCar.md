# src/vehicles/createCar.ts#createCar

## @evidence contracts/development/common.md#meaningful-documentation

States the car's origin and front, why the body is open, which side the driver is on, what each class carries and what the affordances cover.

## @evidence contracts/development/implementation.md#principled-implementation

Pick one read model of the class whole and one of its tyres (`CAR_MODELS`, `ArchetypeDraw.model`), so no car mixes two models' figures, draw the remaining dimensions with the model's own ranges, lay the body out once (`CarBody.layout`), then build the shell (`CarBody`), the class's rear (`CarRear`), the wheels, the doors, the seats and the controls on that layout. The interior is laid out from the driver's seating reference point as SAE J1100 does.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The body, the rear and the cabin are their own modules, each building from the one layout.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The accelerator and the steering wheel are placed by SAE J1516's pedal plane and ball of foot and a sedan package's L6 and H17. The overhangs, belt line, windows, doors, firewall and both rows' seating reference points along the car are the 2018 and 2023 Honda Accords' NCAP measurements. Four values remain named provisional ones, each stating the source to read: the cabin floor's height (`FLOOR`, bounded below by the read rocker edge and above by the derived belt line), the H-point's height over the cushion (`HIP`), the rear seat's height and the door handles' place (`HANDLE`). The brake, the gear lever, the mirror and the driver's belt grip are not built until a source places them. Every class's cabin is these Accord pieces placed on its read model's overall size, so one car mixes makers; each model's own pillar and roof stations are queued to be read. A van's middle pillar is its read bulkhead, no source giving its door station (`CarBody.layout`). Bands read at search results only are marked provisional.

## @evidence contracts/development/implementation.md#efficient-algorithms

About sixty parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
