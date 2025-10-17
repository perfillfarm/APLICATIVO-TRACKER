import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { BookOpen, Download, FileText, Video, Star, ExternalLink } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

interface GuideItem {
  id: string;
  title: string;
  description: string;
  type: 'pdf' | 'video' | 'article';
  category: 'nutrition' | 'exercise' | 'lifestyle' | 'science';
  downloadUrl?: string;
  videoUrl?: string;
  content?: string;
  featured?: boolean;
  downloadCount?: number;
  rating?: number;
  duration?: string;
  fileSize?: string;
}

export default function GuidesScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Sample guides data - você pode substituir por seus próprios links
  const allGuides: GuideItem[] = [
    {
      id: '1',
      title: t('maxTestorinCompleteGuide'),
      description: t('completeGuideDescription'),
      type: 'pdf',
      category: 'science',
      downloadUrl: 'https://example.com/maxtestorin-complete-guide.pdf',
      featured: true,
      downloadCount: 1250,
      rating: 4.8,
      fileSize: '2.5 MB'
    },
    {
      id: '2',
      title: t('nutritionOptimizationGuide'),
      description: t('nutritionGuideDescription'),
      type: 'pdf',
      category: 'nutrition',
      downloadUrl: 'https://example.com/nutrition-optimization.pdf',
      featured: false,
      downloadCount: 890,
      rating: 4.6,
      fileSize: '1.8 MB'
    },
    {
      id: '3',
      title: t('exerciseRoutineVideo'),
      description: t('exerciseVideoDescription'),
      type: 'video',
      category: 'exercise',
      videoUrl: 'https://example.com/exercise-routine-video',
      featured: true,
      downloadCount: 2100,
      rating: 4.9,
      duration: '15 min'
    },
    {
      id: '4',
      title: t('lifestyleTipsArticle'),
      description: t('lifestyleTipsDescription'),
      type: 'article',
      category: 'lifestyle',
      content: 'Conteúdo completo do artigo sobre dicas de estilo de vida...',
      featured: false,
      downloadCount: 650,
      rating: 4.4
    },
    {
      id: '5',
      title: t('scientificStudyPDF'),
      description: t('scientificStudyDescription'),
      type: 'pdf',
      category: 'science',
      downloadUrl: 'https://example.com/scientific-studies.pdf',
      featured: false,
      downloadCount: 420,
      rating: 4.7,
      fileSize: '3.2 MB'
    },
    {
      id: '6',
      title: t('supplementationGuide'),
      description: t('supplementationDescription'),
      type: 'pdf',
      category: 'nutrition',
      downloadUrl: 'https://example.com/supplementation-guide.pdf',
      featured: false,
      downloadCount: 780,
      rating: 4.5,
      fileSize: '1.9 MB'
    }
  ];

  const categories = [
    { id: 'all', name: t('allCategories'), icon: BookOpen },
    { id: 'nutrition', name: t('nutrition'), icon: FileText },
    { id: 'exercise', name: t('exercise'), icon: Video },
    { id: 'lifestyle', name: t('lifestyle'), icon: Star },
    { id: 'science', name: t('science'), icon: ExternalLink },
  ];

  const featuredGuides = allGuides.filter(guide => guide.featured);
  
  const filteredGuides = allGuides.filter(guide => {
    return selectedCategory === 'all' || guide.category === selectedCategory;
  });

  const handleDownload = async (guide: GuideItem) => {
    try {
      if (guide.type === 'pdf' && guide.downloadUrl) {
        const supported = await Linking.canOpenURL(guide.downloadUrl);
        if (supported) {
          await Linking.openURL(guide.downloadUrl);
          Alert.alert(
            t('downloadStarted'),
            t('downloadStartedMessage').replace('{title}', guide.title),
            [{ text: t('ok') }]
          );
        } else {
          Alert.alert(t('error'), t('cannotOpenFile'));
        }
      } else if (guide.type === 'video' && guide.videoUrl) {
        const supported = await Linking.canOpenURL(guide.videoUrl);
        if (supported) {
          await Linking.openURL(guide.videoUrl);
        } else {
          Alert.alert(t('error'), t('cannotOpenVideo'));
        }
      } else if (guide.type === 'article') {
        Alert.alert(
          guide.title,
          guide.content || t('articleContentNotAvailable'),
          [{ text: t('close') }]
        );
      }
    } catch (error) {
      console.error('Error opening guide:', error);
      Alert.alert(t('error'), t('errorOpeningGuide'));
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return FileText;
      case 'video':
        return Video;
      case 'article':
        return BookOpen;
      default:
        return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'pdf':
        return '#EF4444';
      case 'video':
        return '#8B5CF6';
      case 'article':
        return '#10B981';
      default:
        return theme.colors.primary;
    }
  };

  const CategorySelector = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.categoriesScroll}
      contentContainerStyle={styles.categoriesContent}
    >
      {categories.map((category) => {
        const Icon = category.icon;
        const isSelected = selectedCategory === category.id;
        
        return (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              {
                backgroundColor: isSelected ? theme.colors.primary : theme.colors.card,
                borderColor: isSelected ? theme.colors.primary : theme.colors.border,
              }
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Icon 
              size={20} 
              color={isSelected ? '#ffffff' : theme.colors.primary} 
            />
            <Text style={[
              styles.categoryButtonText,
              {
                color: isSelected ? '#ffffff' : theme.colors.primary,
              }
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const GuideCard = ({ guide, featured = false }: { guide: GuideItem; featured?: boolean }) => {
    const TypeIcon = getTypeIcon(guide.type);
    const typeColor = getTypeColor(guide.type);

    return (
      <Card style={[
        styles.guideCard,
        featured && styles.featuredCard,
        { borderLeftColor: typeColor }
      ]}>
        <View style={styles.guideHeader}>
          <View style={[styles.typeIcon, { backgroundColor: typeColor + '20' }]}>
            <TypeIcon size={24} color={typeColor} />
          </View>
          <View style={styles.guideInfo}>
            <Text style={[styles.guideTitle, { color: theme.colors.text }]} numberOfLines={2}>
              {guide.title}
            </Text>
            <Text style={[styles.guideDescription, { color: theme.colors.textSecondary }]} numberOfLines={3}>
              {guide.description}
            </Text>
          </View>
          {featured && (
            <View style={[styles.featuredBadge, { backgroundColor: theme.colors.warning }]}>
              <Star size={16} color="#ffffff" />
            </View>
          )}
        </View>

        <View style={styles.guideStats}>
          <View style={styles.statItem}>
            <Download size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
              {guide.downloadCount?.toLocaleString() || '0'}
            </Text>
          </View>
          
          {guide.rating && (
            <View style={styles.statItem}>
              <Star size={16} color="#F59E0B" />
              <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
                {guide.rating}
              </Text>
            </View>
          )}
          
          {guide.fileSize && (
            <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
              {guide.fileSize}
            </Text>
          )}
          
          {guide.duration && (
            <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
              {guide.duration}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.downloadButton, { backgroundColor: typeColor }]}
          onPress={() => handleDownload(guide)}
        >
          {guide.type === 'pdf' ? (
            <>
              <Download size={20} color="#ffffff" />
              <Text style={styles.downloadButtonText}>{t('downloadPDF')}</Text>
            </>
          ) : guide.type === 'video' ? (
            <>
              <Video size={20} color="#ffffff" />
              <Text style={styles.downloadButtonText}>{t('watchVideo')}</Text>
            </>
          ) : (
            <>
              <BookOpen size={20} color="#ffffff" />
              <Text style={styles.downloadButtonText}>{t('readArticle')}</Text>
            </>
          )}
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header 
        title={
          <View style={styles.headerTitleContainer}>
            <BookOpen size={24} color="#ffffff" style={styles.headerIcon} />
            <Text style={styles.headerTitleText}>{t('guides')}</Text>
          </View>
        }
        subtitle={t('learningMaterials')}
        showOptions={false}
      />
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        
        {/* Category Filter */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.filtersSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t('categories')}
          </Text>
          <CategorySelector />
        </Animated.View>

        {/* Featured Guides */}
        {featuredGuides.length > 0 && selectedCategory === 'all' && (
          <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('featuredGuides')}
            </Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.featuredScroll}
              contentContainerStyle={styles.featuredContent}
            >
              {featuredGuides.map((guide) => (
                <View key={guide.id} style={styles.featuredGuideContainer}>
                  <GuideCard guide={guide} featured={true} />
                </View>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* All Guides */}
        <Animated.View entering={FadeInDown.delay(600)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {selectedCategory === 'all' ? t('allGuides') : categories.find(c => c.id === selectedCategory)?.name}
            </Text>
            <Text style={[styles.resultsCount, { color: theme.colors.textSecondary }]}>
              {filteredGuides.length} {t('items')}
            </Text>
          </View>
          
          <View style={styles.guidesGrid}>
            {filteredGuides.map((guide, index) => (
              <Animated.View 
                key={guide.id} 
                entering={FadeInDown.delay(700 + (index * 100))}
                style={styles.guideContainer}
              >
                <GuideCard guide={guide} />
              </Animated.View>
            ))}
          </View>
          
          {filteredGuides.length === 0 && (
            <View style={styles.emptyState}>
              <BookOpen size={48} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                {t('noGuidesFound')}
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
                {t('tryDifferentCategory')}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Info Section */}
        <Animated.View entering={FadeInDown.delay(1000)} style={styles.section}>
          <Card style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <View style={[styles.infoIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                <BookOpen size={24} color={theme.colors.primary} />
              </View>
              <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
                {t('aboutGuides')}
              </Text>
            </View>
            <Text style={[styles.infoDescription, { color: theme.colors.textSecondary }]}>
              {t('guidesDescription')}
            </Text>
          </Card>
        </Animated.View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 8,
  },
  headerTitleText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  filtersSection: {
    paddingTop: 20,
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoriesScroll: {
    paddingLeft: 20,
  },
  categoriesContent: {
    paddingRight: 20,
    gap: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  featuredScroll: {
    paddingLeft: 20,
  },
  featuredContent: {
    paddingRight: 20,
    gap: 16,
  },
  featuredGuideContainer: {
    width: 300,
  },
  guidesGrid: {
    paddingHorizontal: 20,
    gap: 16,
  },
  guideContainer: {
    marginBottom: 4,
  },
  guideCard: {
    borderLeftWidth: 4,
    position: 'relative',
  },
  featuredCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    position: 'relative',
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  guideInfo: {
    flex: 1,
  },
  guideTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 22,
  },
  guideDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  featuredBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  guideStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '500',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  downloadButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  infoCard: {
    marginHorizontal: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  infoDescription: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'justify',
  },
  bottomSpacing: {
    height: 20,
  },
});