import { AutoMovieHumanLegGirth } from "./AutoMovieHumanLegGirth";
import type { AutoMovieHumanLegReliefWindow } from "./AutoMovieHumanLegReliefWindow";

/**
 * The leg's thirteen relief windows as one table: each a bump or hollow in
 * its own frame (its own centre on the leg's bone, its own section angle,
 * extents and displacement axis) built by the one rule
 * `AutoMovieHumanLegReliefWindow.create`, with a net whose three outer rings
 * are zero, so its height, slope and curvature vanish at the edge (rule J7).
 * Each window's numbers are conventions awaiting a relief fit on the
 * references (as the foot's malleoli): their sizes are anatomical sizes in
 * local radii, not measured medians.
 */
export namespace AutoMovieHumanLegReliefWindows {
  /** How much higher the lateral head of the gastrocnemius stands than the medial head, a share of the shank: the lateral head is the higher and smaller (map.md, 7.2). */
  export const LATERAL_RISE: number = 0.04;

  /**
   * The kneecap as a relief window in its own frame: its own centre on the
   * shank (0.086 of the bone), its own section angle, extents and
   * displacement axis, with a net whose three outer rings are zero, so its
   * height, slope and curvature vanish at the edge (rule J7).
   *
   * Mid-patella stands 36 mm under the knee centre on the references (ANSUR II: 16.9 mm women, 3.3 mm men under the lateral epicondyle and 11.2 and 20.2 mm above tibiale); the patella is about 45 mm long and 50 mm broad, so a half extent of half a knee radius (27 mm) and 0.46 radians (25 mm at 54 mm radius). It pushes forward and 10 degrees down, along its own axis.
   */
  export const PATELLA: AutoMovieHumanLegReliefWindow.IWindow = {
    name: "leg.patella",
    segment: "shank",
    share: 0.086,
    angle: 0,
    halfStation: 0.5,
    halfAngle: 0.46,
    height: 0.1,
    axis: [0.9848, -0.1736, 0],
  };

  /**
   * The tibial tuberosity as a relief window in its own frame: its own centre on the
   * shank (0.14 of the bone), its own section angle, extents and
   * displacement axis, with a net whose three outer rings are zero, so its
   * height, slope and curvature vanish at the edge (rule J7).
   *
   * Tibiale stands 11.2 to 20.2 mm under mid-patella (ANSUR II); the tuberosity is a small forward prominence about 60 mm under the knee centre.
   */
  export const TIBIAL_TUBEROSITY: AutoMovieHumanLegReliefWindow.IWindow = {
    name: "leg.tibialTuberosity",
    segment: "shank",
    share: 0.14,
    angle: 0,
    halfStation: 0.3,
    halfAngle: 0.25,
    height: 0.04,
    axis: [1, 0, 0],
  };

  /**
   * The fibular head as a relief window in its own frame: its own centre on the
   * shank (0.07 of the bone), its own section angle, extents and
   * displacement axis, with a net whose three outer rings are zero, so its
   * height, slope and curvature vanish at the edge (rule J7).
   *
   * The fibular head stands slightly above the level of the tibial tuberosity, behind and lateral to the lateral tibial condyle (Gray 1918, docs/anatomy/skeleton.md), so its window stands posterolateral (120 degrees round the section) and apart from the lateral condyle's at 90 degrees: two bumps summed at one place read as a knob, which the references' lateral knee does not show.
   */
  export const FIBULAR_HEAD: AutoMovieHumanLegReliefWindow.IWindow = {
    name: "leg.fibularHead",
    segment: "shank",
    share: 0.07,
    angle: 2.0944,
    halfStation: 0.4,
    halfAngle: 0.35,
    height: 0.025,
    axis: [-0.5, 0, 0.866],
  };

  /**
   * The medial femoral condyle as a relief window in its own frame: its own centre on the
   * shank (0 of the bone), its own section angle, extents and
   * displacement axis, with a net whose three outer rings are zero, so its
   * height, slope and curvature vanish at the edge (rule J7).
   *
   * The medial epicondyle is the more prominent (Gray 1918); the joint centre stands at the epicondyles (docs/anatomy/skeleton.md).
   */
  export const MEDIAL_CONDYLE: AutoMovieHumanLegReliefWindow.IWindow = {
    name: "leg.medialCondyle",
    segment: "shank",
    share: 0,
    angle: 4.7124,
    halfStation: 0.6,
    halfAngle: 0.5,
    height: 0.05,
    axis: [0, 0, -1],
  };

