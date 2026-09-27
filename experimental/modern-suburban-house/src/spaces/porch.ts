/**
 * `front-porch`: the raised open porch, its three risers, three columns, front
 * beam and low sloped roof.
 *
 * Design owner: `docs/spaces/porch.md`. Floor X = [-5.75, 2.20], Z = [0, 2.20] m
 * at Y = 0 (01 ground-threshold-datums); its platform body reaches the lower
 * waiting base −0.45 − 0.12 m (01-paving-support raised-platform-support).
 * Stair width 1.50 m centred on the front door X = 0.90: three 0.15 m risers
 * from −0.45 m and two 0.30 m treads, derived backwards from the porch edge
 * Z = 2.20; the lower flat waiting belongs to the front walk.
 * Columns at X = -5.40 + 3.65 k (k = 0..2), Z = 1.975 m: base 0.35 m square
 * Y = [0, 0.15], shaft 0.25 m square Y = [0.15, 2.33], head 0.35 m square
 * Y = [2.33, 2.45]. Beam X = [-5.75, 2.20], Z = [1.85, 2.10], Y = [2.45, 2.70].
 * Roof weather surface P(Z) = 3.50 − Z/4 over X = [-6.10, 2.55], Z = [0, 2.35],
 * underside 0.22 m lower; the packer between the beam top and that underside
 * is derived from their gap so the roof does not float on the beam.
 */
import { PALETTE } from "./palette";
import { MAIN } from "./building";
import { block, rect, slopedSlab } from "./solids";
import { part, type IHousePart } from "./solid-records";
import { STOREYS } from "./storeys";
import { FRONT_DOOR } from "./rooms/entry";
import type { IExteriorZone, ISiteBuild } from "./site/zone";
import { WALK_DEPTH } from "./site/paving";

const OWNER = "porch.ts";
const PLATFORM_X = [-5.75, 2.2] as const;
const PLATFORM_BOTTOM = STOREYS.frontWalk - WALK_DEPTH;
const STEP_TREAD = 0.3;
/**
 * @evidence spaces/porch.md The porch's central access stair has an authored 1.50 m width.
 * @evidenceReview spaces/porch.md #c0cfebc porch.md:27 stair width 1.50 m centred on the door; 0.75 half-width gives steps sx0..sx1 = 1.50 m (porch.ts:95-98).
 * @evidence spaces/porch.md#porch-platform-access Its two tread sides stay 0.75 m from the front-door axis.
 * @evidenceReview spaces/porch.md#porch-platform-access #ba53bbe porch.ts:96-97 centre PORCH_STEP_CENTRE_X (door axis) +/-0.75; porch.md:27.
 * @evidence principles/core/source-units.md#source-scope-preservation This width belongs to the porch stair, while the front walk imports it for alignment.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Declared in porch.ts:37; readers porch.ts:96-97 and front-walk.ts:23,37 only.
 * @evidence principles/core/source-units.md#source-substantive-completion Steps and the continuous front-walk use one shared half-width.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Same export feeds step blocks (porch.ts:96-97) and FRONT_WALK.x (front-walk.ts:37).
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Porch-platform-access fixes the stair width at 1.50 m and front-walk-plan consumes it without a second path width.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 porch.md:27 fixes 1.50 m; site/front-walk.md:29 width and centre X consume the porch stair; front-walk.ts:37 has no own width literal.
 */
