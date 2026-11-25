# src/architecture/ApplianceConstruction.ts#ApplianceConstruction.refrigerator

## @evidence contracts/development/common.md#meaningful-documentation

States what is built, where the doors hinge and where the handles are.

## @evidence contracts/development/implementation.md#principled-implementation

The carcass is the maker's depth less the door and the handle's stand-off, so the handle bars' fronts are the depth with handles the sheet gives; the freezer the share of the height its capacity is of the total; the shelves at even steps up the inside, the maker's count of them; the doors open the 90 degrees the maker's manual gives.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Freezer, the fridge's walls, the shelves, then each door with its handle bar and their two contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No door shelves, drawers or seals; the wall, door and shelf thickness and the bar's stand-off are construction estimates.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Fourteen parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one appliance.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/architecture/ApplianceConstruction.ts#ApplianceConstruction.cooker

## @evidence contracts/development/common.md#meaningful-documentation

States what is built, which parts are contacts and why the rest are not.

## @evidence contracts/development/implementation.md#principled-implementation

The body at the maker's width and height; the zones at the maker's hob diameters, centred in the top's four quarters, front left, front right, back left and back right as one faces it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Body, fascia, plinth, door and handle, knobs, then the top and each zone with its contact.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No oven cavity or racks; the plinth, fascia, door thickness and knob sizes are construction estimates.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Fourteen parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one appliance.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/architecture/ApplianceConstruction.ts#ApplianceConstruction.microwave

## @evidence contracts/development/common.md#meaningful-documentation

States what is built, where the door hinges, how the walls are sized and why the door does not open.

## @evidence contracts/development/implementation.md#principled-implementation

Walls placed so their inner faces bound the maker's cavity inside the maker's outside size, the panel taking the width the cavity and the side wall leave.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Bottom and roof, side, back, panel, door, then the three contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No turntable or window; the equal split of the depth between door and back is the one premise the sheet leaves open.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Six parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one appliance.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/architecture/ApplianceConstruction.ts#ApplianceConstruction.washingMachine

## @evidence contracts/development/common.md#meaningful-documentation

States what is built, where the door hinges, and which contacts belong to the door or drum.

## @evidence contracts/development/implementation.md#principled-implementation

The maker-sized body surrounds the cavity built by WasherDrum. The door and handle move as one rigid hinge group.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Build the fixed drum, then the door group, handle and top.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The drum is stationary and coarse. It excludes the detergent drawer and transparent door material.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Uses a fixed number of drum cells, a door, a handle and a dial.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one appliance.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
