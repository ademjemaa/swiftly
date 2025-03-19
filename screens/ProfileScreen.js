import React, { useContext, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { AuthContext } from '../utils/AuthContext';
import axios from 'axios'; 

const ProfileScreen = () => {
  const { state, signOut } = useContext(AuthContext);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('projects');
  const [projectsFilter, setProjectsFilter] = useState('main');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isViewingOwnProfile, setIsViewingOwnProfile] = useState(true);
  
  
  useEffect(() => {
    if (state.user) {
      setCurrentUser(state.user);
    }
  }, [state.user]);

  const searchUser = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Please enter a login to search');
      return;
    }

    setIsSearching(true);
    try {
      
      const response = await axios.get(`https://api.intra.42.fr/v2/users`, {
        params: { 
          filter: { login: searchQuery }
        },
        headers: {
          Authorization: `Bearer ${state.token}`
        }
      });

      if (response.data && response.data.length > 0) {
        setCurrentUser(response.data[0]);
        setIsViewingOwnProfile(false);
      } else {
        Alert.alert('User not found', 'No user found with that login');
      }
    } catch (error) {
      console.error('Error searching for user:', error);
      Alert.alert('Error', 'Failed to search for user. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const resetToOwnProfile = () => {
    setCurrentUser(state.user);
    setIsViewingOwnProfile(true);
    setSearchQuery('');
  };

  if (!currentUser) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading profile data...</Text>
      </View>
    );
  }

  const getFilteredProjects = () => {
    if (!currentUser.projects_users) return [];
    
    const cursusId = projectsFilter === 'main' ? 21 : 9;
    
    const filteredProjects = currentUser.projects_users.filter(project => 
      project.cursus_ids && project.cursus_ids.includes(cursusId)
    );
    
    return filteredProjects.sort((a, b) => {
      if (!a.marked_at) return 1;
      if (!b.marked_at) return -1;
      return new Date(b.marked_at) - new Date(a.marked_at);
    });
  };

  const getSkills = () => {
    if (!currentUser.cursus_users || currentUser.cursus_users.length === 0) return [];
    
    const sortedCursus = [...currentUser.cursus_users].sort((a, b) => 
      new Date(b.begin_at) - new Date(a.begin_at)
    );
    
    return sortedCursus[0].skills || [];
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'projects':
        const filteredProjects = getFilteredProjects();
        return (
          <View style={styles.tabContent}>
            {/* Project Type Selector */}
            <View style={styles.projectTypeSelector}>
              <TouchableOpacity
                style={[
                  styles.projectTypeButton,
                  projectsFilter === 'main' && styles.activeProjectTypeButton
                ]}
                onPress={() => setProjectsFilter('main')}
              >
                <Text style={[
                  styles.projectTypeText,
                  projectsFilter === 'main' && styles.activeProjectTypeText
                ]}>
                  Main Cursus
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.projectTypeButton,
                  projectsFilter === 'piscine' && styles.activeProjectTypeButton
                ]}
                onPress={() => setProjectsFilter('piscine')}
              >
                <Text style={[
                  styles.projectTypeText,
                  projectsFilter === 'piscine' && styles.activeProjectTypeText
                ]}>
                  Piscine
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Projects List */}
            <Text style={styles.sectionTitle}>
              {projectsFilter === 'main' ? 'Main Cursus Projects' : 'Piscine Projects'}
            </Text>
            
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project, index) => (
                <View key={index} style={styles.projectItem}>
                  <View style={styles.projectLeftSection}>
                    <Text style={styles.projectName}>{project.project.name}</Text>
                    {project.marked_at && (
                      <Text style={styles.projectDate}>
                        {new Date(project.marked_at).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                  
                  <View style={styles.projectRightSection}>
                    <Text style={[
                      styles.projectStatus,
                      { color: getStatusColor(project.status) }
                    ]}>
                      {project.status}
                    </Text>
                    {project.final_mark !== null && (
                      <Text style={[
                        styles.projectGrade,
                        { color: project.validated ? '#4CAF50' : '#F44336' }
                      ]}>
                        {project.final_mark}/100
                      </Text>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyMessage}>
                No {projectsFilter === 'main' ? 'main cursus' : 'piscine'} projects to display
              </Text>
            )}
          </View>
        );
        
      case 'skills':
        const skills = getSkills();
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Skills</Text>
            {skills.length > 0 ? (
              skills.sort((a, b) => b.level - a.level).map((skill, index) => (
                <View key={index} style={styles.skillItem}>
                  <Text style={styles.skillName}>{skill.name}</Text>
                  <View style={styles.skillBarContainer}>
                    <View 
                      style={[
                        styles.skillBar, 
                        { width: `${Math.min(skill.level * 5, 100)}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.skillLevel}>{skill.level.toFixed(2)}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyMessage}>No skills to display</Text>
            )}
          </View>
        );
        
      case 'achievements':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            {currentUser.achievements && currentUser.achievements.length > 0 ? (
              currentUser.achievements.map((achievement, index) => (
                <View key={index} style={styles.achievementItem}>
                  <View style={styles.achievementHeader}>
                    <Text style={styles.achievementName}>{achievement.name}</Text>
                    <View style={[styles.achievementTier, 
                      { backgroundColor: getAchievementColor(achievement.tier) }]}>
                      <Text style={styles.achievementTierText}>
                        {achievement.tier.charAt(0).toUpperCase() + achievement.tier.slice(1)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.achievementDescription}>{achievement.description}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyMessage}>No achievements to display</Text>
            )}
          </View>
        );
        
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search user by login..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          onSubmitEditing={searchUser}
        />
        <TouchableOpacity 
          style={styles.searchButton} 
          onPress={searchUser}
          disabled={isSearching}
        >
          {isSearching ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.searchButtonText}>Search</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Viewing Other Profile Banner */}
      {!isViewingOwnProfile && (
        <View style={styles.viewingBanner}>
          <Text style={styles.viewingBannerText}>
            Viewing {currentUser.login}'s profile
          </Text>
          <TouchableOpacity onPress={resetToOwnProfile}>
            <Text style={styles.viewingBannerButton}>Return to My Profile</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView>
        {/* Profile Header */}
        <View style={styles.header}>
          <Image 
            source={{ uri: currentUser.image?.link || 'https://cdn.intra.42.fr/users/default.png' }} 
            style={styles.profileImage} 
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{currentUser.displayname || currentUser.login}</Text>
            <Text style={styles.userLogin}>@{currentUser.login}</Text>
            <Text style={styles.userEmail}>{currentUser.email}</Text>
          </View>
        </View>

        {/* User Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{currentUser.correction_point || 0}</Text>
            <Text style={styles.statLabel}>Correction Points</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{currentUser.wallet || 0}</Text>
            <Text style={styles.statLabel}>Wallet</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{currentUser.location || 'N/A'}</Text>
            <Text style={styles.statLabel}>Location</Text>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'projects' && styles.activeTabButton]} 
            onPress={() => setActiveTab('projects')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'projects' && styles.activeTabText]}>
              Projects
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'skills' && styles.activeTabButton]} 
            onPress={() => setActiveTab('skills')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'skills' && styles.activeTabText]}>
              Skills
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'achievements' && styles.activeTabButton]} 
            onPress={() => setActiveTab('achievements')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'achievements' && styles.activeTabText]}>
              Achievements
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content Container */}
        <View style={styles.sectionContainer}>
          {renderTabContent()}
        </View>

        {/* Logout Button - Only show for own profile */}
        {isViewingOwnProfile && (
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={signOut}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const getStatusColor = (status) => {
  switch (status) {
    case 'finished':
      return '#4CAF50';
    case 'in_progress':
      return '#2196F3';
    case 'failed':
      return '#F44336';
    default:
      return '#757575';
  }
};

const getAchievementColor = (tier) => {
  switch (tier) {
    case 'easy':
      return '#4CAF50';
    case 'medium':
      return '#FF9800';
    case 'hard':
      return '#F44336';
    case 'none':
      return '#9E9E9E';
    default:
      return '#9E9E9E';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginRight: 10,
    backgroundColor: '#f9f9f9',
  },
  searchButton: {
    backgroundColor: '#00BABC',
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  searchButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  viewingBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    padding: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  viewingBannerText: {
    color: '#555',
    fontWeight: '500',
  },
  viewingBannerButton: {
    color: '#00BABC',
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: '#00BABC',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'white',
  },
  userInfo: {
    marginLeft: 15,
    flex: 1,
  },
  userName: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  userLogin: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    marginBottom: 5,
  },
  userEmail: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 5,
    margin: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    borderRightWidth: 1,
    borderRightColor: '#f0f0f0',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00BABC',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 5,
    margin: 15,
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  tabButton: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 3,
    borderBottomColor: '#00BABC',
  },
  tabButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#00BABC',
    fontWeight: 'bold',
  },
  projectTypeSelector: {
    flexDirection: 'row',
    marginBottom: 15,
    borderRadius: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#00BABC',
  },
  projectTypeButton: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  activeProjectTypeButton: {
    backgroundColor: '#00BABC',
  },
  projectTypeText: {
    color: '#00BABC',
    fontWeight: '500',
  },
  activeProjectTypeText: {
    color: 'white',
  },
  sectionContainer: {
    backgroundColor: 'white',
    borderRadius: 5,
    margin: 15,
    marginTop: 5,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  tabContent: {
    minHeight: 200,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  projectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  projectLeftSection: {
    flex: 1,
  },
  projectRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectName: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  projectDate: {
    fontSize: 12,
    color: '#999',
  },
  projectStatus: {
    fontSize: 14,
    marginRight: 10,
    fontWeight: '500',
  },
  projectGrade: {
    fontSize: 14,
    fontWeight: 'bold',
    minWidth: 60,
    textAlign: 'right',
  },
  skillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  skillName: {
    width: 90,
    fontSize: 14,
    color: '#333',
  },
  skillBarContainer: {
    flex: 1,
    height: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  skillBar: {
    height: '100%',
    backgroundColor: '#00BABC',
    borderRadius: 5,
  },
  skillLevel: {
    width: 45,
    fontSize: 14,
    textAlign: 'right',
    color: '#666',
  },
  achievementItem: {
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    borderLeftWidth: 3,
    borderLeftColor: '#00BABC',
  },
  achievementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  achievementTier: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  achievementTierText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  achievementDescription: {
    fontSize: 14,
    color: '#666',
  },
  emptyMessage: {
    color: '#999',
    textAlign: 'center',
    padding: 15,
  },
  logoutButton: {
    backgroundColor: '#f44336',
    margin: 15,
    marginTop: 5,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ProfileScreen;