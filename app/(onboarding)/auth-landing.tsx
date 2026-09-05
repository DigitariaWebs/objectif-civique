import React from "react";
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import { Assets } from "@/constants/assets";
import { PillButton } from "@/components/ui/PillButton";
import { GoogleIcon } from "@/components/SocialIcons";
import { IconTilePattern } from "@/components/IconTilePattern";
import { useHaptics } from "@/hooks/useHaptics";
import { useContainerSize } from "@/hooks/useContainerSize";
import { signInWithGoogle } from "@/lib/auth";
import { isPersoComplete } from "@/store/userStore";
import { toast } from "@/store/toastStore";

export default function AuthLanding() {
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const { size, onLayout } = useContainerSize();

  const onGoogle = async () => {
    haptics.light();
    try {
      const user = await signInWithGoogle();
      if (!user) return;
      router.replace(
        isPersoComplete(user) ? "/(tabs)" : "/(onboarding)/perso/step-1"
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Échec de la connexion Google."
      );
    }
  };

  return (
    <View style={styles.container} onLayout={onLayout}>
      {size ? (
        <IconTilePattern
          width={size.width}
          height={size.height}
          iconSize={28}
          tileOpacity={0.05}
          tintColor="#1a1c1e"
          style={styles.patternLayer}
        />
      ) : null}

      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <View style={styles.brandRow}>
          <Image
            source={Assets.branding.logo}
            style={styles.brandLogo}
            resizeMode="contain"
          />
          <View style={styles.brandDivider} />
          <View>
            <Text style={styles.brandText}>Objectif</Text>
            <Text style={styles.brandText}>Civique</Text>
          </View>
        </View>
      </View>

      <View style={styles.center}>
        <Image
          source={Assets.onboarding.heroProgress}
          style={styles.hero}
          resizeMode="contain"
        />
        <Text style={[Typography.display, styles.title]}>Prêt à réussir ?</Text>
        <Text style={[Typography.bodyLarge, styles.subtitle]}>
          Créez un compte pour suivre votre progression et préparer votre
          examen civique.
        </Text>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 20 }]}>
        {/*
          Connexions tierces : masquées sur iOS. Voir le commentaire détaillé
          dans `sign-in.tsx` — la guideline 4.8 impose Sign in with Apple dès
          lors qu'une connexion tierce est proposée, et Sign in with Apple
          échouait côté serveur.

          Cet écran avait été oublié lors du retrait : il proposait encore
          Google sur toutes les plateformes, et un bouton Apple conditionné au
          seul `Platform.OS` — donc affiché puis en échec sur les iPad sans
          connexion Apple disponible. Le bouton Apple disparaît ici plutôt
          qu'être conditionné à `useAppleAvailable()` comme dans `sign-in` :
          sur cet écran il n'accompagne aucune connexion par e-mail, il ne
          reste donc rien à mettre en conformité avec la 4.8.
        */}
        {Platform.OS !== "ios" && (
          <Pressable
            onPress={onGoogle}
            accessibilityRole="button"
            accessibilityLabel="Continuer avec Google"
            style={({ pressed }) => [
              styles.socialBtn,
              pressed && { opacity: 0.85 },
            ]}
          >
            <GoogleIcon size={20} />
            <Text style={styles.socialLabel}>Continuer avec Google</Text>
          </Pressable>
        )}

        <PillButton
          label="Créer un compte"
          size="md"
          variant="primary"
          fullWidth
          onPress={() => router.push("/(onboarding)/sign-up")}
        />

        <View style={styles.switchRow}>
          <Text style={[Typography.body, { color: Colors.textSecondary }]}>
            Déjà un compte ?{" "}
          </Text>
          <Pressable onPress={() => router.push("/(onboarding)/sign-in")}>
            <Text
              style={[
                Typography.button,
                {
                  color: Colors.tertiary,
                  textDecorationLine: "underline",
                  textDecorationColor: Colors.tertiary,
                },
              ]}
            >
              Se connecter
            </Text>
          </Pressable>
        </View>

        <Text style={styles.disclaimer}>
          Application indépendante, non affiliée à une administration ou un
          organisme gouvernemental.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.ivory,
    paddingHorizontal: 24,
  },
  patternLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  topBar: {
    alignItems: "center",
    paddingBottom: 12,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandLogo: {
    width: 36,
    height: 36,
  },
  brandDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.outlineVariant,
  },
  brandText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    lineHeight: 15,
    color: Colors.primary,
    letterSpacing: -0.2,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  title: {
    color: Colors.onSurface,
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    color: Colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 12,
  },
  bottom: {
    gap: 12,
  },
  socialBtn: {
    height: 48,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
  },
  socialLabel: {
    ...Typography.button,
    color: Colors.onSurface,
    fontSize: 15,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  disclaimer: {
    fontFamily: "Inter_400Regular",
    fontSize: 10.5,
    lineHeight: 14,
    color: Colors.textTertiary,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 8,
  },
});
