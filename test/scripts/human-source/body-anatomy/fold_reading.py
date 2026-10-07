"""Where a registration map folds.

A map that carries anatomy must keep orientation: its Jacobian determinant
is positive wherever tissue is carried. This module reads that determinant
by central differences at every lattice cell whose six neighbours all carry
the map, so no difference reads an extended value, and reports where it is
zero or negative: how many cells, in which height band of the chain, and as
which connected clusters. A fold is reported, never smoothed away.
"""
import numpy as np
from scipy import ndimage

from anatomy_field import extend


def read_folds(grid, volume, registered, bands):
    """Fold account of a map and the mask of folded cells.

    `bands` maps a name to the lower and upper atlas height of that band.
    """
    interior = volume.copy()
    for axis in range(3):
        for shift in (1, -1):
            interior &= np.roll(volume, shift, axis=axis)
    interior[(0, -1), :, :] = False
    interior[:, (0, -1), :] = False
    interior[:, :, (0, -1)] = False
    image = np.zeros(grid.shape + (3,))
    image[volume] = registered(grid.centres(volume))
    for axis in range(3):
        image[..., axis] = extend(image[..., axis], volume)
    # Index i runs toward -X, so the x derivative is the negated i derivative.
    gradient = np.stack([-np.gradient(image, grid.pitch, axis=0), np.gradient(image, grid.pitch, axis=1), np.gradient(image, grid.pitch, axis=2)], axis=-1)
    determinant = np.linalg.det(gradient[interior])
    account = {"interiorCells": int(interior.sum()), "nonPositive": int((determinant <= 0).sum()), "minimum": float(determinant.min()),
               "firstPercentile": float(np.percentile(determinant, 1)), "median": float(np.median(determinant)), "maximum": float(determinant.max()), "bands": {}}
    heights = grid.centres(interior)[:, 1]
    for name, (low, high) in bands.items():
        band = (heights >= low) & (heights < high)
        account["bands"][name] = {"cells": int(band.sum()), "nonPositive": int((determinant[band] <= 0).sum()),
                                  "minimum": float(determinant[band].min()) if band.any() else None}
    folded = np.zeros(grid.shape, dtype=bool)
    folded[tuple(np.argwhere(interior)[determinant <= 0].T)] = True
    labels, clusters = ndimage.label(folded, structure=np.ones((3, 3, 3)))
    sizes = np.bincount(labels.ravel())[1:]
    account["clusters"] = int(clusters)
    account["largestClusters"] = []
    for label in np.argsort(sizes)[::-1][:8] + 1:
        centres = grid.centres(labels == label)
        account["largestClusters"].append({"cells": int(sizes[label - 1]), "centreAtlasMetres": centres.mean(axis=0).round(4).tolist(),
                                           "lowAtlasMetres": centres.min(axis=0).round(4).tolist(), "highAtlasMetres": centres.max(axis=0).round(4).tolist()})
    return account, folded
