import type {
  IAutoMovieInspectionTrail,
  IAutoMovieVector3,
} from "@automovie/interface";
import type { JSX } from "react";

/* Read the selected trail at the exact second of the painted picture. */
export function InspectorMotionTrailPanel(props: {
  readonly trails: readonly IAutoMovieInspectionTrail[];
  readonly seconds: number;
}): JSX.Element | null {
  const rows: JSX.Element[] = [];
  for (const trail of props.trails) {
    const at: number = trail.times.indexOf(props.seconds);
    const sample = trail.motion?.samples[at];
    if (sample === undefined) continue;
    const route = trail.motion?.route;
    const { time, entry, baseline, phase, forward, projection, support } =
      sample;
    const origin = {
      x: trail.positions[at * 3]!,
      y: trail.positions[at * 3 + 1]!,
      z: trail.positions[at * 3 + 2]!,
    };
    const heading: number | undefined =
      forward === undefined || (forward.x === 0 && forward.z === 0)
        ? undefined
        : (Math.atan2(forward.x, forward.z) * 180) / Math.PI;
    rows.push(
      <li key={trail.path}>
        <strong>{trail.path || "Scene root"}</strong>
        <div>
          Film {time.filmSeconds} s
          {time.outputFrame === undefined ? "" : `, frame ${time.outputFrame}`}
          {time.shot === undefined
            ? ""
            : ` · ${time.shot.path} at ${time.shot.seconds} s`}
          {entry === null ? "" : `, entry ${entry}`}
        </div>
        <div>
          World origin {vector(origin)} m ·{" "}
          {trail.stationary ? "sampled stationary" : "moved across samples"}
        </div>
        {route === undefined ? null : (
          <div>
            Route {route.id} · requested {number(route.requestedSpeed)} m/s ·
            effective {number(route.effectiveSpeed)} m/s
          </div>
        )}
        {baseline === undefined ? null : (
          <div>
            World route baseline {vector(baseline.position)} m · heading{" "}
            {number(baseline.yawDeg)}°
          </div>
        )}
        {forward === undefined ? null : (
          <div>
            World forward {vector(forward)}
            {heading === undefined ? "" : ` · heading ${number(heading)}°`}
          </div>
        )}
        {phase === undefined ? null : (
          <div>Gait phase {number(phase)} cycles</div>
        )}
        <div>
          Delivery projection {projection.status}
          {"ndc" in projection ? ` · NDC ${vector(projection.ndc)}` : ""}
        </div>
        <div>
          {support === undefined
            ? "No support binding supplied"
            : support.status === "unavailable"
              ? "Selected support unavailable"
              : `Support ${support.path || "scene root"} · local ${vector(support.local)} m · gap ${number(support.gap)} m · slip ${number(support.slip)} m`}
        </div>
      </li>,
    );
  }
  return rows.length === 0 ? null : (
    <section aria-label="Motion trail samples">
      <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0" }}>
        {rows}
      </ul>
    </section>
  );
}

const DISPLAY_NUMBER: Intl.NumberFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 6,
  useGrouping: false,
});

function number(value: number): string {
  return DISPLAY_NUMBER.format(value);
}

function vector(value: IAutoMovieVector3): string {
  return `(${number(value.x)}, ${number(value.y)}, ${number(value.z)})`;
}
