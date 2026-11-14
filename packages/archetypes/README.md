# @automovie/archetypes

Coarse models of the things people hold, use, sit on, ride and fight with, for AutoMovie. Each is made by a typed producer function from parameters and a seed, and returns an `IAutoMovieModel` that also says where a person meets it: its grips, seats, surfaces, bars, articulations and openings, as affordances in the convention of `AutoMovieAffordanceKind`.

The models are as plain as recognising the thing allows: a chair is a seat, a back and four legs. What a person's act reads is exact. Seat heights, handle heights, risers and treads, grip diameters, a steering wheel's place and a saddle's height each come from a cited standard or measurement, and a seed varies them only inside the cited band. A band's `source` names where it was read, and `provisional` marks one that could not be read at its primary source.

Use it in a production to stage a scene's objects and to give `@automovie/motions` something to hold, sit on or ride. Product packages do not depend on it.

## Use

The package needs Node.js 22.23.2 or later.

```bash
npm install @automovie/archetypes
```

```ts
import { createDoor, createSeat } from "@automovie/archetypes";

const chair = createSeat({ kind: "dining" }, "scene-3/chair-1"); // every free dimension drawn in its band
const stool = createSeat({ kind: "barStool", seatHeight: 0.78 }); // one dimension fixed, the rest at mid-band

chair.affordance("seat").frame; // where a person sits, in the chair's own space
chair.dimensions.seatHeight; // what the seed drew, metres

const door = createDoor({ hinge: "left", hardware: "lever" }, 7);
const open = door.articulate({ hinge: 70 }); // the leaf, its lever and their contacts moved
open.affordance("pull").frame; // the lever's grip on the open leaf
open.site("aperture", 0.5, 0); // the middle of the threshold
```

The same parameters and seed always give the same model. Without a seed every dimension takes the middle of its band. A producer's affordance ids and dimension names are closed types, so a misspelt one fails the type check. A request a producer cannot honour throws an `ArchetypeRefusal` whose fields name the axis at fault and what would have been accepted: a dimension outside its band gives the band, and an affordance the variant lacks gives the ids it has.

An archetype serialises as a plain model. Its accessors (`affordance`, `site`, `articulate`, `travel`, `span`, `placed`, `shapes`, `moment`, `dimensions`, `properties`) are not part of the serialised data.

## Entry points

Each family is also a subpath, such as `@automovie/archetypes/furniture`.

| Subpath | Producers |
| --- | --- |
| `/props` | `createDrinkware`, `createDevice`, `createSmoking`, `createStationery`, `createCareItem`, `createBag`, `createBox`, `createTool`, `createLongTool`, `createVessel`, `createWearable`, `createKeyboard`, `createCleaning`, `createTray`, `createTorch`, `createTableware`, `createFood`, `createLight`, `createUmbrella`, `createMobilityAid` |
| `/furniture` | `createSeat`, `createBed`, `createTable`, `createStorage`, `createLoad` |
| `/architecture` | `createDoor`, `createWindow`, `createSwitch`, `createStairs`, `createRamp`, `createWall`, `createBar`, `createLadder`, `createKerb`, `createTap`, `createSanitary`, `createAppliance`, `createObstacle` |
| `/vehicles` | `createCar`, `createBicycle`, `createMotorcycle`, `createCart`, `createPram`, `createWheelchair`, and the rides `driveCar`, `rideBicycle`, `rideMotorcycle`, `rideWheelchair` |
| `/animals` | `createHorse`, the ride `rideHorse`, and the gait timing `HorseGait` |
| `/weapons` | `createHandgun`, `createHolster`, `createMagazine`, `createLongGun`, `createClub`, `createSword`, `createShield`, `createPolearm`, `createPell`, `createWeaponLoop`, `createWeaponRack` |
| `/gym` | `createBarbell`, `createDumbbell`, `createKettlebell`, `createBench`, `createPullUpBar`, `createParallelBars`, `createPlyoBox`, `createRack`, `createSled`, `createRowingMachine`, `createExerciseBike`, `createExerciseMat`, `createJumpRope`, `createRing`, `createBoxingGlove`, `createHeavyBag` |
| `/sport` | `createVaultingPole`, `createHighJump`, `createLandingMat`, `createVaultingTable`, `createBall`, `createRacket`, `createGolfClub`, `createGlove`, `createJavelin`, `createShot`, `createDiscus`, `createHammerThrow`, `createHurdle`, `createStartingBlock`, `createRelayBaton`, `createPoolEdge` |
| `/music` | `createInstrument`, `createMicrophone` |

