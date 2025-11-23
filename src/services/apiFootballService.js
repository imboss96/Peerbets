// src/services/apiFootballService.js
class ApiFootballService {
  static API_BASE_URL = 'https://v3.football.api-sports.io';
  // Replace with your actual API key
  static API_KEY = '565d18c7ee4a32d70042024b6a73b241';

  /**
   * Make API request with error handling
   */
  static async makeRequest(endpoint) {
    try {
      const response = await fetch(`${this.API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': this.API_KEY
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.errors && Object.keys(data.errors).length > 0) {
        throw new Error(data.errors[0]);
      }
      
      return data.response;
    } catch (error) {
      console.error('API Football error:', error);
      return null;
    }
  }

  /**
   * Get live games (matches in progress)
   */
  static async getLiveGames() {
    const data = await this.makeRequest('/fixtures?live=all');
    
    if (!data || data.length === 0) {
      console.log('No live games found, using mock data');
      return this.getMockLiveGames();
    }

    return data.map(fixture => this.formatFixture(fixture, 'live'));
  }

  /**
   * Get today's games
   */
  static async getTodaysGames() {
    const today = new Date().toISOString().split('T')[0];
    const data = await this.makeRequest(`/fixtures?date=${today}`);
    
    if (!data) {
      return this.getMockUpcomingGames();
    }

    return data.map(fixture => this.formatFixture(fixture, 'upcoming'));
  }

  /**
   * Get upcoming games (next 7 days)
   */
  static async getUpcomingGames() {
    const today = new Date().toISOString().split('T')[0];
    // Get next 7 days of matches
    const data = await this.makeRequest(`/fixtures?next=7`);
    
    if (!data) {
      return this.getMockUpcomingGames();
    }

    return data.map(fixture => this.formatFixture(fixture, 'upcoming'));
  }

  /**
   * Get games by league (Premier League, La Liga, etc.)
   */
  static async getGamesByLeague(leagueId, season = '2024') {
    const data = await this.makeRequest(`/fixtures?league=${leagueId}&season=${season}`);
    
    if (!data) {
      return this.getMockUpcomingGames();
    }

    return data.map(fixture => this.formatFixture(fixture, 'upcoming'));
  }

  /**
   * Format fixture data to our app structure
   */
  static formatFixture(fixture, status) {
    const totalPool = Math.floor(Math.random() * 200000) + 50000;
    const homeBets = Math.floor(totalPool * 0.4);
    const awayBets = Math.floor(totalPool * 0.35);
    const drawBets = Math.floor(totalPool * 0.25);

    return {
      id: fixture.fixture.id,
      league: fixture.league.name,
      country: fixture.league.country,
      homeTeam: fixture.teams.home.name,
      awayTeam: fixture.teams.away.name,
      homeLogo: fixture.teams.home.logo,
      awayLogo: fixture.teams.away.logo,
      kickoff: fixture.fixture.date,
      status: status,
      minute: fixture.fixture.status.elapsed,
      score: {
        home: fixture.goals.home,
        away: fixture.goals.away
      },
      homeBets: homeBets,
      awayBets: awayBets,
      drawBets: drawBets,
      totalPool: totalPool,
      venue: fixture.fixture.venue?.name,
      referee: fixture.fixture.referee,
      statusDescription: this.getStatusDescription(fixture.fixture.status),
      // Additional real data
      leagueId: fixture.league.id,
      round: fixture.league.round,
      timestamp: fixture.fixture.timestamp
    };
  }

  /**
   * Get user-friendly status description
   */
  static getStatusDescription(status) {
    const statusMap = {
      'TBD': 'Time To Be Defined',
      'NS': 'Not Started',
      '1H': 'First Half',
      'HT': 'Halftime',
      '2H': 'Second Half',
      'ET': 'Extra Time',
      'P': 'Penalty In Progress',
      'FT': 'Match Finished',
      'AET': 'Match Finished After Extra Time',
      'PEN': 'Match Finished After Penalty',
      'BT': 'Break Time',
      'SUSP': 'Match Suspended',
      'INT': 'Match Interrupted',
      'PST': 'Match Postponed',
      'CANC': 'Match Cancelled',
      'ABD': 'Match Abandoned',
      'AWD': 'Technical Loss',
      'WO': 'WalkOver'
    };

    return statusMap[status.short] || status.long || 'Live';
  }

  /**
   * Get all games (live + upcoming)
   */
  static async getAllGames() {
    try {
      const [liveGames, upcomingGames] = await Promise.all([
        this.getLiveGames(),
        this.getUpcomingGames()
      ]);
      
      return [...liveGames, ...upcomingGames];
    } catch (error) {
      console.error('Error fetching all games:', error);
      return [...this.getMockLiveGames(), ...this.getMockUpcomingGames()];
    }
  }

  /**
   * Get league standings
   */
  static async getStandings(leagueId, season = '2024') {
    const data = await this.makeRequest(`/standings?league=${leagueId}&season=${season}`);
    return data?.[0]?.league?.standings?.[0] || [];
  }

  /**
   * Get match statistics
   */
  static async getMatchStatistics(fixtureId) {
    return await this.makeRequest(`/fixtures/statistics?fixture=${fixtureId}`);
  }

  /**
   * Get match events (goals, cards, substitutions)
   */
  static async getMatchEvents(fixtureId) {
    return await this.makeRequest(`/fixtures/events?fixture=${fixtureId}`);
  }

  /**
   * Get match lineups
   */
  static async getMatchLineups(fixtureId) {
    return await this.makeRequest(`/fixtures/lineups?fixture=${fixtureId}`);
  }

  /**
   * Subscribe to live updates
   */
  static subscribeToLiveUpdates(callback) {
    // Simulate live updates every 45 seconds to avoid rate limits
    const interval = setInterval(async () => {
      try {
        const liveGames = await this.getLiveGames();
        callback(liveGames);
      } catch (error) {
        console.error('Error in live updates:', error);
      }
    }, 45000);

    return () => clearInterval(interval);
  }

  /**
   * Mock data for live games (fallback)
   */
  static getMockLiveGames() {
    return [
      {
        id: 1,
        league: 'Premier League',
        homeTeam: 'Chelsea',
        awayTeam: 'Manchester United',
        kickoff: new Date().toISOString(),
        status: 'live',
        minute: 67,
        score: { home: 2, away: 1 },
        homeBets: 45000,
        awayBets: 38000,
        drawBets: 12000,
        totalPool: 95000,
        venue: 'Stamford Bridge',
        referee: 'Michael Oliver',
        statusDescription: 'Second Half'
      },
      {
        id: 2,
        league: 'Premier League',
        homeTeam: 'Liverpool',
        awayTeam: 'Arsenal',
        kickoff: new Date().toISOString(),
        status: 'live',
        minute: 23,
        score: { home: 0, away: 0 },
        homeBets: 62000,
        awayBets: 55000,
        drawBets: 18000,
        totalPool: 135000,
        venue: 'Anfield',
        referee: 'Anthony Taylor',
        statusDescription: 'First Half'
      }
    ];
  }

  /**
   * Mock data for upcoming games (fallback)
   */
  static getMockUpcomingGames() {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const threeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    
    return [
      {
        id: 3,
        league: 'La Liga',
        homeTeam: 'Real Madrid',
        awayTeam: 'Barcelona',
        kickoff: tomorrow.toISOString(),
        status: 'upcoming',
        homeBets: 88000,
        awayBets: 92000,
        drawBets: 25000,
        totalPool: 205000,
        venue: 'Santiago Bernabeu',
        referee: 'TBA',
        statusDescription: 'Not Started'
      },
      {
        id: 4,
        league: 'Premier League',
        homeTeam: 'Manchester City',
        awayTeam: 'Tottenham',
        kickoff: threeDays.toISOString(),
        status: 'upcoming',
        homeBets: 71000,
        awayBets: 42000,
        drawBets: 15000,
        totalPool: 128000,
        venue: 'Etihad Stadium',
        referee: 'TBA',
        statusDescription: 'Not Started'
      }
    ];
  }
}

export default ApiFootballService;