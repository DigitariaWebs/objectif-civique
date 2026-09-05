import React from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, {
  Defs,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { useContainerSize } from "@/hooks/useContainerSize";

/**
 * Soft, "grainy-gradient" backdrop:
 *  - subtle base LinearGradient
 *  - four large SVG radial-gradient blobs that fade smoothly to transparent
 *    (no hard circular edges, mimics a heavy blur)
 *  - a white wash on the upper half to soften the blob tops
 */
export function GrainyBackground() {
  // Scale the SVG to the container, not to the window: content is bounded to a
  // column (see `constants/layout`), so on iPad the two differ and a
  // window-sized canvas pushed the blobs out of frame. Before the first
  // measure W and H are 0, so the SVG paints nothing and only the base gradient
  // below shows — no need to hold the whole backdrop back for a frame.
  const { size, onLayout } = useContainerSize();
  const W = size?.width ?? 0;
  const H = size?.height ?? 0;

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      onLayout={onLayout}
    >
      <LinearGradient
        colors={["#F3F6FB", "#FBFAF7", "#F5F1F8"]}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Svg
        width={W}
        height={H}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        <Defs>
          {/* Navy top-right */}
          <RadialGradient
            id="navyTR"
            cx="85%"
            cy="8%"
            r="55%"
            fx="85%"
            fy="8%"
          >
            <Stop offset="0%" stopColor="#0055A4" stopOpacity="0.35" />
            <Stop offset="45%" stopColor="#0055A4" stopOpacity="0.12" />
            <Stop offset="100%" stopColor="#0055A4" stopOpacity="0" />
          </RadialGradient>

          {/* Red mid-left */}
          <RadialGradient
            id="redML"
            cx="-5%"
            cy="38%"
            r="55%"
            fx="-5%"
            fy="38%"
          >
            <Stop offset="0%" stopColor="#EF4135" stopOpacity="0.28" />
            <Stop offset="50%" stopColor="#EF4135" stopOpacity="0.08" />
            <Stop offset="100%" stopColor="#EF4135" stopOpacity="0" />
          </RadialGradient>

          {/* Deep navy bottom-right */}
          <RadialGradient
            id="deepBR"
            cx="100%"
            cy="95%"
            r="60%"
            fx="100%"
            fy="95%"
          >
            <Stop offset="0%" stopColor="#0A0F1E" stopOpacity="0.22" />
            <Stop offset="55%" stopColor="#0A0F1E" stopOpacity="0.06" />
            <Stop offset="100%" stopColor="#0A0F1E" stopOpacity="0" />
          </RadialGradient>

          {/* Subtle violet mid-right for warmth */}
          <RadialGradient
            id="violetMR"
            cx="95%"
            cy="62%"
            r="40%"
            fx="95%"
            fy="62%"
          >
            <Stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.14" />
            <Stop offset="60%" stopColor="#8b5cf6" stopOpacity="0.04" />
            <Stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        <Rect x="0" y="0" width={W} height={H} fill="url(#navyTR)" />
        <Rect x="0" y="0" width={W} height={H} fill="url(#redML)" />
        <Rect x="0" y="0" width={W} height={H} fill="url(#deepBR)" />
        <Rect x="0" y="0" width={W} height={H} fill="url(#violetMR)" />
      </Svg>

      {/* Upper-half wash for extra softness behind the header */}
      <LinearGradient
        colors={["rgba(255,255,255,0.55)", "rgba(255,255,255,0)"]}
        locations={[0, 1]}
        style={[StyleSheet.absoluteFill, { height: "55%" }]}
      />
    </View>
  );
}
