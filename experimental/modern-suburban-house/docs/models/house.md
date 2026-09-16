# House envelope and fit-out model

## Bounded building representation {#bounded-building-representation}

The model is a deterministic primitive-based representation of one two-storey suburban house, its attached empty garage, openings, stair, roof, chimney, site interface, and ordinary interior fit-out. The representation ceiling is a reviewable blocking pass: it preserves identity, extents, openings, material zones, repeated-module bindings, and room contacts, while fine architectural fabrication and photoreal microtexture remain outside scope and are recorded as unverified.

The stable model boundaries are `building/root`, the main envelope elements under `ground/wall/*` and `upper/wall/*`, the attached garage elements under `ground/garage-*`, the roof owners `roof/main-north`, `roof/main-south`, and `roof/garage`, the opening population under `opening/*`, the single stair `stair/single-l-turn`, room-owned floor finishes under `floor-finish/*`, and room-owned contents under `fitout/*` and `lighting/*`. No part is shared between those semantic owners; each primitive keeps its source id, storey, room, surface owner, material, and tags.

The coordinate convention is metres with X across the frontage, Y upward from the ground floor, and Z running from the front street edge at negative Z to the rear at positive Z. Main-house bounds are X -5.5..5.5 and Z -4.8..4.8; the attached garage is X 5.5..11.3 and Z -4.8..1.4. Upper elements use elevation 2.93 m. Roof planes use the same local box basis and a Z-axis roll for their cross-X pitch; shingle modules inherit that roll and are positioned from the measured roof spans.

Openings are bounded cuts in their host wall: wall parts are derived into sill, jamb-side, and head solid spans around each opening, while the opening element owns the frame, glazing or door panel, and endpoint ids. The stair is the only cross-storey connector. Room surfaces are generated once per compiled space from its declared floor material, and the fit-out population is keyed to those same room ids.

The structural review set is derived from the compiled building: every exposed elevation, meeting corner, roof and underside, opening, room threshold, four room corners, and four in-room cardinal directions. This model declaration identifies what each observation can inspect; visual readability and GPU-backed render observations remain outside the source-only verification recorded in the worklog.
