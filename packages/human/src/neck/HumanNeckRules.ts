import type { HumanNeckCurves } from "./HumanNeckCurves";

/** Shared compact neck laws from recovered physical sections and current supports.
 * Source identities, selection, residuals and ungenerated domains are recorded
 * in human/docs/techniques/neck-curve-identification.md. No reference reader,
 * person control table, original mesh or source normal enters the generator.
 */
export namespace HumanNeckRules {
  /** One common fitted rule population, consumed by the analytic neck authority. */
  export const rule: HumanNeckCurves.Rule = {
  "rotationRadians": 0.3167722656181057,
  "baseOffsetOverChord": [
    0.23732448742183537,
    -0.07874317394494325
  ],
  "spanOverNeckLength": 0.5480046138273743,
  "principal": [
    {
      "name": "native-base",
      "fraction": [
        0,
        0
      ]
    },
    {
      "name": "native-neck",
      "fraction": [
        1,
        0
      ]
    }
  ],
  "identifyPerimeterExtrema": true,
  "centreChord": [
    0.20917324843850368,
    -0.15536974202357257,
    -0.038243160840245184,
    0.0004944673311531734
  ],
  "centreGirth": [
    -0.07078246730015647,
    0.02048128998936599,
    0.009265033998871986,
    0.00011834062627587512
  ],
  "theta": [
    [
      [
        -0.0004864218162694004,
        0.00039806093780549086,
        0.00010497677506238361,
        -0.000049772619681321194
      ],
      [
        0.15699443467638408,
        0.0017131663714826527,
        0.0034298390572194116,
        -0.0004581647871222634
      ],
      [
        0.0000025509756441125253,
        0.00009475447855445176,
        0.00001666140972916453,
        -0.000023234560816192708
      ],
      [
        -0.00001759418580325563,
        -0.0000026747679690339236,
        0.000011698335544245354,
        0.000004262412668502759
      ],
      [
        -0.0008335360537282278,
        0.00769890049842023,
        -0.0010961951070814482,
        0.00038822658008652697
      ],
      [
        0.00015651520430679447,
        -0.0002773951570771769,
        0.000048114670509562336,
        -0.00003823064064578696
      ],
      [
        -0.002379806707045467,
        -0.0014232541873547267,
        0.0009346251715792723,
        0.00004727731997536736
      ],
      [
        0.0002506003572372089,
        -0.00009052842429871378,
        -0.00012745921869947236,
        -0.000016101764972765048
      ],
      [
        0.0018015599822281286,
        0.002548220661014796,
        0.0006708395609411092,
        -0.0003332327005377612
      ],
      [
        -0.0002806114224146597,
        -0.0002507213462080019,
        0.00010963111150829733,
        0.00003198888128461003
      ],
      [
        0.0012212276431802572,
        0.001949187766353803,
        -0.0002599278619379786,
        0.000003969161510764649
      ],
      [
        -0.00017187641999051638,
        0.000036316559207502396,
        0.000004967309715082578,
        -0.00003987361105371974
      ],
      [
        -0.00019232991641505496,
        0.00006151260494812588,
        -0.0000785386528882443,
        0.0000044119331686943825
      ],
      [
        0.00008343414718870601,
        -0.00021952934136326916,
        -0.00000970216294521663,
        0.000052714102699443524
      ],
      [
        0.00022974863840295346,
        0.0005558387901118104,
        -0.00005880831798008498,
        -0.00020552663826404205
      ],
      [
        0.000016360750665966486,
        0.000018567347527941548,
        0.00007793830959556664,
        0.000010440714252294367
      ],
      [
        -0.00019024972174786303,
        0.0005912678178946469,
        -0.00039339102582777784,
        -0.00006759444261739092
      ],
      [
        -0.00006403408820951785,
        -0.000021203875240240032,
        0.00002875687525501277,
        -0.000031499604870772154
      ]
    ],
    [
      [
        0.0021687546283173215,
        0.0002031151642845268,
        -0.0002995901806428309,
        -0.000028015505921560798
      ],
      [
        -0.00201280114782102,
        0.0003907194651611861,
        0.0009211298867869216,
        -0.0004376290630491705
      ],
      [
        -0.00004620666620651282,
        0.000028088133096292813,
        0.000030801620895532856,
        -0.000005088108125955966
      ],
      [
        0.000020437136229185204,
        -0.000008473078351644385,
        -7.283578264209181e-7,
        0.0000026238918600722003
      ],
      [
        -0.005499667586078384,
        0.0030068392184607762,
        -0.002169769064836563,
        0.00024145363353195545
      ],
      [
        -0.0008347992013847203,
        0.00014067658332244921,
        -0.000017933107489623528,
        0.000020502699316226517
      ],
      [
        -0.0012425924719049067,
        -0.0006728842313068474,
        2.9929701472849556e-7,
        0.00009372050955899022
      ],
      [
        -0.00023173798502716466,
        -0.00008796243850246181,
        0.00012929553030426272,
        0.00012103581232764412
      ],
      [
        0.0017369361320476594,
        0.0005954822482841876,
        -0.000007202799346357034,
        0.00008804844656145217
      ],
      [
        -0.00012182029990082705,
        0.0003685083803671126,
        0.0000653533929176901,
        -0.0000739644414325998
      ],
      [
        -0.00001042316415366753,
        0.0015757398163160146,
        -0.00016111479571903902,
        -0.0003232812375016877
      ],
      [
        0.00035861227438603474,
        0.00016659558986749986,
        0.000013558977085604828,
        -0.00002337659520890783
      ],
      [
        0.0004081685075350824,
        -0.00037490336955675916,
        -0.0004261748592114776,
        -0.00013180119677559437
      ],
      [
        -0.00009065861656615874,
        -0.00028486357987029317,
        -0.0000027369484056300487,
        0.00002092222754296223
      ],
      [
        0.0003582098049365175,
        -0.000026967724562859673,
        -0.00017806502451031225,
        -0.00008621360979447462
      ],
      [
        0.00001710043113316536,
        0.00014101642934402482,
        0.0001884010090468727,
        -0.000021946218447581556
      ],
      [
        -0.00005048907391803262,
        -0.00021033809229130412,
        -0.00011419468399656282,
        -0.0000111159057561397
      ],
      [
        0.00006158421430256652,
        0.00002613404745846532,
        -0.00012473210695364541,
        -0.000028535587005612297
      ]
    ]
  ],
  "limitations": [
    "Common coefficients were jointly identified from 39 committed official Recovery head-skin sections over four source states; every physical Hermite phase interval and source lineage remains independently retained",
    "Source station quadrature uses each person's actual adjacent physical plane widths normalized to unit total weight; differing observation counts and short final intervals do not prescribe shape weights",
    "Angular Fourier degree eight and longitudinal Legendre degree three are a fitted common approximation; multiplying by the physical linear girth equation yields degree four without a cubic refit",
    "Finite source radial/centre RMS is 1.505 to 2.339 mm and sampled maximum is 5.094 mm before common frame placement; held-out-source RMS is 2.548 to 4.826 mm and maximum 9.590 mm",
    "Shared base-offset and neckLength-to-normal-span mappings retain sampled placement residuals up to 2.064 and 3.378 mm respectively; actual generated whole-body fidelity remains unverified",
    "Every selected adjacent source slab is an orientable consistently directed genus-zero annulus with two boundary cycles; other source components remain excluded without anatomical classification",
    "Source-incidence continuation establishes contour identity only; geometric radial phase does not establish material correspondence or a source transverse jet",
    "Fat, muscularity, independent native parameter derivatives and unseen morphology prediction are unqualified"
  ]
};
}
