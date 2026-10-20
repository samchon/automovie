/**
 * Reference population a converter draws its means from.
 *
 * Craniofacial and body proportions differ between populations in ways stature does not predict. The cephalic index derived from published means is about 77 in US adults of European ancestry (3D Facial Norms, Weinberg et al. 2016, Cleft Palate Craniofac J 53(6):e185-e197) and about 85 in Chinese workers (Du et al. 2008, Ann Occup Hyg 52(8):773-782); across 1,470 adults from Europe, the Middle East, Asia and of African origin, the nose and orbits varied most while mouth width, forehead height and ear height were nearly identical (Farkas et al. 2005, J Craniofac Surg 16(4):615-646, abstract). A converter starts a person at the mean of the chosen population, because averageness, symmetry and sexual dimorphism are attractive across cultures (Rhodes 2006, "The evolutionary psychology of facial beauty", Annu Rev Psychol 57, abstract).
 *
 * The choice names a body of published survey data, not an identity of the person. Modeling never reads it; every difference it makes reaches the person as measurements and pigmentation in {@link IAutoMovieHumanIdentity}. The list grows as surveys for further populations are read.
 */
export const enum AutoMovieHumanPopulation {
  /** European ancestry, as in the US 3D Facial Norms and the White subsample of US surveys. */
  European = "european",

  /** East Asian ancestry, as in Chinese and Korean national surveys. */
  EastAsian = "eastAsian",

  /** Sub-Saharan African ancestry, as in Kenyan, Nigerian and South African surveys. */
  African = "african",
}
