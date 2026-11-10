import { AutoMovieConstructionKnownPort, AutoMovieSolidChain, type IAutoMovieConstructionKnownPortSource, type IAutoMovieSolidSurface } from "@automovie/engine";

import type { AutoMovieHumanF1BodyAssembly } from "../AutoMovieHumanF1BodyAssembly";
import type { IAutoMovieHumanBodyMeasures } from "../IAutoMovieHumanBodyMeasures";
import type { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanTrunkF1Traced } from "./AutoMovieHumanTrunkF1Traced";
import type { AutoMovieHumanTrunkS00 } from "./AutoMovieHumanTrunkS00";
import type { AutoMovieHumanTrunkSegmentFrames } from "./AutoMovieHumanTrunkSegmentFrames";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;

/**
 * The trunk's shoulder ports as known-port parent sides on S00's own chart
 * (station mm, the arclength of the section planes' course, equal to the
 * world height below the neck turn; phase = polar angle in the section
 * plane from +u anterior toward +v right, rad), for the engine's band
 * operator (`AutoMovieConstructionKnownPort`): each port is a closed curve
 * on that chart, the parent field is the S00 surface itself (wall and mounds,
 * `AutoMovieSolidChain.surface`), and the parent map carries the band
 * rectangle (clock `c`, transverse `v` in [0, 1]) into the chart, `v = 0` on
 * the port curve and `v = 1` at the region's centre, so the trimmed region
 * inside the port is the parent's strip of the band.
 *
 * Each port curve is an ellipse in the chart, `station = y0 + (1 - v) a cos c`,
 * `phase = p0 + s (1 - v) b sin c`, with `c = 0` at its top, increasing toward
 * the anterior side (`s` = -1 on the right, +1 on the left, so both sides run
 * top, front, bottom, back), period 2 pi. The map is polynomial in `(1 - v)`
 * and trigonometric in `c`, so its total2 is exact. Each shoulder port is
 * centred on the lateral guide (phase +-pi/2) at the station midway between
 * the axilla and acromion heights (ANSUR II; inside the neck turn a height is
 * the station whose plane origin stands there), its half height half their
 * station difference; its phase half-width is set by bisection so the port's
 * world perimeter on S00 equals the child's root girth, the axillary arm
 * circumference (ANSUR 1988, the arm root profile's tape).
 *
 * The hips are not ports: S00 ends open at the crotch and each leg continues
 * from half of that end plus the medial seam (`AutoMovieHumanTrunkPelvisSplit`).
 * A closing bowl with two thigh-girth ports was tried twice and failed (the
 * ports crossed; the bowl under the pole could not carry a thigh-girth loop).
 */
export namespace AutoMovieHumanTrunkPorts {
  /** The canonical fixed F1 trunk boundaries in ISB world millimetres. */
  export type IFixed = AutoMovieHumanF1BodyAssembly.IPorts;

  /** Supply the actual y1458 neck and row-17 armscye rails to both incident parts. */
  export function f1(): IFixed {
    return {
      neck: NECK.map(([x, y, z]: Vec3): Vec3 => [x, y, z]),
      arm: {
        left: LEFT_ARMSCYE.map(([x, y, z]: Vec3): Vec3 => [x, y, z]),
        right: RIGHT_ARMSCYE.map(([x, y, z]: Vec3): Vec3 => [x, y, z]),
      },
      fork: AutoMovieHumanTrunkF1Traced.f1Fork(),
    };
  }

