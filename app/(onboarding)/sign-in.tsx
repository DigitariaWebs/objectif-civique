import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronLeft, Eye, EyeOff, Lock, Mail } from "lucide-react-native";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import { Input } from "@/components/ui/Input";
import { PillButton } from "@/components/ui/PillButton";
import { AppleIcon, GoogleIcon } from "@/components/SocialIcons";
import {
  signInWithEmail,
  signInWithGoogle,
  signInWithApple,
  resetPassword,
} from "@/lib/auth";
import { isPersoComplete } from "@/store/userStore";
import { toast } from "@/store/toastStore";
import { useHaptics } from "@/hooks/useHaptics";
import { useAppleAvailable } from "@/hooks/useAppleAvailable";

const schema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});
type FormData = z.infer<typeof schema>;

export default function SignIn() {
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  // Le bouton Apple ne doit apparaitre que si la connexion Apple est
  // reellement utilisable : un iPad est bien sous iOS, mais la fonctionnalite
  // peut y etre indisponible (pas de compte iCloud, restrictions).
  const appleAvailable = useAppleAvailable();
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { control, handleSubmit, getValues, formState: { errors } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: { email: "", password: "" },
    });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const user = await signInWithEmail({
        email: data.email,
        password: data.password,
      });
      Promise.resolve(haptics.success()).catch(() => {});
      // Profil incomplet → reprend l'onboarding ; sinon → app.
      router.replace(
        isPersoComplete(user) ? "/(tabs)" : "/(onboarding)/perso/step-1"
      );
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "E-mail ou mot de passe incorrect.";
      toast.error(msg);
      console.warn("[sign-in] onSubmit failed", err);
    } finally {
      setSubmitting(false);
    }
  };

  const onGoogle = async () => {
    haptics.light();
    try {
      const user = await signInWithGoogle();
      if (!user) return; // annulé par l'utilisateur
      router.replace(
        isPersoComplete(user) ? "/(tabs)" : "/(onboarding)/perso/step-1"
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Échec de la connexion Google."
      );
    }
  };

  const onApple = async () => {
    haptics.light();
    try {
      const user = await signInWithApple();
      if (!user) return; // annulé par l'utilisateur
      router.replace(
        isPersoComplete(user) ? "/(tabs)" : "/(onboarding)/perso/step-1"
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Échec de la connexion Apple."
      );
    }
  };

  const onForgotPassword = async () => {
    const email = getValues("email").trim();
    if (!email || !email.includes("@")) {
      toast.info("Saisissez d'abord votre e-mail, puis touchez à nouveau.");
      return;
    }
    try {
      await resetPassword(email);
      toast.success("E-mail de réinitialisation envoyé. Vérifiez votre boîte.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Échec de l'envoi.";
      toast.error(msg);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.ivory }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 12 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="Retour"
          hitSlop={6}
        >
          <ChevronLeft size={22} color={Colors.primary} />
        </Pressable>

        <View style={styles.formWrap}>
          <View style={{ marginBottom: 28 }}>
            <Text style={[Typography.display, { color: Colors.onSurface }]}>
              Bon retour
            </Text>
            <Text
              style={[
                Typography.bodyLarge,
                { color: Colors.textSecondary, marginTop: 4 },
              ]}
            >
              Connectez-vous pour reprendre votre préparation.
            </Text>
          </View>

          <View style={{ gap: 16 }}>
            <Controller
              control={control}
              name="email"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Email"
                  placeholder="vous@email.com"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  leftIcon={<Mail size={18} color={Colors.primary} />}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.email?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Mot de passe"
                  placeholder="Votre mot de passe"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  leftIcon={<Lock size={18} color={Colors.primary} />}
                  secureTextEntry={!showPwd}
                  rightIcon={
                    <Pressable onPress={() => setShowPwd((v) => !v)} hitSlop={8}>
                      {showPwd ? (
                        <EyeOff size={18} color={Colors.textSecondary} />
                      ) : (
                        <Eye size={18} color={Colors.textSecondary} />
                      )}
                    </Pressable>
                  }
                  error={errors.password?.message}
                />
              )}
            />
          </View>

          <Pressable
            onPress={onForgotPassword}
            style={{ alignSelf: "flex-end", marginTop: 10, padding: 6 }}
          >
            <Text style={[Typography.button, { color: Colors.tertiary }]}>
              Mot de passe oublié ?
            </Text>
          </Pressable>

          <PillButton
            label="Se connecter"
            size="md"
            variant="primary"
            fullWidth
            onPress={handleSubmit(onSubmit)}
            loading={submitting}
            style={{ marginTop: 20 }}
          />

          {/*
            Connexions tierces : masquees sur iOS.

            La guideline 4.8 impose Sign in with Apple des lors qu'une connexion
            tierce est proposee. Sign in with Apple echouait cote serveur Apple
            (« Sign Up Not Completed ») malgre une configuration verifiee correcte
            — entitlement present dans le profil et le binaire, App ID en primary.
            Deux refus de verification en ont decoule.

            En ne proposant aucune connexion tierce sur iOS, l'obligation tombe :
            il reste l'e-mail et le mot de passe, qui fonctionnent. Android
            conserve Google, deja en production et sans probleme.
          */}
          {Platform.OS !== "ios" && (
            <>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={[Typography.caption, styles.dividerLabel]}>
                  Ou continuer avec
                </Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={{ gap: 12 }}>
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

                {appleAvailable && (
                  <Pressable
                    onPress={onApple}
                    accessibilityRole="button"
                    accessibilityLabel="Continuer avec Apple"
                    style={({ pressed }) => [
                      styles.socialBtn,
                      styles.appleBtn,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <AppleIcon size={20} color={Colors.white} />
                    <Text style={[styles.socialLabel, { color: Colors.white }]}>
                      Continuer avec Apple
                    </Text>
                  </Pressable>
                )}
              </View>
            </>
          )}

          <View style={styles.switchRow}>
            <Text style={[Typography.body, { color: Colors.textSecondary }]}>
              Pas encore de compte ?{" "}
            </Text>
            <Pressable onPress={() => router.replace("/(onboarding)/sign-up")}>
              <Text
                style={[
                  Typography.button,
                  {
                    color: Colors.tertiary,
                    textDecorationLine: "underline",
                  },
                ]}
              >
                S'inscrire
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  /*
    Le formulaire est centre dans la hauteur restante. Sur telephone il remplit
    deja l'ecran et le centrage est sans effet ; sur iPad il tenait dans le
    tiers superieur en laissant 60 % de vide sous lui — le genre de mise en
    page qu'Apple range en guideline 4. Le bouton retour reste en haut.
  */
  formWrap: {
    flex: 1,
    justifyContent: "center",
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.white,
    marginBottom: 24,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 24,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.outlineVariant,
  },
  dividerLabel: {
    color: Colors.textSecondary,
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
  appleBtn: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },
  socialLabel: {
    ...Typography.button,
    color: Colors.onSurface,
    fontSize: 15,
  },
});