export const PORCH_STEP_HALF_WIDTH = 0.75;
/**
 * @evidence spaces/porch.md The porch steps take their centre from the entry doorway rather than a second X coordinate.
 * @evidenceReview spaces/porch.md #c0cfebc v-141 PORCH_STEP_CENTRE_X=(FRONT_DOOR.from+to)/2 (porch.ts:33); porch.md:27 steps centred on the door opening X.
 * @evidence spaces/porch.md#porch-platform-access Averaging FRONT_DOOR's two jambs keeps all three steps on the door axis.
 * @evidenceReview spaces/porch.md#porch-platform-access #ba53bbe v-141 Averaging the jambs holds (porch.ts:33), but the centre positions two step blocks (porch-step-1/2, porch.ts:80-95) and the walk; the third riser is the full-width platform front (porch.ts:76), not an axis-centred step. "all three steps" miscounts emitted steps.
 * @evidence principles/core/source-units.md#source-scope-preservation The calculation reads the entry owner's void without changing it.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Reads FRONT_DOOR (entry.ts:45) without writing it.
 * @evidence principles/core/source-units.md#source-substantive-completion The step blocks and front-walk interval consume this centre on every build.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 Step X porch.ts:80; FRONT_WALK.x front-walk.ts:33 (slab front-walk.ts:95); also environment.ts:294-297 route.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Porch-platform-access centres its 1.50 m stair on the front-door axis; this midpoint reads both FRONT_DOOR jambs.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 porch.md:27 centred on the door opening centre X; porch.ts:45 averages FRONT_DOOR.from/to (entry.ts:45-51).
 */
export const PORCH_STEP_CENTRE_X = (FRONT_DOOR.from + FRONT_DOOR.to) / 2;
/**
 * @evidence spaces/porch.md Three equal risers bridge the front walk and finished porch elevations.
 * @evidenceReview spaces/porch.md #c0cfebc v-141 (porchFloor-frontWalk)/3 = 0.15 (porch.ts:41); porch.md:27 three 0.15 risers from -0.45 to the porch floor.
 * @evidence spaces/porch.md#porch-platform-access Dividing the imported elevation difference by three preserves the step sequence when either datum moves.
 * @evidenceReview spaces/porch.md#porch-platform-access #ba53bbe v-141 Rise divides the imported STOREYS difference by 3 (porch.ts:41); tread tops porchFloor-rise*k (porch.ts:91).
 * @evidence principles/core/source-units.md#source-scope-preservation This is the porch's stair relation, not a new level alongside STOREYS.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Derived relation only; STOREYS untouched.
 * @evidence principles/core/source-units.md#source-substantive-completion Each tread top uses k times this derived rise beneath porchFloor.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 Block top STOREYS.porchFloor-PORCH_STEP_RISE*k (porch.ts:91).
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Porch-platform-access divides the 0.45 m difference between front walk and porch floor into three equal rises; this value reads both STOREYS datums.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 porch.md:27 three 0.15 m risers from -0.45 to the porch floor; porch.ts:53 (porchFloor-frontWalk)/3 from storeys.ts:40,42.
 */
export const PORCH_STEP_RISE = (STOREYS.porchFloor - STOREYS.frontWalk) / 3;
/**
 * @evidence spaces/porch.md The step run starts against the porch platform's front edge.
 * @evidenceReview spaces/porch.md #c0cfebc v-141 Step-1 edge = PORCH_STEP_BACK_Z = 2.2 (porch.ts:82) meets platform max Z 2.2 (porch.ts:76); porch.md:25,27. (Platform re-types 2.2; see 297.)
 * @evidence spaces/porch.md#porch-platform-access The Z=2.20 m edge locates the first tread and connector transition once.
 * @evidenceReview spaces/porch.md#porch-platform-access #ba53bbe v-141 Both porch-step edges (porch.ts:82) and the connector transition (environment.ts:296) read this one constant.
 * @evidence principles/core/source-units.md#source-scope-preservation The coordinate belongs to the porch platform, leaving the lower walk's extent to its owner.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Platform front edge now reads it (porch.ts:90), as do zone outline/anchor (:176,:180); front-walk extent stays in front-walk.ts:38 [PORCH_STEP_FRONT_Z, DRIVEWAY.z[1]]; porch emits no waiting pad. v141 FALSE (retyped 2.2) fixed.
 * @evidence principles/core/source-units.md#source-substantive-completion Both tread placement and the connector route read the same back edge.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 porch.ts:82 and environment.ts:296 both read PORCH_STEP_BACK_Z.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Porch-platform-access fixes the platform front edge at Z=2.20 m and derives both treads toward +Z from it; the platform, steps, zone, and connector share this export.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 porch.md:25 outline Z=[0,2.20]; :27 step Z derived backwards from the porch front end. Readers: platform porch.ts:90, steps :100, zone :176/:180, connector environment.ts:312.
 */