  // Keep these measured trim rails at full precision so neither incident part needs to weld by tolerance.
  const NECK: readonly Vec3[] = [
    [-50.600962235386504, 1458, -0.017625829613552194], [-50.453768951465236, 1458, -2.9508815200148883],
    [-50.28982137105052, 1458, -5.786972122843151], [-49.8850389808444, 1458, -8.781903298554337],
    [-49.5176602851476, 1458, -11.479209697681506], [-49.05790163713607, 1458, -14.039241321595915],
    [-48.501470929393236, 1458, -17.063642720238043], [-48.01413845364351, 1458, -19.494566547371438],
    [-47.34380250677441, 1458, -22.498545165087062], [-46.85812175122763, 1458, -24.777287203544592],
    [-46.00057991675993, 1458, -27.77586237923674], [-45.44508880389441, 1458, -29.882380751617937],
    [-44.45218865428919, 1458, -32.91488945941207], [-43.804530480582386, 1458, -34.81666189746399],
    [-42.550571880082, 1458, -37.749981647955835], [-41.85322443341032, 1458, -39.31550804517254],
    [-40.24199499736048, 1458, -42.264152822088526], [-37.956659576780396, 1458, -45.54634684120886],
    [-37.47368797717948, 1458, -46.34922265163058], [-34.423574784409965, 1458, -49.754140131200664],
    [-34.286267684795746, 1458, -49.921889436611], [-34.162342080290856, 1458, -50.03273502735418],
    [-33.50193317644087, 1458, -50.55001350017036], [-31.084093340697237, 1458, -52.608432004485955],
    [-30.68001451775494, 1458, -52.91403516924529], [-27.818745723474635, 1458, -54.688943848859225],
    [-26.70318154056301, 1458, -55.292047975432354], [-24.71620960189115, 1458, -56.022909089586],
    [-22.483035354255847, 1458, -56.898196242718804], [-18.630404157764005, 1458, -57.64249312380854],
    [-18.079032896402396, 1458, -57.755785249035604], [-17.783813695487325, 1458, -57.76274411757173],
    [-17.000024252512283, 1458, -57.77722588327553], [-14.462831826424136, 1458, -57.99436248405208],
    [-13.670537239915035, 1458, -58.07598167193196], [-11.166131666562912, 1458, -57.94671034915035],
    [-9.273902210918635, 1458, -57.93423502240927], [-5.135743190110027, 1458, -57.41313313840542],
    [-4.8942796794448284, 1458, -57.37535992069194], [-4.5267991915021355, 1458, -57.28866021179143],
    [-0.5858047081305671, 1458, -56.741890861399504], [1.5184083361121452, 1458, -56.25753999581659],
    [3.7212693460704855, 1458, -55.892634291915854], [4.649549030496459, 1458, -55.61863931838565],
    [7.138691595073951, 1458, -55.08156837677577], [7.802128210759953, 1458, -54.96396579524974],
    [8.044561282642789, 1458, -54.939695281939585], [11.007049357054392, 1458, -54.30841828833872],
    [12.490086248782227, 1458, -54.05679631569123], [14.211065409808448, 1458, -53.56413681817615],
    [16.948783888550743, 1458, -52.8172555481223], [17.34257238899691, 1458, -52.663000621092124],
    [18.260334753961004, 1458, -52.31671491278155], [20.380918811162253, 1458, -51.5802034325897],
    [21.27236466602581, 1458, -51.238166551109316], [23.259366914203124, 1458, -50.23259034674238],
    [25.36153165704934, 1458, -49.09206797325033], [25.995278639527626, 1458, -48.6582355885008],
    [27.3289396052321, 1458, -47.70543325932039], [28.572331352413027, 1458, -46.83310456056776],
    [29.158903227211788, 1458, -46.386893731864475], [30.96329489468939, 1458, -44.81031949605845],
    [32.63223952746832, 1458, -43.237080345890355], [33.191547336310336, 1458, -42.64027484070376],
    [34.25212689052681, 1458, -41.436029604105556], [35.208599393282626, 1458, -40.33956903003146],
    [35.69078741062788, 1458, -39.731622371087894], [37.01442898328533, 1458, -37.90829872032887],
    [38.3274175484098, 1458, -35.97620615030193], [38.66403068262221, 1458, -35.41407664054336],
    [39.330432560979105, 1458, -34.26856770651681], [40.144409781105054, 1458, -32.834237191475324],
    [40.56882819277103, 1458, -32.08396167650513], [41.47953914689709, 1458, -30.266992036415743],
    [42.56813426951339, 1458, -28.241459524110937], [42.80149897199884, 1458, -27.755713781933146],
    [43.34245380300245, 1458, -26.740017801329266], [44.09393171275399, 1458, -25.264919200576998],
    [44.49536486259372, 1458, -24.60915241196592], [45.46951826772718, 1458, -22.868157096803422],
    [46.59699556838775, 1458, -21.20986305280392], [47.00544491112991, 1458, -20.553042476240435],
    [48.05947378631151, 1458, -19.043453149526005], [48.61489245405103, 1458, -18.258689140807405],
    [48.862812777315035, 1458, -17.920252704352215], [50.21549893482912, 1458, -15.848165579116692],
    [51.013588121747276, 1458, -14.578168207197267], [51.68711980490567, 1458, -13.300204711268739],
    [52.824854376590785, 1458, -11.124384618141754], [53.01720206615199, 1458, -10.61823035657725],
    [53.83144234699561, 1458, -8.444283886525922], [54.104017288267805, 1458, -7.714909500866799],
    [54.168042257868684, 1458, -7.540761933400258], [54.79954368421563, 1458, -4.531685222356501],
    [54.957656781252474, 1458, -3.804550686128789], [55.11123608026559, 1458, -1.0218004255224256],
    [55.18478046882629, 1458, 0.0034957700040496795], [55.10662762343765, 1458, 1.0292334287542277],
    [54.90686001183919, 1458, 3.8190067181603875], [54.76150951576884, 1458, 4.52161156020974],
    [54.103973008774396, 1458, 7.552394128080181], [54.055539106320396, 1458, 7.685201404648758],
    [53.856248358608255, 1458, 8.209946041515709], [52.99357480862245, 1458, 10.555381271037362],
    [52.78609071057732, 1458, 11.119381917671562], [51.761822056371194, 1458, 13.263550788040478],
    [51.08980543996363, 1458, 14.574943677265315], [50.31506257906603, 1458, 15.800711259897808],
    [48.92805495772251, 1458, 17.924762685310007], [48.72334949281049, 1458, 18.199645021790538],
    [48.277774816209046, 1458, 18.83764361156281], [47.11944571442114, 1458, 20.489849270677723],
    [46.67996038791501, 1458, 21.224539448976255], [45.615354559193364, 1458, 22.810131516424846],
    [44.61968336357013, 1458, 24.604304979641125], [44.262247172129925, 1458, 25.20261622193993],
    [43.57999014718192, 1458, 26.533266100202287], [42.983110642020215, 1458, 27.66804274453268],
    [42.72758300534787, 1458, 28.208220972175933], [41.69887046574747, 1458, 30.17391272516093],
    [40.766049660954465, 1458, 32.00909932302468], [40.38057115908254, 1458, 32.699750483354066],
    [39.62234559516691, 1458, 33.98100873053612], [38.883807928507025, 1458, 35.21870989965024],
    [38.49823254051305, 1458, 35.833954094269984], [37.22867287740643, 1458, 37.6796914268087],
    [35.851680208367114, 1458, 39.55893025145427], [35.427802260793015, 1458, 40.08147029043047],
    [34.61138901994233, 1458, 41.01228331769039], [33.400625835750425, 1458, 42.35682064241481],
    [32.75911639629357, 1458, 43.03245092902254], [31.170264091497305, 1458, 44.51170365494508],
    [29.24404039475931, 1458, 46.16140211782052], [28.749593868877604, 1458, 46.5230665338758],
    [27.72976759006091, 1458, 47.22650698886601], [26.149986841718803, 1458, 48.333587402318365],
    [25.389969424856183, 1458, 48.84499250593496], [23.39411616289295, 1458, 49.923241312602165],
    [21.259519758637968, 1458, 51.01021636781493], [20.50353902661245, 1458, 51.30179519227178],
    [18.722797345853483, 1458, 51.94216192050051], [17.45351752747127, 1458, 52.43241931490217],
    [16.909946584248235, 1458, 52.648336813935046], [14.308360283099383, 1458, 53.356819813146956],
    [12.42747130129532, 1458, 53.896444413292556], [11.095873092498309, 1458, 54.126598147803165],
    [7.984613014744262, 1458, 54.80364092785138], [7.8923506004675446, 1458, 54.8131277556819],
    [7.639573279311811, 1458, 54.85972470729204], [4.751925160623827, 1458, 55.500103265744116],
    [3.684309390085751, 1458, 55.81977753526933], [1.6298224258874114, 1458, 56.1613571758271],
    [-0.5869852603472623, 1458, 56.67722120688999], [-4.125079784985857, 1458, 57.17489837935275],
    [-4.876951715835958, 1458, 57.35168318062264], [-5.358218450179258, 1458, 57.42718983640765],
    [-9.248984629852757, 1458, 57.91135414825244], [-11.054039549327484, 1458, 57.92590857881478],
    [-13.631782251992014, 1458, 58.05986072769594], [-14.355610752037443, 1458, 57.99037163166731],
    [-16.699423621347044, 1458, 57.79471601394408], [-17.68078896352671, 1458, 57.78088305892835],
    [-18.04705426281634, 1458, 57.77106202911841], [-18.72704397997127, 1458, 57.631046609164166],
    [-22.45387584868132, 1458, 56.90164558453343], [-24.762532328791266, 1458, 55.989592160218514],
    [-26.675597756054245, 1458, 55.27712216735], [-27.76009104409377, 1458, 54.68582158854414],
    [-30.657711884319383, 1458, 52.886689733708096], [-31.03608144377324, 1458, 52.60084305694556],
    [-33.30288318742623, 1458, 50.67363054828561], [-34.12403855154203, 1458, 50.0313194262517],
    [-34.27759566681138, 1458, 49.89410478568774], [-34.44752896014674, 1458, 49.68662585201216],
    [-37.47048119833458, 1458, 46.32348201444899], [-37.978415699302516, 1458, 45.47941888555],
    [-40.24133730107792, 1458, 42.23967778795224], [-41.83651102117298, 1458, 39.336806954316565],
    [-42.55350819542127, 1458, 37.73001258290534], [-43.7926508477525, 1458, 34.843417682331165],
    [-44.45687668733993, 1458, 32.898819610084985], [-45.43873089163958, 1458, 29.91288648551743],
    [-46.00590594412111, 1458, 27.763833716483937], [-46.8525657790161, 1458, 24.803186896079197],
    [-47.34628330586422, 1458, 22.485625962299782], [-48.0074646242512, 1458, 19.507793703753602],
    [-48.50030173537144, 1458, 17.044476953467555], [-49.0493285543229, 1458, 14.038837499689997],
    [-49.51182868661358, 1458, 11.454146829322095], [-49.881562437442255, 1458, 8.739057465385791],
    [-50.28431721217066, 1458, 5.757123043035843], [-50.450626612646545, 1458, 2.9123063602987247],
  ];
  const LEFT_ARMSCYE: readonly Vec3[] = [
    [-23.557342241025417, 1273.175050508448, -149.78386583871296], [-28.37948415700508, 1273.205006865859, -150.03751583456406],
    [-33.1729048328418, 1273.4494503916476, -150.57091231346857], [-37.99209155957519, 1273.894259337658, -151.36797540355747],
    [-38.797826790284056, 1273.994946651504, -151.5357214388568], [-39.07008825856985, 1274.0577563365805, -151.63012060843087],
    [-44.21880139038835, 1275.0162919142267, -153.11492537810454], [-46.709056868956836, 1275.9472710843834, -154.4454257701894],
    [-49.29852420010111, 1276.8099936750154, -155.69090676278586], [-52.92314607216224, 1279.0426890400565, -158.77736613617122],
    [-53.590311915015675, 1279.402176585988, -159.27803408438567], [-55.612198963910615, 1281.4096105637823, -161.99809309018784],
    [-56.99873766309738, 1282.7921228880855, -163.87112408176807], [-57.143162992171604, 1283.0444145404595, -164.2081008198072],
    [-59.644536852856604, 1287.15732906945, -169.70810273964747], [-60.58154428140446, 1289.2524079153586, -172.4947593882585],
    [-61.14523781341163, 1291.4622496778945, -175.41518150268877], [-61.45659142526287, 1294.4088983628938, -179.2897567890946],
    [-61.47973675117296, 1297.3869192179077, -183.19262199924222], [-61.13339809534852, 1300.36028813747, -187.07296428925736],
    [-60.33629976199616, 1303.2929810161131, -190.87997081526586], [-59.05055146982811, 1306.9233395293452, -195.5793404048705],
    [-56.70328833155848, 1310.4963851117357, -200.1564211514669], [-55.73721381876928, 1311.911650670962, -201.96776450882746],
    [-52.30486263570454, 1315.3201344403096, -206.2809896256119], [-51.04082881559314, 1316.5580933343006, -207.84677602261905],
    [-46.37812988216119, 1319.9529556892123, -212.0874508028691], [-45.191351296747115, 1320.7958918429454, -213.13910890368112],
    [-39.08153859244702, 1324.054627505748, -217.13708777123526], [-38.37779819781033, 1324.4135437121852, -217.57605426105192],
    [-32.395733085771745, 1326.577292434712, -220.14504891139333], [-30.775941722295695, 1327.158259864521, -220.8342201656681],
    [-30.532591628435892, 1327.2137677968083, -220.89612750772812], [-22.55096892158265, 1328.8982331944958, -222.74825598282828],
    [-20.81894579506073, 1329.0525890803483, -222.87348601559117], [-13.882012478615776, 1329.5613548297615, -223.2316484155839],
    [-10.521889514398657, 1329.3776630869124, -222.84157651686814], [-3.6251669370807105, 1328.7157441125703, -221.6676825785093],
    [-0.29238251639621593, 1328.1382681391838, -220.76288570966796], [2.9427219347498, 1327.3299598917222, -219.55999284345916],
    [8.734616480464929, 1325.3410680822285, -216.69660688278634], [10.307041464650014, 1324.777083703222, -215.88775550302574],
    [16.168372408388986, 1321.4605210260795, -211.28175310489866], [16.534970621278156, 1321.2465933068906, -210.9851630258485],
    [19.566433475476693, 1318.4532494132072, -207.19050858388482], [21.041840959016685, 1317.0897992911387, -205.3385018410179],
    [21.18207377732542, 1316.9717139888205, -205.17755016553897], [23.77188130191405, 1312.3499598682984, -199.00692902443447],
    [23.91680417754179, 1312.116422791067, -198.69450261806912], [24.750339062002254, 1307.2065205354584, -192.22443352317973],
    [24.756705336453713, 1307.1819740348353, -192.19198936870612], [24.728790537676712, 1306.8546784083228, -191.76440413022257],
    [24.441588564404583, 1302.9353684579874, -186.6420500345577], [24.436317347101713, 1302.7014769382597, -186.33583712508437],
    [22.03533158058497, 1295.9563252047878, -177.6050161327674], [20.44107415445633, 1292.8226056607214, -173.57006531231417],
    [18.448496860019475, 1289.8479197833863, -169.76119217146606], [15.955742067478374, 1287.032114661497, -166.1827251320742],
    [12.860952147037, 1284.3750373837672, -162.83899261598987], [9.062269468899325, 1281.8765350389112, -159.73432304506417],
    [4.457836403269322, 1279.5364547156423, -156.87304484114833], [-0.9857866254687231, 1277.2562499445557, -154.1275281031249],
    [-6.4359462892768695, 1275.4306936996004, -151.97798756347817], [-12.216671656095048, 1274.1173300506484, -150.51422500182548],
    [-18.651991793863186, 1273.3737030675707, -149.82604219778415],
  ];
  const RIGHT_ARMSCYE: readonly Vec3[] = [
    [0.09269247666260094, 1277.6939919052547, 154.68651844425813], [4.663783913756193, 1279.6566611121075, 157.0547884692957],
    [8.67616457032939, 1281.6912198386408, 159.5420903154826], [12.171804379836356, 1283.8755201393365, 162.24856050141895],
    [15.192673275731256, 1286.2874140686758, 165.27433554570473], [17.78074119146826, 1289.0047536811408, 168.71955196693995],
    [19.977978060501528, 1292.1053910312125, 172.6843462837247], [21.82635381628523, 1295.6671781733728, 177.26885501465893],
    [23.237664617793666, 1298.602718758176, 181.0522816619749], [23.33033329635114, 1299.161010466764, 181.77964113731866],
    [24.4363045859548, 1302.7016684125297, 186.36947497459565], [24.441574529237144, 1302.9356359133355, 186.6757873608857],
    [24.728799730963424, 1306.8549931426194, 191.79820011820357], [24.75670301244078, 1307.1821189181735, 192.22556313918295],
    [24.75033806093442, 1307.206660113002, 192.25800027129097], [23.916805532791756, 1312.1165963293806, 198.72811126773234],
    [23.77187152090744, 1312.3501495468142, 199.04055922704288], [21.18213522560734, 1316.9717317781196, 205.21095014656922],
    [21.041704187373018, 1317.0899827013352, 205.37212760696795], [19.564960259911672, 1318.454692208469, 207.2258434836193],
    [16.534964354326874, 1321.2467356957513, 211.01872818761498], [16.168361005431464, 1321.460660562543, 211.31531474076553],
    [10.30704404416512, 1324.7772515783736, 215.92135343231107], [8.73464020120743, 1325.341234376868, 216.73020192420776],
    [2.942712399978742, 1327.3301041335935, 219.59356097151908], [-0.4490380259370925, 1328.055930041314, 220.6953498468696],
    [-5.244618709141227, 1329.0287764148288, 222.18320468496267], [-10.521480312366666, 1329.3776618875017, 222.8749380620419],
    [-13.882036652919183, 1329.561387689667, 223.26507468303237], [-20.819271791843224, 1329.0528329290369, 222.90720434504624],
    [-22.550950287864595, 1328.8984994159073, 222.7819888673889], [-30.53258868926357, 1327.2139323998933, 220.92973109195805],
    [-30.77594950495214, 1327.158423816392, 220.86782347151905], [-32.39538130471178, 1326.5775919010066, 220.17881455312406],
    [-38.3777843103452, 1324.4137394464517, 217.6097018705626], [-39.08172829436746, 1324.0547197332442, 217.17060921078263],
    [-45.19140506344635, 1320.795911709241, 213.1725329880409], [-46.37801052059236, 1319.9531086833774, 212.1210424107595],
    [-52.17198583052069, 1315.468567972165, 206.502961508589], [-54.65353899027255, 1313.0790456705372, 203.48251894011938],
    [-56.70334357530599, 1310.4964931786703, 200.18996975668205], [-59.05053719130937, 1306.923523977037, 195.61298862337088],
    [-60.33620962196602, 1303.2934383630711, 190.91397558366089], [-60.91443698834517, 1301.772950479532, 188.94752540550655],
    [-61.58973197585716, 1295.968963198197, 181.3731047520458], [-61.44823189087634, 1293.043903024587, 177.53436853949765],
    [-60.810390898624604, 1290.218094414382, 173.803604456877], [-59.64571618427322, 1287.3233216404014, 169.95905870386844],
    [-58.10839171608951, 1284.5671197295728, 166.2795012026587], [-56.11705242414479, 1281.9324708002796, 162.73901728894694],
    [-53.59033323851039, 1279.4023569709047, 159.31169229843232], [-52.92336921036542, 1279.0429907279631, 158.81119227020696],
    [-49.298558252165606, 1276.8101660691068, 155.72455532090876], [-46.70922560846532, 1275.9474708327218, 154.4791159175938],
    [-44.218848899785215, 1275.016449068929, 153.14855415500793], [-39.69363079300116, 1274.104699697917, 151.75277012365046],
    [-34.96854524730124, 1273.5139298584636, 150.76865036519945], [-30.150752072936708, 1273.2035320865566, 150.14775509182635],
    [-25.347411080158828, 1273.132898918184, 149.84164451570254], [-20.196736424879237, 1273.252275772884, 149.76904392834064],
    [-14.948352941143428, 1273.62957644498, 150.03003352740092], [-9.832415675477, 1274.4066536650323, 150.82070342212887],
    [-5.079079674405553, 1275.7253601636014, 152.33714372176996],
  ];

