"""Count the defects in the rendered face, instead of noticing them one at a time.

Fixing what the eye happens to catch finds defects in the order they are ugly and
never says when the list ends. This reads the same four frames per subject and
per view that the census capture writes, and reports four numbers that between
them cover what has actually gone wrong on this face so far: a garment painted
onto a chest, a block left by the fill, a seam where observation stops, one side
of a head reconstructed from the other, and hair that covers less than it should.

The clay pass is what makes it possible. It puts one uniform material over the
whole scene and changes nothing else, so a lit frame is shading times albedo and
its clay frame is shading times a constant. Dividing cancels the light and leaves
the albedo as the viewer receives it, which is the only form of it that matters.

The four:

All four are read on the dressed frame, because that is what ships. Read on the
bald one, the albedo measure counts the hairline the bake painted onto the scalp,
which the groom covers.

`asymmetry` -- a face's albedo is near-symmetric and its lighting is not, and the
lighting is now divided out, so a large left-right difference in the quotient is
a defect rather than a person. This is the one measure here that owes nothing to
any model of anatomy: it catches a mirror-pass seam, a one-sided observation and
a patchy fill without knowing what a face is.

`painted` -- an edge in the quotient where the clay frame is smooth. A lip
border, a nostril and a brow sit on a crease, a rim or a ridge, so the geometry
knows about them; a UV seam, a block boundary and the hem of a garment do not
exist in the geometry at all. The separation is not perfect and is not claimed
to be: the measure is read across subjects and across a change, under one fixed
protocol, which is what it is good for.

`holes` -- skin showing through the middle of the hair, as a share of the hair
silhouette. A bare forehead is a hairline, not a defect, so what counts is only
what the hair encloses and fails to cover: the first reading took the top third
of the skull instead and called emma-watson's forehead 58% bare scalp.

`field` -- the same steps as `painted`, but only where no relief comes within
six pixels. A brow, a lash line, a nostril rim and a lip border all sit on
something the geometry knows about, and flagging them is flagging the face
rather than a fault in it; what is left is a step on skin that should be
smooth. Across the population it is 47% of `painted`, and it is the half worth
chasing: `rupert-grint` scores 0.02% on it against 2.47% for `kim-min-jung`,
through the same bake, which is the proof that the floor is not where the
median sits.

`torso` -- how far the chest's albedo sits from the face's, in chroma. Nothing
below the collar is observed any more, so the chest is continued from this
person's own skin, and whether the continuation is their colour is a question
the other four cannot answer: a flat, wrong-coloured chest has no edges in it
and so reads as an improvement on `painted`. The bands are placed from model
height, not from anything in the frame: the skin spans +138 mm to -144 mm, so
the face is the rows from 28% to 56% down the bald silhouette and the chest is
the last 21%, below the -85 mm floor.

`fragments` -- the share of hair pixels in specks rather than in the mass.

Usage, from the repository root:
  python test/scripts/face-review/measure-render-census.py <name> [name-to-compare]
"""

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

