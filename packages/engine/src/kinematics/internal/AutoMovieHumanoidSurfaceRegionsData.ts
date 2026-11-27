/*
 * The costal margin's lowest point as a share of stature: the tenth rib height
 * of ANSUR II (Gordon et al. 2014, NATICK/TR-15/007; means of the public
 * records, 1,986 women and 4,082 men: tenth rib 1056.3 and 1120.7 mm, stature
 * 1628.5 and 1756.2 mm), the greater of the women's and the men's shares, so
 * the station stands at or just above the margin on either body. Declared
 * before the table, whose initialiser reads it.
 */
export const COSTAL_MARGIN: number = Math.max(1056.3 / 1628.5, 1120.7 / 1756.2);
