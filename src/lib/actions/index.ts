// Export all authentication actions
export {
  login,
  signup,
  logout,
  getCurrentUser,
  isAuthenticated,
  requireAuth,
} from "./auth";

// Export all poll management actions
export {
  createPoll,
  updatePoll,
  deletePoll,
  getPolls,
  getPollWithVotes,
  getUserPolls,
  getPollStats,
  canAccessPoll,
} from "./polls";

// Export all voting actions
export {
  submitVote,
  hasUserVoted,
  getUserVote,
  getPollVotes,
  getUserVotingHistory,
  removeVote,
  getVoteStatistics,
} from "./votes";
