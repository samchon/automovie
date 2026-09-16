/* Public-API bridge to pinned OSQP. TypeScript owns the borrowed CSC/input and
 * output buffers. OSQP copies inputs during setup; cleanup releases its private
 * allocations before returning. No private struct offsets or persistent solve
 * state cross this boundary. Scalars are doubles and indices are 32-bit ints.
 * The caller chooses units. Fixed iteration-based rho updates are independent
 * of machine timing; no I/O, clock, random or interrupt service is compiled in.
 *
 * The return value is the OSQP API error, separate from info[0]'s solver status.
 * Output buffers are valid only when that API return is zero. An infeasible or
 * unfinished solve retains its native status rather than becoming geometry.
 */
#include <stddef.h>
#include "osqp.h"

int automovie_quadratic_solve(
    int n, int m, int nonzero, int *objective_columns, int *objective_rows,
    double *diagonal, const double *linear,
    int *columns, int *rows, double *values,
    const double *lower, const double *upper, const double *initial,
    double *solution, double *dual, double *info) {
  OSQPSolver *solver = NULL;
  OSQPSettings settings;
  OSQPCscMatrix objective;
  OSQPCscMatrix constraints;
  OSQPCscMatrix_set_data(&objective, n, n, n, diagonal,
                        objective_rows, objective_columns);
  OSQPCscMatrix_set_data(&constraints, m, n, nonzero, values, rows, columns);
  osqp_set_default_settings(&settings);
  settings.verbose = 0;
  settings.eps_abs = 1e-8;
  settings.eps_rel = 1e-8;
  settings.max_iter = 100000;
  settings.polishing = 1;
  settings.adaptive_rho = OSQP_ADAPTIVE_RHO_UPDATE_ITERATIONS;
  settings.adaptive_rho_interval = 50;
  int status = osqp_setup(&solver, &objective, linear, &constraints,
                          lower, upper, m, n, &settings);
  if (!status && initial) status = osqp_warm_start(solver, initial, NULL);
  if (!status) status = osqp_solve(solver);
  if (!status) {
    for (int i = 0; i < n; ++i) solution[i] = solver->solution->x[i];
    for (int i = 0; i < m; ++i) dual[i] = solver->solution->y[i];
    info[0] = solver->info->status_val;
    info[1] = solver->info->iter;
    info[2] = solver->info->prim_res;
    info[3] = solver->info->dual_res;
    info[4] = solver->info->obj_val;
    info[5] = solver->info->status_polish;
  }
  osqp_cleanup(solver);
  return status;
}
