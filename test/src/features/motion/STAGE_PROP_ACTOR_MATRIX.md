# Stage prop actor matrix

[#3835](https://github.com/samchon/automovie/issues/3835) crosses the inert screen props with the contacts an actor holds or wears them by. [#3716](https://github.com/samchon/automovie/issues/3716) adds the period firearms, the fitted bayonet and the casing. [#3863](https://github.com/samchon/automovie/issues/3863) qualifies the pole-blade display marks. The checks run on the polygon actor and the emitted models of the same build.

## Casts and conditions

Every held and worn cell runs on the surveyed `f-small` and `m-average` bodies from `motionHumanBody`, each standing at the origin facing `+Z`. A held prop starts upright 0.35 m ahead and 0.25 m to the right, its contact about 0.95 m above the floor, or on the floor when the contact is higher. Each cell uses one fixed performance seed.

## Held cells

The right hand takes each variant by the contact named below, then stands still for 0.4 s. Through the stand, the contact keeps its frame in the hand within 1 mm and 1°. Midway through, the hand's posed colliders are within 10 mm of the prop's colliders. The prop does not move before the pickup, and the hold starts only after the pickup ends.

| Producer | Variants | Contact |
| --- | --- | --- |
| `createStageWeaponProp` | mace, pike, shuo, halberd, offset hammer, linked | `grip` |
| `createStageWeaponProp` | long, crescent, side and serpent blades | `grip-lower` |
| `createStageFencingProp` | foil, épée, sabre | `grip` |
| `createStageHandBowProp` | longbow, recurve, horse bow | `grip` |
| `createStageShaftToken` | arrow, bolt | `shaft` |
| `createStagePracticeSwordProp`, `createStageTwoHandedSwordProp`, `createStageStockBowProp` | one each | `grip` |
| `createStageBallProp`, `createStageRoundProp`, `createStageGrenadeProp`, `createStageStoneProp` | one each | `body` |
| `createStageCartridgeProp`, `createStageCasing` | one each | `grip` |
| `createStageBayonet` | fitted to a musket | `handle` |

## Paired, worn and transferred cells

Two `m-average` performers stand 1.3 m apart, and each holds a padded longsword by its grip. Neither blade comes within 50 mm of the partner's posed colliders.

The stage holster, sheath, quiver, pouch, fitted carrier, open helmet and vambrace ride their bones through a 1 m walk, at the start, midpoint and end. The costume binds through `assembleCostumeArmour`. A slung percussion rifle rides the hips until the right hand takes its grip, then keeps the grip's frame in the hand.

## Refused cells

| Case | Expected refusal |
| --- | --- |
| Take a padded longsword by a `pommel` it lacks | `affordance` |
| Take a longsword placed 2.5 m ahead | `reach` |
| Fit a foil in the fitted carrier | `display` |
| Put a gauntlet in the head slot | `slot` |

## Display marks

Each pole-blade profile is carried through the public figure-eight beat by `grip-lower` in the right hand and `grip-upper` in the left. Both hands stay within 10 mm of the shaft, and the lead hand stays within its grip's handle length. The support hand may slide along the shaft, as a figure-eight's guiding hand does. The tip stands at least 30 mm from the other marks, and the side blade's `side-edge` at least 30 mm from its edge. The edge and its `rear` are at least 10 mm apart and face opposite ways.

## Firearm attachments

A bayonet seated on an upright fixed musket is lifted off along the bore, held clear of the muzzle by more than its socket's length, and returned through `bayonetEntry` to the seat. Its socket meets the seat within 1 mm and 1° at the start and the end.

## Provenance and provisional choices

| Model | Read | Provisional |
| --- | --- | --- |
| `createStageMatchlock` | DIA 53.220, German, late 16th century: 114 cm overall, 81.1 cm barrel, 14.2 by 7.1 cm stock | mass, barrel radius, length of pull |
| `createStagePercussionRifle` | Met 1974.10, Carl Stiegele, ca. 1865: 110.2 cm, 70.2 cm barrel, .45 calibre, 3657.1 g | stock depth and width, barrel wall, length of pull |
| `createStageCasing` | .30-06 case length, base, rim and neck diameters | neck length, empty mass |
| `createStageBayonet` | socket bore from the generated musket's barrel | blade, socket, crank and wall lengths |

The modern support arms are the existing `createLongGun` models: Colt's carbines and the M1903 and Kar 98k bolt rifles. No further modern profile is added. The Smithsonian's socket-bayonet scabbard record (NMAH 1050670) refused automated reading on 2026-11-21. The bayonet's lengths remain estimates until a measured record is read. No reference-view overlay or side and three-quarter camera comparison was made, because this campaign verifies with numerical tests only. The silhouettes are identified by their measured lengths and lock parts. Each model is exterior geometry with no working mechanism.

## Run

```powershell
pnpm test:esbuild --include test_motion_stage_fight_stage_prop_matrix test_motion_stage_fight_stage_polearm_marks test_archetype_stage_firearm_attachments
```
