import type {
  IAutoMovieHumanFaceHair,
  assertHumanFaceHair,
  buildHumanFaceHairMesh,
  closeHumanFaceHairContact,
  createHumanFaceHairBuilder,
  createHumanFaceHairGatherField,
  createHumanFaceHairRoots,
  createHumanFaceHairTailSpread,
  createHumanFaceScalpTint,
  evaluateHumanFaceHairDirection,
  growHumanFaceHairStrand,
  humanFaceHairClosureLoops,
  humanFaceHairContact,
  humanFaceHairDensity,
  humanFaceHairEmergence,
  humanFaceHairFrame,
  humanFaceHairLength,
  humanFaceHairSequence,
  humanFaceHairlineBoundary,
  humanFaceHairlineCoverage,
  integrateHumanFaceHairCurve,
  interpolateHumanFaceHairStrands,
  resolveHumanFaceHairGatherAnchor,
} from "@automovie/human";

/**
 * Numerical scalp-hair source inspection for the shared 18-document study.
 * The documents were migrated and GPU-reviewed, but source observations do not
 * accept photographic likeness or arbitrary parameter combinations. This
 * carrier retains source observations without review fingerprints.
 *
 * @evidence {@link IAutoMovieHumanFaceHair} Read the numerical layer document and its admission. Generated station arrays, photos and personal resource keys have no field in this schema.
 * @evidence {@link IAutoMovieHumanFaceHair.layers} Read the eight-layer admission and empty-list behavior. The limit bounds construction cost, not biological hair populations.
 * @evidence {@link IAutoMovieHumanFaceHair.Layer} Read every root, length, direction, sampling and finish field beside the compiled builder. Coordinates use neutral head metres; physical rod dynamics and follicle density are not claimed.
 * @evidence {@link IAutoMovieHumanFaceHair.Layer.gather} Read the polar scalp tie, its radius and strength, and the axial tail with optional numeric cross-section radius/reach. No personal curve is stored.
 * @evidence {@link IAutoMovieHumanFaceHair.Layer.id} Read nonblank/unique admission and generated part/material naming. No person-dependent dispatch uses this name.
 * @evidence {@link IAutoMovieHumanFaceHair.Layer.surface} Read exact lookup against shared source surfaces and current complete position buffers.
 * @evidence {@link IAutoMovieHumanFaceHair.Layer.domain} Read exact lookup of an anatomical triangle subset belonging to the selected shared surface. It cannot name a private groom.
 * @evidence {@link IAutoMovieHumanFaceHair.Layer.count} Read inclusive integer 0..1024 admission, empty construction and retained-prefix area sampling. This is strip count, not biological density.
 * @evidence {@link IAutoMovieHumanFaceHair.Layer.seed} Read unsigned integer admission and retained candidate sequence offsets. Rejected candidates do not renumber surviving phase or variation.
 * @evidence {@link IAutoMovieHumanFaceHair.Layer.hairline} Read the four polar boundaries, squared azimuth blending and rejection-only mask over the shared domain. This does not classify scalp anatomy from a photograph.
 * @evidence {@link IAutoMovieHumanFaceHair.Layer.lengthAxes} Read six positive metric values blended by absolute neutral radial components. Emergence belongs to the resulting centreline length; the axes are a field, not measured landmarks.
 * @evidence {@link IAutoMovieHumanFaceHair.Layer.lengthVariation} Read deterministic base-seven fractional modulation and the worst-case interval admission. It stores amplitude, never per-root offsets.
 * @evidence {@link IAutoMovieHumanFaceHair.Layer.samplingStep} Read the metric chord bound, curl sampling comparison and aggregate interval budget. This is numerical resolution, not a saved guide count.
 * @evidence {@link IAutoMovieHumanFaceHair.Layer.clearance} Read its nonnegative addition to the free-strip contact margin. The root fan is explicitly outside that distance proof.
 * @evidence {@link IAutoMovieHumanFaceHair.Layer.flow} Read finite nonzero admission and inward-component removal before lift/curl. Cancellation refuses instead of introducing a random replacement direction.
 * @evidence {@link IAutoMovieHumanFaceHair.Layer.lift} Read nonnegative direction bias and exponential decay with positive metric reach. It is static styling, not measured material stiffness.
 * @evidence {@link IAutoMovieHumanFaceHair.Layer.part} Read normalized plane coordinates, tanh transition, tangent projection, optional Gaussian root envelope and arc-length decay. The envelope does not store per-root guides.
 * @evidence {@link IAutoMovieHumanFaceHair.Layer.curl} Read wave/helix branches, angular modulation and eight-interval wavelength admission. Contact may modify the desired curl and no stress-free rod solution is claimed.
 * @evidence {@link IAutoMovieHumanFaceHair.Layer.taper} Read the tip ratio and start fraction applied to measured arc-length UV. Generated strips do not receive a second curve fit.
 * @evidence {@link IAutoMovieHumanFaceHair.Layer.finish} Read linear RGB, roughness and procedural fibre texture inputs. The common PNG formula produces derived pixels without personal bitmap authoring.
 * @evidence {@link assertHumanFaceHair} Read structural equality, finite/range checks, optional fields, unique identities and joint allocation refusal. Domain/contact feasibility is deferred to the compiled builder, including empty-layer domain lookup.
 * @evidence {@link createHumanFaceHairRoots} Read owned neutral triangle points, area CDF, square-root barycentric coordinates, polar rejection and preserved sequence identities. Sampling exhaustion is a refusal, not an anatomical result.
 * @evidence {@link humanFaceHairDensity} Read the ribbon width taken from the population's own local density: the k-nearest-neighbour estimator over the seated roots, the side of the scalp area one root is responsible for, and the measured-area fallback for a population too small to have neighbours.
 * @evidence {@link humanFaceHairSequence} Read the radical-inverse loop and its admitted caller indices. Prime bases select repeatable coordinates with no global random state.
 * @evidence {@link humanFaceHairFrame} Read finite nonzero direction admission and least-aligned-axis transverse conditioning. The alternate axis defines a frame only and never replaces a cancelled comb direction.
 * @evidence {@link evaluateHumanFaceHairDirection} Read parting, lift and both curl branches in their declared order. The field remains kinematic and root-space regional influence is independent of deformed surface coordinates.
 * @evidence {@link humanFaceHairEmergence} Read the exit angle from the scalp: the surface normal tilted toward the field's tangential part, by the hairline's own ramp between the mid-scalp and hairline figures.
 * @evidence {@link humanFaceHairContact} Read the clearance (half width, half step, requested clearance and a scale-derived allowance) and the nearest-feature projection shared by guides and interpolated strands.
 * @evidence {@link humanFaceHairLength} Read the six axial lengths combined by absolute chart components and the seeded variation, shared by guides and strands.
 * @evidence {@link resolveHumanFaceHairGatherAnchor} Read the shared domain ray hit and its current-surface barycentric replay; a missing direction refuses.
 * @evidence {@link createHumanFaceHairGatherField} Read the current scalp graph distance and tangent descent used before the tie.
 * @evidence {@link createHumanFaceHairTailSpread} Read the deterministic filled cross-section after the tie.
 * @evidence {@link interpolateHumanFaceHairStrands} Read the guide interpolation: nearest same-side guides by scalp distance, exponential weights against the guides' mean spacing, equal arc-length blending and scaling to the strand's own length.
 * @evidence {@link createHumanFaceScalpTint} Read the scalp tint: coverage from the hairline transition ramp and the root region envelope on the neutral, the densest layer's colour, and the clamped gain toward the hair colour over the skin finish.
 * @evidence {@link humanFaceHairlineCoverage} Read the hairline transition: the zone's depth read as the polar angle it subtends at a direction's own distance, and the smoothstep both the population and the scalp colour take from it.
 * @evidence {@link humanFaceHairlineBoundary} Read the hairline boundary blended from the four authored angles by the squared horizontal chart components, shared by root sampling and scalp coverage.
 * @evidence {@link growHumanFaceHairStrand} Read the placement of one interpolated strand: every station after the root projected by the guides' contact rule, and the strand grown by the integrator when that projection refuses.
 * @evidence {@link integrateHumanFaceHairCurve} Read neutral regional length, seeded phase, signed-distance contact, chord bisection and final metric truncation. Arithmetic allowance is explicit; root-fan and hair-to-hair clearance remain unproved.
 * @evidence {@link buildHumanFaceHairMesh} Read single-root fan, paired metric rows, minimal frame transport, measured UV/taper and nondegenerate triangle refusal. It meshes the integrator's stations without Catmull-Rom interpolation.
 * @evidence {@link humanFaceHairClosureLoops} Read the closure rim: edges used by one closure triangle, directed as wound, chained into loops, with branching and open rims refused.
 * @evidence {@link closeHumanFaceHairContact} Read the per-evaluation cap: each rim loop's current centroid appended and fanned over its directed rim edges.
 * @evidence {@link createHumanFaceHairBuilder} Read shared domain/closure admission, neutral/current correspondence, owned construction and procedural finishes. The actual connected builder now calls this function; the 18 published numerical documents are migrated; photographic likeness is still pending.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-parametric-hair Records source inspection and remaining root-fan, hair-to-hair contact and photographic likeness verification gaps for the shared numerical path. It does not accept the current rendered population.
 */
export const humanFaceNumericalHairReview =
  "Numerical hair source inspection; photographic likeness pending" as const;
