// Legacy actions file - migrate imports to use new modular structure
// This file is kept for backward compatibility during the migration

export {
  // Authentication actions
  login,
  signup,
  logout,
  getCurrentUser,
  isAuthenticated,
  requireAuth,

  // Poll management actions
  createPoll,
  updatePoll,
  deletePoll,
  getPolls,
  getPollWithVotes,
  getUserPolls,
  getPollStats,
  canAccessPoll,

  // Voting actions
  submitVote,
  hasUserVoted,
  getUserVote,
  getPollVotes,
  getUserVotingHistory,
  removeVote,
  getVoteStatistics,
} from "./actions/index";

// Re-export everything from the new modular actions structure
// This ensures backward compatibility while we migrate components
