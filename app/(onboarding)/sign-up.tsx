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
import {
  Check,
  ChevronLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
} from "lucide-react-native";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import { Input } from "@/components/ui/Input";
import { PillButton } from "@/components/ui/PillButton";
import { AppleIcon, GoogleIcon } from "@/components/SocialIcons";
import { signUpWithEmail, signInWithGoogle, signInWithApple } from "@/lib/auth";
import { isPersoComplete } from "@/store/userStore";
import { useHaptics } from "@/hooks/useHaptics";
import { useAppleAvailable } from "@/hooks/useAppleAvailable";
import { toast } from "@/store/toastStore";

const schema = z.object({
  firstName: z.string().min(2, "Prénom trop court"),
  email: z.string().email("Email invalide"),
  password: z
    .string()
    .min(8, "8 caractères minimum")
    .regex(/[A-Za-z]/, "Doit contenir une lettre")
    .regex(/[0-9]/, "Doit contenir un chiffre"),
  acceptCgu: z.literal(true, {
    errorMap: () => ({ message: "Vous devez accepter les CGU" }),
  }),
});

type FormData = z.infer<typeof schema>;

/** Règles de mot de passe affichées en direct sous le champ. */
function passwordRules(pwd: string) {
  return [
    { label: "Au moins 8 caractères", ok: pwd.length >= 8 },
    { label: "Une lettre", ok: /[A-Za-z]/.test(pwd) },
    { label: "Un chiffre", ok: /[0-9]/.test(pwd) },
  ];
}

export default function SignUp() {
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  // Le bouton Apple ne doit apparaitre que si la connexion Apple est
  // reellement utilisable : un iPad est bien sous iOS, mais la fonctionnalite
  // peut y etre indisponible (pas de compte iCloud, restrictions).
  const appleAvailable = useAppleAvailable();
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { control, handleSubmit, formState: { errors }, setValue, watch } =
    useForm<FormData>({
      resolver: zodResolver(schema) as any,
      defaultValues: {
        firstName: "",
        email: "",
        password: "",
        acceptCgu: false as unknown as true,
      },
    });
  const acceptCgu = watch("acceptCgu");
  const password = watch("password");
  const rules = passwordRules(password ?? "");

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      // 1) Crée le compte côté backend (auth + profil + progression) — bloquant.
      const user = await signUpWithEmail({
        firstName: data.firstName,
        email: data.email,
        password: data.password,
      });

      // 2) Confirmation d'e-mail requise : pas de session. On informe et on
      //    renvoie vers la connexion (pas d'entrée dans l'app).
      if (!user) {
        Promise.resolve(haptics.success()).catch(() => {});
        toast.success(
          "Compte créé ! Vérifiez votre e-mail pour le confirmer, puis connectez-vous."
        );
        router.replace("/(onboarding)/sign-in");
        return;
      }

      // 3) Session active → haptique (fire-and-forget) + navigation perso.
      Promise.resolve(haptics.success()).catch(() => {});
      router.replace("/(onboarding)/perso/step-1");
    } catch (err) {
      // Message d'erreur traduit renvoyé par lib/auth.
      const msg =
        err instanceof Error
          ? err.message
          : "Une erreur est survenue. Veuillez réessayer.";
      toast.error(msg);
      console.warn("[sign-up] onSubmit failed", err);
    } finally {
      setSubmitting(false);
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
              Créer un compte
            </Text>
            <Text
              style={[
                Typography.bodyLarge,
                { color: Colors.textSecondary, marginTop: 4 },
              ]}
            >
              Quelques infos pour personnaliser votre parcours.
            </Text>
          </View>

          <View style={{ gap: 16 }}>
            <Controller
              control={control}
              name="firstName"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Prénom"
                  placeholder="Ex: Ibrahima"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  leftIcon={<User size={18} color={Colors.primary} />}
                  error={errors.firstName?.message}
                  autoCapitalize="words"
                />
              )}
            />
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
                  placeholder="8 caractères, lettre + chiffre"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  leftIcon={<Lock size={18} color={Colors.primary} />}
                  secureTextEntry={!showPwd}
                  rightIcon={
                    <Pressable
                      onPress={() => setShowPwd((v) => !v)}
                      hitSlop={8}
                      accessibilityLabel="Afficher le mot de passe"
                    >
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

            {password && password.length > 0 ? (
              <View style={styles.rulesBox}>
                {rules.map((r) => (
                  <View key={r.label} style={styles.ruleRow}>
                    {r.ok ? (
                      <Check size={14} color={Colors.success} />
                    ) : (
                      <View style={styles.ruleDot} />
                    )}
                    <Text
                      style={[
                        Typography.caption,
                        { color: r.ok ? Colors.success : Colors.textSecondary },
                      ]}
                    >
                      {r.label}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          <Pressable
            onPress={() => setValue("acceptCgu", !acceptCgu as any)}
            style={styles.cguRow}
            hitSlop={6}
          >
            <View
              style={[
                styles.checkbox,
                acceptCgu && { backgroundColor: Colors.primary, borderColor: Colors.primary },
              ]}
            >
              {acceptCgu ? <Check size={14} color={Colors.white} /> : null}
            </View>
            <Text style={[Typography.body, { color: Colors.onSurface, flex: 1 }]}>
              J'accepte les{" "}
              <Text
                style={{
                  color: Colors.tertiary,
                  textDecorationLine: "underline",
                }}
              >
                Conditions Générales d'Utilisation
              </Text>
            </Text>
          </Pressable>
          {errors.acceptCgu ? (
            <Text style={[Typography.caption, { color: Colors.error, marginTop: 4 }]}>
              {errors.acceptCgu.message as string}
            </Text>
          ) : null}

          <PillButton
            label="Créer mon compte"
            size="md"
            variant="primary"
            fullWidth
            onPress={handleSubmit(onSubmit)}
            loading={submitting}
            style={{ marginTop: 24 }}
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
                  onPress={async () => {
                    haptics.light();
                    try {
                      const user = await signInWithGoogle();
                      if (!user) return;
                      router.replace(
                        isPersoComplete(user)
                          ? "/(tabs)"
                          : "/(onboarding)/perso/step-1"
                      );
                    } catch (err) {
                      toast.error(
                        err instanceof Error
                          ? err.message
                          : "Échec de la connexion Google."
                      );
                    }
                  }}
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
                    onPress={async () => {
                      haptics.light();
                      try {
                        const user = await signInWithApple();
                        if (!user) return;
                        router.replace(
                          isPersoComplete(user)
                            ? "/(tabs)"
                            : "/(onboarding)/perso/step-1"
                        );
                      } catch (err) {
                        toast.error(
                          err instanceof Error
                            ? err.message
                            : "Échec de la connexion Apple."
                        );
                      }
                    }}
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
              Déjà un compte ?{" "}
            </Text>
            <Pressable onPress={() => router.replace("/(onboarding)/sign-in")}>
              <Text
                style={[
                  Typography.button,
                  {
                    color: Colors.tertiary,
                    textDecorationLine: "underline",
                  },
                ]}
              >
                Se connecter
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
  rulesBox: {
    gap: 6,
    paddingHorizontal: 4,
    marginTop: 2,
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ruleDot: {
    width: 14,
    height: 14,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
  },
  cguRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 20,
    marginBottom: 12,
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
