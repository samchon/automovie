# src/vehicles/CartDrawn.ts#CartDrawn.cart

## @evidence contracts/development/common.md#meaningful-documentation

States what is built and where each place comes from.

## @evidence contracts/development/implementation.md#principled-implementation

The shafts hang level at the horse's tugs, which sit on the saddle pad at the middle of the barrel, so their height is the horse's back less its barrel's radius (`AutoMovieArchetypeEquine.rig`, the girth over two pi), and they run either side of the barrel, a barrel's width apart (the girth over pi; In Harness's 23 to 24 in at 15 to 16 hh agrees). The shafts' tips stand at the point of the horse's shoulder (the Carriage Association of America's fitting guidance, seen only in search results), so the tugs, and the `coupling` between them, stand `AutoMovieArchetypeEquine.SADDLE` behind the tips. The tips stand `shaftLength` ahead of the single tree, a read cart's own shafts or, unread, the horse's point of shoulder to its point of buttock and the drawn `clearance` behind it (`createCart`), so the single tree stands clear of the horse; the single tree stands `SINGLE_TREE` ahead of the axle. The floor rests on the axle and the seat stands over it at `seatHeight`. The single tree stands across the front at the points of draft's height and spread (`AutoMovieArchetypeEquine.rig`'s `draft`), so the traces run straight back from the collar; it hangs from a bar between the shafts. The driving lines' held runs, `leftLine` and `rightLine`, are each line's length behind its terret: `createCart.LINES`, IVC Carriage's 14 ft stock single-horse lines, less the line's run from the bit ring through the neck strap's ring to the terret (`EquineHarness.passes`), laid from the terret on the horse's saddle at the coupling toward the line's rest point, `createCart.REST`'s elbow height over the seat. Where along a run the hands hold is the driving act's choice, as a grasp chooses within its bound.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The horse's places, then the body, the shafts and the wheels.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts `SINGLE_TREE` is a named provisional value and the seat's height a band seen only in search results; the body's own boards, a construction no act reads, are sized from the track and the seat. The single tree's height, level with the points of draft so the traces run level, is a provisional value: the fitting guides read give the trace's angle to the hame, not the single tree's height; the lines' rest point over the seat is their rest geometry only, never where a hand is put.

## @evidence contracts/development/implementation.md#efficient-algorithms

About a dozen parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/vehicles/CartDrawn.ts#CartDrawn.rickshaw

## @evidence contracts/development/common.md#meaningful-documentation

States what is built and where each place comes from.

## @evidence contracts/development/implementation.md#principled-implementation

The shafts are held level at the standing runner's hanging hands, so they stand at `gripHeight`, the measured wrist's height; their tips are the rickshaw's front, `length` ahead of its wheels' rear; each grip is a `handle` along its shaft at the tip, and the `coupling` is the middle between the grips. The floor rests on the axle; the seat (`RICKSHAW_SEAT`, `RICKSHAW_SEAT_WIDTH`) stands over it, and the footboard ends `RICKSHAW_FOOTBOARD` ahead of the seat's front edge.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Body, shafts, wheels.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The seat's height and the shafts' spacing are named provisional values; the hood is not modelled.

## @evidence contracts/development/implementation.md#efficient-algorithms

About a dozen parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/vehicles/CartDrawn.ts#CartDrawn.chariot

## @evidence contracts/development/common.md#meaningful-documentation

States what is built and where each place comes from.

## @evidence contracts/development/implementation.md#principled-implementation

The floor, `floorWidth` across and `floorDepth` deep, rests on the axle at its rear edge, so its height is the wheel's radius; the siding rises `railHeight` round its front, its top the `rim` the crew holds. The pole runs `poleLength` from the axle up to the yoke, which sits on the pair's withers, so the yoke's height is the horse's `withersHeight`; the `coupling` is the pole's end at the yoke. The wheels have the six spokes of the Tutankhamun chariots.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Floor, siding, pole, wheels.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The D-shaped floor is a rectangle and the siding three panels; the floor's place on the axle is the chariots' arrangement as described, its boards a construction no act reads.

## @evidence contracts/development/implementation.md#efficient-algorithms

About a dozen parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
