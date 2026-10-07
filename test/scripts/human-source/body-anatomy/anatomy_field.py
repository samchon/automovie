"""Harmonic fields on one sagittal half of a body volume.

The registration map of the body anatomy is defined on the right half of a
sagittally symmetric volume. Coordinates are metres, +X left, +Y up, +Z
anterior, with the sagittal plane at x = 0; the right half is x <= 0. Cell
(i, j, k) has its centre at (-(i + .5) h, y0 + (j + .5) h, z0 + (k + .5) h), so
the sagittal plane lies on the faces of the i = 0 cells and no cell straddles
it. A field is then either even across the plane (a missing neighbour there
is a zero normal derivative) or odd (the mirrored neighbour holds the negated
value), which is exactly the symmetry a mirrored body requires. Solving one
half makes left and right equal by construction instead of by tolerance.

Every field solves the discrete Laplace equation on the seven-point stencil:
a harmonic function has no interior extremum, so an interpolated weight stays
between its boundary values and an interpolated displacement stays within the
range its boundaries prescribe. Cells outside the volume contribute no
equation, which is the natural zero-flux condition on the skin, on the cut
planes and on the even sagittal face.
"""
import numpy as np
from scipy import ndimage, sparse
from scipy.sparse.linalg import cg

NEIGHBOURS = ((1, 0, 0), (-1, 0, 0), (0, 1, 0), (0, -1, 0), (0, 0, 1), (0, 0, -1))


class HalfGrid:
    """Cell-centred lattice over the right half-space of one body frame."""

    def __init__(self, low_yz, high_x, high_yz, pitch):
        self.pitch = float(pitch)
        # Cell centres sit on whole multiples of the pitch in Y and Z and on
        # half multiples in X, which is where `solid_points` puts them.
        self.y0 = np.floor(low_yz[0] / pitch) * pitch - 2.5 * pitch
        self.z0 = np.floor(low_yz[1] / pitch) * pitch - 2.5 * pitch
        self.shape = (int(np.ceil(high_x / pitch)) + 3,
                      int(np.ceil((high_yz[0] - self.y0) / pitch)) + 3,
                      int(np.ceil((high_yz[1] - self.z0) / pitch)) + 3)

    def continuous(self, points):
        """Fractional cell coordinates of right-half points (x <= 0)."""
        points = np.asarray(points, dtype=np.float64)
        return np.column_stack((-points[:, 0] / self.pitch - .5,
                                (points[:, 1] - self.y0) / self.pitch - .5,
                                (points[:, 2] - self.z0) / self.pitch - .5))

    def cells(self, points):
        """Containing cell of each point and whether that cell exists."""
        index = np.floor(self.continuous(points) + .5).astype(np.int64)
        inside = np.all((index >= 0) & (index < np.asarray(self.shape)), axis=1)
        return index, inside

    def occupy(self, points):
        """Mark the cells that contain any of the given right-half points."""
        field = np.zeros(self.shape, dtype=bool)
        index, inside = self.cells(points)
        index = index[inside]
        field[index[:, 0], index[:, 1], index[:, 2]] = True
        return field

    def centres(self, mask):
        """Centre coordinates of the marked cells, in the body frame."""
        i, j, k = np.nonzero(mask)
        return np.column_stack((-(i + .5) * self.pitch, self.y0 + (j + .5) * self.pitch,
                                self.z0 + (k + .5) * self.pitch))


def solid_points(mesh, pitch, strict=None):
    """Centres of the cells a closed surface encloses or touches.

    With `strict`, a signed-distance function of the same surface, a cell the
    surface merely touches counts only when its centre is inside. Two sheets
    closer together than a cell, such as an arm lying against the trunk, then
    stay separate instead of being bridged by the cells both touch.
    """
    # The rasteriser centres its cells on whole multiples of the pitch. The
    # half lattice needs the sagittal plane on cell faces, so the surface is
    # rasterised half a cell aside in X and the centres are moved back. A
    # centre then never lies on a face of the lattice it is assigned to.
    aside = np.asarray([pitch / 2, 0.0, 0.0])
    moved = mesh.copy()
    moved.apply_translation(aside)
    voxels = moved.voxelized(pitch)
    cells = ndimage.binary_fill_holes(voxels.matrix)
    centres = voxels.indices_to_points(np.argwhere(cells))
    if np.abs(np.mod(centres / pitch, 1) - .5).min() < .49:
        raise ValueError("The rasteriser no longer centres its cells on whole multiples of the pitch.")
    centres = centres - aside
    if strict is not None:
        surface = voxels.indices_to_points(np.argwhere(voxels.matrix)) - aside
        outside = surface[strict(surface) > 0]
        # Rows are lattice centres: drop the touched cells whose centre is outside.
        keys = lambda points: np.round(points / pitch * 2).astype(np.int64)
        dropped = set(map(tuple, keys(outside)))
        centres = centres[np.fromiter((tuple(key) not in dropped for key in keys(centres)), dtype=bool, count=len(centres))]
    return centres


