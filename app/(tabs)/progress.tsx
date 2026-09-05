import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import * as LucideIcons from "lucide-react-native";
import { Award, Lock } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import { Radius } from "@/constants/radius";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ProgressCircle } from "@/components/ui/ProgressCircle";
import { PillButton } from "@/components/ui/PillButton";
import { GhostButton } from "@/components/ui/GhostButton";
import { WeeklyChart } from "@/components/WeeklyChart";
import { useProgressStore, getSuccessRate } from "@/store/progressStore";
import { useContainerSize } from "@/hooks/useContainerSize";
import { THEMES } from "@/data/themes";
import { ACHIEVEMENTS } from "@/data/achievements";
import { todayKey } from "@/lib/formatters";

export default function ProgressTab() {
  const insets = useSafeAreaInsets();
  // Largeur du conteneur, pas de la fenetre : sur iPad le graphique etait
  // dimensionne sur la fenetre et depassait la colonne, donc rogne a droite.
  const { size, onLayout } = useContainerSize();
  const progress = useProgressStore();

  const successRate = getSuccessRate({
    questionsAnswered: progress.questionsAnswered,
    correctCount: progress.correctCount,
  });

  const practicedDays = new Set(progress.dailyStats.map((d) => d.date));

  // Generate last 30 days
  const today = new Date();
  const dots: { date: string; practiced: boolean }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
    dots.push({ date: key, practiced: practicedDays.has(key) });
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      onLayout={onLayout}
      contentContainerStyle={{
        padding: 16,
        paddingTop: insets.top + 12,
        paddingBottom: 140,
      }}
    >
      <View style={{ marginBottom: 14 }}>
        <Text style={styles.screenTitle}>Progrès</Text>
        <Text style={styles.screenSub}>Vos statistiques d'apprentissage.</Text>
      </View>

      <GlassCard padding={14} style={{ marginBottom: 16 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.bigStat}>{progress.questionsAnswered}</Text>
            <Text style={styles.bigStatLabel}>Questions répondues</Text>
          </View>
          <ProgressCircle value={successRate / 100} size={72} strokeWidth={8}>
            <Text style={styles.circleLabel}>{successRate}%</Text>
          </ProgressCircle>
        </View>
        <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
          <MiniTile
            label="Série en cours"
            value={`${progress.currentStreak} j`}
            emoji="🔥"
          />
          <MiniTile
            label="Meilleure série"
            value={`${progress.longestStreak} j`}
            icon={<Award size={14} color={Colors.tertiary} />}
          />
        </View>
      </GlassCard>

      <View style={styles.card}>
        <View style={styles.cardHead}>
          <Text style={styles.sectionTitle}>7 derniers jours</Text>
          <Badge label="Réussite" variant="gold" />
        </View>
        {size ? (
          <WeeklyChart data={progress.dailyStats} width={size.width - 60} />
        ) : null}
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 20, marginBottom: 10 }]}>
        Progression par thème
      </Text>
      <View style={{ gap: 8 }}>
        {THEMES.map((t) => {
          const Icon = (LucideIcons as any)[t.icon] ?? LucideIcons.Folder;
          const percent = progress.themeProgress[t.id] ?? 0;
          return (
            <View key={t.id} style={styles.themeRow}>
              <View style={styles.themeIcon}>
                <Icon size={16} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.themeName} numberOfLines={1}>
                  {t.name}
                </Text>
                <ProgressBar
                  value={percent / 100}
                  height={4}
                  style={{ marginTop: 5 }}
                />
              </View>
              <Text style={styles.themePercent}>{Math.round(percent)}%</Text>
            </View>
          );
        })}
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 20, marginBottom: 8 }]}>
        Régularité
      </Text>
      <View style={styles.card}>
        <Text style={[Typography.caption, { color: Colors.textSecondary, marginBottom: 12 }]}>
          30 derniers jours
        </Text>
        <View style={styles.dotGrid}>
          {dots.map((d) => (
            <View
              key={d.date}
              style={[
                styles.dot,
                {
                  backgroundColor: d.practiced ? Colors.secondary : Colors.surfaceContainerLow,
                },
              ]}
            />
          ))}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 }}>
          <View style={[styles.dot, { backgroundColor: Colors.secondary }]} />
          <Text style={[Typography.caption, { color: Colors.textSecondary }]}>
            Jour de pratique
          </Text>
        </View>
      </View>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Récompenses</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingRight: 16 }}
        style={{ marginBottom: 24 }}
      >
        {ACHIEVEMENTS.map((a) => {
          const Icon = (LucideIcons as any)[a.icon] ?? Award;
          const unlocked = progress.achievementsUnlocked.includes(a.id);
          return (
            <View key={a.id} style={styles.badgeCard}>
              {unlocked ? (
                <LinearGradient
                  colors={[Colors.tertiary, Colors.tertiaryLight]}
                  style={styles.badgeCircle}
                >
                  <Icon size={20} color={Colors.white} />
                </LinearGradient>
              ) : (
                <View style={[styles.badgeCircle, { backgroundColor: Colors.surfaceContainerLow }]}>
                  <Icon size={20} color={Colors.textTertiary} />
                  <View style={styles.lockOverlay}>
                    <Lock size={10} color={Colors.white} />
                  </View>
                </View>
              )}
              <Text
                numberOfLines={2}
                style={[
                  Typography.caption,
                  {
                    color: unlocked ? Colors.onSurface : Colors.textTertiary,
                    textAlign: "center",
                    marginTop: 8,
                    fontFamily: "Inter_600SemiBold",
                  },
                ]}
              >
                {a.title}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={{ gap: 10 }}>
        <PillButton
          label="Lancer une simulation"
          size="md"
          variant="primary"
          fullWidth
          onPress={() => router.push("/simulation/intro")}
        />
        <GhostButton
          label="S'entraîner par thème"
          size="md"
          fullWidth
          onPress={() => router.push("/(tabs)/revise")}
        />
      </View>
    </ScrollView>
  );
}

function MiniTile({
  label,
  value,
  emoji,
  icon,
}: {
  label: string;
  value: string;
  emoji?: string;
  icon?: React.ReactNode;
}) {
  return (
    <View style={styles.miniTile}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        {emoji ? <Text style={{ fontSize: 11 }}>{emoji}</Text> : null}
        {icon}
        <Text style={styles.miniLabel}>{label}</Text>
      </View>
      <Text style={styles.miniValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screenTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    lineHeight: 26,
    color: Colors.onSurface,
    letterSpacing: -0.3,
  },
  screenSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: Colors.onSurface,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  sectionLink: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.tertiary,
  },
  bigStat: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: Colors.primary,
  },
  bigStatLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  circleLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: Colors.onSurface,
  },
  card: {
    padding: 12,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: "rgba(204,199,208,0.25)",
  },
  cardHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  miniTile: {
    flex: 1,
    padding: 10,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 10,
  },
  miniLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: Colors.textSecondary,
  },
  miniValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: Colors.onSurface,
    marginTop: 3,
  },
  themeRow: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: "rgba(204,199,208,0.25)",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  themeIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: Colors.primaryFixed,
    alignItems: "center",
    justifyContent: "center",
  },
  themeName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.onSurface,
  },
  themePercent: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: Colors.primary,
  },
  dotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 5,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 10,
  },
  badgeCard: {
    width: 88,
    height: 108,
    padding: 8,
    borderRadius: 14,
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: "rgba(204,199,208,0.25)",
    alignItems: "center",
  },
  badgeCircle: {
    width: 48,
    height: 48,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  lockOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 999,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