SHOTS = Path(".shots/human-2469/investigation-2498")
VIEWS = ["front", "left-three-quarter", "left", "back"]
#: Not every measure means anything from every angle, and averaging one that
#: does not is how a reading gets made up. Mirroring a profile compares a face
#: with the back of a head, which is why asymmetry read 0.37 to 0.70 there on
#: every subject and swamped what the front and back had to say. The torso
#: measure needs a face to compare the chest against, and from behind there is
#: none: it read 153e-3 on oh-seung-yoon by comparing his scalp with his chest.
WHERE = {
    "painted": VIEWS,
    "field": VIEWS,
    "asymmetry": ["front", "back"],
    "torso": ["front", "left-three-quarter"],
    "holes": VIEWS,
    "fragments": VIEWS,
}
#: Clay darker than this is in shadow, where dividing by it only amplifies noise.
LIT = 0.06
#: A Sobel response, over the albedo at that point, past this is an edge rather
#: than a gradient. A three-by-three Sobel answers a step of h with 4h, so one
#: here is a quarter of the local albedo crossed in a single pixel, which skin
#: does not do except at a feature. Calibrated by overlaying the flagged pixels
#: on the frame: at 0.14 the flag covered forty per cent of a face, brows and
#: lips included.
EDGE = 1.0
#: And the clay's own Sobel below this means the surface under that edge is
#: smooth: the shading moves less than four per cent across the pixel, so no
#: crease, rim or ridge accounts for what the albedo does there.
SMOOTH = 0.15
#: A hair island smaller than this share of the largest one is a speck.
SPECK = 0.01
#: Dressing the head moved the pixel by this much: a lock in front of skin.
MATERIAL = 0.02
#: Or moved the clay shading by this much: a lock whose normal is not the
#: surface's. Neither test alone finds all of the hair. The clay one goes blind
#: where a lock lies flat along the scalp and shades exactly like it, which is
#: over the crown; the lit one goes blind where a lock and the skin behind it
#: happen to render alike. Together they also make the measure far steadier:
#: across a change that touched only the skin and not one groom, the lit test
#: alone moved the reading by 2.02 points on average and the two together by
#: 0.63.
RELIEF = 0.02
#: Or is grainier by this much than the same pixel bald: a lock is made of
#: fibres and a scalp is not. The third cue is there because the first two fail
#: together on the same faces. The lit test cannot see black hair over a scalp
#: the bake painted black, and the clay test cannot see hair that lies flat and
#: shades like the surface under it, so oh-seung-yoon and michael-gambon read as
#: having holes in hair that is plainly there. Adding grain takes michael-gambon
#: from 6.75% to 0.50% from the front and leaves rupert-grint and alan-rickman
#: at 0.00%, which is what a cue that finds hair rather than invents it does.
FIBRE = 0.006
#: Rows of the frame the editor's own toolbar occupies. The screenshot is of the
#: canvas, and the toolbar is drawn over it, so without this the buttons read as
#: part of the head: the first reading put the scalp band across the toolbar and
#: reported 79% of every groom's scalp bare.
TOOLBAR = 60
LUMA = np.array([0.2126, 0.7152, 0.0722])


def read(folder: Path, subject: str, state: str, view: str):
    file = folder / f"{subject}-{state}-{view}.png"
    if not file.exists():
        return None
    return np.asarray(Image.open(file).convert("RGB"), dtype=np.float64) / 255.0


def background(image: np.ndarray) -> np.ndarray:
    """The page behind the head, taken from the frame's own corner."""
    out = np.all(np.abs(image - image[0, 0]) < 0.02, axis=2)
    out[:TOOLBAR] = True
    return out


def grain(plane: np.ndarray, reach: int = 5) -> np.ndarray:
    """Local standard deviation: how much texture sits inside a few pixels."""
    level = ndimage.uniform_filter(plane, reach)
    return np.sqrt(
        np.maximum(ndimage.uniform_filter(plane * plane, reach) - level * level, 0.0)
    )


def sobel(plane: np.ndarray) -> np.ndarray:
    return np.hypot(
        ndimage.sobel(plane, axis=0, mode="nearest"),
        ndimage.sobel(plane, axis=1, mode="nearest"),
    )


