/**
 * Géométrie de la colonne de contenu.
 *
 * L'app est dessinée pour un téléphone. Sur iPad, laisser les écrans s'étirer
 * sur toute la largeur avait valu un refus « guideline 4 — crowded interface » :
 * `app/_layout.tsx` borne donc le contenu à une colonne centrée. Sur téléphone
 * la contrainte est inerte — aucun appareil n'atteint cette largeur.
 */
export const Layout = {
  /**
   * Largeur maximale de la colonne de contenu. Au-delà, les lignes de texte
   * deviennent trop longues à lire et les cartes s'étirent.
   */
  contentMaxWidth: 640,

  /**
   * Au-delà de cette largeur, on est sur tablette : la colonne plafonne à
   * `contentMaxWidth` et aucun téléphone ne l'atteint. Les écrans qui composent
   * du texte peuvent y monter d'un cran — à taille téléphone, un titre perdu
   * dans un bandeau de tablette paraît vide, ce qu'Apple lit comme un portage
   * non soigné.
   */
  wideBreakpoint: 560,
} as const;
