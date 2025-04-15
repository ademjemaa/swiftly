export const getUserLevel = (currentUser) => {
  if (!currentUser.cursus_users || currentUser.cursus_users.length === 0) return null;
  
  // Find the level for 42cursus (id 21)
  const mainCursus = currentUser.cursus_users.find(cursus => cursus.cursus_id === 21);
  if (mainCursus) {
    return mainCursus.level;
  }
  
  return null;
};

export const getFilteredProjects = (currentUser, projectsFilter) => {
  if (!currentUser.projects_users) return [];
  
  const cursusId = projectsFilter === 'main' ? 21 : 9;
  
  const filteredProjects = currentUser.projects_users.filter(project => 
    project.cursus_ids && project.cursus_ids.includes(cursusId)
  );
  
  // Organize projects into parent-child relationships
  const projectsMap = {};
  const parentProjects = [];
  
  // First pass: categorize projects into parent or child
  filteredProjects.forEach(project => {
    // Store each project by its ID for easy lookup
    const projectId = project.project.id;
    if (!projectsMap[projectId]) {
      projectsMap[projectId] = {
        ...project,
        children: []
      };
    } else {
      // Update existing entry with actual project data
      projectsMap[projectId] = {
        ...project,
        children: projectsMap[projectId].children
      };
    }
    
    // If project has a parent, add it as a child to the parent
    if (project.project.parent_id) {
      const parentId = project.project.parent_id;
      if (!projectsMap[parentId]) {
        projectsMap[parentId] = { children: [] };
      }
      projectsMap[parentId].children.push(project);
    } else {
      // It's a parent project
      parentProjects.push(projectId);
    }
  });
  
  // Convert to array and sort
  const result = parentProjects.map(id => projectsMap[id])
    .filter(project => project.project) // Make sure it has proper project data
    .sort((a, b) => {
      if (!a.marked_at) return 1;
      if (!b.marked_at) return -1;
      return new Date(b.marked_at) - new Date(a.marked_at);
    });
    
  // Sort children projects within each parent
  result.forEach(parentProject => {
    if (parentProject.children && parentProject.children.length > 0) {
      parentProject.children.sort((a, b) => {
        if (!a.marked_at) return 1;
        if (!b.marked_at) return -1;
        return new Date(b.marked_at) - new Date(a.marked_at);
      });
    }
  });
  
  return result;
};

export const getSkills = (currentUser) => {
  if (!currentUser.cursus_users || currentUser.cursus_users.length === 0) return [];
  
  const sortedCursus = [...currentUser.cursus_users].sort((a, b) => 
    new Date(b.begin_at) - new Date(a.begin_at)
  );
  
  return sortedCursus[0].skills || [];
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'finished':
      return '#4CAF50'; // Green 
    case 'in_progress':
      return '#757575'; // Grey 
    case 'failed':
      return '#F44336'; // Red
    default:
      return '#9E9E9E'; // Lighter grey for unknown status
  }
};

export const getAchievementColor = (tier) => {
  switch (tier) {
    case 'easy':
      return '#4CAF50'; // Green
    case 'medium':
      return '#FF9800'; // Orange
    case 'hard':
      return '#F44336'; // Red
    case 'challenge':
      return '#9C27B0'; // Purple
    default:
      return '#2196F3'; // Blue for 'none' and others
  }
};

export const getTierPriority = (tier) => {
  switch (tier.toLowerCase()) {
    case 'hard':
      return 0;
    case 'medium':
      return 1;
    case 'easy':
      return 2;
    default:
      return 3;
  }
};

export const sortAchievements = (achievements) => {
  return [...achievements].sort((a, b) => {
    const priorityA = getTierPriority(a.tier);
    const priorityB = getTierPriority(b.tier);
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // If same tier, sort alphabetically by name
    return a.name.localeCompare(b.name);
  });
}; 