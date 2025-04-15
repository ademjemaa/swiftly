import React, { useContext, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { AuthContext } from '../utils/AuthContext';
import api from '../utils/api';
import { styles } from '../styles/profileStyles';
import { getFilteredProjects, getSkills, getStatusColor, getAchievementColor, sortAchievements } from '../utils/profileHelpers';
import ProfileHeader from '../components/ProfileHeader';
import StatsSection from '../components/StatsSection';

const ProfileScreen = () => {
  const { state, signOut } = useContext(AuthContext);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('projects');
  const [projectsFilter, setProjectsFilter] = useState('main');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isViewingOwnProfile, setIsViewingOwnProfile] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState({});

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
      const response = await api.get(`/users`, {
        params: { 
          'filter[login]': searchQuery.trim().toLowerCase() 
        }
      });

      if (response.data && response.data.length > 0) {
        const userDetailsResponse = await api.get(`/users/${response.data[0].id}`);
        setCurrentUser(userDetailsResponse.data);
        setIsViewingOwnProfile(false);
      } else {
        Alert.alert('User not found', 'No user found with that login');
      }
    } catch (error) {
      console.error('Error searching for user:', error);
      
      if (error.response) {
        if (error.response.status === 404) {
          Alert.alert('User not found', 'No user exists with this login');
        } else if (error.response.status === 401) {
          Alert.alert('Authentication Error', 'Please log in again', [
            { text: 'OK', onPress: () => signOut() }
          ]);
        } else {
          Alert.alert('Error', `Server error: ${error.response.status}`);
        }
      } else if (error.request) {
        Alert.alert('Network Error', 'No response from server. Check your connection.');
      } else {
        Alert.alert('Error', 'An unexpected error occurred');
      }
    } finally {
      setIsSearching(false);
    }
  };

  const resetToOwnProfile = () => {
    setCurrentUser(state.user);
    setIsViewingOwnProfile(true);
    setSearchQuery('');
  };

  const toggleProjectExpansion = (projectId) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  if (!currentUser) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading profile data...</Text>
      </View>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'projects':
        const filteredProjects = getFilteredProjects(currentUser, projectsFilter);
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
                <View key={index}>
                  {/* Parent Project */}
                  <TouchableOpacity 
                    style={styles.projectItem}
                    onPress={() => project.children.length > 0 && toggleProjectExpansion(project.project.id)}
                  >
                    <View style={styles.projectLeftSection}>
                      <Text style={styles.projectName}>
                        {project.project.name}
                        {project.children.length > 0 && 
                          (expandedProjects[project.project.id] ? ' ▼' : ' ▶')}
                      </Text>
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
                          { color: 
                            project.final_mark < 100 ? '#F44336' : 
                            project.final_mark === 100 ? '#4CAF50' : 
                            '#FF9800' 
                          }
                        ]}>
                          {project.final_mark}/100
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                  
                  {/* Child Projects */}
                  {project.children.length > 0 && expandedProjects[project.project.id] && (
                    <View style={styles.childProjectsContainer}>
                      {project.children.map((childProject, childIndex) => (
                        <View key={childIndex} style={styles.childProjectItem}>
                          <View style={styles.projectLeftSection}>
                            <Text style={styles.childProjectName}>
                              {childProject.project.name}
                            </Text>
                            {childProject.marked_at && (
                              <Text style={styles.projectDate}>
                                {new Date(childProject.marked_at).toLocaleDateString()}
                              </Text>
                            )}
                          </View>
                          
                          <View style={styles.projectRightSection}>
                            <Text style={[
                              styles.projectStatus,
                              { color: getStatusColor(childProject.status) }
                            ]}>
                              {childProject.status}
                            </Text>
                            {childProject.final_mark !== null && (
                              <Text style={[
                                styles.projectGrade,
                                { color: 
                                  childProject.final_mark < 100 ? '#F44336' : 
                                  childProject.final_mark === 100 ? '#4CAF50' : 
                                  '#FF9800' 
                                }
                              ]}>
                                {childProject.final_mark}/100
                              </Text>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
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
        const skills = getSkills(currentUser);
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
              sortAchievements(currentUser.achievements).map((achievement, index) => (
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
        />
        <TouchableOpacity 
          style={styles.searchButton} 
          onPress={searchUser}
          disabled={isSearching}
        >
          {isSearching ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.searchButtonText}>Search</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView>
        <ProfileHeader currentUser={currentUser} />
        <StatsSection currentUser={currentUser} />

        {/* Back to Own Profile Button */}
        {!isViewingOwnProfile && (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={resetToOwnProfile}
          >
            <Text style={styles.backButtonText}>Back to My Profile</Text>
          </TouchableOpacity>
        )}

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
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;