export const PORCH_STEP_BACK_Z = 2.2;
/**
 * @evidence spaces/porch.md Two 0.30 m treads extend from the platform to the lower waiting walk.
 * @evidenceReview spaces/porch.md #c0cfebc STEP_TREAD 0.3 (porch.ts:29), two treads (:99-113), PORCH_STEP_FRONT_Z (:69) is the walk start; porch.md:27.
 * @evidence spaces/porch.md#porch-platform-access The front step edge is derived from the platform edge plus both tread depths.
 * @evidenceReview spaces/porch.md#porch-platform-access #ba53bbe PORCH_STEP_FRONT_Z = PORCH_STEP_BACK_Z + 2*STEP_TREAD (porch.ts:69) and the platform front edge IS PORCH_STEP_BACK_Z (:90); porch.md:27. v141 FALSE fixed.
 * @evidence principles/core/source-units.md#source-scope-preservation The front walk imports this edge instead of inventing where its flat waiting begins.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 front-walk.ts:22,38 FRONT_WALK.z[0]=PORCH_STEP_FRONT_Z.
 * @evidence principles/core/source-units.md#source-substantive-completion The derived Z bounds the first walk slab and its logical zone.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f front-walk.ts:105 slab and zone outline/anchor/patch (:60-86) use FRONT_WALK.z[0].
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Porch-platform-access specifies two 0.30 m treads from its Z=2.20 m edge and front-walk-plan begins its lower waiting at their outer edge; this expression shares that contact.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 porch.md:25 edge Z=2.20, :27 two 0.30 m treads; site/front-walk.md:29 inner end Z from the first riser; porch.ts:69 and front-walk.ts:38 share it.
 */
export const PORCH_STEP_FRONT_Z = PORCH_STEP_BACK_Z + 2 * STEP_TREAD;
const porchRoof = (z: number): number => 3.5 - z / 4;

/** Emit the porch platform, steps, columns, beam, packer and roof. */
/**
 * @evidence spaces/porch.md This builder owns the complete raised entry porch, its access steps, columns, beam, packer, roof, and zone.
 * @evidenceReview spaces/porch.md #c0cfebc porch.ts:82-184 platform, 2 steps, 3x3 column parts, beam, packer, roof, front-porch zone.
 * @evidence spaces/porch.md#porch-platform-access The platform at Y=0 joins three 0.15 m risers to the front-walk level and names the front-porch standing zone.
 * @evidenceReview spaces/porch.md#porch-platform-access #ba53bbe Platform top STOREYS.porchFloor=0 (porch.ts:90); steps at -0.15/-0.30 down to the -0.45 walk; zone id front-porch (:174); porch.md:27.
 * @evidence spaces/porch.md#porch-roof-columns Three repeated column stacks carry a front beam and a sloped roof whose packer closes the beam-to-underside gap.
 * @evidenceReview spaces/porch.md#porch-roof-columns #6adada5 Loop c=0..2 base/shaft/head (porch.ts:114-140); beam :141-148; packer from beam top 2.7 to underside P-0.22 (:149-159); porch.md:55,:57.
 * @evidence principles/core/source-units.md#source-scope-preservation The builder leaves the lower waiting pad to front-walk and uses the imported STOREYS datums for platform height.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 No waiting pad emitted; platform Y from STOREYS.frontWalk-WALK_DEPTH to STOREYS.porchFloor (porch.ts:28,:89-90).
 * @evidence principles/core/source-units.md#source-substantive-completion Blocks, a sloped roof mesh, and the zone record are emitted in a fixed loop and part order.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Fixed-order parts array with loops (porch.ts:82-171) and one zone (:173-184).
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Porch-platform-access fixes the platform, three rises, and stair width, while porch-roof-columns fixes three columns, their beam, and pitched roof; the builder emits those assigned parts and one front-porch zone.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 porch.md:25,:27 platform, three risers, 1.50 m width; :55,:57 three columns, beam, pitched roof; porch.md not revised during source work.
 */
