/**
 * Reference population associated with the requested survey statistics.
 *
 * Craniofacial and body proportions differ between populations in ways stature does not predict. The cephalic index derived from published means is about 77 in US adults of European ancestry (3D Facial Norms, Weinberg et al. 2016, Cleft Palate Craniofac J 53(6):e185-e197) and about 85 in Chinese workers (Du et al. 2008, Ann Occup Hyg 52(8):773-782); across 1,470 adults from Europe, the Middle East, Asia and of African origin, the nose and orbits varied most while mouth width, forehead height and ear height were nearly identical (Farkas et al. 2005, J Craniofac Surg 16(4):615-646, abstract).
 *
 * The choice names a body of published survey data, not the person's identity or detailed measurements. It supplies no automatic dimensions or pigmentation.
 */
export const enum AutoMovieHumanPopulation {
  /** European ancestry, as in the US 3D Facial Norms and the White subsample of US surveys. */
  European = "european",

  /** East Asian ancestry, as in Chinese and Korean national surveys. */
  EastAsian = "eastAsian",

  /** Sub-Saharan African ancestry, as in Kenyan, Nigerian and South African surveys. */
  African = "african",
}
