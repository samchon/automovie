import { TestValidator } from "@nestia/e2e";

import { faceBrowTubeStations } from "../../../scripts/face-review/faceBrowTubeStations";
import { prepareFaceBrowFibres } from "../../../scripts/face-review/prepareFaceBrowFibres";
import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";
import { nclose, throwsError } from "../internal/predicates";

/** The connected analytic skin reaches the real fibre builder and engine gate.
 * Dimensions/distribution are a labelled fixture convention, not anatomy norms. */
export const test_subject_brow_host_preparation = (): void => {
  const fixture = humanFaceBasisFixture();
  const props: Parameters<typeof prepareFaceBrowFibres>[0] = { ...fixture,
    host: "square", attachment: { triangle: 0, weights: [0.5, 0.25, 0.25], reference: [1, 0, 0] },
    binding: { side: "left", lower: [0, 1], upper: [3, 2] }, fibres: 1,
    profile: { radius: 0.05, radiusStep: 0, taper: 0.5, clearance: 0.1, arch: 0,
      outwardBend: 0, segments: 2, rootBand: [0.1, 0.1], span: 0.001, endFade: [0, 0], densitySeed: 0 },
    finish: "skin", convention: "analytic plane probe; every physical/distribution value is authored", maxQueries: 128 };
  const snapshot = JSON.stringify(props);
  const prepared = prepareFaceBrowFibres(props);
  const stations = faceBrowTubeStations(prepared.parts[0].geometry.mesh, 2);
  TestValidator.predicate("connected host reaches fibre consumer in metres", prepared.parts.length === 1 &&
    nclose(stations[0].point[0], 0.5, 1e-12) && nclose(stations[0].point[1], 0.1, 1e-12) &&
    nclose(stations[0].point[2], 0.00015, 1e-12) && nclose(stations[0].radius, 0.00005, 1e-12));
  TestValidator.predicate("whole shaft envelope takes unsigned surface gate", prepared.certificates[0].status === "separated" &&
    nclose(prepared.certificates[0].measuredGapMetres, 0.0001, 1e-12) && prepared.provenance.contact.includes("unsigned"));
  TestValidator.equals("caller source/state/profile unchanged", JSON.stringify(props), snapshot);
  const replay = prepareFaceBrowFibres(props);
  TestValidator.equals("deterministic model replay", JSON.stringify(replay.model), JSON.stringify(prepared.model));
  TestValidator.equals("deterministic derived identity", replay.provenance.derivative, prepared.provenance.derivative);
  const thicker = prepareFaceBrowFibres({ ...props, profile: { ...props.profile, radius: 0.075 } });
  TestValidator.predicate("changed finite shaft cannot inherit a probe derivative", thicker.provenance.derivative !== prepared.provenance.derivative &&
    nclose(faceBrowTubeStations(thicker.parts[0].geometry.mesh, 2)[0].radius, 0.000075, 1e-12));
  const changed = prepareFaceBrowFibres({ ...props, document: { ...props.document, shape: { width: 1 } } });
  TestValidator.predicate("changed connected state rebuilds frame and derivative", changed.provenance.derivative !== prepared.provenance.derivative &&
    nclose(changed.frame.origin[0], 0.75, 1e-12) && nclose(faceBrowTubeStations(changed.parts[0].geometry.mesh, 2)[0].point[0], 0.75, 1e-12));
  TestValidator.equals("zero explicit population adds no probe", prepareFaceBrowFibres({ ...props, fibres: 0 }).parts.length, 0);
  const flow = { sections: [0, 1].map((at) => ({ at, lower: { tip: 0.101, outwardBend: 0 }, upper: { tip: 0.101, outwardBend: 0 } })) };
  TestValidator.equals("complete explicit flow replaces span", prepareFaceBrowFibres({ ...props,
    profile: { ...props.profile, span: undefined, flow } }).parts.length, 1);
  TestValidator.predicate("wrong basis refuses stale derivative", throwsError(() => prepareFaceBrowFibres({ ...props,
    document: { ...props.document, basis: "stale" } }), "host basis"));
  TestValidator.predicate("missing convention refuses", throwsError(() => prepareFaceBrowFibres({ ...props, convention: " " }), "probe convention"));
  TestValidator.predicate("missing host refuses", throwsError(() => prepareFaceBrowFibres({ ...props, host: "missing" }), "connected host"));
  for (const profile of [{ ...props.profile, representation: "ribbon" as const }, { ...props.profile, rootBand: undefined },
    { ...props.profile, span: undefined }, { ...props.profile, endFade: undefined }, { ...props.profile, densitySeed: undefined }])
    TestValidator.predicate("implicit consumer defaults refuse", throwsError(() => prepareFaceBrowFibres({ ...props, profile }), "explicit tube"));
  TestValidator.predicate("actual model material gate refuses", throwsError(() => prepareFaceBrowFibres({ ...props, finish: "missing" }), "model gate"));
};
