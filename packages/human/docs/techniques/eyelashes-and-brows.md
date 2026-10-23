# Eyelashes and brows

Lashes and brows are strand geometry, not cards: a thin tube or ribbon per hair reads correctly from every direction, needs no opacity texture and costs a few thousand triangles per eye. Both are placed by rule from the generated eye, so they follow any lid or brow ridge the body generator makes. The rules relay [anatomy/hair.md](../anatomy/hair.md).

## Lashes

`AutoMovieHumanEyelash` roots the lashes on the anterior lid surface just outside the anterior edge of `AutoMovieHumanEyelid`, in three staggered rows on the upper lid and two on the lower: 150 upper lashes from 16 to 98 percent of the lid from the medial canthus and 45 lower ones from 30 to 94 percent. The upper count lies in the measured 90 to 160; the lower count is below the measured 75 to 80 so the fine lower lashes do not read as a fence at render scale.

The input `length` is the longest upper lash. Length peaks about 60 percent along the lid and falls to half medially; lower lashes are 30 percent of the upper. Every lash curves from the bulb: upper lashes leave slightly below the line of sight and turn up by about 78 degrees, lower lashes turn down by about 50, so the two never interlace. Lashes splay toward the nose and the temple along the lid, and groups of four to six pull their tips a third of the way together, as real lashes clump. Tubes taper from 0.11 mm to 0.016 mm.

## Brows

`AutoMovieHumanEyebrow` lays the brow out in the face plane from the eye's canthi and projects every hair point along the line of sight onto the generated head skin, lifting it by a few tenths of a millimetre along the skin's normal. The middle line passes at the upper-margin heights of Park 2017 (26.4, 31.0, 28.4 and 21.6 mm above the medial canthus at the medial canthus, lateral limbus, lateral canthus and lateral end) less half the width there; the brow runs from 1 mm medial of the medial canthus to 9 mm beyond the lateral canthus, and its width swells from 3.5 mm at the rounded medial start to 9 mm above the medial canthus and falls through 6.5 mm at the peak to 2 mm at the tail.

About 1100 hairs per brow, 3.5 to 6.5 mm long, thin toward the tail and fade over a noisy border. Direction follows Rajput 2021: head hairs, sparse and fading in over the first fifth of the brow, fan up and out, body hairs converge on the axis from both borders, the tail runs along the axis sloping down. Hairs lie nearly flush, lifted 8 degrees and falling back.

## Limits

- Heights come from young Korean women; brows do not yet respond to sex, age or the femininity control.
- Lashes and brows take only the input colour; there is no grey or density input.
