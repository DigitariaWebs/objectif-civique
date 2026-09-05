import { useCallback, useState } from "react";
import { LayoutChangeEvent } from "react-native";

export type ContainerSize = { width: number; height: number };

/**
 * Taille réelle du conteneur, mesurée par `onLayout`.
 *
 * À préférer systématiquement à `useWindowDimensions()` pour dimensionner des
 * enfants : depuis que `app/_layout.tsx` borne le contenu à une colonne (voir
 * `constants/layout`), la largeur de la fenêtre et celle du conteneur diffèrent
 * sur iPad. Un carrousel paginé dimensionné sur la fenêtre s'y décale d'une
 * page à l'autre — c'est ce qui a valu le refus « guideline 4 » sur
 * iPad Air 11".
 *
 * `size` vaut `null` tant que la première mesure n'est pas arrivée. L'appelant
 * ne part alors pas d'une valeur fenêtre qu'il faudrait corriger ensuite : il
 * diffère le rendu des enfants dont une taille fausse se verrait — un
 * carrousel, un motif de tuiles. Un calque purement additif au-dessus d'un fond
 * déjà peint (`GrainyBackground`) peut se contenter de rendre à zéro, ce qui ne
 * peint rien.
 */
export function useContainerSize() {
  const [size, setSize] = useState<ContainerSize | null>(null);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) =>
      prev &&
      Math.abs(prev.width - width) < 1 &&
      Math.abs(prev.height - height) < 1
        ? prev
        : { width, height },
    );
  }, []);

  return { size, onLayout };
}
