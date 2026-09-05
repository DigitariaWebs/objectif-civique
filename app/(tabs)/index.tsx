import React from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowRight,
  Bell,
  BookOpenCheck,
  ChevronRight,
  Compass,
  Crown,
  FileText,
  Flame,
  Handshake,
  Layers,
  MapPin,
  MessageCircle,
  MessagesSquare,
  Newspaper,
  ShieldQuestion,
  Sparkles,
  Target,
  Timer,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { GrainyBackground } from "@/components/ui/GrainyBackground";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useUserStore } from "@/store/userStore";
import { useProgressStore, getSuccessRate } from "@/store/progressStore";
import { useSessionStore } from "@/store/sessionStore";
import { GOAL_LABELS } from "@/data/questions";
import { THEMES } from "@/data/themes";
import { useHaptics } from "@/hooks/useHaptics";
import { useContainerSize } from "@/hooks/useContainerSize";
import { getPresentation } from "@/lib/goalPresentation";
import { getResumeTarget } from "@/lib/resume";
import { isPaid } from "@/lib/entitlements";

const TOTAL_QUESTION_BANK = 3500;
const FLASHCARD_TARGET = 50;

type TileDef = {
  key: string;
  title: string;
  subtitle: string;
  value: number;
  icon: React.ReactNode;
  gradient: [string, string];
  onPress: () => void;
};

