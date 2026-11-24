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

A producer's affordance ids and dimension names are closed types, so a misspelt one fails the type check. A request a producer cannot honour throws an `AutoMovieArchetypeRefusal` whose fields name the axis at fault and what would have been accepted: a dimension outside its band gives the band, and an affordance the variant lacks gives the ids it has.

An archetype serialises as a plain model. Retain that serialised data when the model data produced by an earlier revision must be preserved. Its accessors (`affordance`, `site`, `articulate`, `travel`, `span`, `placed`, `shapes`, `moment`, `dimensions`, `properties`) are not part of the serialised data.

## Entry points

Each family is also a subpath, such as `@automovie/archetypes/furniture`. Select a producer by the vehicle, instrument, fixture or prop the scene places. For example, `createRowboat` exposes its oar frames, `createUprightPiano` its keys and pedal, `createDrawerUnit` its sliding contacts, and `createPaper({ format: "foldedMap" })` its fold sites.

| Subpath | Selected producers |
| --- | --- |
| `/props` | `createPhone`, `createCamera`, `createRemote`, `createTablet`, `createRadio`, `createDesktopKeyboard`, `createLaptop`, `createPaper`, `createPen`, `createHat`, `createHammer`, `createScrewdriver`, `createCane`, `createWalker`, `createCookingPot`, `createCarryBasket`, `createCandle`, `createPendantLamp`, `createCargoPod` |
| `/furniture` | `createSeat`, `createPlatformBed`, `createGurney`, `createCrib`, `createTable`, `createBookcase`, `createHingedCabinet`, `createDrawerUnit`, `createSafe`, `createShowcase` |
| `/architecture` | `createDoor`, `createWindow`, `createStairs`, `createRamp`, `createRefrigerator`, `createRange`, `createWashingMachine`, `createVendingMachine`, `createWashbasin`, `createBathtub`, `createFireHydrant`, `createBollard`, `createJerseyBarrier`, `createRopeStanchions` |
| `/vehicles` | `createCar`, `createBicycle`, `createMotorcycle`, `createShoppingTrolley`, `createWheelbarrow`, `createRickshaw`, `createHorseCart`, `createRowboat`, `createCanoe`, `createPullingBoat`, `driveCar`, `rideBicycle`, `rideMotorcycle`, `rideWheelchair`, `rowBoat` |
| `/animals` | `createHorse`, `createPony`, `createDonkey`, `createMule`, `createFoal`, `createDog`, `createCat`, `createOx`, `createCamel`, `createDeer`, shared body and rig `AutoMovieArchetypeQuadrupedBody` and `AutoMovieArchetypeQuadrupedSkeleton`, equipment, `rideQuadruped` and `rideHorse`, gait tables, `AutoMovieArchetypeQuadrupedRest`, and `AutoMovieArchetypeEquineGoniometry` |
| `/weapons` | `createHandgun`, `createStageHolster`, `createStageBladeCarrier`, `createStageQuiver`, `createPracticeBaton`, `createCostumeHelmet`, `createCostumeCuirass`, `assembleCostumeArmour`, `createSword`, `createShield`, `createPell` |
| `/gym` | `createBarbell`, `createDumbbell`, `createKettlebell`, `createBench`, `createPullUpBar`, `createParallelBars`, `createPlyoBox`, `createRack`, `createSled`, `createRowingMachine`, `createExerciseBike`, `createExerciseMat`, `createJumpRope`, `createRing`, `createBoxingGlove`, `createHeavyBag` |
| `/sport` | `createSphericalBall`, `createOvalBall`, `createPuck`, `createFieldGoal`, `createBasketballHoop`, `createVolleyballNet`, `createTennisNet`, `createIceHockeyStick`, `createFieldHockeyStick`, `createLacrosseCrosse`, `createCricketBat`, `createBaseballBat`, `createRacket`, `createCueTable`, `createKendoArmour` |
| `/music` | `createUprightPiano`, `createGuitar`, `createViolin`, `createSideDrum`, `createBugle`, `createMicrophone` |
| `/nature` | `createFireRing`, `createRock`, `createTent`, `createTree` |