  /** One port's parent side. */
  export interface IPort {
    /** `shoulder.left` or `shoulder.right`. */
    name: string;

    /** Chart centre `[station mm, phase rad]`. */
    centre: [number, number];

    /** Chart half extents `[station mm, phase rad]`. */
    semi: [number, number];

    /** +1 or -1: the phase sense of increasing clock at `c = pi / 2` (toward anterior). */
    sense: 1 | -1;

    /** The child root girth the port's perimeter was sized to, mm. */
    girth: number;

    /** The port curve's world perimeter on S00, mm (128-gon). */
    perimeter: number;

    /** The S00 surface (parent field), chart (station, phase). */
    field: IAutoMovieSolidSurface;

    /** The parent map from the band rectangle (clock, transverse) into that chart. */
    map: IAutoMovieConstructionKnownPortSource.IMap;

    /** World point of the port curve at clock `c`. */
    curve(c: number): Vec3;

    /**
     * The world total2 of the band rectangle on S00 at clock `c` and
     * transverse `v` (0 on the port curve, 1 at the region's centre): `u` per
     * radian of clock along the loop, `v` per unit of transverse into the
     * trunk's region, by the chain rule of the S00 field's jet over the
     * parent map's exact jet. A child starts its root's lines from `jet(c, 0)`.
     */
    jet(c: number, v?: number): IAutoMovieSolidSurface.IJet;

