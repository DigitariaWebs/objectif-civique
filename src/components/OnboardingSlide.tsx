import React from "react";
import { ImageSourcePropType, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants/colors";
import { Layout } from "@/constants/layout";

type Props = {
  imageSource: ImageSourcePropType;
  width: number;
  height: number;
  eyebrow: string;
  title: string;
  subtitle: string;
  accent?: "navy" | "red";
  sheetHeight: number;
  navReserved: number;
};

export function OnboardingSlide({
  imageSource,
  width,
  height,
  eyebrow,
  title,
  subtitle,
  accent = "navy",
  sheetHeight,
  navReserved,
}: Props) {
  // La pastille est posee sur la photo, pas sur le bandeau blanc : a 10 %
  // d'opacite elle disparaissait sur les cliches clairs (le Pantheon de la
  // deuxieme diapositive). Un fond blanc quasi opaque la detache de n'importe
  // quelle scene, et la teinte pleine porte la couleur d'accent.
  const eyebrowColor = accent === "red" ? Colors.secondary : Colors.primary;
  const eyebrowBg = "rgba(255,255,255,0.92)";
  const eyebrowBorder =
    accent === "red" ? "rgba(239,65,53,0.35)" : "rgba(0,85,164,0.30)";
  const wide = width >= Layout.wideBreakpoint;

  return (
    <View style={[styles.container, { width, height }]}>
      <Image
        source={imageSource}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        contentPosition="center"
        transition={200}
      />

      {/* Top scrim — keeps status bar + logo + skip legible over any scene */}
      <LinearGradient
        colors={["rgba(20,25,35,0.28)", "rgba(20,25,35,0)"]}
        locations={[0, 1]}
        style={styles.topScrim}
        pointerEvents="none"
      />

      {/* Bottom fade — blends the photo into the white content sheet */}
      <LinearGradient
        colors={[
          "rgba(255,255,255,0)",
          "rgba(255,255,255,0.65)",
          "rgba(255,255,255,1)",
        ]}
        locations={[0, 0.55, 1]}
        style={[styles.bottomFade, { height: sheetHeight + 120, bottom: 0 }]}
        pointerEvents="none"
      />

      {/* Content sheet */}
      <View
        style={[
          styles.sheet,
          wide && styles.sheetWide,
          { height: sheetHeight, paddingBottom: navReserved },
        ]}
        pointerEvents="none"
      >
        <View
          style={[
            styles.eyebrow,
            { backgroundColor: eyebrowBg, borderColor: eyebrowBorder },
          ]}
        >
          <Text style={[styles.eyebrowText, { color: eyebrowColor }]}>
            {eyebrow}
          </Text>
        </View>
        <Text style={[styles.title, wide && styles.titleWide]}>{title}</Text>
        <Text style={[styles.subtitle, wide && styles.subtitleWide]}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    backgroundColor: "#EFE6DA",
  },
  topScrim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 160,
  },
  bottomFade: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 20,
    paddingHorizontal: 28,
    justifyContent: "flex-start",
  },
  sheetWide: {
    paddingHorizontal: 40,
  },
  eyebrow: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 16,
  },
  eyebrowText: {
    fontFamily: "Satoshi_600SemiBold",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    color: Colors.onSurface,
    fontFamily: "Satoshi_700Bold",
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.6,
    marginBottom: 12,
  },
  titleWide: {
    fontSize: 36,
    lineHeight: 43,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
  },
  subtitleWide: {
    fontSize: 17,
    lineHeight: 26,
  },
});