def census(folder: Path, subject: str) -> dict | None:
    rows = {}
    for view in VIEWS:
        lit = read(folder, subject, "bald-lit", view)
        clay = read(folder, subject, "bald-clay", view)
        dressedLit = read(folder, subject, "dressed-lit", view)
        dressedClay = read(folder, subject, "dressed-clay", view)
        if any(one is None for one in (lit, clay, dressedLit, dressedClay)):
            return None
        skin = ~background(clay)
        clayLuma = clay @ LUMA
        # Hair is where dressing the head changed the pixel. Outside the bald
        # silhouette that is geometry; inside it, it is that a lock and the skin
        # behind it are different materials.
        #
        # The two clay frames alone were tried first, on the grounds that a
        # difference between them owes nothing to hair colour. It owes nothing
        # to hair either, where a lock lies flat along the scalp: its normal
        # matches the surface under it, one uniform material shades both the
        # same, and the mask goes blind exactly over the crown. From the side it
        # called 20% of alan-rickman's solid cap of hair a hole, against 0%
        # here, and his hair is not a hole.
        dressedSkin = ~background(dressedClay)
        dressedClayLuma = dressedClay @ LUMA
        hair = dressedSkin & (
            (~skin)
            | (np.abs(dressedLit - lit).max(axis=2) > MATERIAL)
            | (np.abs(dressedClayLuma - clayLuma) > RELIEF)
            | (grain(dressedLit @ LUMA) > grain(lit @ LUMA) + FIBRE)
        )
        hair = ndimage.binary_closing(hair, np.ones((3, 3)))
        # The albedo is read on the dressed frame, on the skin the viewer is
        # actually shown. Read on the bald frame it counts the hairline the bake
        # painted onto the scalp as a defect, and the groom covers that.
        visible = dressedSkin & ~hair
        usable = visible & (dressedClayLuma > LIT)
        if usable.sum() < 2000:
            continue
        # The albedo as the viewer receives it, with the light divided out.
        quotient = np.zeros_like(dressedLit)
        quotient[usable] = dressedLit[usable] / dressedClayLuma[usable][:, None]
        plane = quotient @ LUMA
        # Measured against the albedo right there, not against the frame's own
        # median. A global divisor couples the reading to everything else in the
        # frame: when the chest stopped being a white shirt and became continued
        # skin, the divisor moved and michael-gambon's face -- not one texel of
        # which had changed -- read 1.50% to 4.28% worse. A local contrast is
        # invariant to any of that, and it also means the same thing on a dark
        # face and a pale one.
        local = np.maximum(ndimage.uniform_filter(np.where(usable, plane, 0.0), 21), 1e-6)
        painted = sobel(np.where(usable, plane, 0.0)) / local
        relief = sobel(np.where(usable, dressedClayLuma, 0.0))
        inside = ndimage.binary_erosion(usable, iterations=3)
        flagged = inside & (painted > EDGE) & (relief < SMOOTH)

        # Left against right, about the head's own axis rather than the frame's.
        # The fit does not centre the head, so mirroring about the image centre
        # compares a cheek with an ear and reports the framing as asymmetry.
        axis = int(round(ndimage.center_of_mass(inside)[1]))
        shift = plane.shape[1] - 1 - 2 * axis
        mirrored = np.roll(plane[:, ::-1], shift, axis=1)
        partner = np.roll(inside[:, ::-1], shift, axis=1)
        paired = inside & partner
        # Relative, for the same reason the edge measure is.
        average = np.abs(plane) + np.abs(mirrored)
        asymmetry = (
            float(
                np.median(
                    2
                    * np.abs(plane[paired] - mirrored[paired])
                    / np.maximum(average[paired], 1e-6)
                )
            )
            if paired.sum() > 1000
            else 0.0
        )

        labels, count = ndimage.label(hair)
        fragments = 0.0
        if count > 1:
            sizes = np.bincount(labels.ravel())[1:]
            fragments = float(sizes[sizes < sizes.max() * SPECK].sum() / sizes.sum())

        # Skin showing through the middle of the hair. Where the hairline falls
        # is the hairstyle; a hole the hair encloses is the groom failing to
        # cover what it claims, and it needs no model of where hair belongs.
        solid = ndimage.binary_fill_holes(hair)
        holes = (
            float((solid & ~hair).sum() / solid.sum()) if solid.sum() > 500 else 0.0
        )

        # Face against chest in the de-lit albedo, by bands placed from model
        # height. The skin spans +138 mm to -144 mm of model Y, so the face sits
        # from 28% to 56% down the bald silhouette and the chest below 79%.
        ys = np.flatnonzero(skin.any(axis=1))
        torso = 0.0
        if ys.size:
            top, span = ys[0], ys[-1] - ys[0]
            faceBand = np.zeros_like(inside)
            faceBand[top + int(span * 0.28) : top + int(span * 0.56)] = True
            chestBand = np.zeros_like(inside)
            chestBand[top + int(span * 0.79) :] = True
            faceBand &= inside
            chestBand &= inside
            if faceBand.sum() > 500 and chestBand.sum() > 500:
                total = np.clip(quotient.sum(axis=2, keepdims=True), 1e-6, None)
                tint = (quotient / total)[..., :2]
                torso = float(
                    np.linalg.norm(
                        np.median(tint[faceBand], axis=0)
                        - np.median(tint[chestBand], axis=0)
                    )
                )

        # Six pixels of margin, because a flag beside a feature is that feature
        # blurred by the render, not a mark on the skin.
        smoothField = inside & ~ndimage.binary_dilation(relief >= SMOOTH, iterations=6)

        rows[view] = {
            "painted": round(float(flagged.sum() / max(inside.sum(), 1)), 5),
            "field": round(
                float((flagged & smoothField).sum() / max(smoothField.sum(), 1)), 5
            ),
            "torso": round(torso, 5),
            "asymmetry": round(asymmetry, 4),
            "holes": round(holes, 4),
            "fragments": round(fragments, 5),
        }
    if not rows:
        return None
    summary = {}
    for key, where in WHERE.items():
        taken = [rows[view][key] for view in where if view in rows]
        summary[key] = round(float(np.mean(taken)), 5) if taken else 0.0
    return {"views": rows, **summary}


