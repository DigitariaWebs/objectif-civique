import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft, RotateCcw, Bookmark } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import { Radius } from "@/constants/radius";
import { PillButton } from "@/components/ui/PillButton";
import { FLASHCARD_QUESTIONS, GOAL_LABELS } from "@/data/questions";
import { getBank } from "@/data/banks";
import { getExplanation } from "@/lib/quizEngine";
import { SERIES_SIZE, seriesCount, seriesSlice } from "@/lib/series";
import { THEMES } from "@/data/themes";
import { useProgressStore } from "@/store/progressStore";
import { useHaptics } from "@/hooks/useHaptics";
import { useContainerSize } from "@/hooks/useContainerSize";
import { Category, Question, ThemeId } from "@/types";
import { useUserStore } from "@/store/userStore";
import { isPaid } from "@/lib/entitlements";
import { PremiumGate } from "@/components/PremiumGate";

const CARD_HEIGHT = 420;

// Aperçu gratuit : nombre de cartes accessibles sans forfait.
const FREE_FLASHCARD_LIMIT = 20;

export default function FlashcardDeck() {
  const { slug, free } = useLocalSearchParams<{ slug: string; free?: string }>();
  const isFree = free === "1";
  const insets = useSafeAreaInsets();
  const { size, onLayout } = useContainerSize();
  const haptics = useHaptics();
  const bookmarks = useProgressStore((s) => s.bookmarks);
  const toggleBookmark = useProgressStore((s) => s.toggleBookmark);
  const user = useUserStore((s) => s.user);

  const { deck, title } = useMemo(() => {
    const build = (): { deck: Question[]; title: string } => {
      // Deck par banque (Prépa intense, Référentiel, Apprendre, Livret officiel)
      if (slug?.startsWith("bank-")) {
        const bank = getBank(slug.replace("bank-", ""));
        if (bank) {
          return {
            deck: FLASHCARD_QUESTIONS.filter(
              (q) => q.source != null && bank.sources.includes(q.source)
            ),
            title: bank.label,
          };
        }
      }
      if (slug?.startsWith("theme-")) {
        const themeId = slug.replace("theme-", "") as ThemeId;
        const theme = THEMES.find((t) => t.id === themeId);
        return {
          deck: FLASHCARD_QUESTIONS.filter((q) => q.theme === themeId),
          title: theme?.name ?? "Thème",
        };
      }
      const cat = slug as Category;
      return {
        deck: FLASHCARD_QUESTIONS.filter((q) => q.categories.includes(cat)),
        title: GOAL_LABELS[cat] ?? "Flashcards",
      };
    };
    const base = build();
    // Aperçu gratuit : on limite à 20 cartes et on bypasse le paywall.
    if (isFree) {
      return {
        deck: base.deck.slice(0, FREE_FLASHCARD_LIMIT),
        title: "Flashcards gratuites",
      };
    }
    return base;
  }, [slug, isFree]);

  const [index, setIndex] = useState(0);
  // Série courante : les decks de plus de 40 cartes sont découpés en paquets.
  const [series, setSeries] = useState(0);
  const flip = useSharedValue(0);
  const [flipped, setFlipped] = useState(false);

  const totalCards = deck.length;
  const totalSeries = seriesCount(totalCards);
  const seriesCards = useMemo(() => seriesSlice(deck, series), [deck, series]);

  const current: Question | undefined = seriesCards[index];

  const onFlip = () => {
    haptics.light();
    const next = flipped ? 0 : 1;
    flip.value = withTiming(next, { duration: 380 });
    setFlipped(!flipped);
  };

  const resetFlip = () => {
    flip.value = withTiming(0, { duration: 0 });
    setFlipped(false);
  };

  const isLastCard = index >= seriesCards.length - 1;
  const isLastSeries = series >= totalSeries - 1;

  const onNext = () => {
    if (!isLastCard) {
      resetFlip();
      setIndex(index + 1);
    } else if (!isLastSeries) {
      // Passe à la série suivante (paquet de 40 suivant).
      resetFlip();
      setSeries(series + 1);
      setIndex(0);
    } else {
      router.back();
    }
  };
  const onPrev = () => {
    if (index > 0) {
      resetFlip();
      setIndex(index - 1);
    } else if (series > 0) {
      // Revient à la fin de la série précédente.
      const prevLen = seriesSlice(deck, series - 1).length;
      resetFlip();
      setSeries(series - 1);
      setIndex(Math.max(0, prevLen - 1));
    }
  };

  const frontStyle = useAnimatedStyle(() => {
    const rotate = interpolate(flip.value, [0, 1], [0, 180]);
    const opacity = flip.value < 0.5 ? 1 : 0;
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotate}deg` }],
      opacity,
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const rotate = interpolate(flip.value, [0, 1], [180, 360]);
    const opacity = flip.value >= 0.5 ? 1 : 0;
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotate}deg` }],
      opacity,
    };
  });

  if (!isPaid(user) && !isFree) {
    return <PremiumGate />;
  }

  if (!current) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.surface }}>
        <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={6}
          >
            <ChevronLeft size={22} color={Colors.primary} />
          </Pressable>
          <Text style={[Typography.h2, { color: Colors.onSurface, flex: 1 }]}>
            Flashcards
          </Text>
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            Aucune carte disponible pour cette sélection.
          </Text>
        </View>
      </View>
    );
  }

  const isBookmarked = bookmarks.includes(current.id);
  // Largeur du conteneur, pas de la fenetre : sur iPad la carte etait plus
  // large que la colonne qui la rogne (voir `constants/layout`).
  const cardWidth = (size?.width ?? 0) - 40;

  return (
    <View
      style={{ flex: 1, backgroundColor: Colors.surface }}
      onLayout={onLayout}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={6}
        >
          <ChevronLeft size={22} color={Colors.primary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.deckTitle}>{title}</Text>
          <Text style={styles.deckProgress}>
            Carte {index + 1} sur {seriesCards.length}
            {totalSeries > 1 ? ` · Série ${series + 1}/${totalSeries}` : ""}
          </Text>
        </View>
        <Pressable
          onPress={() => toggleBookmark(current.id)}
          style={styles.backBtn}
          hitSlop={6}
        >
          <Bookmark
            size={20}
            color={isBookmarked ? Colors.tertiary : Colors.textTertiary}
            fill={isBookmarked ? Colors.tertiary : "none"}
          />
        </Pressable>
      </View>

      <View style={styles.center}>
        {size ? (
          <Pressable onPress={onFlip} style={{ width: cardWidth, height: CARD_HEIGHT }}>
            <Animated.View
              style={[
                styles.card,
                styles.cardFront,
                { width: cardWidth },
                frontStyle,
              ]}
            >
              <Text style={styles.faceLabel}>Question</Text>
              <ScrollView
                style={styles.faceScroll}
                contentContainerStyle={styles.faceScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.faceText}>{current.text}</Text>
              </ScrollView>
              <Text style={styles.hint}>Touchez pour retourner</Text>
            </Animated.View>

            <Animated.View
              style={[
                styles.card,
                styles.cardBack,
                { width: cardWidth },
                backStyle,
              ]}
            >
              <Text style={[styles.faceLabel, { color: Colors.white }]}>
                Réponse
              </Text>
              <ScrollView
                style={styles.faceScroll}
                contentContainerStyle={styles.faceScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {current.correctIndex >= 0 && current.choices[current.correctIndex] ? (
                  <Text style={[styles.faceText, { color: Colors.white }]}>
                    {current.choices[current.correctIndex]}
                  </Text>
                ) : null}
                {getExplanation(current) ? (
                  <Text style={styles.explanation}>{getExplanation(current)}</Text>
                ) : null}
              </ScrollView>
            </Animated.View>
          </Pressable>
        ) : null}
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          onPress={onPrev}
          disabled={index === 0 && series === 0}
          style={[styles.navBtn, index === 0 && series === 0 && { opacity: 0.4 }]}
        >
          <Text style={styles.navLabel}>Précédent</Text>
        </Pressable>
        <Pressable onPress={onFlip} style={styles.flipBtn}>
          <RotateCcw size={18} color={Colors.white} />
        </Pressable>
        <PillButton
          label={isLastCard && isLastSeries ? "Terminer" : "Suivant"}
          variant="primary"
          size="md"
          onPress={onNext}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.white,
  },
  deckTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.onSurface,
  },
  deckProgress: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    position: "absolute",
    top: 0,
    height: CARD_HEIGHT,
    borderRadius: Radius.xl,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 18,
    alignItems: "stretch",
    justifyContent: "flex-start",
    overflow: "hidden",
    backfaceVisibility: "hidden",
  },
  faceScroll: {
    flex: 1,
    width: "100%",
  },
  faceScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 8,
  },
  cardFront: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
  },
  cardBack: {
    backgroundColor: Colors.primary,
  },
  faceLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: Colors.tertiaryOnSoft,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    textAlign: "center",
    marginBottom: 12,
  },
  faceText: {
    fontFamily: "Inter_700Bold",
    fontSize: 23,
    lineHeight: 31,
    color: Colors.onSurface,
    textAlign: "center",
  },
  hint: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textTertiary,
    textAlign: "center",
    marginTop: 10,
  },
  explanation: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
    color: "rgba(255,255,255,0.92)",
    textAlign: "center",
    marginTop: 16,
  },
  bottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  navBtn: {
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  navLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.onSurface,
  },
  flipBtn: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
