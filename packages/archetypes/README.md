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

With the source revision, dependencies and runtime fixed, the same parameters and seed give the same model. Without a seed, free band draws use their midpoints and an omitted model name selects the first eligible model. Fixed and derived dimensions follow the producer's documented rules. Upgrades may intentionally correct model selection, geometry, physical properties or contacts, changing later output.

A producer's affordance ids and dimension names are closed types, so a misspelt one fails the type check. A request a producer cannot honour throws an `ArchetypeRefusal` whose fields name the axis at fault and what would have been accepted: a dimension outside its band gives the band, and an affordance the variant lacks gives the ids it has.

An archetype serialises as a plain model. Retain that serialised data when the model data produced by an earlier revision must be preserved. Its accessors (`affordance`, `site`, `articulate`, `travel`, `span`, `placed`, `shapes`, `moment`, `dimensions`, `properties`) are not part of the serialised data.

## Entry points

Each family is also a subpath, such as `@automovie/archetypes/furniture`.

| Subpath | Producers |
| --- | --- |
| `/props` | `createDrinkware`, `createDevice`, `createSmoking`, `createStationery`, `createCareItem`, `createBag`, `createBox`, `createTool`, `createLongTool`, `createVessel`, `createWearable`, `createKeyboard`, `createCleaning`, `createTray`, `createTorch`, `createTableware`, `createFood`, `createLight`, `createUmbrella`, `createMobilityAid` |
| `/furniture` | `createSeat`, `createBed`, `createTable`, `createStorage`, `createLoad`, `createBarrel`, `createLectern`, `createHighChair`, `createConsole`, `createSafe`, `createShowcase` |
| `/architecture` | `createDoor`, `createWindow`, `createSwitch`, `createStairs`, `createRamp`, `createWall`, `createBar`, `createLadder`, `createKerb`, `createTap`, `createSanitary`, `createAppliance`, `createObstacle`, `createStreetFixture`, `createBin`, `createMachine`, `createGate`, `createElevator`, `createValve`, `createHandhold`, `createCellFront`, `createMirror`, `createBoard`, `createSaloonDoor`, `createControl`, `createHatch`, `createBeerTap` |
| `/vehicles` | `createCar`, `createBicycle`, `createMotorcycle`, `createCart`, `createPram`, `createWheelchair`, `createBoat`, `createDeck`, and the rides `driveCar`, `rideBicycle`, `rideMotorcycle`, `rideWheelchair`, `rowBoat` |
| `/animals` | Eight kinds through `createQuadruped`, shared body/rig `QuadrupedBody` and `QuadrupedSkeleton`, actual equipment, `rideQuadruped`/`rideHorse`, measured and authored gait tables, `QuadrupedRest`, and source-aware `EquineGoniometry` |
| `/weapons` | `createHandgun`, `createHolster`, `createMagazine`, `createLongGun`, `createClub`, `createSword`, `createShield`, `createArmour`, `createPolearm`, `createProjectile`, `createBow`, `createCannon`, `createSiegeEngine`, `createPell`, `createWeaponLoop`, `createWeaponRack` |
| `/gym` | `createBarbell`, `createDumbbell`, `createKettlebell`, `createBench`, `createPullUpBar`, `createParallelBars`, `createPlyoBox`, `createRack`, `createSled`, `createRowingMachine`, `createExerciseBike`, `createExerciseMat`, `createJumpRope`, `createRing`, `createBoxingGlove`, `createHeavyBag` |
| `/sport` | `createVaultingPole`, `createHighJump`, `createLandingMat`, `createVaultingTable`, `createBall`, `createRacket`, `createGolfClub`, `createGlove`, `createJavelin`, `createShot`, `createDiscus`, `createHammerThrow`, `createHurdle`, `createStartingBlock`, `createRelayBaton`, `createPoolEdge`, `createGoal`, `createStick`, `createCue`, `createCueTable`, `createSurfboard`, `createSki`, `createSkateboard`, `createKendoArmour` |
| `/music` | `createInstrument`, `createMicrophone` |
| `/nature` | `createFireRing`, `createRock`, `createTent`, `createTree` |

Each producer's JSDoc states how the thing stands in its own space, and its namespace lists its kinds, affordance ids, dimensions and bands (`createSeat.BANDS`).

### Environments

Import place builders from `@automovie/archetypes/environments`. Give each placed item a local name, a module to build, and its position or a named attachment. The environment supplies the set and walkable space to the shot program, and the models, props, world design and object motions to the compile runtime.

```ts
import { createEnvironment, createTerrain } from "@automovie/archetypes/environments";

const park = createEnvironment({
  id: "park",
  seed: 7,
  items: {
    ground: {
      use: createTerrain({ size: [28, 18] }),
      at: { x: -14, y: 0, z: -9 },
    },
  },
});
```

Add buildings, furnished rooms and rides as named items. Resolve a motion target through the item's named frame, such as a door's threshold or a chair's seat. Spread `park.stage` into the shot's stage and `park.runtime` into the runtime passed to `compileDefinedShot`. The shot retains its own camera, cast and choreography.

In the production's set source, resize a room by editing its `[x, z, width, depth]` rectangle in local metres. Move a named entrance with its `offset` in metres along the selected wall. An action can target the `seat` affordance on the placed prop `park/cafe/table-1/chair-near`. If an attachment target is missing, check the item, level and local name against `park.anchors`. If a bridge between named openings is refused, align the span perpendicular to both walls and fit its width to the narrower clear opening.

