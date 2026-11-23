# src/environments/furnishings/furnishRoom.ts#furnishRoom

## @evidence contracts/development/implementation.md#principled-implementation

Measures the oriented proxy footprint in the room frame. A repeating lattice starts at the minimum XZ edges with one aisle of perimeter inset. Each cell translates a group box so neighboring boxes have the stated aisle width. Only generated items within the cell are checked against its fixed-role boxes and reserved areas. Model rest bounds give the local Y offset for floor contact.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Places and validates the room layout before calling the common prop adapter. Kit producers supply equipment geometry and relative arrangement. The same fit, identity and staging logic serves both producers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Grid spacing uses conservative group boxes. The 915 mm default is from the U.S. Access Board's accessible-route width, not a compliance assertion. The 1e-9 m contact tolerance follows the engine's authored prop relations. It does not move explicit overrides or solve continuous actor clearance.

## @evidence contracts/development/implementation.md#efficient-algorithms

Measures each prototype before this call and projects its room-local box once per default orientation. Grid slots are considered at most once. Each considered slot checks the fixed and override count and the named keep-outs. Output work grows with the number of staged items and their affordances.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Instances share the production's model prototypes, measured bounds and candidate grid arithmetic. Per-occurrence ids, support frames and stage placements are rebuilt from the authoring inputs.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Reservation, prototype and occupancy maps live only for the call. The returned records are bounded by the requested group count, fixed props and model affordances. No external resources are held.

# src/environments/furnishings/furnishRoom.ts#furnishRoom

## @evidence contracts/development/common.md#meaningful-documentation

States frame, floor contact, slot and aisle policy, priority of keep-outs and overrides, errors and emitted records.
