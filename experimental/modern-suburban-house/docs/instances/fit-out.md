# Fit-out population

## Ground-floor fit-out {#ground-floor-fit-out}

The living-room population is the sofa element `living/sofa`, two armchairs `living/armchair` and `living/armchair-two`, coffee table `living/coffee-table`, fireplace `living/fireplace`, bookcase `living/bookcase`, rug `living/rug`, and plant `living/plant`. The continuous kitchen-dining-family room contains the multi-part kitchen element `kitchen/cabinets`, refrigerator `kitchen/refrigerator`, range `kitchen/range`, hood `kitchen/hood`, island stools `kitchen/island-stool-one`, `kitchen/island-stool-two`, and `kitchen/island-stool-three`, dining table `dining/table` with six dining-chair elements, family sofa `family/sofa`, low table `family/low-table`, rug `family/rug`, plant `family/plant`, and media console `family/media-console`.

The service band contains pantry shelves `pantry/shelves`, powder vanity `powder/vanity`, hand basin `powder/hand-basin`, mirror `powder/mirror`, and toilet `powder/toilet`; mudroom bench `mudroom/bench`, shoe storage `mudroom/shoe-storage`, utility sink `mudroom/utility-sink`, hooks `mudroom/hooks`, and the combined washer/dryer blocking proxy `mudroom/laundry-pair`; and garage storage cabinets `garage/storage-cabinets` and deep shelf `garage/storage-shelf`. The garage is intentionally empty of cars and vehicle proxies. The laundry pair is one source element rather than two separately addressable appliance elements, so individual washer-versus-dryer identity is `unverified`.

## Upper-floor fit-out {#upper-floor-fit-out}

The bedroom loop emits `fitout/primary-bedroom/bed`, `fitout/primary-bedroom/nightstand`, `fitout/primary-bedroom/nightstand-two`, `fitout/primary-bedroom/dresser`, `fitout/primary-bedroom/closet`, and the corresponding `bed`, `nightstand`, `dresser`, and `closet` elements for `bedroom-two` and `bedroom-three`. The linen room uses `fitout/upper/hall-linen`.

Bathroom one uses `fitout/bathroom-one/vanity`, `fitout/bathroom-one/mirror`, `fitout/bathroom-one/toilet`, and `fitout/bathroom-one/shower`. The primary bath uses `fitout/primary-bath/vanity`, `fitout/primary-bath/mirror`, `fitout/primary-bath/toilet`, `fitout/primary-bath/shower`, and `fitout/primary-bath/tub`. The corridor remains the short upper-hall space from the stair landing; fit-out does not create another passage, room, or stair.

## Population and identity {#population-and-identity}

`furniture` is a multi-part element constructor and `simpleFurniture` is a one-box element constructor; neither is a serialized prototype registry. The stable identity is the literal element or part ID emitted by `src/house.ts`; each element carries its storey, room `spaceId`, surface owner, and bounded parts, while each part carries its material and semantic tags. Centers and sizes are authored in metres in the main-house frame, with upper-floor Y positions derived from `UPPER_ELEVATION`.

The population is deterministic: a static ground-floor list plus a fixed bedroom loop over three named room ids, with no random seed, traversal-dependent variation, LOD population, or orientation-variation system. Placement is an instance-layer decision and does not modify room boundaries, thresholds, connectors, or surface ownership. Materials and explicit source placement provide the ordinary family-home variation; orientation is not claimed as an independent variation mechanism. Sparse circulation and fixture placement are design intent, while complete geometric clearance and independent observer measurement remain `unverified` until the required review is performed.

## Review set and limits {#review-set-and-limits}

The neutral instance review set is the complete emitted fit-out population, grouped by its room bindings within the fifteen-space graph and checked against the source ID list above: living seating and accessories, kitchen appliances and stools, dining seating, family seating and media, service fixtures and storage, garage storage, the three bedroom groups, linen storage, and both bathroom groups. Review asks whether each named object has one stable source identity, one room binding, bounded geometry in the intended storey, and no role as a hidden route or second room. Renderer appearance, physical appliance construction, hidden HVAC, plumbing, drainage, electrical work, and measured clearance are `unverified` outside the authored blocking representation.