export default function HomeTab() {
  const insets = useSafeAreaInsets();
  const { size, onLayout } = useContainerSize();
  const user = useUserStore((s) => s.user);
  const progress = useProgressStore();
  const haptics = useHaptics();
  const currentSession = useSessionStore((s) => s.current);
  const resume = getResumeTarget(currentSession);
  const goalCategory = (user?.goal as "NAT" | "CR" | "CSP") ?? "NAT";

  const firstName = user?.firstName ?? "Ami";
  const initials = firstName.slice(0, 1).toUpperCase();
  const goalLabel = user?.goal ? GOAL_LABELS[user.goal] : "Naturalisation";
  const presentation = getPresentation(user?.goal ?? null);
  const successRate = getSuccessRate({
    questionsAnswered: progress.questionsAnswered,
    correctCount: progress.correctCount,
  });

  const sortedThemes = [...THEMES]
    .map((t) => ({ ...t, percent: progress.themeProgress[t.id] ?? 0 }))
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 3);

  const themeAvg =
    THEMES.reduce(
      (acc, t) => acc + (progress.themeProgress[t.id] ?? 0),
      0
    ) / Math.max(THEMES.length, 1);

  const trainingPct = Math.min(
    1,
    progress.questionsAnswered / TOTAL_QUESTION_BANK
  );
  const simulationPct = Math.min(1, progress.bestSessionScore / 100);
  const flashcardsPct = Math.min(
    1,
    progress.bookmarks.length / FLASHCARD_TARGET
  );
  const themesPct = Math.min(1, themeAvg / 100);

  // Largeur de la colonne mesuree, pas celle de la fenetre : le contenu est
  // borne (voir `constants/layout`), donc sur iPad la fenetre est plus large
  // que cet ecran et la grille debordait de la colonne.
  const contentWidth = (size?.width ?? 0) - 40; // moins le padding 20 * 2
  const tileWidth = (contentWidth - 12) / 2; // moins l'ecart

  const go = (fn: () => void) => () => {
    haptics.light();
    fn();
  };

  const caseTag = user?.goal ?? "NAT";
  const tiles: TileDef[] = [
    {
      key: "training",
      title: "Entraînement",
      subtitle: `Questions officielles ${caseTag}`,
      value: trainingPct,
      icon: <BookOpenCheck size={20} color={Colors.white} strokeWidth={2.2} />,
      gradient: [Colors.primary, Colors.primaryContainer],
      onPress: () =>
        router.push({
          pathname: "/practice/[category]",
          params: { category: caseTag },
        }),
    },
    {
      key: "simulation",
      title: "Simulation",
      subtitle: `Examen blanc ${caseTag} · 40 Q`,
      value: simulationPct,
      icon: <Timer size={20} color={Colors.white} strokeWidth={2.2} />,
      gradient: [Colors.secondary, "#ff6b5f"],
      onPress: () => router.push("/simulation/intro"),
    },
    {
      key: "flashcards",
      title: "Flashcards",
      subtitle: `Cartes mémo ${caseTag}`,
      value: flashcardsPct,
      icon: <Layers size={20} color={Colors.white} strokeWidth={2.2} />,
      gradient: ["#7a4ae0", "#9a72f0"],
      onPress: () => router.push("/flashcards"),
    },
    {
      key: "themes",
      title: "Par thème",
      subtitle: `5 thèmes · ${caseTag}`,
      value: themesPct,
      icon: <Compass size={20} color={Colors.white} strokeWidth={2.2} />,
      gradient: [Colors.primaryContainer, Colors.primary],
      onPress: () => router.push("/(tabs)/revise"),
    },
  ];

  return (
    <View
      style={{ flex: 1, backgroundColor: "#F3F6FB" }}
      onLayout={onLayout}
    >
      <GrainyBackground />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: insets.top + 8,
          paddingBottom: 140,
        }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.hello}>Bonjour,</Text>
            <Text style={styles.name}>{firstName}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.iconBtn,
              pressed && { opacity: 0.8 },
            ]}
            hitSlop={6}
          >
            <Bell size={18} color={Colors.onSurface} />
          </Pressable>
        </View>

        {/* Bannière de parcours — communique IMMÉDIATEMENT le cas de l'utilisateur */}
        <View style={styles.goalBanner}>
          <LinearGradient
            colors={[Colors.primary, "#003a75"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.goalBannerBlob} pointerEvents="none" />

          {presentation.illustration ? (
            <Image
              source={presentation.illustration}
              style={styles.goalBannerIllustration}
              resizeMode="contain"
            />
          ) : null}

          <View style={styles.goalBannerContent}>
            <Text style={styles.goalBannerLabel}>{presentation.banner}</Text>
            <Text style={styles.goalBannerTitle}>{presentation.longLabel}</Text>
            <Text style={styles.goalBannerTagline} numberOfLines={2}>
              {presentation.tagline}
            </Text>
            <View style={styles.goalBannerFooter}>
              <View style={styles.goalBannerChip}>
                <Sparkles size={11} color={Colors.white} />
                <Text style={styles.goalBannerChipText}>
                  Niveau requis · {presentation.languageLevel}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Reprise — série en cours non terminée */}
        {resume ? (
          <Pressable
            onPress={go(() =>
              router.push({
                pathname: resume.pathname,
                params: resume.params,
              } as never)
            )}
            style={({ pressed }) => [
              styles.resumeBanner,
              pressed && { transform: [{ scale: 0.99 }], opacity: 0.96 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={resume.label}
          >
            <View style={styles.resumeIcon}>
              <Timer size={20} color={Colors.white} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.resumeTitle}>{resume.label}</Text>
              <Text style={styles.resumeSub} numberOfLines={2}>
                Vous avez une série en cours — reprenez là où vous vous êtes
                arrêté.
              </Text>
            </View>
            <ChevronRight size={18} color={Colors.white} />
          </Pressable>
        ) : null}

        {/* Essai gratuit — 40 questions officielles, sans abonnement */}
        {!isPaid(user) ? (
          <Pressable
            onPress={go(() =>
              router.push({
                pathname: "/practice/[category]",
                params: { category: goalCategory, freeOfficial: "1" },
              })
            )}
            style={({ pressed }) => [
              styles.freeTrialBanner,
              pressed && { transform: [{ scale: 0.99 }], opacity: 0.96 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Essai gratuit : 40 questions officielles"
          >
            <View style={styles.freeTrialIcon}>
              <Sparkles size={20} color={Colors.white} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.freeBadge}>
                <Text style={styles.freeBadgeText}>GRATUIT</Text>
              </View>
              <Text style={styles.freeTrialTitle}>40 questions officielles</Text>
              <Text style={styles.freeTrialSub} numberOfLines={2}>
                Testez gratuitement avant de vous abonner.
              </Text>
            </View>
            <ChevronRight size={18} color={Colors.success} />
          </Pressable>
        ) : null}

        {/* Essai gratuit — 20 flashcards, sans abonnement */}
        {!isPaid(user) ? (
          <Pressable
            onPress={go(() =>
              router.push({
                pathname: "/flashcards/[slug]",
                params: { slug: goalCategory, free: "1" },
              })
            )}
            style={({ pressed }) => [
              styles.freeTrialBanner,
              pressed && { transform: [{ scale: 0.99 }], opacity: 0.96 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Essai gratuit : 20 flashcards"
          >
            <View style={styles.freeTrialIcon}>
              <Layers size={20} color={Colors.white} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.freeBadge}>
                <Text style={styles.freeBadgeText}>GRATUIT</Text>
              </View>
              <Text style={styles.freeTrialTitle}>20 flashcards</Text>
              <Text style={styles.freeTrialSub} numberOfLines={2}>
                Mémorisez avec 20 cartes offertes.
              </Text>
            </View>
            <ChevronRight size={18} color={Colors.success} />
          </Pressable>
        ) : null}

        {/* Forfait CTA — shown only while on free plan */}
        {!isPaid(user) ? (
          <Pressable
            onPress={go(() => router.push("/subscription"))}
            style={({ pressed }) => [
              styles.forfaitBanner,
              pressed && { transform: [{ scale: 0.99 }], opacity: 0.96 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Voir les forfaits premium"
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryContainer]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.forfaitIcon}>
              <Crown size={20} color={Colors.white} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.forfaitTitle}>Débloquez tout le contenu</Text>
              <Text style={styles.forfaitSub} numberOfLines={2}>
                3 500+ questions, simulations et guides — en un seul paiement, dès 5,99 €.
              </Text>
            </View>
            <ArrowRight size={18} color={Colors.white} />
          </Pressable>
        ) : null}

        {/* Hero — continue session */}
        <Pressable
          onPress={go(() =>
            router.push({
              pathname: "/practice/[category]",
              params: { category: user?.goal ?? "NAT" },
            })
          )}
          style={styles.hero}
        >
          {/* Decorative corner blob */}
          <LinearGradient
            colors={["rgba(0,85,164,0.14)", "rgba(0,85,164,0)"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.heroBlob}
            pointerEvents="none"
          />

          <View style={styles.heroTopRow}>
            <View style={styles.heroChip}>
              <Sparkles size={11} color={Colors.primary} />
              <Text style={styles.heroChipText}>Prochaine session</Text>
            </View>
            <Text style={styles.heroCount}>
              {progress.questionsAnswered}
              <Text style={styles.heroCountMuted}>/50</Text>
            </Text>
          </View>
          <Text style={styles.heroTitle}>{presentation.heroTitle}</Text>
          <Text style={styles.heroDesc}>{presentation.heroSubtitle}</Text>

          <View style={styles.heroFooter}>
            <View style={styles.heroCta}>
              <Text style={styles.heroCtaText}>Continuer</Text>
              <ArrowRight size={14} color={Colors.white} />
            </View>
            <View style={styles.heroStats}>
              <HeroStat label="Réussite" value={`${successRate}%`} />
              <View style={styles.heroStatDivider} />
              <HeroStat
                label="Série"
                value={`${progress.currentStreak}`}
                icon={<Flame size={12} color={Colors.secondary} />}
              />
            </View>
          </View>
        </Pressable>

        {/* Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Votre parcours</Text>
          <Text style={styles.sectionMuted}>
            {Math.round(
              (trainingPct + simulationPct + flashcardsPct + themesPct) * 25
            )}
            % global
          </Text>
        </View>

        {/* 2×2 compact tile grid */}
        {size ? (
          <View style={styles.grid}>
            {tiles.map(({ key, ...rest }) => (
              <StudyTile key={key} {...rest} width={tileWidth} />
            ))}
          </View>
        ) : null}

        {/* Bloc parcours spécifique au profil */}
        {user?.goal ? (
          <View style={styles.parcoursCard}>
            <View style={styles.parcoursHeader}>
              <Target size={14} color={Colors.primary} />
              <Text style={styles.parcoursLabel}>
                MON PARCOURS · {GOAL_LABELS[user.goal].toUpperCase()}
              </Text>
            </View>
            <View style={styles.parcoursList}>
              <ParcoursStep
                first
                label={
                  user.goal === "NAT"
                    ? "Réviser le programme civique NAT"
                    : "Réviser le programme civique " + user.goal
                }
                onPress={go(() =>
                  router.push({
                    pathname: "/practice/[category]",
                    params: { category: user.goal ?? "NAT" },
                  })
                )}
              />
              <ParcoursStep
                label="Préparer mon dossier (pièces requises)"
                onPress={go(() => router.push("/documents" as any))}
              />
              {user.goal === "NAT" ? (
                <ParcoursStep
                  label="Entretien d'assimilation (vrai/faux + thèmes)"
                  onPress={go(() => router.push("/assimilation"))}
                />
              ) : null}
              <ParcoursStep
                label="Lancer une simulation 40 questions"
                onPress={go(() => router.push("/simulation/intro"))}
              />
            </View>
          </View>
        ) : null}

        {/* NAT-only: Entretien d'assimilation banner */}
        {user?.goal === "NAT" ? (
          <Pressable
            onPress={go(() => router.push("/assimilation"))}
            style={({ pressed }) => [
              styles.assimBanner,
              pressed && { transform: [{ scale: 0.99 }], opacity: 0.96 },
            ]}
          >
            <LinearGradient
              colors={[Colors.secondary, "#ff6b5f"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.assimIcon}
            >
              <MessageCircle size={20} color={Colors.white} strokeWidth={2.2} />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.assimTitle}>Entretien d'assimilation</Text>
              <Text style={styles.assimSub} numberOfLines={2}>
                {user.civicTestPassed
                  ? "Étape suivante après le test civique — questions vrai/faux."
                  : "Après le test civique, préparez l'entretien en préfecture."}
              </Text>
            </View>
            <ChevronRight size={18} color={Colors.textTertiary} />
          </Pressable>
        ) : null}

        {/* Derniers thèmes */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={styles.sectionLabel}>Derniers thèmes</Text>
          <Pressable onPress={go(() => router.push("/(tabs)/progress"))}>
            <Text style={styles.sectionLink}>Tout voir</Text>
          </Pressable>
        </View>
        <View style={styles.themesCard}>
          {sortedThemes.map((t, i) => (
            <React.Fragment key={t.id}>
              {i > 0 ? <View style={styles.themeDivider} /> : null}
              <Pressable
                onPress={go(() =>
                  router.push({ pathname: "/theme/[id]", params: { id: t.id } })
                )}
                style={styles.themeRow}
              >
                <View style={styles.themeDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.themeRowTitle}>{t.name}</Text>
                  <ProgressBar
                    value={t.percent / 100}
                    height={4}
                    trackColor="rgba(25,28,30,0.06)"
                    fillColors={[Colors.primary, Colors.primary]}
                    style={{ marginTop: 8 }}
                  />
                </View>
                <Text style={styles.themePercent}>
                  {Math.round(t.percent)}%
                </Text>
              </Pressable>
            </React.Fragment>
          ))}
        </View>

        {/* Tools */}
        <Text style={[styles.sectionLabel, { marginTop: 24, marginBottom: 12 }]}>
          Outils
        </Text>
        <View style={styles.toolsGrid}>
          <ToolChip
            icon={<BookOpenCheck size={18} color={Colors.primary} />}
            label="Guide"
            onPress={go(() => router.push("/guide"))}
          />
          <ToolChip
            icon={<FileText size={18} color={Colors.primary} />}
            label="Mon dossier"
            onPress={go(() => router.push("/documents" as any))}
          />
          <ToolChip
            icon={<ShieldQuestion size={18} color={Colors.primary} />}
            label="Éligibilité"
            onPress={go(() => router.push("/eligibility"))}
          />
          <ToolChip
            icon={<MapPin size={18} color={Colors.primary} />}
            label="Centres"
            onPress={go(() => router.push("/exam-centers"))}
          />
          <ToolChip
            icon={<Newspaper size={18} color={Colors.primary} />}
            label="Actualités"
            onPress={go(() => router.push("/news"))}
          />
          <ToolChip
            icon={<MessagesSquare size={18} color={Colors.primary} />}
            label="Forum"
            onPress={go(() => router.push("/forum"))}
          />
          <ToolChip
            icon={<Target size={18} color={Colors.primary} />}
            label="Accompagnement"
            onPress={go(() => router.push("/coaching"))}
          />
          <ToolChip
            icon={<Handshake size={18} color={Colors.primary} />}
            label="Partenaire"
            onPress={go(() => router.push("/partnership" as any))}
          />
        </View>
      </ScrollView>
    </View>
  );
}

/* ---------- helpers ---------- */

function HeroStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <View style={styles.heroStat}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <Text style={styles.heroStatValue}>{value}</Text>
        {icon}
      </View>
      <Text style={styles.heroStatLabel}>{label}</Text>
    </View>
  );
}

function StudyTile({
  title,
  subtitle,
  value,
  icon,
  gradient,
  onPress,
  width,
}: Omit<TileDef, "key"> & { width: number }) {
  const pct = Math.round(value * 100);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { width },
        pressed && { transform: [{ scale: 0.98 }], opacity: 0.96 },
      ]}
    >
      <View style={styles.tileTopRow}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.tileIcon, { shadowColor: gradient[0] }]}
        >
          {icon}
        </LinearGradient>
        <ChevronRight size={16} color={Colors.textTertiary} />
      </View>

      <Text style={styles.tileTitle}>{title}</Text>
      <Text style={styles.tileSubtitle} numberOfLines={1}>
        {subtitle}
      </Text>

      <View style={styles.tileBottom}>
        <View style={{ flex: 1 }}>
          <ProgressBar
            value={value}
            height={5}
            trackColor="rgba(25,28,30,0.06)"
            fillColors={gradient}
          />
        </View>
        <Text style={[styles.tilePercent, { color: gradient[0] }]}>
          {pct}%
        </Text>
      </View>
    </Pressable>
  );
}