def connected_to(mask, seed):
    """The six-connected part of a volume that reaches a seed set."""
    labels, _ = ndimage.label(mask)
    keep = np.unique(labels[seed & mask])
    return np.isin(labels, keep[keep != 0])


def solve_laplace(volume, fixed, values, parity="even", tolerance=1e-9):
    """Harmonic extension of fixed cell values through a volume.

    `volume` marks every cell of the domain, `fixed` the cells whose value is
    prescribed by `values`. The sagittal face of the i = 0 cells is even
    (zero flux) or odd (the mirrored cell holds the negated value). Every
    free cell must reach a fixed cell, or the system would be singular; the
    caller restricts the volume first and this function refuses otherwise.
    """
    free = volume & ~fixed
    if not np.any(fixed & volume):
        raise ValueError("A harmonic field needs at least one prescribed cell.")
    if np.any(free & ~connected_to(volume, fixed)):
        raise ValueError("A free cell cannot reach any prescribed value.")
    number = np.full(volume.shape, -1, dtype=np.int64)
    count = int(free.sum())
    number[free] = np.arange(count)
    diagonal = np.zeros(count)
    right = np.zeros(count)
    rows, columns = [], []
    here = np.nonzero(free)
    own = number[here]
    for step in NEIGHBOURS:
        there = tuple(axis + delta for axis, delta in zip(here, step))
        valid = np.ones(count, dtype=bool)
        for axis, size in zip(there, volume.shape):
            valid &= (axis >= 0) & (axis < size)
        if parity == "odd" and step == (-1, 0, 0):
            # Across the sagittal face the value is its own negation.
            diagonal[own[there[0] < 0]] += 2
        index = tuple(axis[valid] for axis in there)
        source = own[valid]
        neighbour_free = free[index]
        neighbour_fixed = fixed[index] & volume[index]
        diagonal[source[neighbour_free | neighbour_fixed]] += 1
        rows.append(source[neighbour_free])
        columns.append(number[index][neighbour_free])
        np.add.at(right, source[neighbour_fixed], values[index][neighbour_fixed])
    if np.any(diagonal == 0):
        raise ValueError("A free cell has no neighbour inside its volume.")
    rows, columns = np.concatenate(rows), np.concatenate(columns)
    matrix = sparse.csr_matrix((-np.ones(len(rows)), (rows, columns)), shape=(count, count))
    matrix = matrix + sparse.diags(diagonal)
    preconditioner = sparse.diags(1 / diagonal)
    solution, status = cg(matrix, right, rtol=tolerance, maxiter=40000, M=preconditioner)
    if status != 0:
        raise ValueError("The harmonic solve did not converge: " + str(status))
    residual = float(np.linalg.norm(matrix @ solution - right) / max(np.linalg.norm(right), 1e-300))
    field = np.where(fixed, values, 0.0).astype(np.float64)
    field[free] = solution
    return field, {"unknowns": count, "relativeResidual": residual}


def extend(field, volume):
    """Copy each outside cell from its nearest inside cell.

    Sampling near the surface then reads the surface value instead of mixing
    in cells that carry no equation.
    """
    nearest = ndimage.distance_transform_edt(~volume, return_distances=False, return_indices=True)
    return field[tuple(nearest)]


def sample(grid, extended, points):
    """Trilinear value of an extended cell field at right-half points."""
    coordinates = grid.continuous(points).T
    return ndimage.map_coordinates(extended, coordinates, order=1, mode="nearest")
