import type {
  IAutoMovieHumanFaceHair,
  assertHumanFaceHair,
  buildHumanFaceHairMesh,
  createHumanFaceHairBuilder,
  createHumanFaceHairRoots,
  evaluateHumanFaceHairDirection,
  humanFaceHairContact,
  humanFaceHairFrame,
  humanFaceHairLength,
  humanFaceHairSequence,
  integrateHumanFaceHairCurve,
  interpolateHumanFaceHairStrands,
} from "@automovie/human";

/**
 * Numerical scalp-hair source inspection during migration from personal guides.
 * These are construction observations, without current-population visual or
 * anatomical acceptance. The old 18 documents still need scalar migration and
 * rendered verification. Source fingerprints are obtained only after inspection.
 *
 * @evidence {@link IAutoMovieHumanFaceHair} Read the numerical layer document and its admission. Generated station arrays, photos and personal resource keys have no field in this schema.
 * @evidenceReview {@link IAutoMovieHumanFaceHair} #3ad485c Read the complete numerical document after adding a six-coefficient root envelope. The same canonical layers still contain no generated coordinates, photographs or private resource keys; current population migration remains unfinished. Reread with layers that may declare a guide hierarchy.
 * @evidence {@link IAutoMovieHumanFaceHair.layers} Read the eight-layer admission and empty-list behavior. The limit bounds construction cost, not biological hair populations.
 * @evidenceReview {@link IAutoMovieHumanFaceHair.layers} #5d32414 Read the eight-layer admission and empty-list behavior. The limit bounds construction cost, not biological hair populations.
 * @evidence {@link IAutoMovieHumanFaceHair.Layer} Read every root, length, direction, sampling and finish field beside the compiled builder. Coordinates use neutral head metres; physical rod dynamics and follicle density are not claimed.
 * @evidenceReview {@link IAutoMovieHumanFaceHair.Layer} #64344f1 Read rootRegion beside area sampling, independent part.region, per-layer fields and editor transactions. Local root preference preserves the requested count and is explicitly not biological density. Reread with the optional `guides` hierarchy (a fraction of roots integrated as guides, the rest interpolated from one to eight neighbours).
 * @evidence {@link IAutoMovieHumanFaceHair.Layer.id} Read nonblank/unique admission and generated part/material naming. No person-dependent dispatch uses this name.
 * @evidenceReview {@link IAutoMovieHumanFaceHair.Layer.id} #994b721 Read nonblank/unique admission and generated part/material naming. No person-dependent dispatch uses this name.
 * @evidence {@link IAutoMovieHumanFaceHair.Layer.surface} Read exact lookup against shared source surfaces and current complete position buffers.
 * @evidenceReview {@link IAutoMovieHumanFaceHair.Layer.surface} #743f9bd Read exact lookup against shared source surfaces and current complete position buffers.
 * @evidence {@link IAutoMovieHumanFaceHair.Layer.domain} Read exact lookup of an anatomical triangle subset belonging to the selected shared surface. It cannot name a private groom.
 * @evidenceReview {@link IAutoMovieHumanFaceHair.Layer.domain} #7826069 Read exact lookup of an anatomical triangle subset belonging to the selected shared surface. It cannot name a private groom.
 * @evidence {@link IAutoMovieHumanFaceHair.Layer.count} Read inclusive integer 0..1024 admission, empty construction and retained-prefix area sampling. This is strip count, not biological density.
 * @evidenceReview {@link IAutoMovieHumanFaceHair.Layer.count} #ab4c708 Read inclusive integer 0..1024 admission, empty construction and retained-prefix area sampling. This is strip count, not biological density.
 * @evidence {@link IAutoMovieHumanFaceHair.Layer.seed} Read unsigned integer admission and retained candidate sequence offsets. Rejected candidates do not renumber surviving phase or variation.
 * @evidenceReview {@link IAutoMovieHumanFaceHair.Layer.seed} #fcf8bd8 Read unsigned integer admission and retained candidate sequence offsets. Rejected candidates do not renumber surviving phase or variation.
 * @evidence {@link IAutoMovieHumanFaceHair.Layer.hairline} Read the four polar boundaries, squared azimuth blending and rejection-only mask over the shared domain. This does not classify scalp anatomy from a photograph.
 * @evidenceReview {@link IAutoMovieHumanFaceHair.Layer.hairline} #c32e2eb Read the four polar boundaries, squared azimuth blending and rejection-only mask over the shared domain. This does not classify scalp anatomy from a photograph.
 * @evidence {@link IAutoMovieHumanFaceHair.Layer.lengthAxes} Read six positive metric values blended by absolute neutral radial components. Emergence belongs to the resulting centreline length; the axes are a field, not measured landmarks.
 * @evidenceReview {@link IAutoMovieHumanFaceHair.Layer.lengthAxes} #1546c2e Read six positive metric values blended by absolute neutral radial components. Emergence belongs to the resulting centreline length; the axes are a field, not measured landmarks.
 * @evidence {@link IAutoMovieHumanFaceHair.Layer.lengthVariation} Read deterministic base-seven fractional modulation and the worst-case interval admission. It stores amplitude, never per-root offsets.
 * @evidenceReview {@link IAutoMovieHumanFaceHair.Layer.lengthVariation} #e758db3 Read deterministic base-seven fractional modulation and the worst-case interval admission. It stores amplitude, never per-root offsets.
 * @evidence {@link IAutoMovieHumanFaceHair.Layer.width} Read positive metric admission, half-width contact radius and transported paired mesh rows. Width remains independent of painted fibres.
 * @evidenceReview {@link IAutoMovieHumanFaceHair.Layer.width} #632b876 Read positive metric admission, half-width contact radius and transported paired mesh rows. Width remains independent of painted fibres.
 * @evidence {@link IAutoMovieHumanFaceHair.Layer.samplingStep} Read the metric chord bound, curl sampling comparison and aggregate interval budget. This is numerical resolution, not a saved guide count.
 * @evidenceReview {@link IAutoMovieHumanFaceHair.Layer.samplingStep} #2d622f2 Read the metric chord bound, curl sampling comparison and aggregate interval budget. This is numerical resolution, not a saved guide count.
 * @evidence {@link IAutoMovieHumanFaceHair.Layer.clearance} Read its nonnegative addition to the free-strip contact margin. The root fan is explicitly outside that distance proof.
 * @evidenceReview {@link IAutoMovieHumanFaceHair.Layer.clearance} #8b1de0d Read its nonnegative addition to the free-strip contact margin. The root fan is explicitly outside that distance proof.
 * @evidence {@link IAutoMovieHumanFaceHair.Layer.flow} Read finite nonzero admission and inward-component removal before lift/curl. Cancellation refuses instead of introducing a random replacement direction.
 * @evidenceReview {@link IAutoMovieHumanFaceHair.Layer.flow} #09d39b5 Read finite nonzero admission and inward-component removal before lift/curl. Cancellation refuses instead of introducing a random replacement direction.
 * @evidence {@link IAutoMovieHumanFaceHair.Layer.lift} Read nonnegative direction bias and exponential decay with positive metric reach. It is static styling, not measured material stiffness.
 * @evidenceReview {@link IAutoMovieHumanFaceHair.Layer.lift} #65383f5 Read nonnegative direction bias and exponential decay with positive metric reach. It is static styling, not measured material stiffness.
 * @evidence {@link IAutoMovieHumanFaceHair.Layer.part} Read normalized plane coordinates, tanh transition, tangent projection, optional Gaussian root envelope and arc-length decay. The envelope does not store per-root guides.
 * @evidenceReview {@link IAutoMovieHumanFaceHair.Layer.part} #3425558 Read the shared Region type and the same Gaussian arithmetic in parting. Root sampling and parting have independent values; extracting the formula preserves the previous directional calculation.
 * @evidence {@link IAutoMovieHumanFaceHair.Layer.curl} Read wave/helix branches, angular modulation and eight-interval wavelength admission. Contact may modify the desired curl and no stress-free rod solution is claimed.
 * @evidenceReview {@link IAutoMovieHumanFaceHair.Layer.curl} #af8e7f9 Read wave/helix branches, angular modulation and eight-interval wavelength admission. Contact may modify the desired curl and no stress-free rod solution is claimed.
 * @evidence {@link IAutoMovieHumanFaceHair.Layer.taper} Read the tip ratio and start fraction applied to measured arc-length UV. Generated strips do not receive a second curve fit.
 * @evidenceReview {@link IAutoMovieHumanFaceHair.Layer.taper} #b3959ea Read the tip ratio and start fraction applied to measured arc-length UV. Generated strips do not receive a second curve fit.
 * @evidence {@link IAutoMovieHumanFaceHair.Layer.finish} Read linear RGB, roughness and procedural fibre texture inputs. The common PNG formula produces derived pixels without personal bitmap authoring.
 * @evidenceReview {@link IAutoMovieHumanFaceHair.Layer.finish} #cc36439 Read linear RGB, roughness and procedural fibre texture inputs. The common PNG formula produces derived pixels without personal bitmap authoring.
 * @evidence {@link assertHumanFaceHair} Read structural equality, finite/range checks, optional fields, unique identities and joint allocation refusal. Domain/contact feasibility is deferred to the compiled builder, including empty-layer domain lookup.
 * @evidenceReview {@link assertHumanFaceHair} #b04dec7 Read structural admission and both optional envelope paths. Finite centres and strictly positive finite spreads are required even at zero count; source-domain lookup and feasibility remain builder obligations. Reread the guide admission: fraction in (0,1], integral neighbours in [1,8].
 * @evidence {@link createHumanFaceHairRoots} Read owned neutral triangle points, area CDF, square-root barycentric coordinates, polar rejection and preserved sequence identities. Sampling exhaustion is a refusal, not an anatomical result.
 * @evidenceReview {@link createHumanFaceHairRoots} #0c7e04a Read neutral area sampling followed by polar and base-13 Gaussian rejection. Sequence identities and barycentric seats are retained, omitted regions admit every candidate, and exhausted local populations explicitly refuse.
 * @evidence {@link humanFaceHairSequence} Read the radical-inverse loop and its admitted caller indices. Prime bases select repeatable coordinates with no global random state.
 * @evidenceReview {@link humanFaceHairSequence} #7f7fc99 Read the radical-inverse loop and its admitted caller indices. Prime bases select repeatable coordinates with no global random state.
 * @evidence {@link humanFaceHairFrame} Read finite nonzero direction admission and least-aligned-axis transverse conditioning. The alternate axis defines a frame only and never replaces a cancelled comb direction.
 * @evidenceReview {@link humanFaceHairFrame} #03ce90a Read finite nonzero direction admission and least-aligned-axis transverse conditioning. The alternate axis defines a frame only and never replaces a cancelled comb direction.
 * @evidence {@link evaluateHumanFaceHairDirection} Read parting, lift and both curl branches in their declared order. The field remains kinematic and root-space regional influence is independent of deformed surface coordinates.
 * @evidenceReview {@link evaluateHumanFaceHairDirection} #bb25244 Read the extracted envelope call against its former expression: optional uniform weight, independent-axis squared distance and exponential weight are unchanged. Parting, lift and wave/helix order remain kinematic; no new visual acceptance is claimed.
 * @evidence {@link humanFaceHairContact} Read the clearance (half width, half step, requested clearance and a scale-derived allowance) and the nearest-feature projection shared by guides and interpolated strands.
 * @evidenceReview {@link humanFaceHairContact} #4d19da6 Read the allowance and projection lifted out of the integrator unchanged, the 64-step refusal, and that interpolated strands call the same projection on every station after the root.
 * @evidence {@link humanFaceHairLength} Read the six axial lengths combined by absolute chart components and the seeded variation, shared by guides and strands.
 * @evidenceReview {@link humanFaceHairLength} #ba22710 Read the length lifted out of the integrator unchanged and its singular-chart refusal; a strand takes its own regional length rather than its guides'.
 * @evidence {@link interpolateHumanFaceHairStrands} Read the guide interpolation: nearest same-side guides by scalp distance, exponential weights against the guides' mean spacing, equal arc-length blending and scaling to the strand's own length.
 * @evidenceReview {@link interpolateHumanFaceHairStrands} #9e3bad5 Read the part gate, the cut-off at twice the spacing with the nearest-guide fallback, the single-guide case, and the refusals for no guide, a zero-length guide and a collapsed blend; no contact query is made here, the builder projects the result.
 * @evidence {@link integrateHumanFaceHairCurve} Read neutral regional length, seeded phase, signed-distance contact, chord bisection and final metric truncation. Arithmetic allowance is explicit; root-fan and hair-to-hair clearance remain unproved.
 * @evidenceReview {@link integrateHumanFaceHairCurve} #fa861d6 Read the shared scale-derived contact allowance and h + epsilon chord admission, including final extension by at most epsilon. The nearest-endpoint bound pays for both from the remaining contact allowance. Same-input Float32 GLB bytes remained exact in the 1,024-root probe; root-fan and hair-to-hair clearance remain unproved.
 * @evidence {@link buildHumanFaceHairMesh} Read single-root fan, paired metric rows, minimal frame transport, measured UV/taper and nondegenerate triangle refusal. It meshes the integrator's stations without Catmull-Rom interpolation.
 * @evidenceReview {@link buildHumanFaceHairMesh} #2d9fcf6 Read the first nonparallel tangent's emergence plane, straight-curve normal fallback and subsequent minimal transport. The analytic planar-width scenario failed before this correction. This inspection does not accept root-fan contact or current population appearance; the integrator's stations and measured UV/taper remain the geometry owners.
 * @evidence {@link createHumanFaceHairBuilder} Read shared domain/closure admission, neutral/current correspondence, owned construction and procedural finishes. The actual connected builder now calls this function; personal documents and population acceptance remain unfinished.
 * @evidenceReview {@link createHumanFaceHairBuilder} #c74bf42 Read shared domain/closure admission, neutral/current correspondence, owned construction and procedural finishes. The actual connected builder now calls this function; personal documents and population acceptance remain unfinished. Reread the guide selection by the root's own Halton identity, integration of guides only, same-side interpolation of the rest, projection of every strand station by the guides' contact rule, and the station budget over both.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-parametric-hair Records source inspection and remaining root-fan, migration and population verification gaps for the shared numerical path. It does not accept the current rendered population.
 */
export const humanFaceNumericalHairReview =
  "Numerical hair source inspection; population acceptance pending" as const;
