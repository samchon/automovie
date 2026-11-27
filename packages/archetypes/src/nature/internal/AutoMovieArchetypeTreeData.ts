export namespace AutoMovieArchetypeTreeData {
  /*
   * White oak's size at maturity, read in the USDA silvics manual.
   */
  export const SILVICS: string =
    'USDA Forest Service, Silvics of North America, white oak (Quercus alba): "often 24 to 30 m (80 to 100 ft) in height and 91 to 122 cm (36 to 48 in) in d.b.h." (https://research.fs.usda.gov/silvics/white-oak)';

  /*
   * Oaks' crown base, read in a study of European oaks, applied to white oak.
   */
  export const CROWN: string =
    "Spiecker 2021, Annals of Forest Research 64(1), Table 1: the crown base (lowest living primary branch) at 60 % and 50 % of the tree's height at harvest for 1.5 and 2.0 mm of annual radial increment, over 1,300 measured pedunculate and sessile oaks (https://www.afrjournal.org/index.php/afr/article/viewFile/2207/1148), applied to white oak";

  /*
   * Green white oak's moisture content, read in the Wood Handbook.
   */
  export const MOISTURE: string =
    "Wood Handbook, FPL-GTR-190 (2010), Table 4-1, average moisture content of green wood: oak, white, heartwood 64 %, sapwood 78 % (https://research.fs.usda.gov/download/treesearch/37428.pdf, p. 4-2)";

  /*
   * Old-growth Douglas-firs, read in a 450-year stand's study.
   */
  export const WIND_RIVER: string =
    "Ishii and Wilson 2001, Canadian Journal of Forest Research 31:1250-1261, Table 1: six Douglas-firs of a 450-year stand at Wind River, Washington, 50.8 to 61.6 m tall and 87.1 to 153.5 cm d.b.h. (https://da.lib.kobe-u.ac.jp/da/kernel/90000778/90000778.pdf, p. 1252)";

  /*
   * Old-growth Douglas-firs' live crown ratio, read.
   */
  export const LIVE_CROWN: string =
    "Hummel 2009, Northwest Science 83(3), p. 244: \"The LCR of the former (0.64) is greater than the latter (0.45)\", the live crown ratios of two 450-year Douglas-fir stands, the live crown's length over the tree's height (https://research.fs.usda.gov/download/treesearch/34502.pdf); the crown base share is one less it";

  /*
   * Green Douglas-fir's moisture content, read in the Wood Handbook.
   */
  export const FIR_MOISTURE: string =
    "Wood Handbook, FPL-GTR-190 (2010), Table 4-1, average moisture content of green wood: Douglas-fir, coast type, heartwood 37 %, sapwood 115 % (https://research.fs.usda.gov/download/treesearch/37428.pdf, p. 4-2)";

  /*
   * The lower branches' bands' source.
   */
  export const BRANCHES: string =
    "provisional: a staged climbable tree's lower limbs, the lowest from a short climber's overhead reach to beyond a jump's, set a hand-to-foot climbing step apart, and a forearm to a thigh thick";
}