Each producer's JSDoc describes its frame and inputs. Its companion types name the supported contacts. A producer that uses bands documents them in its source records.

Existing dispatcher names continue to read saved recipes with their original `kind`, dimensions and seed. For example, `createDevice({ kind: "camera" }, seed)` selects the same camera as `createCamera({}, seed)`. The gallery opens old addresses at the corresponding named producer and retains the selected shape or format and view state.

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

Add buildings, furnished rooms and rides as named items. Furnish a room with a kit: `createCafeKit`, `createGymKit`, `createLivingRoomKit`, `createBedroomKit`, `createKitchenKit` or `createOfficeKit`. Each kit's JSDoc names its roles and the clearances it reserves, with their sources. For any other room, `createFurnishedRoom` places pieces against a wall, after an earlier piece along the same wall, facing an earlier piece, or at a position, and keeps floor clear in front of or beside each one. Resolve a motion target through the item's named frame, such as a door's threshold or a chair's seat. Spread `park.stage` into the shot's stage and `park.runtime` into the runtime passed to `compileDefinedShot`. The shot retains its own camera, cast and choreography.

In the production's set source, resize a room by editing its `[x, z, width, depth]` rectangle in local metres. Move a named entrance with its `offset` in metres along the selected wall. An action can target the `seat` affordance on the placed prop `park/cafe/table-1/chair-near`. If an attachment target is missing, check the item, level and local name against `park.anchors`. If a bridge between named openings is refused, align the span perpendicular to both walls and fit its width to the narrower clear opening.

### Articulation

A door's leaf, a drawer, a lever, a suitcase's handle and a bicycle's crank are parts bound to an articulation affordance (`hinge`, `slider`, `knob`, `button`, `trigger`, `crank`, `wheel`, `pedal`). `archetype.articulate({ id: travel })` returns the archetype with those parts, and every contact that rides them, moved; the travel is degrees for a turning kind and metres otherwise, and a travel outside the articulation's range is refused.

An articulation may follow another (`follows`): a car's front road wheels steer as its steering wheel turns. A state names the leader unless the coupling explicitly permits reversible input. A reversible coupling accepts either coordinate, but naming both coordinates of the same degree of freedom is refused. `archetype.travel(id)` reads any articulation's travel, a follower's included. A span (`AutoMovieArchetypeBuilder.span`) is a straight line between two moving frames, laid again after every pose; `archetype.span(id)` gives its ends and whether it is slack.

### Assemblies

`AutoMovieArchetypeAssembly.of(id, name, { key: { archetype, placement } })` composes placed archetypes into one, which rides, seats and serialises like any archetype. A member's ids are read under its key: the seat of the member `bench2` is `bench2/seat`, and its door's hinge `door/hinge` in `articulate`. `assembly.couple(follower, { id: leader, ratio })` makes an articulation of one member follow another's, and `assembly.member(key)` gives a member as posed, with its own typed accessors. An assembly is composed in a production's source; the package ships none.

### Moving supports

A ride moves an archetype along a course of straight legs and turns, from rest to a cruising speed and back to rest. A course may also mark a speed at each leg's end (`speeds`, 0 for a stop, with a `pause` there), start or end moving (`startSpeed`, `endSpeed`), begin at a film second (`at`), climb or descend a leg (`rise`) and back along one (`reverse`); `AutoMovieArchetypeCourse.timed(name, samples)` plans a path through points at given seconds instead.

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

`rideBicycle` turns the crank by the distance covered and leans the bicycle into turns, `rideMotorcycle` leans, and `rideHorse` steps the horse's limbs through a walk, trot, canter or gallop and names every hoof's landing. `AutoMovieArchetypeRide.along` moves any archetype, such as a trolley, unchanged.

### Animals and their source limits

