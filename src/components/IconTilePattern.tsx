import React, { useMemo } from "react";
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { Assets } from "@/constants/assets";

const ICONS: ImageSourcePropType[] = [
  Assets.achievements.firstStep,
  Assets.achievements.streak7,
  Assets.achievements.centurion,
  Assets.achievements.excellence,
  Assets.achievements.perfectTheme,
  Assets.achievements.earlyBird,
  Assets.achievements.nightOwl,
  Assets.achievements.marathon,
  Assets.achievements.scholar,
  Assets.achievements.citizen,
  Assets.themes.institutions,
  Assets.themes.histoire,
  Assets.themes.valeurs,
  Assets.themes.geographie,
  Assets.themes.culture,
  Assets.perso.naturalisation,
  Assets.perso.csp,
  Assets.perso.cr,
  Assets.perso.channelSocial,
  Assets.perso.channelSearch,
  Assets.perso.channelFriend,
  Assets.perso.channelOther,
];

/** Marge appliquée de chaque côté d'une tuile, en fraction de `iconSize`. */
const TILE_MARGIN_RATIO = 0.18;

/** Marge intérieure du motif, en fraction de `iconSize`. */
const WRAP_PADDING_RATIO = 0.25;

type Props = {
  /** Largeur du conteneur. Sert à calculer le nombre de tuiles par ligne. */
  width: number;
  height: number;
  iconSize?: number;
  tileOpacity?: number;
  tintColor?: string;
  style?: ViewStyle;
};

export function IconTilePattern({
  width,
  height,
  iconSize = 28,
  tileOpacity = 0.1,
  tintColor = "#1a1c1e",
  style,
}: Props) {
  const tiles = useMemo(() => {
    // Le nombre de tuiles se déduit de la surface à couvrir. L'ancienne formule
    // supposait 14 tuiles par ligne — vrai sur un téléphone, faux dès que le
    // conteneur s'élargit : sur iPad le motif s'arrêtait avant le bas de
    // l'écran, laissant une moitié de fond nue.
    const pitch = iconSize * (1 + 2 * TILE_MARGIN_RATIO);
    const usableWidth = width - 2 * iconSize * WRAP_PADDING_RATIO;
    const perRow = Math.max(1, Math.floor(usableWidth / pitch));
    const rows = Math.ceil(height / pitch);
    const count = perRow * rows;
    return Array.from({ length: count }, (_, i) => {
      const icon = ICONS[i % ICONS.length];
      const rot = ((i * 37) % 40) - 20;
      return { icon, rot, key: i };
    });
  }, [width, height, iconSize]);

  return (
    <View
      pointerEvents="none"
      style={[
        styles.wrap,
        {
          height,
          opacity: tileOpacity,
          padding: iconSize * WRAP_PADDING_RATIO,
        },
        style,
      ]}
    >
      {tiles.map(({ icon, rot, key }) => (
        <Image
          key={key}
          source={icon}
          style={[
            styles.tile,
            {
              width: iconSize,
              height: iconSize,
              margin: iconSize * TILE_MARGIN_RATIO,
              transform: [{ rotate: `${rot}deg` }],
              tintColor,
            },
          ]}
          resizeMode="contain"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignContent: "flex-start",
    justifyContent: "center",
    overflow: "hidden",
  },
  tile: {},
});
