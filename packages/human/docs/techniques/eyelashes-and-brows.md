# Eyelashes and brows

Lashes are strand geometry, not cards: a thin tube per hair reads correctly from every direction, needs no opacity texture and costs a few thousand triangles per eye. Brows are, for now, colour painted into the skin's texture; strand brows come later. Both are placed by rule from the generated eye, so they follow any lid or brow ridge the body generator makes. The rules relay [anatomy/hair.md](../anatomy/hair.md).

## Lashes

`AutoMovieHumanEyelash` roots the lashes on the anterior lid surface just outside the anterior edge of `AutoMovieHumanEyelid`, in three staggered rows on the upper lid and two on the lower: 150 upper lashes from 16 to 98 percent of the lid from the medial canthus and 45 lower ones from 30 to 94 percent. The upper count lies in the measured 90 to 160; the lower count is below the measured 75 to 80 so the fine lower lashes do not read as a fence at render scale.

The input `length` is the longest upper lash. Length peaks about 60 percent along the lid and falls to half medially; lower lashes are 30 percent of the upper. Every lash curves from the bulb: upper lashes leave slightly below the line of sight and turn up by about 78 degrees, lower lashes turn down by about 50, so the two never interlace. Lashes splay toward the nose and the temple along the lid, and groups of four to six pull their tips a third of the way together, as real lashes clump. Tubes taper from 0.11 mm to 0.016 mm.

## Brows

`AutoMovieHumanEyebrowPlacement` lays the brow out in the face plane from the eye's canthi. The middle line passes at the upper-margin heights of Park 2017 (26.4, 31.0, 28.4 and 21.6 mm above the medial canthus at the medial canthus, lateral limbus, lateral canthus and lateral end) less half the width there. The brow runs from 1 mm medial of the medial canthus to 9 mm beyond the lateral canthus, and its width swells from 3.5 mm at the rounded medial start to 9 mm above the medial canthus and falls through 6.5 mm at the peak to 2 mm at the tail.

`AutoMovieHumanEyebrowTone` paints it, as the brow's hair colour with a coverage, into an image over the head skin's chart layout, which the skin material lays over its own colour where it covers (a `replace` overlay); no hair geometry is made. A skin point's place in the face plane gives its position along the brow and across it; its coverage is the input `density` (0.85 when omitted) times the brow's density laws: fading in over the head's first fifth, rising to a third of the length, thinning toward the tail and fading over the last tenth, with a noisy border so the brow is not a stencil. The input `thickness` scales the width (1 when omitted). Only skin in front of the eye's globe centre and facing forward is painted. The image's texels are 0.2 mm of the chart layout.

## Limits

- Heights come from young Korean women; brows do not respond to sex, age or the femininity control.
- Lashes take only the input colour and length; brows take colour, thickness and density. There is no grey input.
- A brow has no hair direction or relief: it is colour only.
