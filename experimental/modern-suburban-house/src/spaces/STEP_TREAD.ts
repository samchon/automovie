/**
 * `front-porch`: the raised open porch, its three risers, three columns, front
 * beam and low sloped roof.
 *
 * Floor X = [-5.75, 2.20], Z = [0, 2.20] m
 * at Y = 0 (01 ground-threshold-datums); its platform body reaches the lower
 * waiting base −0.45 − 0.12 m (01-paving-support raised-platform-support).
 * Stair width 1.50 m centred on the front door X = 0.90: three 0.15 m risers
 * from −0.45 m and two 0.30 m treads, derived backwards from the porch edge
 * Z = 2.20; the lower flat waiting belongs to the front walk.
 * Columns at X = -5.40 + 3.65 k (k = 0..2), Z = 1.975 m: base 0.35 m square
 * Y = [0, 0.15], shaft 0.25 m square Y = [0.15, 2.33], head 0.35 m square
 * Y = [2.33, 2.45]. Beam X = [-5.75, 2.20], Z = [1.85, 2.10], Y = [2.45, 2.70].
 * Roof weather surface P(Z) = 3.50 − Z/4 over X = [-6.10, 2.55], Z = [0, 2.35],
 * underside 0.22 m lower; the packer between the beam top and that underside
 * is derived from their gap so the roof does not float on the beam.
 */

export const STEP_TREAD = 0.3;
