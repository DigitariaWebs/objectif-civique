import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import {
  Calendar,
  Check,
  Crown,
  Sparkles,
  Target,
  TrendingUp,
  X,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import { ProgressCircle } from "@/components/ui/ProgressCircle";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { PillButton } from "@/components/ui/PillButton";
import { GhostButton } from "@/components/ui/GhostButton";
import { IconTilePattern } from "@/components/IconTilePattern";
import { useSessionStore } from "@/store/sessionStore";
import { useUserStore } from "@/store/userStore";
import { useContainerSize } from "@/hooks/useContainerSize";
import { DEADLINE_LABELS, GOAL_LABELS, LEVEL_LABELS } from "@/data/questions";
import { PLANS } from "@/data/plans";
import { scoreSession } from "@/lib/quizEngine";
import { recommendPlan } from "@/lib/planRecommendation";

export default function AssessmentResult() {
  const insets = useSafeAreaInsets();
  const { size, onLayout } = useContainerSize();
  const session = useSessionStore((s) => s.current);
  const user = useUserStore((s) => s.user);

  const recap = session
    ? scoreSession(session.answers, session.questions)
    : { correct: 0, wrong: 0, skipped: 0, percent: 0, total: 5 };

  const title =
    recap.correct >= 4
      ? "Excellent niveau !"
      : recap.correct >= 2
        ? "Bon début !"
        : "Le travail va payer";

  const goalLabel = user?.goal ? GOAL_LABELS[user.goal] : "—";
  const deadlineLabel = user?.deadline ? DEADLINE_LABELS[user.deadline] : "—";
  const levelLabel = user?.level ? LEVEL_LABELS[user.level] : "—";

  const reco = recommendPlan(user, recap);
  const recoPlan = PLANS.find((p) => p.id === reco.planId);

  return (
    <View
      style={{ flex: 1, backgroundColor: Colors.surface }}
      onLayout={onLayout}
    >
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
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={() => router.replace("/(tabs)")}
          style={styles.closeBtn}
          accessibilityLabel="Fermer"
        >
          <X size={18} color={Colors.primary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <View style={styles.hero}>
          <ProgressCircle
            value={recap.correct / 5}
            size={180}
            strokeWidth={14}
            gradient={[Colors.primary, Colors.tertiary]}
          >
            <Text
              style={{
                fontSize: 40,
                color: Colors.primary,
                fontFamily: "Inter_700Bold",
              }}
            >
              {recap.correct}/5
            </Text>
          </ProgressCircle>

          <Text style={[Typography.display, { color: Colors.onSurface, marginTop: 16, textAlign: "center" }]}>
            {title}
          </Text>
          <Text style={[Typography.bodyLarge, { color: Colors.textSecondary, marginTop: 6, textAlign: "center" }]}>
            {recap.correct} bonnes réponses sur 5 — voici votre plan personnalisé.
          </Text>
        </View>

        <GlassCard style={{ marginTop: 24 }}>
          <View style={{ gap: 10 }}>
            <Row icon={<Target size={18} color={Colors.tertiary} />}>
              Objectif : {goalLabel}
            </Row>
            <Row icon={<Calendar size={18} color={Colors.primary} />}>
              Échéance : {deadlineLabel}
            </Row>
            <Row icon={<TrendingUp size={18} color={Colors.primary} />}>
              Niveau estimé : {levelLabel}
            </Row>
          </View>
        </GlassCard>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, marginTop: 16 }}
        >
          <Badge label="Programme intensif" variant="info" />
          <Badge label="Révision quotidienne" variant="gold" />
          <Badge label="Accompagnement humain" variant="success" />
        </ScrollView>

        {/* Carte de recommandation personnalisée — axe + forfait suggéré */}
        {recoPlan ? (
          <View style={styles.recoCard}>
            <View style={styles.recoBadgeRow}>
              <Sparkles size={12} color={Colors.white} />
              <Text style={styles.recoBadgeText}>RECOMMANDÉ POUR VOUS</Text>
            </View>

            <View style={styles.recoFocus}>
              <Text style={styles.recoFocusLabel}>Axe prioritaire</Text>
              <Text style={styles.recoFocusTitle}>{reco.focusLabel}</Text>
              <Text style={styles.recoFocusDesc}>
                {reco.focusDescription}
              </Text>
            </View>

            <View style={styles.recoPlanRow}>
              <View style={styles.recoPlanIcon}>
                <Crown size={18} color={Colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.recoPlanLabel}>Formule recommandée</Text>
                <Text style={styles.recoPlanTitle}>
                  {recoPlan.title}
                  <Text style={styles.recoPlanPrice}>  ·  {recoPlan.price}</Text>
                </Text>
              </View>
            </View>

            {reco.reasons.length > 0 ? (
              <View style={styles.reasonsList}>
                {reco.reasons.map((r, i) => (
                  <View key={i} style={styles.reasonRow}>
                    <View style={styles.reasonBullet}>
                      <Check
                        size={11}
                        color={Colors.white}
                        strokeWidth={3}
                      />
                    </View>
                    <Text style={styles.reasonText}>{r}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <PillButton
              label="Découvrir ce forfait"
              variant="primary"
              size="md"
              fullWidth
              onPress={() => router.push("/subscription")}
              style={{ marginTop: 14 }}
            />
          </View>
        ) : null}

        <GhostButton
          label="Continuer en version gratuite"
          fullWidth
          onPress={() => router.replace("/(tabs)")}
          style={{ marginTop: 12 }}
        />
      </ScrollView>
    </View>
  );
}

function Row({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      {icon}
      <Text style={[Typography.body, { color: Colors.onSurface, flex: 1 }]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  hero: { alignItems: "center", marginTop: 8 },
  patternLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },

  recoCard: {
    marginTop: 22,
    padding: 18,
    borderRadius: 22,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 7,
  },
  recoBadgeRow: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: Colors.primary,
    marginBottom: 14,
  },
  recoBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: Colors.white,
    letterSpacing: 0.8,
  },
  recoFocus: {
    marginBottom: 14,
  },
  recoFocusLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 10.5,
    color: Colors.textTertiary,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  recoFocusTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    lineHeight: 24,
    color: Colors.onSurface,
    letterSpacing: -0.3,
  },
  recoFocusDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  recoPlanRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(0,85,164,0.08)",
    marginBottom: 14,
  },
  recoPlanIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
  },
  recoPlanLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: Colors.primary,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  recoPlanTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.onSurface,
    marginTop: 2,
  },
  recoPlanPrice: {
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
    fontSize: 13,
  },
  reasonsList: {
    gap: 8,
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  reasonBullet: {
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: Colors.success,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  reasonText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    color: Colors.onSurface,
  },
});
