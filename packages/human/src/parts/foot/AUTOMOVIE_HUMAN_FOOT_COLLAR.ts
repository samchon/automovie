/**
 * Distance of the foot's pinned collar below its shared ankle ring, of foot length.
 *
 * The existing conventional collar distance is shared by the sweep's station,
 * its pinned cage row and the source solid's boundary condition. The column
 * stays on the ring's B-spline throughout this span; malleolar and slab masses
 * start below it, so a field cannot silently redefine the pinned boundary.
 */
export const AUTOMOVIE_HUMAN_FOOT_COLLAR: number = 0.025;