### Articulation

A door's leaf, a drawer, a lever, a suitcase's handle and a bicycle's crank are parts bound to an articulation affordance (`hinge`, `slider`, `knob`, `button`, `trigger`, `crank`, `wheel`, `pedal`). `archetype.articulate({ id: travel })` returns the archetype with those parts, and every contact that rides them, moved; the travel is degrees for a turning kind and metres otherwise, and a travel outside the articulation's range is refused.

An articulation may follow another (`follows`): a car's front road wheels steer as its steering wheel turns. A state names the leader unless the coupling explicitly permits reversible input. A reversible coupling accepts either coordinate, but naming both coordinates of the same degree of freedom is refused. `archetype.travel(id)` reads any articulation's travel, a follower's included. A span (`ArchetypeBuilder.span`) is a straight line between two moving frames, laid again after every pose; `archetype.span(id)` gives its ends and whether it is slack.

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

### Animals and their source limits

`createQuadruped` accepts `horse`, `pony`, `mule`, `donkey`, `ox`, `camel`, `dog` and `deer`. The equids keep their existing producers. The other kinds are coarse whole-cohort references: the new ox, dromedary and sika profiles preserve their source height/girth pairs and label transferred limb data and constructed shapes. Fixed cohort means do not establish population variation. Dog, ox and camel require authored whole-model mass; a bare deer may use its cited cohort mean. Adding a deer lead requires explicit complete mass.

The optional lead uses explicitly supplied collar and rope dimensions. Oxen can wear an authored yoke and camel/ox references can carry an authored side pack. `QuadrupedEquipment` builds their actual bars, pads and U hooks with `hitch`, `leftLoad` and `rightLoad` contacts, admitting fit against the real rest rig. The caller supplies the complete body-plus-equipment mass; these coarse assemblies make no manufacturer or safe-load claim.

`QuadrupedSkeleton.of(animal)` gives the actual links as an `IAutoMovieArticulatedRig` in the closed quadruped vocabulary. `prepareArticulatedRig` supplies generic rigid FK. `QuadrupedSkeleton.pose` moves actual parts and contacts through explicit carrier maps, preserving the original model. The humanoid bone vocabulary is unchanged.

The dog table includes a measured walking interval and two faster experimental points transferred from another breed. The three new species have measured walking points. Missing faster clocks are authoring inputs: `QuadrupedLocomotion.camel({ pace })` adds a lateral pace, while `QuadrupedLocomotion.deer({ trot, gallop })` adds diagonal trot and rotary gallop. Each clock row requires `speed`, `stride`, `foreStance` and `hindStance` in metres/seconds. Pass the resulting table as the fourth argument of `rideQuadruped(animal, course, gait, table)`. Measured timing, constructed full phases, pose proxies and authored transitions remain distinct in the table owners' documentation.

`QuadrupedRest(animal, params)` plans authored lowering, a supported sternal hold and rising. Its typed plan requires a level floor, durations, rest pitch, tail/distal carriage, phase windows and complete accessory/contact carriers. Samples return actual generic-FK geometry, goals and floor-clearance observations, refusing unreachable or penetrating poses. The law provides geometric support and rolling foot clearance; the greyhound study does not establish other species' dynamics or side rolling.

`EquineJointLimits` retains cited clinical mean/SD observations and their exact acquisition conventions. `EquineGoniometry.measure` measures three explicitly acquired landmarks in an explicitly oriented plane and compares them with one selected study. Coarse bar endpoints are not automatically clinical markers. Anatomical local admission limits remain unknown where the published measurements cannot establish them; means and standard deviations are not hard limits.

### Mass and colliders

`archetype.body` carries the mass and the centre of mass, `archetype.properties.inertia` the inertia about it, and `archetype.moment(point, direction)` the moment about a line. `archetype.shapes()` gives one collider per solid primitive or declared convex cell. A producer can use separate solid parts for contact while visual meshes supply details such as racket strings or net twine.

## Inspection

The archetypes are inspected with AutoMovie's shared instrument. `src/executable/subjects.ts` is a draw-only subject module: subjects that each hold every kind of a few related producers set along a diagonal (`seats`, `drinkware`, `small-props`, `doors`, `vehicles`, ...), `articulated` with the opened and drawn states, and one subject per ride (`ride-car`, `ride-horse-trot`, ...). From this folder, `pnpm capture` runs `automovie capture` on it for stills and contact sheets and `pnpm inspect` opens the inspector page; both take the request keys the [`render` README](../render/README.md#request-keys) lists.

Animal subjects include `animal-skeleton`, `reference-quadrupeds`, `equipped-quadrupeds`, measured walks, dog trot/gallop, explicitly authored camel pace/deer faster gaits and the canonical resting cycle. These are actual public producer/ride consumers; a completed capture is evidence only after its pictures and recorded conditions have been inspected.

```bash
pnpm capture --subject seats --views "three-quarter@focus=set/seat-office;right@ortho@focus=set/seat-office" --marks "affordance/*"
```

Each archetype's object is named after its catalog entry under the group `set`, such as `set/seat-dining`, and its parts by their ids, so a view with `@focus=set/seat-office` frames one archetype of a subject. Its affordances are marks of the kinds `affordance/<kind>`, an arrow out of each contact with the outline of its extent.
