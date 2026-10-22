# Ear

Values retain their cited population and protocol. They constrain an ear only where the reference observation is missing; they are not generator defaults.

## Parts

From Gray 1918 ([gray-1918](../sources/gray-1918.md)), established account.

- One plate of fibrocartilage under thin adherent skin, ovoid with the larger end up; the lateral surface is concave and faces slightly forward.
- The helix is the curled outer rim. The antihelix runs inside it and divides above into two crura around the fossa triangularis; the scapha is the groove between helix and antihelix.
- The concha is the deep bowl in front of the antihelix, split by the crus of the helix into the cymba above and the cavum below; the external acoustic meatus opens from the cavum.
- The tragus projects over the meatus from the front; the antitragus faces it across the intertragic notch.
- The lobule hangs below the cartilage and has none.

## Size and placement

| Quantity | Value | Source |
| --- | --- | --- |
| Ear length, women (L / R) | 64.5 / 64.5 mm (SD 10.1 / 9.4) | [Cho 2025](../sources/cho-2025-korean-ear.md), measured CT |
| Ear width, women | 27.5 / 27.3 mm | Cho 2025 |
| Conchal length / width, women | 27.0 / 18.2 mm | Cho 2025 |
| Protrusion at superaurale / tragal level, women | 8.3 / 17.3 mm | Cho 2025 |
| Lobular length, women | 23.5 mm | Cho 2025 |
| Width / length | about 0.55 | [Banks and Cheney](../sources/banks-cheney-otoplasty.md), conventional |
| Long axis | 15 to 20 degrees posterior to vertical | Banks and Cheney |
| Auriculocephalic angle | 25 to 35 degrees | Banks and Cheney |
| Protrusion top / middle / bottom | 10-12 / 16-18 / 20-22 mm | Banks and Cheney |
| Vertical placement | top at the lateral brow, lobule bottom at subnasale | Banks and Cheney |

Protrusion grows from the top of the auricle to its lower helix in both sources, so the groove behind the ear (the cranioauricular sulcus) is shallowest above and deepest behind the concha.

## Horizontal sections

Horizontal cuts of the f1 reference head at 0.5 mm spacing (`test/.shots/f1/ear-observations/horizontal-v1.json`), the plane family of the body loft, pass from bottom to top through:

1. the free lobule, a separate loop below the lowest attachment (otobasion inferius);
2. the attached auricle, one outline with the head: a finger-shaped stem leaving the scalp at the auriculocephalic angle, then the concha bowl, tragus and antitragus in front and the helix hook at its tip, with the sulcus behind as an acute notch;
3. the free upper helix above the highest attachment (otobasion superius), first a hook, then, where the helix rolls over the scapha, a loop around a small closed pocket, then a single loop up to superaurale.

These are topology events of the section family: a merge at the lobule, a split at the upper attachment, and a pocket opening and closing under the helix roll.