The equids (`createHorse`, `createPony`, `createDonkey`, `createMule`, `createFoal`) share one model, `AutoMovieArchetypeEquine`: one build, tack set, dimension set and mass law. `createQuadruped` also accepts `ox`, `camel`, `dog` and `deer`. Each of these is one measured reference: its height and girth come from the cited cohort, and limb data transferred from another species or shapes built without a source are labelled as such. A reference is a cohort mean, so the seed does not vary it the way it varies a band. Dog, ox and camel need the whole-model mass from the author; a bare deer may take its cited cohort mean.

Equipment is authored: a lead from its collar and rope dimensions, an ox yoke and a camel or ox side pack (`AutoMovieArchetypeQuadrupedEquipment`), with `hitch`, `leftLoad` and `rightLoad` contacts fitted against the rest rig. The author supplies the body-plus-equipment mass, and the coarse assemblies claim no maker dimension or load rating.

`AutoMovieArchetypeQuadrupedSkeleton.of(animal)` gives the links as an `IAutoMovieArticulatedRig` in the quadruped bone vocabulary, which `prepareArticulatedRig` poses by rigid forward kinematics. `AutoMovieArchetypeQuadrupedSkeleton.pose` moves the parts and their contacts and leaves the original model unchanged.

The dog, ox, camel and deer gait tables hold a measured walk; the dog's two faster points are transferred from another breed. A gait with no measured clock is an authoring input: `AutoMovieArchetypeQuadrupedLocomotion.camel({ pace })` and `AutoMovieArchetypeQuadrupedLocomotion.deer({ trot, gallop })` take `speed`, `stride`, `foreStance` and `hindStance` (metres and seconds) and return a table for `rideQuadruped(animal, course, gait, table)`. Each table's source documents which values are measured and which are built or authored.

`AutoMovieArchetypeQuadrupedRest(animal, params)` plans lying down, a sternal rest and rising on a level floor from authored durations and carriage, and refuses an unreachable or floor-penetrating pose. Its support law comes from a greyhound study, which establishes no other species' dynamics and no side roll.

`AutoMovieArchetypeEquineJointLimits` keeps cited clinical joint-angle means and standard deviations with their acquisition conventions, and `AutoMovieArchetypeEquineGoniometry.measure` compares three landmarks in a stated plane with one study. A coarse bar end is not a clinical marker, and a mean and its deviation are observations, not hard limits.

### Mass and colliders

`archetype.body` carries the mass and the centre of mass, `archetype.properties.inertia` the inertia about it, and `archetype.moment(point, direction)` the moment about a line. `archetype.shapes()` gives one collider per solid primitive or declared convex cell. A producer can use separate solid parts for contact while visual meshes supply details such as racket strings or net twine.

## Inspection

The archetypes are inspected with AutoMovie's shared instrument. `src/executable/subjects.ts` is a draw-only subject module: subjects that each hold every kind of a few related producers set along a diagonal (`seats`, `drinkware`, `small-props`, `doors`, `vehicles`, ...), `articulated` with the opened and drawn states, and one subject per ride (`ride-car`, `ride-horse-trot`, ...). From this folder, `pnpm capture` runs `automovie capture` on it for stills and contact sheets and `pnpm inspect` opens the inspector page; both take the request keys the [`render` README](../render/README.md#request-keys) lists.

Animal subjects include `animal-skeleton`, `reference-quadrupeds`, `equipped-quadrupeds`, the measured walks, the dog's trot and gallop, the authored camel pace and deer gaits, and the resting cycle. A capture is evidence only after its pictures and recorded conditions have been inspected.

```bash
pnpm capture --subject seats --views "three-quarter@focus=set/seat-office;right@ortho@focus=set/seat-office" --marks "affordance/*"
```

Each archetype's object is named after its catalog entry under the group `set`, such as `set/seat-dining`, and its parts by their ids, so a view with `@focus=set/seat-office` frames one archetype of a subject. Its affordances are marks of the kinds `affordance/<kind>`, an arrow out of each contact with the outline of its extent.