  /**
   * The lateral femoral condyle as a relief window in its own frame: its own centre on the
   * shank (0 of the bone), its own section angle, extents and
   * displacement axis, with a net whose three outer rings are zero, so its
   * height, slope and curvature vanish at the edge (rule J7).
   *
   * The lateral epicondyle; the joint centre stands at the epicondyles (docs/anatomy/skeleton.md).
   */
  export const LATERAL_CONDYLE: AutoMovieHumanLegReliefWindow.IWindow = {
    name: "leg.lateralCondyle",
    segment: "shank",
    share: 0,
    angle: 1.5708,
    halfStation: 0.6,
    halfAngle: 0.5,
    height: 0.04,
    axis: [0, 0, 1],
  };

  /**
   * The hollow behind the knee as a relief window in its own frame: its own centre on the
   * thigh (0.962 of the bone), its own section angle, extents and
   * displacement axis, with a net whose three outer rings are zero, so its
   * height, slope and curvature vanish at the edge (rule J7).
   *
   * The popliteal fossa spans from about 40 mm above to 20 mm under the joint line, centred 15 mm above it; the hollow is the skin moved forward, into the leg, between the hamstring tendons.
   */
  export const POPLITEAL_FOSSA: AutoMovieHumanLegReliefWindow.IWindow = {
    name: "leg.poplitealFossa",
    segment: "thigh",
    share: 0.962,
    angle: 3.1416,
    halfStation: 0.7,
    halfAngle: 0.45,
    height: 0.05,
    axis: [1, 0, 0],
  };

  /**
   * The medial head of the gastrocnemius as a relief window in its own frame: its own centre on the
   * shank (at the calf tape's site, the calf's maximum), its own section angle, extents and
   * displacement axis, with a net whose three outer rings are zero, so its
   * height, slope and curvature vanish at the edge (rule J7).
   *
   * The medial head is the lower and larger (map.md, 7.2); the belly runs about 170 mm, so a half extent of 1.6 radii, centred on the calf tape's site, where the girth law makes the calf's maximum; it pushes out along its own axis, backward and medial.
   */
  export const GASTROCNEMIUS_MEDIAL_HEAD: AutoMovieHumanLegReliefWindow.IWindow = {
    name: "leg.gastrocnemiusMedialHead",
    segment: "shank",
    share: AutoMovieHumanLegGirth.CALF_SITE,
    angle: 4.2761,
    halfStation: 1.6,
    halfAngle: 0.6,
    height: 0.08,
    axis: [-0.4226, 0, -0.9063],
  };

  /**
   * The lateral head of the gastrocnemius as a relief window in its own frame: its own centre on the
   * shank (above the medial head by {@link LATERAL_RISE} of the bone), its own section angle, extents and
   * displacement axis, with a net whose three outer rings are zero, so its
   * height, slope and curvature vanish at the edge (rule J7).
   *
   * The lateral head, higher and smaller than the medial (map.md, 7.2); it pushes out along its own axis, backward and lateral.
   */
  export const GASTROCNEMIUS_LATERAL_HEAD: AutoMovieHumanLegReliefWindow.IWindow = {
    name: "leg.gastrocnemiusLateralHead",
    segment: "shank",
    share: AutoMovieHumanLegGirth.CALF_SITE - LATERAL_RISE,
    angle: 2.3562,
    halfStation: 1.2,
    halfAngle: 0.5,
    height: 0.05,
    axis: [-0.7071, 0, 0.7071],
  };

  /**
   * The soleus' distal bulge either side of the Achilles tendon as a relief window in its own frame: its own centre on the
   * shank (0.55 of the bone), its own section angle, extents and
   * displacement axis, with a net whose three outer rings are zero, so its
   * height, slope and curvature vanish at the edge (rule J7).
   *
   * The soleus shows distal to the gastrocnemius' bellies (Gray 1918); it pushes straight back.
   */
  export const SOLEUS_BELLY: AutoMovieHumanLegReliefWindow.IWindow = {
    name: "leg.soleusBelly",
    segment: "shank",
    share: 0.55,
    angle: 3.1416,
    halfStation: 1,
    halfAngle: 0.9,
    height: 0.03,
    axis: [-1, 0, 0],
  };

