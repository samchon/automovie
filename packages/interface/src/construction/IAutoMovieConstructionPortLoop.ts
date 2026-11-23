/**
 * A port curve: an ellipse on the host face's chart about a centre, run from
 * its station-ward end at clock 0, or that ellipse with its distance from the
 * centre scaled per column.
 */
export interface IAutoMovieConstructionPortLoop {
  /** The centre `[station, phase]`, metres and radians. */
  centre: [number, number];

  /**
   * The semi-axes `[station, phase]`, metres and radians, positive, the phase
   * one under pi.
   */
  semi: [number, number];

  /** +1 or -1: the phase's sense of increasing clock at `c = pi / 2`. */
  sense: 1 | -1;

  /**
   * The curve's distance from the centre at each of the band's column clocks `2
   * pi k / count`, as a share of the ellipse's there: the port curve's point is
   * `centre + r(c) (semi[0] cos c, sense semi[1] sin c)`. The periodic cubic
   * through the shares gives `r(c)` between columns, so the host trim and the
   * band read the same C2 curve. Absent, `r(c) = 1` and the loop is the
   * ellipse. The authored shares can follow a nonelliptic outline. Realization
   * checks the resulting correspondence and strip.
   */
  shape?: number[];
}
