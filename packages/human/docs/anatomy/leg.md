# Leg

Leg measurements apply to their own population, posture and protocol. Read the skeleton centres, skin landmarks and tape sites independently.

## Joint centres and stance

| Quantity | Basis |
| --- | --- |
| Hip centre | Hara et al. use leg length from the anterior superior iliac spine to the medial malleolus through the medial femoral epicondyle. Their lateral equation is `8 + 0.086 LL` mm from the pelvic midline. Recovering those bony landmarks from stature and skin controls is a separate transfer. [Hara 2016](../sources/hara-2016.md). |
| Knee centre | Read femoral and tibial alignment in the knee frame. A neutral knee on the straight hip-to-ankle line is a geometric stance convention. [Tang et al. on lower-limb alignment](../sources/tang-2000-lower-limb-alignment.md). |
| Ankle and foot | The lateral malleolus height locates a skin landmark. Use joint-centre and posture estimates according to their named frames. The quiet-stance study measures heel spacing and foot-axis angle as group observations. [McIlroy and Maki 1997](https://doi.org/10.1016/S0268-0033(96)00040-X). |

The older leg section API uses the measured quiet-stance heel separation for its baseline. Its centred rounds and fractional tape stations are geometric estimates. Individual tape inputs and the parent's join constrain the generated surface. [Leg prior](../../src/generation/AutoMovieHumanLegPrior.ts).

## Crotch height

ISO 8559-1 section 5.7.6 defines inside leg length as the vertical distance from the crotch to the outer ankle point. With both in the same standing frame, crotch height equals inseam plus lateral malleolus height. [ISO 8559-1](../sources/iso-8559-1-2017.md).

## Mid-patella and tapes

Locate mid-patella on the skin and the knee centre at the joint. Read thigh circumference just below the gluteal fold at the widest prescribed site. Locate the calf maximum and the minimum ankle circumference independently. Read each tape in its own posture. [ISO 8559-1](../sources/iso-8559-1-2017.md), [ANSUR II protocol](../sources/ansur-ii-handbook-foot-neck.md).

## Sections and joins

The leg sections follow the leg's own course from thigh to calf and ankle. The neighbouring surface supplies the boundary loop, and the adjacent leg guide leaves it with the shared boundary values and slopes. Inspect the anterior patella, popliteal fossa, calf belly, gluteal fold and transition into the ankle from their own directions. [Leg section laws](../../src/generation/leg/AutoMovieHumanLegLaws.ts), [Anatomical consistency](../testing/consistency.md).