    /**
     * The port's declared frame in the world: origin at the loop's centroid
     * (128-gon), axis 0 the loop plane's normal by Newell's method pointing
     * out of the trunk (away from the section course), axis 1 the world up
     * made orthogonal to it, axis 2 their cross product (forward on the right
     * port, backward on the left), the child's root frame before its own
     * relative transform.
     */
    frame: { origin: Vec3; axes: [Vec3, Vec3, Vec3] };

    /** Basis of the placement and size. */
    basis: string;
  }

  /** The shoulder ports, or null when S00 has no surface. */
  export interface IOutput {
    /** Shoulder ports by side. */
    shoulders: Record<"left" | "right", IPort>;

    /** The S00 surface the ports lie on. */
    field: IAutoMovieSolidSurface;
  }

  /** Build the shoulder ports from one S00 build. */
  export function create(s00: AutoMovieHumanTrunkS00.IOutput): IOutput | null {
    if (s00.chain === null) return null;
    const field: IAutoMovieSolidSurface | null = AutoMovieSolidChain.surface(s00.chain);
    if (field === null) return null;
    const f: AutoMovieHumanTrunkSegmentFrames.IOutput = s00.datums.frames;
    const m: IAutoMovieHumanBodyMeasures = s00.measures;
    const axilla: number = s00.curves.axis.turn.station(m.axillaHeight);
    const acromion: number = s00.curves.axis.turn.station(f.heights.acromion);
    const centre: number = (axilla + acromion) / 2;

    const make: (name: string, phase: number, sense: 1 | -1) => IPort = (name: string, phase: number, sense: 1 | -1): IPort => {
      // Phase half-width by bisection so the world perimeter equals the girth.
      const at: [number, number] = [centre, phase];
      const half: number = (acromion - axilla) / 2;
      let lo: number = 0.02;
      let hi: number = 1.4;
      for (let k: number = 0; k < 40; ++k) {
        const mid: number = (lo + hi) / 2;
        if (length(field, ellipse(at, [half, mid], sense)) < m.axillaryArmCircumference) lo = mid;
        else hi = mid;
      }
      const semi: [number, number] = [half, (lo + hi) / 2];
      const map: IAutoMovieConstructionKnownPortSource.IMap = ellipse(at, semi, sense);
      const course: number = s00.curves.source.axis?.(f.heights.acromion) ?? s00.curves.axis.xs;
      return {
        name,
        centre: at,
        semi,
        sense,
        girth: m.axillaryArmCircumference,
        perimeter: length(field, map),
        field,
        map,
        curve: (c: number): Vec3 => world(field, map.point(c, 0)),
        jet: (c: number, v: number = 0): IAutoMovieSolidSurface.IJet => compose(field, map.jet(c, v)),
        frame: frameOf(field, map, course),
        basis: "lateral guide, midway axilla-acromion (ANSUR II heights as stations), half height half their difference; phase width so the perimeter is the axillary arm circumference",
      };
    };
    return {
      shoulders: { left: make("shoulder.left", -Math.PI / 2, 1), right: make("shoulder.right", Math.PI / 2, -1) },
      field,
    };
  }