Each producer's JSDoc states how the thing stands in its own space, and its namespace lists its kinds, affordance ids, dimensions and bands (`createSeat.BANDS`).

### Articulation

A door's leaf, a drawer, a lever, a suitcase's handle and a bicycle's crank are parts bound to an articulation affordance (`hinge`, `slider`, `knob`, `button`, `trigger`, `crank`, `wheel`, `pedal`). `archetype.articulate({ id: travel })` returns the archetype with those parts, and every contact that rides them, moved; the travel is degrees for a turning kind and metres otherwise, and a travel outside the articulation's range is refused.

An articulation may follow another (`follows`): a car's front road wheels steer as its steering wheel turns. A state names only the leader, and `archetype.travel(id)` reads any articulation's travel, a follower's included. A span (`ArchetypeBuilder.span`) is a straight line between two moving frames, laid again after every pose; `archetype.span(id)` gives its ends and whether it is slack.

### Assemblies

`ArchetypeAssembly.of(id, name, { key: { archetype, placement } })` composes placed archetypes into one, which rides, seats and serialises like any archetype. A member's ids are read under its key: the seat of the member `bench2` is `bench2/seat`, and its door's hinge `door/hinge` in `articulate`. `assembly.couple(follower, { id: leader, ratio })` makes an articulation of one member follow another's, and `assembly.member(key)` gives a member as posed, with its own typed accessors. An assembly is composed in a production's source; the package ships none.

### Moving supports

A ride moves an archetype along a course of straight legs and turns, from rest to a cruising speed and back to rest. A course may also mark a speed at each leg's end (`speeds`, 0 for a stop, with a `pause` there), start or end moving (`startSpeed`, `endSpeed`), begin at a film second (`at`), climb or descend a leg (`rise`) and back along one (`reverse`); `ArchetypeCourse.timed(name, samples)` plans a path through points at given seconds instead.

```ts
import { createCar, driveCar } from "@automovie/archetypes";

const car = createCar({ kind: "sedan" }, 3);
const ride = driveCar(car, {
  start: { x: 0, z: 0, heading: 0 },
  legs: [{ kind: "straight", length: 30 }, { kind: "turn", radius: 12, angle: 90 }],
  cruise: 8,
  acceleration: 2,
  deceleration: 3,
});
ride.at(6.5); // the car with its steering wheel turned, and its placement in the world
ride.frame("driverSeat", 6.5); // the seat's world frame, to keep a driver on
ride.instants; // depart, cruise, turn2Start, brake, turn2End, stop
```

`rideBicycle` turns the crank by the distance covered and leans the bicycle into turns, `rideMotorcycle` leans, and `rideHorse` steps the horse's limbs through a walk, trot, canter or gallop and names every hoof's landing. `ArchetypeRide.along` moves any archetype, such as a trolley, unchanged.

### Mass and colliders

`archetype.body` carries the mass and the centre of mass, `archetype.properties.inertia` the inertia about it, and `archetype.moment(point, direction)` the moment about a line. `archetype.shapes()` gives one collider per part in the engine's contact shapes, for a hand to close on.

## Inspection

The archetypes are inspected with AutoMovie's shared instrument. `src/executable/subjects.ts` is a draw-only subject module: subjects that each hold every kind of a few related producers set along a diagonal (`seats`, `drinkware`, `small-props`, `doors`, `vehicles`, ...), `articulated` with the opened and drawn states, and one subject per ride (`ride-car`, `ride-horse-trot`, ...). From this folder, `pnpm capture` runs `automovie capture` on it for stills and contact sheets and `pnpm inspect` opens the inspector page; both take the request keys the [`render` README](../render/README.md#request-keys) lists.

```bash
pnpm capture --subject seats --views "three-quarter@focus=set/seat-office;right@ortho@focus=set/seat-office" --marks "affordance/*"
```

Each archetype's object is named after its catalog entry under the group `set`, such as `set/seat-dining`, and its parts by their ids, so a view with `@focus=set/seat-office` frames one archetype of a subject. Its affordances are marks of the kinds `affordance/<kind>`, an arrow out of each contact with the outline of its extent.
