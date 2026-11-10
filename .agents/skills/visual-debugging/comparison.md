# Comparison

A comparison joins two captures cell by cell, so that only the compared thing differs between the two stills of a pair. This document owns which pairs to make, how their cells match and how the difference is read.

## What a pair separates

| Pair | Separates |
| --- | --- |
| Before and after a correction | The change's effect from what was already there, and regressions outside it |
| A reference or fixed source and the result | The result's own errors from the source's |
| A computed result and its picture | A calculation fault from a display fault |
| The source's picture and the encoded file | What encoding, color conversion or assembly changed |
| A conditioning input and what a generator made from it | What the generator kept, moved or invented |
| A coarse form and its detailed option | What the detail shows at the size it is used |
| A sequential capture and a restart or seek to the same time | State that depends on how the time was reached |
| This delivery and the previous one | What changed between them at matched times |

## Match the cells

Pair two cells only when subject, time or pose, resolved camera, pass, raster size, renderer and light agree. A view's name does not establish the same framing when the view fits itself to its subject, so the later capture reuses the earlier one's resolved camera.

Report a cell that one capture holds and the other lacks as unmatched, with its cause. A comparison over the cells that happened to match says nothing about the ones that did not.

## Read the difference

| Form | Shows |
| --- | --- |
| The pair side by side | What each still looks like on its own terms |
| One over the other | A shift in placement, silhouette, horizon or facing |
| A difference image | Where the pixels changed, including where no change was meant |
| A measured difference per cell | Which pairs to open first |

A measured difference ranks where to look and never replaces looking. Identical bytes establish that nothing changed, and nothing about whether the picture is right.

A difference outside the region the change was meant to affect is a regression until it is explained.