  /**
   * The Achilles tendon as a relief window in its own frame: its own centre on the
   * shank (0.85 of the bone), its own section angle, extents and
   * displacement axis, with a net whose three outer rings are zero, so its
   * height, slope and curvature vanish at the edge (rule J7).
   *
   * A narrow ridge on the posterior midline above the heel (map.md, 7.2); its extent is the tendon's, about 120 mm long and 15 mm broad.
   */
  export const ACHILLES_TENDON: AutoMovieHumanLegReliefWindow.IWindow = {
    name: "leg.achillesTendon",
    segment: "shank",
    share: 0.85,
    angle: 3.1416,
    halfStation: 1.8,
    halfAngle: 0.25,
    height: 0.05,
    axis: [-1, 0, 0],
  };

  /**
   * The teardrop of the vastus medialis above the knee as a relief window in its own frame: its own centre on the
   * thigh (0.88 of the bone), its own section angle, extents and
   * displacement axis, with a net whose three outer rings are zero, so its
   * height, slope and curvature vanish at the edge (rule J7).
   *
   * The vastus medialis' fibres run low on the medial side above the patella (Gray 1918); it pushes anteromedially.
   */
  export const VASTUS_MEDIALIS_TEARDROP: AutoMovieHumanLegReliefWindow.IWindow = {
    name: "leg.vastusMedialisTeardrop",
    segment: "thigh",
    share: 0.88,
    angle: 5.4978,
    halfStation: 0.8,
    halfAngle: 0.5,
    height: 0.04,
    axis: [0.7071, 0, -0.7071],
  };

  /**
   * The quadriceps' front as a relief window in its own frame: its own centre on
   * the thigh (0.45 of the bone), its own section angle, extents and
   * displacement axis, with a net whose three outer rings are zero, so its
   * height, slope and curvature vanish at the edge (rule J7).
   *
   * The rectus femoris and the vasti make the thigh's front convex in side view
   * from the groin to the suprapatellar level, fullest a little above the
   * thigh's middle. The window spans that run along the bone (1.8 local radii
   * either side of its centre, about 0.35 of the femur on f1) and the anterior
   * sector between the vastus medialis and the vastus lateralis (0.7 radians
   * either side of straight ahead), and pushes forward along the section's own
   * forward axis. It is a bump added to the tube's envelope; the tube is
   * rescaled to the girth law afterwards, so the bump moves volume to the front
   * and the tapes still read their inputs.
   */
  export const QUADRICEPS: AutoMovieHumanLegReliefWindow.IWindow = {
    name: "leg.quadriceps",
    segment: "thigh",
    share: 0.45,
    angle: 0,
    halfStation: 1.8,
    halfAngle: 0.7,
    height: 0.04,
    axis: [1, 0, 0],
  };

  /**
   * The crease under the buttock as a relief window in its own frame: its own centre at the thigh's root, the leg's first own row under
   * the crotch ring (where the trunk's ring has handed the skin over), its own section angle, extents and
   * displacement axis, with a net whose three outer rings are zero, so its
   * height, slope and curvature vanish at the edge (rule J7).
   *
   * The buttock window of the trunk starts at the crotch ring with height, slope and curvature zero, so the fold is the ring's own posterior arc; this window continues it a short way down as a shallow hollow, the skin moved forward.
   */
  export const INFRAGLUTEAL_FOLD: AutoMovieHumanLegReliefWindow.IWindow = {
    name: "leg.infraglutealFold",
    segment: "thigh",
    share: 0.2,
    angle: 3.4907,
    halfStation: 0.4,
    halfAngle: 0.5,
    height: 0.03,
    axis: [1, 0, 0],
    anchor: "crotch",
  };

  /** Every window, knee first, the thigh's last. */
  export const ALL: readonly AutoMovieHumanLegReliefWindow.IWindow[] = [
    PATELLA,
    TIBIAL_TUBEROSITY,
    FIBULAR_HEAD,
    MEDIAL_CONDYLE,
    LATERAL_CONDYLE,
    POPLITEAL_FOSSA,
    GASTROCNEMIUS_MEDIAL_HEAD,
    GASTROCNEMIUS_LATERAL_HEAD,
    SOLEUS_BELLY,
    ACHILLES_TENDON,
    VASTUS_MEDIALIS_TEARDROP,
    QUADRICEPS,
    INFRAGLUTEAL_FOLD,
  ];
}
