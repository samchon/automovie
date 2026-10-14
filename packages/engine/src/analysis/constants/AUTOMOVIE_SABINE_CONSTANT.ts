/**
 * Sabine's constant in metric units, `0.161 s*m^-1`.
 *
 * It is the constant of the equation `T60 = 0.161 * V / A`, not a property of
 * any room or material, which is why it lives in the solver rather than in a
 * table a production would have to supply.
 */
export const AUTOMOVIE_SABINE_CONSTANT = 0.161;
