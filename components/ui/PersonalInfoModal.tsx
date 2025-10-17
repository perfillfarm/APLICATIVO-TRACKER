import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Alert, ScrollView, Image } from 'react-native';
import { User, CreditCard as Edit3, Save, Calendar, Mail, X, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { FirebaseService } from '@/services/FirebaseService';
import Animated, { 
  FadeIn, 
  FadeOut, 
  SlideInDown, 
  SlideOutDown 
} from 'react-native-reanimated';

interface PersonalInfoModalProps {
  visible: boolean;
  onClose: () => void;
}

interface UserProfile {
  name: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  email: string;
  phone: string;
  startDate: string;
  profileImage?: string;
}

export const PersonalInfoModal: React.FC<PersonalInfoModalProps> = ({
  visible,
  onClose,
}) => {
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const { user, userProfile, updateUserProfile } = useFirebaseAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [tempProfile, setTempProfile] = useState<UserProfile | null>(null);
  const [firstLoginDate, setFirstLoginDate] = useState<string>('');

  useEffect(() => {
    if (userProfile && visible) {
      setProfile(userProfile);
      setTempProfile(userProfile);
      loadFirstLoginDate();
    }
  }, [userProfile, visible]);

  const loadFirstLoginDate = async () => {
    try {
      if (user) {
        const creationTime = user.metadata.creationTime;
        if (creationTime) {
          const firstDate = new Date(creationTime).toLocaleDateString();
          setFirstLoginDate(firstDate);
        } else {
          const profile = await FirebaseService.getUserProfile(user.uid);
          if (profile?.createdAt) {
            const firstDate = new Date(profile.createdAt).toLocaleDateString();
            setFirstLoginDate(firstDate);
          } else {
            const currentDate = new Date().toLocaleDateString();
            setFirstLoginDate(currentDate);
          }
        }
      }
    } catch (error) {
      console.error('Error loading first login date:', error);
      const currentDate = new Date().toLocaleDateString();
      setFirstLoginDate(currentDate);
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    setTempProfile(profile ? { ...profile } : null);
    onClose();
  };

  const saveProfile = async () => {
    try {
      if (!tempProfile) return;
      
      console.log(`🔄 [${user?.uid}] Saving profile updates...`);
      await updateUserProfile(tempProfile);
      setProfile(tempProfile);
      setIsEditing(false);
      console.log(`💊 [${user?.uid}] Profile saved successfully`);
      Alert.alert(t('success'), t('profileUpdatedSuccess'));
    } catch (error) {
      console.error('Error saving profile:', error);
      console.error(`❌ [${user?.uid}] Failed to save profile:`, error);
      Alert.alert(t('error'), t('couldNotSaveProfile'));
    }
  };

  const startEditing = () => {
    setTempProfile(profile ? { ...profile } : null);
    setIsEditing(true);
  };

  const pickImage = async () => {
    try {
      console.log('📸 [PersonalInfo] pickImage function called');
      console.log(`📸 [PersonalInfo] Starting image picker for user ${user?.uid}`);
      
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('📸 [PersonalInfo] Gallery permission result:', permissionResult);
      
      if (permissionResult.granted === false) {
        console.log('📸 [PersonalInfo] Gallery permission denied');
        Alert.alert(t('permissionNeeded'), t('galleryPermission'));
        return;
      }

      console.log('📸 [PersonalInfo] Launching image picker...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      console.log('📸 [PersonalInfo] Image picker result:', result);
      
      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log(`📸 [PersonalInfo] Image selected: ${imageUri}`);
        
        try {
          console.log('📸 [PersonalInfo] Uploading to Firebase Storage...');
          const downloadURL = await FirebaseService.uploadProfileImage(user!.uid, imageUri);
          console.log(`✅ [PersonalInfo] Image uploaded successfully: ${downloadURL}`);
          
          if (tempProfile) {
            console.log('📸 [PersonalInfo] Updating temp profile with new image URL');
            setTempProfile({ ...tempProfile, profileImageUrl: downloadURL });
          }
          
          Alert.alert(t('success'), t('imageUploadedSuccess'));
        } catch (error) {
          console.error('Error uploading image:', error);
          Alert.alert(t('error'), t('couldNotUploadImage'));
        }
      } else {
        console.log('📸 [PersonalInfo] Image selection canceled or failed');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      console.error('📸 [PersonalInfo] Error in pickImage:', error);
      Alert.alert(t('error'), t('couldNotSelectImage'));
    }
  };

  const takePhoto = async () => {
    try {
      console.log('📷 [PersonalInfo] takePhoto function called');
      console.log(`📷 [PersonalInfo] Starting camera for user ${user?.uid}`);
      
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      console.log('📷 [PersonalInfo] Camera permission result:', permissionResult);
      
      if (permissionResult.granted === false) {
        console.log('📷 [PersonalInfo] Camera permission denied');
        Alert.alert(t('permissionNeeded'), t('cameraPermission'));
        return;
      }

      console.log('📷 [PersonalInfo] Launching camera...');
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      console.log('📷 [PersonalInfo] Camera result:', result);
      
      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log(`📷 [PersonalInfo] Photo taken: ${imageUri}`);
        
        try {
          console.log('📷 [PersonalInfo] Uploading to Firebase Storage...');
          const downloadURL = await FirebaseService.uploadProfileImage(user!.uid, imageUri);
          console.log(`✅ [PersonalInfo] Photo uploaded successfully: ${downloadURL}`);
          
          if (tempProfile) {
            console.log('📷 [PersonalInfo] Updating temp profile with new image URL');
            setTempProfile({ ...tempProfile, profileImageUrl: downloadURL });
          }
          
          Alert.alert(t('success'), t('imageUploadedSuccess'));
        } catch (error) {
          console.error('Error uploading photo:', error);
          Alert.alert(t('error'), t('couldNotUploadImage'));
        }
      } else {
        console.log('📷 [PersonalInfo] Photo capture canceled or failed');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      console.error('📷 [PersonalInfo] Error in takePhoto:', error);
      Alert.alert(t('error'), t('couldNotTakePhoto'));
    }
  };

  const showImageOptions = () => {
    console.log('📸 [PersonalInfo] showImageOptions called');
    Alert.alert(
      t('profilePhoto'),
      t('choosePhotoOption'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('gallery'), 
          onPress: () => {
            console.log('📸 [PersonalInfo] Gallery option selected');
            pickImage();
          }
        },
        { 
          text: t('camera'), 
          onPress: () => {
            console.log('📸 [PersonalInfo] Camera option selected');
            takePhoto();
          }
        },
      ]
    );
  };

  const cancelEdit = () => {
    setTempProfile(profile ? { ...profile } : null);
    setIsEditing(false);
  };

  const ProfileField = ({ 
    icon: Icon, 
    label, 
    value, 
    onChangeText, 
    placeholder,
    readOnly = false
  }: any) => {
    return (
      <View style={styles.fieldContainer}>
        <View style={styles.fieldHeader}>
          <Icon size={20} color={theme.colors.primary} />
          <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
        </View>
        {isEditing ? (
          <TextInput
            style={[
              styles.fieldInput,
              {
                color: theme.colors.text,
                borderBottomColor: theme.colors.border,
                opacity: readOnly ? 0.6 : 1,
              }
            ]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textSecondary}
            editable={!readOnly}
            autoCorrect={false}
            autoCapitalize="words"
            keyboardType="default"
            returnKeyType="next"
            blurOnSubmit={false}
            multiline={false}
          />
        ) : (
          <Text style={[styles.fieldValue, { color: theme.colors.text }]}>
            {value || t('notInformed')}
          </Text>
        )}
      </View>
    );
  };

  const GenderSelector = () => {
    return (
      <View style={styles.fieldContainer}>
        <View style={styles.fieldHeader}>
          <User size={20} color={theme.colors.primary} />
          <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>{t('profileGender')}</Text>
        </View>
        {isEditing ? (
          <View style={styles.genderContainer}>
            {['male', 'other'].map((gender) => (
              <TouchableOpacity
                key={gender}
                style={[
                  styles.genderOption,
                  {
                    backgroundColor: tempProfile?.gender === gender ? theme.colors.primary : theme.colors.background,
                    borderColor: tempProfile?.gender === gender ? theme.colors.primary : theme.colors.border,
                  }
                ]}
                onPress={() => tempProfile && setTempProfile({ ...tempProfile, gender: gender as any })}
              >
                <Text style={[
                  styles.genderOptionText,
                  {
                    color: tempProfile?.gender === gender ? '#ffffff' : theme.colors.textSecondary,
                  }
                ]}>
                  {gender === 'male' ? t('male') : t('other')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={[styles.fieldValue, { color: theme.colors.text }]}>
            {profile?.gender === 'male' ? t('male') : profile?.gender === 'female' ? t('female') : t('other')}
          </Text>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.overlay}
          onTouchEnd={handleClose}
        />
        
        <Animated.View
          entering={SlideInDown.springify().damping(15)}
          exiting={SlideOutDown.duration(200)}
          style={[styles.modalContent, { backgroundColor: theme.colors.card }]}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.titleSection}>
              <User size={24} color={theme.colors.primary} />
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {t('personalInformation')}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: theme.colors.background }]}
              onPress={handleClose}
            >
              <X size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarContainer}>
                <View style={[styles.avatar, { backgroundColor: theme.colors.background }]}>
                  {(isEditing ? tempProfile?.profileImageUrl : profile?.profileImageUrl) ? (
                    <Image
                      source={{ uri: isEditing ? tempProfile?.profileImageUrl : profile?.profileImageUrl }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <User size={48} color={theme.colors.primary} />
                  )}
                </View>
                
                {isEditing && (
                  <TouchableOpacity
                    style={[styles.uploadButton, { backgroundColor: theme.colors.primary }]}
                    onPress={showImageOptions}
                  >
                    <Camera size={20} color="#ffffff" />
                  </TouchableOpacity>
                )}
              </View>
              
              <Text style={[styles.profileName, { color: theme.colors.text }]}>
                {profile?.name || t('nameNotInformed')}
              </Text>
              <Text style={[styles.profileSubtitle, { color: theme.colors.textSecondary }]}>
                {t('usingMaxTestorin')}
              </Text>
            </View>

            {/* Edit Control */}
            <View style={[styles.controlSection, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.controlTitle, { color: theme.colors.text }]}>
                {t('managePersonalData')}
              </Text>
              <Text style={[styles.controlSubtitle, { color: theme.colors.textSecondary }]}>
                {isEditing ? t('editModeActive') : t('viewOrEditInfo')}
              </Text>
              
              <TouchableOpacity
                style={[
                  styles.controlButton,
                  { 
                    backgroundColor: isEditing ? theme.colors.warning : theme.colors.primary,
                  }
                ]}
                onPress={() => isEditing ? cancelEdit() : startEditing()}
                activeOpacity={0.7}
              >
                {isEditing ? (
                  <>
                    <X size={20} color="#ffffff" />
                    <Text style={styles.controlButtonText}>{t('cancelEdit')}</Text>
                  </>
                ) : (
                  <>
                    <Edit3 size={20} color="#ffffff" />
                    <Text style={styles.controlButtonText}>{t('editInformation')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <View style={styles.form}>
              <ProfileField
                icon={User}
                label={t('fullName')}
                value={tempProfile?.name || ''}
                onChangeText={(text: string) => tempProfile && setTempProfile({ ...tempProfile, name: text })}
                placeholder={language === 'en' ? "Ex: John Silva Santos" : "Ex: João Silva Santos"}
              />

              <GenderSelector />

              <ProfileField
                icon={Mail}
                label={t('contactEmail')}
                value={tempProfile?.email || ''}
                onChangeText={(text: string) => tempProfile && setTempProfile({ ...tempProfile, email: text })}
                placeholder={language === 'en' ? "Ex: john@email.com" : "Ex: joao@email.com"}
              />

              <ProfileField
                icon={Calendar}
                label={t('treatmentStartDate')}
                value={firstLoginDate || tempProfile?.treatmentStartDate || ''}
                onChangeText={() => {}}
                placeholder={firstLoginDate ? firstLoginDate : (language === 'en' ? "Loading..." : "Carregando...")}
                readOnly={true}
              />
            </View>

            {/* Save Section */}
            {isEditing && (
              <View style={[styles.saveSection, { backgroundColor: theme.colors.background }]}>
                <Text style={[styles.saveTitle, { color: theme.colors.text }]}>
                  {t('saveChanges')}
                </Text>
                <Text style={[styles.saveSubtitle, { color: theme.colors.textSecondary }]}>
                  {t('confirmChanges')}
                </Text>
                
                <View style={styles.saveButtonContainer}>
                  <TouchableOpacity 
                    style={[
                      styles.cancelButton, 
                      { 
                        backgroundColor: theme.colors.card,
                        borderColor: theme.colors.border 
                      }
                    ]} 
                    onPress={cancelEdit}
                  >
                    <X size={18} color={theme.colors.textSecondary} />
                    <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>
                      {t('discard')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.saveButton, { backgroundColor: theme.colors.success }]} 
                    onPress={saveProfile}
                  >
                    <Save size={18} color="#ffffff" />
                    <Text style={styles.saveButtonText}>{t('saveData')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '95%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    paddingBottom: 16,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 12,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
    borderRadius: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  uploadButton: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
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
    zIndex: 10,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  profileSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  controlSection: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  controlTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  controlSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  controlButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  form: {
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  fieldValue: {
    fontSize: 16,
    marginLeft: 28,
  },
  fieldInput: {
    fontSize: 16,
    marginLeft: 28,
    borderBottomWidth: 1,
    paddingBottom: 4,
  },
  genderContainer: {
    flexDirection: 'row',
    marginLeft: 28,
    gap: 8,
  },
  genderOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  genderOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  saveSection: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  saveTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  saveSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  saveButtonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    marginLeft: 8,
  },
});