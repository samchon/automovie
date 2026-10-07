"""Correspondence of a posed atlas boundary sheet with a target face.

The posed sheet is drawn onto the target in rounds. Each round asks every
vertex for its closest target point and moves it by that displacement after
averaging the displacement over the sheet's own edges; early rounds average
widely, so whole regions travel together, and later rounds average little,
so the sheet settles. A final exact projection puts every vertex on the
target. Wide averaging first is what keeps closest-point matching from
sliding a region along the surface it is approaching.

A landmark that both surfaces name pins the tangential freedom the rounds
leave: near it the displacement is drawn toward the landmark's own, with a
Gaussian falloff. The lower chain has one such pair, the mid-patella point.
Nothing here measures anatomy; the result is an authored correspondence
between one atlas individual and one target exterior.
"""
import numpy as np


def edge_list(faces, chosen):
    """Directed edges and neighbour counts of the chosen vertices' sub-sheet."""
    local = np.full(len(chosen), -1)
    local[chosen] = np.arange(int(chosen.sum()))
    kept = local[faces]
    kept = kept[np.all(kept >= 0, axis=1)]
    edges = np.vstack((kept[:, [0, 1]], kept[:, [1, 2]], kept[:, [2, 0]]))
    edges = np.unique(np.vstack((edges, edges[:, ::-1])), axis=0)
    return edges, np.bincount(edges[:, 0], minlength=int(chosen.sum()))


def smooth(values, edges, counts, rounds):
    """Average each vertex value with the mean of its edge neighbours."""
    for _ in range(rounds):
        total = np.zeros_like(values)
        np.add.at(total, edges[:, 0], values[edges[:, 1]])
        values = np.where(counts[:, None] > 0, .5 * values + .5 * total / np.maximum(counts, 1)[:, None], values)
    return values


def fit(posed, edges, counts, target, landmarks=(), reach_metres=.04, schedule=(200, 60, 20, 5)):
    """Positions on the target for every posed vertex, and how far the last step moved.

    `landmarks` pairs a posed vertex ordinal with its target position.
    """
    moved = posed.copy()
    for rounds in schedule:
        nearest, _ = target.query(moved)
        step = nearest - moved
        for vertex, goal in landmarks:
            pull = np.exp(-np.sum((moved - moved[vertex]) ** 2, axis=1) / (2 * reach_metres ** 2))[:, None]
            step = (1 - pull) * step + pull * (goal - moved[vertex])
        moved = moved + smooth(step, edges, counts, rounds)
    fitted, remaining = target.query(moved)
    # The sagittal plane maps to itself: a right-half vertex stays on the right.
    fitted[:, 0] = np.minimum(fitted[:, 0], 0.0)
    return fitted, remaining