  /** The parent chart map of an elliptic port: exact total2 in (clock, transverse). */
  export function ellipse(centre: [number, number], semi: [number, number], sense: 1 | -1): IAutoMovieConstructionKnownPortSource.IMap {
    const [a, b]: [number, number] = semi;
    const s: number = sense * b;
    return {
      domain: [0, 2 * Math.PI],
      transverse: [0, 1],
      point: (c: number, v: number): [number, number] => [centre[0] + (1 - v) * a * Math.cos(c), centre[1] + (1 - v) * s * Math.sin(c)],
      jet: (c: number, v: number): IAutoMovieConstructionKnownPortSource.IJet => {
        const w: number = 1 - v;
        const cos: number = Math.cos(c);
        const sin: number = Math.sin(c);
        return {
          p: [centre[0] + w * a * cos, centre[1] + w * s * sin],
          u: [-w * a * sin, w * s * cos],
          v: [-a * cos, -s * sin],
          uu: [-w * a * cos, -w * s * sin],
          uv: [a * sin, -s * cos],
          vv: [0, 0],
        };
      },
    };
  }

  /**
   * The band between a trunk port and a limb's root: the engine's known-port
   * operator over the S00 field with this port's map (parent) and the limb's
   * own field and map (child, owned by its region), period 2 pi.
   */
  export function band(port: IPort, child: { field: IAutoMovieSolidSurface; map: IAutoMovieConstructionKnownPortSource.IMap; boundary: string }, orientation: 1 | -1): AutoMovieConstructionKnownPort.IPrepared {
    return AutoMovieConstructionKnownPort({
      definition: {
        name: `band.${port.name}`,
        domain: [0, 2 * Math.PI],
        period: 2 * Math.PI,
        orientation,
        parent: { field: "trunk", map: port.name, boundary: `trunk.port.${port.name}`, material: "trunk", binding: "trunk" },
        child: { field: "child", map: `${port.name}.child`, boundary: child.boundary, material: child.boundary, binding: child.boundary },
      },
      fields: new Map([
        ["trunk", port.field],
        ["child", child.field],
      ]),
      maps: new Map([
        [port.name, port.map],
        [`${port.name}.child`, child.map],
      ]),
    });
  }