export const buildPorch = (): ISiteBuild => {
  const parts: IHousePart[] = [
    part(
      "porch-platform",
      OWNER,
      "porch",
      PALETTE.porchFloor,
      block(
        [PLATFORM_X[0], PLATFORM_BOTTOM, MAIN.outer.z[1]],
        [PLATFORM_X[1], STOREYS.porchFloor, PORCH_STEP_BACK_Z],
      ),
    ),
  ];
  // Steps: tread k (k = 1, 2) lies k × 0.30 m in front of the porch edge at k risers below it.
  const [sx0, sx1] = [
    PORCH_STEP_CENTRE_X - PORCH_STEP_HALF_WIDTH,
    PORCH_STEP_CENTRE_X + PORCH_STEP_HALF_WIDTH,
  ];
  for (let k = 1; k <= 2; ++k) {
    const edge = PORCH_STEP_BACK_Z + STEP_TREAD * (k - 1);
    parts.push(
      part(
        `porch-step-${k}`,
        OWNER,
        "porch",
        PALETTE.porchFloor,
        block(
          [sx0, PLATFORM_BOTTOM, edge],
          [sx1, STOREYS.porchFloor - PORCH_STEP_RISE * k, edge + STEP_TREAD],
        ),
      ),
    );
  }
  for (let c = 0; c < 3; ++c) {
    const x = -5.4 + 3.65 * c;
    const z = 1.8 + 0.35 / 2;
    parts.push(
      part(
        `porch-column-${c}-base`,
        OWNER,
        "porch",
        PALETTE.trim,
        block([x - 0.175, 0, z - 0.175], [x + 0.175, 0.15, z + 0.175]),
      ),
      part(
        `porch-column-${c}-shaft`,
        OWNER,
        "porch",
        PALETTE.trim,
        block([x - 0.125, 0.15, z - 0.125], [x + 0.125, 2.33, z + 0.125]),
      ),
      part(
        `porch-column-${c}-head`,
        OWNER,
        "porch",
        PALETTE.trim,
        block([x - 0.175, 2.33, z - 0.175], [x + 0.175, 2.45, z + 0.175]),
      ),
    );
  }
  parts.push(
    part(
      "porch-beam",
      OWNER,
      "porch",
      PALETTE.trim,
      block([PLATFORM_X[0], 2.45, 1.85], [PLATFORM_X[1], 2.7, 2.1]),
    ),
    part(
      "porch-beam-packer",
      OWNER,
      "porch",
      PALETTE.trim,
      slopedSlab({
        plan: rect(PLATFORM_X, [1.85, 2.1]),
        top: (_x, z) => porchRoof(z) - 0.22,
        floor: 2.7,
      }),
    ),
    part(
      "porch-roof",
      OWNER,
      "roof",
      PALETTE.roof,
      slopedSlab({
        plan: rect([-6.1, 2.55], [0, 2.35]),
        top: (_x, z) => porchRoof(z),
        thickness: 0.22,
      }),
    ),
  );
  // The front-porch zone is the platform the entry door opens on (porch-platform-access).
  const zone: IExteriorZone = {
    id: "front-porch",
    owner: OWNER,
    outline: rect(PLATFORM_X, [MAIN.outer.z[1], PORCH_STEP_BACK_Z]),
    anchor: {
      x: PORCH_STEP_CENTRE_X,
      y: STOREYS.porchFloor,
      z: (MAIN.outer.z[1] + PORCH_STEP_BACK_Z) / 2,
    },
    rampTo: null,
  };
  return { zones: [zone], parts };
};
