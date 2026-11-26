# Ear pieces

Each side is an auricle carrier with four ridge sources and a conchal cutter. `AutoMovieHumanHeadEarParts` returns their original views and explicit parents. Composer lofts them through the engine, and `AutoMovieHumanHeadTree` nests the ridge merges and concha difference inside the auricle before merging that subtree onto `head.mass`.

## Current construction tree

| Part on each side | Parent | Operation | Defining source |
| --- | --- | --- | --- |
| `auricle.<side>` | `head.mass` | merge | tilted measurement chord carried by horizontal world-Y sections |
| `ear.helix.<side>` | `auricle.<side>` | merge | six-point curved rim course with retained breadth-scaled ridge sections |
| `ear.antihelix.<side>` | `auricle.<side>` | merge | three-point internal course ending at the regular fork |
| `ear.crus.superior.<side>` | `auricle.<side>` | merge | upper three-point course starting at that fork |
| `ear.crus.inferior.<side>` | `auricle.<side>` | merge | anterior three-point course starting at that fork |
| `ear.concha.<side>` | `auricle.<side>` | diff | closed inward Dome operand with an oval rim and sunk stem |

The composer preserves the authoritative metre declaration and its evaluated part. Named sites are read from those emitted source stations. Recomputing a station independently after unit conversion can read an interior cap point instead of the named endpoint.

## Measurements and frame

The orientation site is the selected tragion height on the identical head mass's original side guide. Its analytic derivative defines the retained side-outline normal convention. The measurement chord leans back 17.5 degrees from vertical in that tangent plane, following the adopted 15 to 20 degree surgical orientation range. This is a construction convention; the tangent is not an individually measured scalp normal. The above-tragion height uses the retained ANSUR regression through `AutoMovieHumanEarPlace`; its protocol transfer to these ear landmarks remains a separate assumption.

Superaurale and subaurale close the public sa-sba length and selected endpoint heights. Their tilted chord does not prescribe the section planes. The plate uses horizontal world-Y planes with X/Z drift, so each section stays at its authored height while the endpoints preserve the long chord.

Public `IAutoMovieHumanEar.breadth` is Cho's c-j distance, from otobasion superius c to posterior helix j, perpendicular to sa-sba. The two sites occupy distinct height stations. This input is neither a horizontal section diameter nor maximum pra-pa breadth. The c site lies on the actual head-source section. Protrusion closes between the tragal rim and another actual scalp point along the declared world-lateral direction at tragion height. Cho's scalp distances do not prescribe that world direction. Each side uses its own supplied length, breadth and protrusion.

The plate's signed section halves include its retained rim thickness and inward carrier allowance. They describe the carrier volume, rather than a measured cartilage thickness or the native ear's complete exterior. Population measurements and geometric conventions remain distinct in the [Cho](../sources/cho-2025-korean-ear.md), [Banks and Cheney](../sources/banks-cheney-otoplasty.md) and [Zhu](../sources/zhu-2017-auricular-concha.md) notes.

## Ridges and concha

The helix course follows the plate's attachment, top and posterior sites. Its centreline is offset inward by the existing circular section radius. A solve through the engine's natural source and its critical heights bounds the upper centreline at the selected top minus that radius. It introduces no mesh fit or extra clearance. This bound and the original guide observations do not certify the whole joined outer-ear envelope.

The antihelix and crura use retained breadth/31 offsets and their own curved axes. All three courses share a regular fork site with positive transverse supports. Each declared port extends by the existing largest half extent before its hidden closing pole. The extension is an overlap convention, with no additional anatomical radius or guarantee that a merge succeeds.

Concha length and breadth use Cho's distinct g-h and b-k reference means; depth uses Zhu's rim-plane-to-floor means. The female left/right values remain population means, rather than f1 individual observations or a sex-specific law for all adults. The long direction is projected into the plate's own rim plane. Oval interpolation, rim seat and breadth-scaled placement are explicit modelling conventions. The Dome extends inward from a stem outside the nominal rim. Displaying this positive closed operand does not show a subtracted cavity, an ear canal or lining.

## Verification and consumer boundary

Inspect every emitted outline and axis, every available raw `top.<k>` ring, and selected neighbours over the native reference. A top camera does not establish that a top source was selected. Original section planes belong to their own source frame; an edge-on projection needs another camera. An observation count establishes coverage only. Input acceptance also needs a reason for every difference, absence or malformed curve.

The f1 source decisions and exact matched ids are recorded in the [head log](../work/log-head.md). The current source question independently checks named sa-sba/c-j/scalp endpoints, declared heights, sampled signed guide/plane bounds and positive shared fork supports. Those checks do not prove continuous whole-source containment, clinical contact or a successful merge/diff.

`head.parts:parts` reads the actual composed `placed.loft.chain` records through `HumanDebugChainLoft`, production `AutoMovieHumanBodyConstruction` and `AutoMovieHumanBodySurface`. Its section/axis/guide pass and matching surface passes are genuine prejoin observations. They establish neither ordinary publication after tree realization nor complete native cap fidelity.

The current cap consumers leave two separate debts. Engine ViewLoft removes zero-extent tips from the regular principal layers and publishes the two closing points as `pole` and `opposite`. Human `BodySurfaceLoft` can then remove the first or last positive regular ring again, while `BodySurfacePoles` reads only `pole` and otherwise falls back to calibration or the coefficient-mean axis. This explains why a finite regular loft net can coexist with an extended fan or a different closure point.

The lower-level `LoftViewRead.values` and `LoftSectionNative.phase` readers can evaluate local cap interiors with positive extents and valid conic geometry from the original source. The public world `point`/`sampler`/`phaseSampler` route separately calls `LoftSection.owner` and `LoftChain.bracket`, which rejects stations outside the retained principal interval beyond its existing 1e-9 mm boundary allowance. Reuse the existing local cap reader with the actual source frame and ownership; its local availability is not a successful world query or evidence that a particular head cap station was executed in this round.

At a true all-zero pole, the native phase path still requires positive extents and curvatures and has no separate zero-point branch. Physical station2 separately requires the original scalar station jets; singular or unavailable jets remain explicit failures. The closing-point descriptors supply world points but no original tip station or pole chart. The minimum repair must preserve positive regular rings and both supplied endpoints, connect the existing local cap reader through the correct world frame and active ownership, and settle the required zero-point/chart behavior. A new local cap equation is unnecessary. `SolidChain.surface.domain` also remains the regular interval, and its outside Cartesian Taylor is not native cap replay. Defining-curve distortion, invented caps and zero-filled derivatives cannot establish cap fidelity.

## Remaining anatomy and historical design

Tragus, antitragus, canal trim and lining remain unbuilt requirements. The earlier appendage-root strip on `head.middle`, event-split ridges, separate lobe chain and seam checks describe a historical design. They are not the current source tree or evidence that its joins are implemented. Current acceptance must follow the actual tree, original inputs, prejoin lofts and realized output separately.