  /**
   * The world total2 in the band rectangle (clock, transverse) by the chain
   * rule: with `m` the map's chart jet and `S` the field's jet at `m.p`,
   * `P_c = S_u m_c0 + S_v m_c1`, `P_cc = S_uu m_c0^2 + 2 S_uv m_c0 m_c1 +
   * S_vv m_c1^2 + S_u m_cc0 + S_v m_cc1`, and likewise for the mixed and
   * transverse terms.
   */
  function compose(field: IAutoMovieSolidSurface, m: IAutoMovieConstructionKnownPortSource.IJet | null): IAutoMovieSolidSurface.IJet {
    if (m === null) throw new Error("trunk port: the parent map has no jet there");
    const s: IAutoMovieSolidSurface.IJet = field.jet(m.p[0], m.p[1]);
    const lin = (a: readonly number[]): Vec3 => [0, 1, 2].map((k: number): number => s.u[k]! * a[0]! + s.v[k]! * a[1]!) as Vec3;
    const quad = (a: readonly number[], b: readonly number[], second: readonly number[]): Vec3 =>
      [0, 1, 2].map((k: number): number => s.uu[k]! * a[0]! * b[0]! + s.uv[k]! * (a[0]! * b[1]! + a[1]! * b[0]!) + s.vv[k]! * a[1]! * b[1]! + s.u[k]! * second[0]! + s.v[k]! * second[1]!) as Vec3;
    return {
      p: [s.p[0]!, s.p[1]!, s.p[2]!],
      u: lin(m.u),
      v: lin(m.v),
      uu: quad(m.u, m.u, m.uu),
      uv: quad(m.u, m.v, m.uv),
      vv: quad(m.v, m.v, m.vv),
    };
  }