name = sys.argv[1]
folder = SHOTS / f"census-{name}"
subjects = sorted({one.name.split("-bald-lit-")[0] for one in folder.glob("*-bald-lit-*.png")})
report = {}
print(f"{'subject':26s} {'painted':>9s} {'field':>8s} {'asymmetry':>10s} {'torso':>9s} {'holes':>7s} {'fragments':>10s}")
for subject in subjects:
    row = census(folder, subject)
    if row is None:
        print(f"{subject:26s} incomplete")
        continue
    report[subject] = row
    print(
        f"{subject:26s} {row['painted'] * 100:8.2f}% {row['field'] * 100:7.2f}%"
        f" {row['asymmetry']:10.4f}"
        f" {row['torso'] * 1000:7.1f}e-3 {row['holes'] * 100:6.1f}% {row['fragments'] * 100:9.3f}%"
    )

(SHOTS / f"render-census-{name}.json").write_text(
    json.dumps(report, indent=2) + "\n", encoding="utf8"
)
if report:
    print()
    for key in WHERE:
        values = np.array([r[key] for r in report.values()])
        order = sorted(report, key=lambda s: report[s][key], reverse=True)[:3]
        scale = 1 if key in ("asymmetry", "torso") else 100
        unit = "" if key in ("asymmetry", "torso") else "%"
        print(
            f"{key:>10s}  median {np.median(values) * scale:7.3f}{unit}"
            f"  worst {values.max() * scale:7.3f}{unit}"
            f"   {', '.join(order)}"
        )

if len(sys.argv) > 2:
    other = json.loads((SHOTS / f"render-census-{sys.argv[2]}.json").read_text("utf8"))
    print()
    print(f"against census-{sys.argv[2]}: change per subject, negative is better")
    for key in WHERE:
        shared = [s for s in report if s in other]
        if not shared:
            continue
        delta = np.array([report[s][key] - other[s][key] for s in shared])
        worse = [s for s, d in zip(shared, delta) if d > abs(np.median(delta)) * 0.5 + 1e-6]
        scale = 1 if key in ("asymmetry", "torso") else 100
        print(
            f"{key:>10s}  median {np.median(delta) * scale:+8.4f}"
            f"  worst {delta.max() * scale:+8.4f}"
            f"   {len(worse)} of {len(shared)} worse"
            + (f": {', '.join(worse[:4])}" if worse else "")
        )
