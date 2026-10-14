import { type Bounds, MeshWriter } from "./orthogonal-mesh";
import { type ModelPartRecord, type ModelStateRecord } from "./representation";
import { lathedShell } from "./lathedShell";

/**
 * Existing draft vessel dispatch for pots, profiles, ellipses and Y-axis bores.
 *
 * Precedence is plant pot, profile tokens, ellipse data, then a -y bore without orthogonal voids; unmatched records return false without writing. The pot uses the numeric millimetre state token for scale and a centre fixed at X/Z zero. Elliptical bowl parts use a 0.14-metre cavity floor; other elliptical parts are through shells. Profile wall thickness is H/divisor, differing from the design's min(W,D)/divisor, and profile inner radii clamp to 1e-6 metres. Closures and attachments are not emitted.
 *
 * The Y-bore span must contain two finite tokens, but its upper token is not used to end the cavity, which reaches b.y[1]. Other numeric tokens, positive dimensions and compatible radii remain caller premises. Each branch constructs a finite ring sequence and pays lathedShell's angular/UV work. Ring lists are local; the supplied writer owns emitted arrays and no result is cached.
 */
export function vessel(
  w: MeshWriter,
  b: Bounds,
  st: ModelStateRecord,
  part: ModelPartRecord,
): boolean {
  const rx: number = (b.x[1] - b.x[0]) / 2,
    rz: number = (b.z[1] - b.z[0]) / 2,
    cx: number = (b.x[0] + b.x[1]) / 2,
    cz: number = (b.z[0] + b.z[1]) / 2;
  if (st.plantSpec && part.id === "pot") {
    const spec: { [key: string]: unknown; wallMinimum: number; wallFactor: number; potBottomRadius: number; potTopRadius: number; potHeight: number; soilSurface: number; leafThickness: number; } = st.plantSpec,
      H: number = Number(st.state) / 1000,
      t: number = Math.max(spec.wallMinimum, spec.wallFactor * H);
    const bottomR: number = spec.potBottomRadius * H,
      topR: number = spec.potTopRadius * H;
    const bottomInner: number =
      bottomR + ((topR - bottomR) * t) / (b.y[1] - b.y[0]) - t;
    lathedShell(
      w,
      0,
      0,
      [
        [b.y[0], bottomR, bottomR],
        [b.y[1], topR, topR],
      ],
      [
        [b.y[0] + t, bottomInner, bottomInner],
        [b.y[1], topR - t, topR - t],
      ],
      false,
    );
    return true;
  }
  const profile: string[] | undefined = st.profiles?.[part.id];
  if (profile) {
    const [section, bottomDivisor, shoulderRatio, wallDivisor, mouthRadius]: string[] =
      profile;
    const H: number = b.y[1] - b.y[0],
      floor: number = H / Number(bottomDivisor),
      shoulder: number =
        Number(shoulderRatio.split("/")[0]) /
        Number(shoulderRatio.split("/")[1]);
    const wall: number = H / Number(wallDivisor),
      neck: number = Number(mouthRadius) + wall;
    const nr: number = section === "ellipse" ? neck : neck;
    lathedShell(
      w,
      cx,
      cz,
      [
        [b.y[0], rx, rz],
        [b.y[0] + H * shoulder, rx, rz],
        [b.y[1], nr, nr],
      ],
      [
        [
          b.y[0] + floor,
          Math.max(rx - wall, 0.000001),
          Math.max(rz - wall, 0.000001),
        ],
        [
          b.y[0] + H * shoulder,
          Math.max(rx - wall, 0.000001),
          Math.max(rz - wall, 0.000001),
        ],
        [b.y[1], Number(mouthRadius), Number(mouthRadius)],
      ],
      false,
    );
    return true;
  }
  const ellipse: [number, number, number, number, number, number] | undefined = st.ellipse?.[part.id];
  if (ellipse) {
    const [ex, ez, ix, iz, ox, oz]: [number, number, number, number, number, number] = ellipse;
    const through: boolean = part.id !== "bowl";
    const floor: number = through ? b.y[0] : b.y[1] - 0.14; // toilet H2: bowl-cavity-depth = 0.14 m
    lathedShell(
      w,
      ex,
      ez,
      [
        [b.y[0], ox, oz],
        [b.y[1], ox, oz],
      ],
      [
        [floor, ix, iz],
        [b.y[1], ix, iz],
      ],
      through,
    );
    return true;
  }
  const bore: { axis: string; args: string[]; } | undefined = st.bores?.[part.id];
  if (bore?.axis === "-y" && !st.voids?.[part.id]) {
    const radius: number = Number(bore.args[0]),
      yrange: number[] = bore.args[1].replace("−", "-").split("..").map(Number);
    if (yrange.length !== 2 || !yrange.every(Number.isFinite))
      throw new Error(`invalid bore ${part.id}`);
    lathedShell(
      w,
      cx,
      cz,
      [
        [b.y[0], rx, rz],
        [b.y[1], rx, rz],
      ],
      [
        [yrange[0], radius, radius],
        [b.y[1], radius, radius],
      ],
      yrange[0] === b.y[0],
    );
    return true;
  }
  return false;
}