function ParcoursStep({
  label,
  onPress,
  first,
}: {
  label: string;
  onPress: () => void;
  first?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.parcoursStep,
        first && { borderTopWidth: 0 },
        pressed && { opacity: 0.85 },
      ]}
    >
      <View style={styles.parcoursDot} />
      <Text style={styles.parcoursStepText} numberOfLines={1}>
        {label}
      </Text>
      <ChevronRight size={14} color={Colors.textTertiary} />
    </Pressable>
  );
}

function ToolChip({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.toolChip,
        pressed && { opacity: 0.85 },
      ]}
    >
      <View style={styles.toolChipIcon}>{icon}</View>
      <Text style={styles.toolChipLabel} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

/* ---------- styles ---------- */

const cardShadow = {
  shadowColor: "#0A0F1E",
  shadowOpacity: 0.1,
  shadowRadius: 20,
  shadowOffset: { width: 0, height: 8 },
  elevation: 5,
} as const;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 999,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  avatarText: {
    fontFamily: "Satoshi_700Bold",
    fontSize: 18,
    color: Colors.white,
  },
  hello: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  name: {
    fontFamily: "Satoshi_700Bold",
    fontSize: 20,
    lineHeight: 24,
    color: Colors.onSurface,
    letterSpacing: -0.3,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
    shadowColor: "#0A0F1E",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  goalPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(0,85,164,0.10)",
    marginBottom: 18,
  },
  goalPillText: {
    fontFamily: "Satoshi_600SemiBold",
    fontSize: 11,
    color: Colors.primary,
    letterSpacing: 0.3,
  },

  /* Bannière de parcours — affichée en gros en haut de l'accueil */
  goalBanner: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 18,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
    minHeight: 180,
  },
  goalBannerBlob: {
    position: "absolute",
    top: -50,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  goalBannerIllustration: {
    position: "absolute",
    top: 12,
    right: 8,
    width: 110,
    height: 110,
  },
  goalBannerContent: {
    paddingRight: 100,
  },
  goalBannerLabel: {
    fontFamily: "Satoshi_700Bold",
    fontSize: 11,
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 1.6,
    marginBottom: 8,
  },
  goalBannerTitle: {
    fontFamily: "Satoshi_700Bold",
    fontSize: 22,
    lineHeight: 27,
    color: Colors.white,
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  goalBannerTagline: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(255,255,255,0.85)",
    marginBottom: 14,
  },
  goalBannerFooter: {
    flexDirection: "row",
    alignItems: "center",
  },
  goalBannerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  goalBannerChipText: {
    fontFamily: "Satoshi_700Bold",
    fontSize: 11,
    color: Colors.white,
    letterSpacing: 0.3,
  },

  hero: {
    borderRadius: 24,
    backgroundColor: Colors.white,
    padding: 18,
    marginBottom: 24,
    overflow: "hidden",
    ...cardShadow,
  },
  heroBlob: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 999,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  heroChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(0,85,164,0.10)",
  },
  heroChipText: {
    fontFamily: "Satoshi_600SemiBold",
    fontSize: 10.5,
    color: Colors.primary,
    letterSpacing: 0.3,
  },
  heroCount: {
    fontFamily: "Satoshi_700Bold",
    fontSize: 15,
    color: Colors.onSurface,
    letterSpacing: 0.2,
  },
  heroCountMuted: {
    color: Colors.textTertiary,
    fontFamily: "Satoshi_600SemiBold",
  },
  heroTitle: {
    fontFamily: "Satoshi_700Bold",
    fontSize: 20,
    lineHeight: 26,
    color: Colors.onSurface,
    letterSpacing: -0.4,
  },
  heroDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 16,
  },
  heroFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 16,
    paddingRight: 14,
    height: 40,
    borderRadius: 999,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  heroCtaText: {
    fontFamily: "Satoshi_700Bold",
    fontSize: 13,
    color: Colors.white,
    letterSpacing: 0.2,
  },
  heroStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  heroStatDivider: {
    width: StyleSheet.hairlineWidth,
    height: 24,
    backgroundColor: "rgba(25,28,30,0.12)",
  },
  heroStat: { alignItems: "center" },
  heroStatValue: {
    fontFamily: "Satoshi_700Bold",
    fontSize: 14,
    color: Colors.onSurface,
  },
  heroStatLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 10.5,
    color: Colors.textSecondary,
    marginTop: 1,
  },

  sectionLabel: {
    fontFamily: "Satoshi_700Bold",
    fontSize: 12,
    color: Colors.onSurface,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  sectionMuted: {
    fontFamily: "Satoshi_600SemiBold",
    fontSize: 11,
    color: Colors.textTertiary,
    letterSpacing: 0.2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionLink: {
    fontFamily: "Satoshi_600SemiBold",
    fontSize: 12,
    color: Colors.primary,
    letterSpacing: 0.2,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  tile: {
    padding: 14,
    borderRadius: 20,
    backgroundColor: Colors.white,
    ...cardShadow,
  },
  tileTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  tileIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  tileTitle: {
    fontFamily: "Satoshi_700Bold",
    fontSize: 15,
    color: Colors.onSurface,
    letterSpacing: -0.2,
  },
  tileSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 11.5,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  tileBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  tilePercent: {
    fontFamily: "Satoshi_700Bold",
    fontSize: 12,
    minWidth: 30,
    textAlign: "right",
  },

  themesCard: {
    borderRadius: 20,
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    ...cardShadow,
  },
  themeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
  },
  themeDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(25,28,30,0.08)",
  },
  themeDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: Colors.primary,
  },
  themeRowTitle: {
    fontFamily: "Satoshi_600SemiBold",
    fontSize: 14,
    color: Colors.onSurface,
  },
  themePercent: {
    fontFamily: "Satoshi_700Bold",
    fontSize: 13,
    color: Colors.primary,
    minWidth: 40,
    textAlign: "right",
  },

  toolsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  toolChip: {
    flexBasis: "31%",
    flexGrow: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: Colors.white,
    shadowColor: "#0A0F1E",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  toolChipIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,85,164,0.10)",
  },
  toolChipLabel: {
    fontFamily: "Satoshi_600SemiBold",
    fontSize: 12,
    color: Colors.onSurface,
    letterSpacing: 0.1,
  },

  resumeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 20,
    marginBottom: 14,
    backgroundColor: Colors.tertiary,
    shadowColor: Colors.tertiary,
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  resumeIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  resumeTitle: {
    fontFamily: "Satoshi_700Bold",
    fontSize: 14.5,
    color: Colors.white,
    letterSpacing: -0.1,
  },
  resumeSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 16,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
  freeTrialBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 20,
    marginBottom: 14,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.success,
  },
  freeTrialIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.success,
  },
  freeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "rgba(34,197,94,0.15)",
    marginBottom: 3,
  },
  freeBadgeText: {
    fontFamily: "Satoshi_700Bold",
    fontSize: 9.5,
    letterSpacing: 0.8,
    color: Colors.success,
  },
  freeTrialTitle: {
    fontFamily: "Satoshi_700Bold",
    fontSize: 14.5,
    color: Colors.onSurface,
    letterSpacing: -0.1,
  },
  freeTrialSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 16,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  forfaitBanner: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 20,
    marginBottom: 18,
    overflow: "hidden",
    shadowColor: Colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  forfaitIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  forfaitTitle: {
    fontFamily: "Satoshi_700Bold",
    fontSize: 14.5,
    color: Colors.white,
    letterSpacing: -0.1,
  },
  forfaitSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 16,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
  parcoursCard: {
    marginTop: 14,
    padding: 14,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: "rgba(0,85,164,0.18)",
    ...cardShadow,
  },
  parcoursHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  parcoursLabel: {
    fontFamily: "Satoshi_700Bold",
    fontSize: 11,
    color: Colors.primary,
    letterSpacing: 1.1,
  },
  parcoursList: { gap: 4 },
  parcoursStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(25,28,30,0.06)",
  },
  parcoursDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: Colors.primary,
  },
  parcoursStepText: {
    flex: 1,
    fontFamily: "Satoshi_600SemiBold",
    fontSize: 13,
    color: Colors.onSurface,
  },
  assimBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: Colors.white,
    marginTop: 14,
    ...cardShadow,
  },
  assimIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.secondary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  assimTitle: {
    fontFamily: "Satoshi_700Bold",
    fontSize: 14.5,
    color: Colors.onSurface,
    letterSpacing: -0.1,
  },
  assimSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 16,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
