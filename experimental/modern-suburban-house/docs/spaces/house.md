# House spatial graph

## Building and storeys {#building-and-storeys}

There is one building with a ground storey and an upper storey. Every space belongs to exactly one storey. The main rectangular envelope is continuous across both storeys; the garage is a right-attached ground-storey volume with a low roof. The stair is the only vertical connector and is an L-shaped dog-leg in the central stair hall. There is no void, second stair, lift, hidden passage, or disconnected room.

## Ground-floor public and common graph {#ground-floor-public-and-common-graph}

The front entry opens directly to the living room and the central stair hall. The living room is front-left and includes a fireplace wall, seating, and a direct sightline toward the stair. The kitchen, dining, and family room occupy one continuous rear common space without a separating wall. The kitchen is nearest the service band, the dining zone faces the rear slider, and the family zone faces the fireplace/media wall; these are use zones inside one space, not separate rooms.

## Ground-floor service and garage graph {#ground-floor-service-and-garage-graph}

The east service band contains pantry, powder room, and laundry/mudroom. The pantry opens to the kitchen, the powder room opens to the ground circulation, and the laundry/mudroom opens to both the ground circulation and the garage through a real door. The garage is a single empty two-car space with its own slab, exterior overhead door, perimeter walls, ceiling, storage cabinets, and service threshold. No car, vehicle proxy, or vehicle-shaped placeholder is authored.

## Upper-floor private graph {#upper-floor-private-graph}

The stair reaches one landing and a short L-shaped corridor. That corridor directly connects the primary bedroom, bedroom two, bedroom three, bathroom one, bathroom two, and linen/storage. The primary bedroom has a closet and its own bathroom. The two smaller bedrooms have ordinary closets and share the corridor's two bathrooms. All upper rooms are reached by the same stair and corridor without a hidden shortcut.

## Openings and route schedule {#openings-and-route-schedule}

Every room transition is represented by an opening with a host wall, width, head height, and source and destination space ids. The front door connects porch to entry, the entry connects to living and stair hall, the stair connects ground stair hall to upper hall, the mudroom door connects to the garage, and the upper corridor doors connect each private room and storage. Windows and the rear slider are envelope openings; the garage overhead door is an exterior opening and not a vehicle route in this library.

## Room surface ownership {#room-surface-ownership}

Each complete room surface is owned by one stable id: ground-entry, living-room, stair-hall, kitchen-dining-family, pantry, powder-room, laundry-mudroom, garage, upper-hall, primary-bedroom, bedroom-two, bedroom-three, bathroom-one, bathroom-two, and linen-storage. Storey floors and ceilings own their own complete horizontal surfaces. A room owner may place contents in its volume but may not split ownership of its walls, floor, ceiling, or threshold with a neighboring owner.

## Spatial review population {#spatial-review-population}

The compiled review population derives from the spaces and openings: one threshold observation, four inside-corner observations, and four in-room cardinal-direction observations for every room; all exposed exterior elevations, all building corners, all exposed roof slopes and undersides, every entrance, every window and slider, and the garage door. A section axonometric is an additional diagnostic view only and never reduces this population.