  /** The port's declared frame: the loop's centroid, its Newell normal pointing away from the course X at the port, world up orthogonalised, and their cross product. */
  function frameOf(field: IAutoMovieSolidSurface, map: IAutoMovieConstructionKnownPortSource.IMap, course: number): { origin: Vec3; axes: [Vec3, Vec3, Vec3] } {
    const ring: Vec3[] = Array.from({ length: 128 }, (_: unknown, k: number): Vec3 => world(field, map.point((2 * Math.PI * k) / 128, 0)));
    const origin: Vec3 = [0, 1, 2].map((i: number): number => ring.reduce((t: number, p: Vec3): number => t + p[i]!, 0) / ring.length) as Vec3;
    const n: Vec3 = [0, 0, 0];
    ring.forEach((a: Vec3, k: number): void => {
      const b: Vec3 = ring[(k + 1) % ring.length]!;
      n[0] += (a[1] - b[1]) * (a[2] + b[2]);
      n[1] += (a[2] - b[2]) * (a[0] + b[0]);
      n[2] += (a[0] - b[0]) * (a[1] + b[1]);
    });
    const unit = (v: Vec3): Vec3 => {
      const l: number = Math.hypot(v[0], v[1], v[2]);
      return [v[0] / l, v[1] / l, v[2] / l];
    };
    let out: Vec3 = unit(n);
    // Out of the trunk: the side of the plane away from the section course (X = course, Z = 0).
    if (out[0] * (origin[0] - course) + out[2] * origin[2] < 0) out = [-out[0], -out[1], -out[2]];
    const upDot: number = out[1];
    const up: Vec3 = unit([-upDot * out[0], 1 - upDot * out[1], -upDot * out[2]]);
    const third: Vec3 = [out[1] * up[2] - out[2] * up[1], out[2] * up[0] - out[0] * up[2], out[0] * up[1] - out[1] * up[0]];
    return { origin, axes: [out, up, third] };
  }

  /** World point of a chart point on the S00 field. */
  function world(field: IAutoMovieSolidSurface, chart: [number, number]): Vec3 {
    const p: readonly number[] = field.point !== undefined ? field.point(chart[0], chart[1]) : field.jet(chart[0], chart[1]).p;
    return [p[0]!, p[1]!, p[2]!];
  }

  /** World perimeter of a port map's curve (v = 0) on the field, 128-gon. */
  function length(field: IAutoMovieSolidSurface, map: IAutoMovieConstructionKnownPortSource.IMap): number {
    let total: number = 0;
    let previous: Vec3 = world(field, map.point(0, 0));
    for (let k: number = 1; k <= 128; ++k) {
      const next: Vec3 = world(field, map.point((2 * Math.PI * k) / 128, 0));
      total += Math.hypot(next[0] - previous[0], next[1] - previous[1], next[2] - previous[2]);
      previous = next;
    }
    return total;
  }
}
