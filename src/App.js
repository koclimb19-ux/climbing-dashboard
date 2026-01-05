import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Trophy, TrendingUp, Mountain, Award, Calendar, User } from 'lucide-react';

// Bonus type mapping
const BONUS_MAP = {
  'TrabVia': 'Via Trabalhada',
  'NewVia': 'Via Cadena Inedita',
  'FlashVia': 'Via Flash',
  'AVistaVia': 'Via A Vista',
  'FAVia': 'Via FA',
  'AVistaPula1Via': 'Via Quabra de Grau A Vista',
  'AVistaPula2Via': 'Via Quabra de Grau A Vista',
  'AVistaPula3Via': 'Via Quabra de Grau A Vista',
  'Pula1Via': 'Via Quebra de Grau Maximo',
  'Pula2Via': 'Via Quebra de Grau Maximo',
  'Pula3Via': 'Via Quebra de Grau Maximo',
  'Pula4Via': 'Via Quebra de Grau Maximo',
  'TrabBoulder': 'Boulder Trabalhado',
  'NewBoulder': 'Boulder Cadena Inedita',
  'FlashBoulder': 'Boulder Flash',
  'AVistaBoulder': 'Boulder A Vista',
  'FABolder': 'Boulder FA',
  'AVistaPula1Boulder': 'Boulder Quabra de Grau A Vista',
  'AVistaPula2Boulder': 'Boulder Quabra de Grau A Vista',
  'AVistaPula3Boulder': 'Boulder Quabra de Grau A Vista',
  'Pula1Boulder': 'Boulder Quebra de Grau Maximo',
  'Pula2Boulder': 'Boulder Quebra de Grau Maximo',
  'Pula3Boulder': 'Boulder Quebra de Grau Maximo',
  'Pula4Boulder': 'Boulder Quebra de Grau Maximo',
  'Pula5Boulder': 'Boulder Quebra de Grau Maximo'
};

const CHART_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'];

const ClimbingDashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAthlete, setSelectedAthlete] = useState('all');
  const [view, setView] = useState('leaderboard');
  const [selectedBonus, setSelectedBonus] = useState(null);
  const [selectedAthleteBonus, setSelectedAthleteBonus] = useState(null);
  
  // Set your API key and Spreadsheet ID here - they will be saved in the code
  const [apiKey, setApiKey] = useState('AIzaSyB9S1znY3qnK3NsJiJVI4d1CGQRroaGnik');
  const [spreadsheetId, setSpreadsheetId] = useState('1tF6dl2cHAfD9W2g-Gt3o4Xi6bt8J6P6ngVc_-06IEH0');
  const [isConfigured, setIsConfigured] = useState(false);

  const fetchData = async () => {
    if (!apiKey || !spreadsheetId) {
      setError('Please enter both API Key and Spreadsheet ID');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const range = 'cadenas1!A2:O';
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;
      
      console.log('Fetching from:', url);
      
      const response = await fetch(url);
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Error response:', errorData);
        
        if (response.status === 403) {
          throw new Error('Access denied. Make sure: 1) Your API key is correct, 2) Google Sheets API is enabled in your project, 3) The spreadsheet is shared publicly (Anyone with link can view)');
        } else if (response.status === 404) {
          throw new Error('Sheet not found. Check your Spreadsheet ID or make sure the sheet "cadenas1" exists.');
        } else if (response.status === 400) {
          throw new Error('Bad request. Check that the sheet name "cadenas1" is correct and the range A2:O exists.');
        } else {
          throw new Error(`HTTP ${response.status}: ${errorData?.error?.message || 'Failed to fetch data'}`);
        }
      }
      
      const result = await response.json();
      console.log('Data received:', result);
      
      if (!result.values || result.values.length === 0) {
        throw new Error('No data found in the sheet. Make sure "cadenas1" has data starting from row 2.');
      }
      
      const parsedData = result.values.map((row, index) => {
        const points = parseFloat(row[14]) || 0;
        
        // Debug logging for first 5 rows
        if (index < 5) {
          console.log(`Row ${index + 2}:`, {
            athlete: row[0],
            bonus: row[9],
            pointsRaw: row[14],
            pointsParsed: points,
            fullRow: row
          });
        }
        
        return {
          athlete: row[0] || '',
          date: row[5] || '',
          routeName: row[6] || '',
          crag: row[7] || '',
          grade: row[8] || '',
          bonus: row[9] || '',
          bonusDescription: BONUS_MAP[row[9]] || row[9],
          points: points,
          type: (row[9] && (row[9].includes('Boulder') || row[9].includes('Bolder'))) ? 'Boulder' : 'Via'
        };
      });
      
      console.log('Parsed data:', parsedData.length, 'rows');
      console.log('Sample parsed data:', parsedData.slice(0, 3));
      
      setData(parsedData);
      setIsConfigured(true);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to fetch data. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigure = () => {
    fetchData();
  };

  // Auto-connect on component mount
  useEffect(() => {
    if (apiKey && spreadsheetId && !isConfigured) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array means this runs once on mount

  // Calculate leaderboard
  const leaderboard = React.useMemo(() => {
    const athleteStats = {};
    
    data.forEach(climb => {
      if (!athleteStats[climb.athlete]) {
        athleteStats[climb.athlete] = {
          athlete: climb.athlete,
          totalPoints: 0,
          totalClimbs: 0,
          vias: 0,
          boulders: 0
        };
      }
      
      athleteStats[climb.athlete].totalPoints += climb.points;
      athleteStats[climb.athlete].totalClimbs += 1;
      
      if (climb.type === 'Boulder') {
        athleteStats[climb.athlete].boulders += 1;
      } else {
        athleteStats[climb.athlete].vias += 1;
      }
    });
    
    // Round the total points after summing
    return Object.values(athleteStats).map(athlete => ({
      ...athlete,
      totalPoints: Math.round(athlete.totalPoints)
    })).sort((a, b) => b.totalPoints - a.totalPoints);
  }, [data]);

  // Calculate bonus type breakdown
  const bonusBreakdown = React.useMemo(() => {
    const breakdown = { via: {}, boulder: {} };
    
    data.forEach(climb => {
      const category = climb.type === 'Boulder' ? 'boulder' : 'via';
      const bonusKey = climb.bonusDescription;
      
      if (!breakdown[category][bonusKey]) {
        breakdown[category][bonusKey] = { count: 0, points: 0 };
      }
      
      breakdown[category][bonusKey].count += 1;
      breakdown[category][bonusKey].points += climb.points;
    });
    
    // Round the points after summing
    Object.keys(breakdown).forEach(category => {
      Object.keys(breakdown[category]).forEach(bonusKey => {
        breakdown[category][bonusKey].points = Math.round(breakdown[category][bonusKey].points);
      });
    });
    
    return breakdown;
  }, [data]);

  // Calculate totals for vias and boulders
  const typeTotals = React.useMemo(() => {
    const totals = {
      via: { count: 0, points: 0 },
      boulder: { count: 0, points: 0 }
    };
    
    data.forEach(climb => {
      const category = climb.type === 'Boulder' ? 'boulder' : 'via';
      totals[category].count += 1;
      totals[category].points += climb.points;
    });
    
    totals.via.points = Math.round(totals.via.points);
    totals.boulder.points = Math.round(totals.boulder.points);
    
    return totals;
  }, [data]);

  // Ordered bonus types for alignment
  const orderedBonusTypes = [
    { via: 'Via Trabalhada', boulder: 'Boulder Trabalhado' },
    { via: 'Via Cadena Inedita', boulder: 'Boulder Cadena Inedita' },
    { via: 'Via Flash', boulder: 'Boulder Flash' },
    { via: 'Via A Vista', boulder: 'Boulder A Vista' },
    { via: 'Via FA', boulder: 'Boulder FA' },
    { via: 'Via Quabra de Grau A Vista', boulder: 'Boulder Quabra de Grau A Vista' },
    { via: 'Via Quebra de Grau Maximo', boulder: 'Boulder Quebra de Grau Maximo' }
  ];

  // Recent activity
  const recentActivity = React.useMemo(() => {
    return [...data]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);
  }, [data]);

  // Bonus type detail view (including totals)
  const bonusDetailData = React.useMemo(() => {
    if (!selectedBonus) return null;
    
    const athleteCounts = {};
    
    // Handle total via/boulder comparison
    if (selectedBonus === 'Total Vias' || selectedBonus === 'Total Boulders') {
      const targetType = selectedBonus === 'Total Vias' ? 'Via' : 'Boulder';
      
      data.forEach(climb => {
        if (climb.type === targetType) {
          if (!athleteCounts[climb.athlete]) {
            athleteCounts[climb.athlete] = {
              athlete: climb.athlete,
              count: 0,
              totalPoints: 0,
              climbs: []
            };
          }
          athleteCounts[climb.athlete].count += 1;
          athleteCounts[climb.athlete].totalPoints += climb.points;
          athleteCounts[climb.athlete].climbs.push(climb);
        }
      });
    } else {
      // Handle specific bonus type
      data.forEach(climb => {
        if (climb.bonusDescription === selectedBonus) {
          if (!athleteCounts[climb.athlete]) {
            athleteCounts[climb.athlete] = {
              athlete: climb.athlete,
              count: 0,
              totalPoints: 0,
              climbs: []
            };
          }
          athleteCounts[climb.athlete].count += 1;
          athleteCounts[climb.athlete].totalPoints += climb.points;
          athleteCounts[climb.athlete].climbs.push(climb);
        }
      });
    }
    
    return Object.values(athleteCounts)
      .sort((a, b) => b.count - a.count)
      .map(athlete => ({
        ...athlete,
        totalPoints: Math.round(athlete.totalPoints)
      }));
  }, [selectedBonus, data]);

  // Individual athlete stats
  const athleteData = React.useMemo(() => {
    if (selectedAthlete === 'all') return null;
    
    const athleteClimbs = data.filter(c => c.athlete === selectedAthlete);
    const bonusCounts = {};
    
    athleteClimbs.forEach(climb => {
      const key = climb.bonusDescription;
      if (!bonusCounts[key]) {
        bonusCounts[key] = 0;
      }
      bonusCounts[key] += 1;
    });
    
    return {
      climbs: athleteClimbs,
      bonusCounts,
      totalPoints: Math.round(athleteClimbs.reduce((sum, c) => sum + c.points, 0)),
      totalClimbs: athleteClimbs.length
    };
  }, [selectedAthlete, data]);

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-slate-800 rounded-lg shadow-2xl p-8 border border-slate-700">
            <div className="text-center mb-8">
              <Mountain className="w-16 h-16 mx-auto text-orange-500 mb-4" />
              <h1 className="text-3xl font-bold text-white mb-2">Climbing Championship Dashboard</h1>
              <p className="text-slate-400">Configure your Google Sheets connection</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Google Sheets API Key
                </label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="AIzaSy..."
                />
                <p className="mt-2 text-xs text-slate-400">
                  Get your API key from <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-orange-400 hover:underline">Google Cloud Console</a>
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Spreadsheet ID
                </label>
                <input
                  type="text"
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                />
                <p className="mt-2 text-xs text-slate-400">
                  Found in your sheet URL: docs.google.com/spreadsheets/d/<span className="text-orange-400">[SPREADSHEET_ID]</span>/edit
                </p>
              </div>
              
              <button
                onClick={handleConfigure}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Connect Dashboard
              </button>
              
              {error && (
                <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-200 text-sm">
                  {error}
                </div>
              )}
            </div>
            
            <div className="mt-8 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
              <h3 className="text-sm font-semibold text-white mb-2">Setup Instructions:</h3>
              <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside">
                <li>Enable Google Sheets API in Google Cloud Console</li>
                <li>Create an API key with Sheets API access</li>
                <li>Make your spreadsheet publicly viewable (or share with API service account)</li>
                <li>Copy your Spreadsheet ID from the URL</li>
                <li>Enter both values above and click Connect</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Mountain className="w-16 h-16 mx-auto text-orange-500 mb-4 animate-pulse" />
          <p className="text-white text-xl">Loading championship data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="max-w-2xl mx-auto bg-red-900/20 border border-red-700 rounded-lg p-6">
          <p className="text-red-200">{error}</p>
          <button 
            onClick={() => setIsConfigured(false)}
            className="mt-4 bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded"
          >
            Reconfigure
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Mountain className="w-10 h-10 text-orange-500" />
            K.O. CLIMB
          </h1>
          <p className="text-slate-400">Year-long competition tracking</p>
        </div>

        {/* Navigation */}
        <div className="mb-6 flex gap-2 flex-wrap justify-center">
          <button
            onClick={() => setView('leaderboard')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              view === 'leaderboard'
                ? 'bg-orange-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Trophy className="w-4 h-4 inline mr-2" />
            Leaderboard
          </button>
          <button
            onClick={() => setView('bonus')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              view === 'bonus'
                ? 'bg-orange-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Award className="w-4 h-4 inline mr-2" />
            Bonus Analysis
          </button>
          <button
            onClick={() => setView('athlete')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              view === 'athlete'
                ? 'bg-orange-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <User className="w-4 h-4 inline mr-2" />
            Athlete Stats
          </button>
          <button
            onClick={() => setView('recent')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              view === 'recent'
                ? 'bg-orange-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            Recent Activity
          </button>
        </div>

        {/* Leaderboard View */}
        {view === 'leaderboard' && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg shadow-xl p-6 border border-slate-700">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-500" />
                Championship Standings
              </h2>
              
              <div className="space-y-3">
                {leaderboard.map((athlete, index) => (
                  <div
                    key={athlete.athlete}
                    className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                      index === 0
                        ? 'bg-gradient-to-r from-yellow-900/40 to-yellow-800/20 border-2 border-yellow-600'
                        : index === 1
                        ? 'bg-gradient-to-r from-slate-700/40 to-slate-600/20 border-2 border-slate-500'
                        : index === 2
                        ? 'bg-gradient-to-r from-orange-900/40 to-orange-800/20 border-2 border-orange-600'
                        : 'bg-slate-700/50 border border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                          index === 0
                            ? 'bg-yellow-500 text-yellow-900'
                            : index === 1
                            ? 'bg-slate-400 text-slate-900'
                            : index === 2
                            ? 'bg-orange-500 text-orange-900'
                            : 'bg-slate-600 text-slate-200'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-white font-semibold text-lg">{athlete.athlete}</div>
                        <div className="text-slate-400 text-sm">
                          {athlete.totalClimbs} climbs • {athlete.vias} routes • {athlete.boulders} boulders
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-orange-400">{athlete.totalPoints}</div>
                      <div className="text-slate-400 text-sm">points</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top 10 Chart */}
            <div className="bg-slate-800 rounded-lg shadow-xl p-6 border border-slate-700">
              <h3 className="text-xl font-bold text-white mb-4">Points Distribution</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={leaderboard.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="athlete" stroke="#9ca3af" angle={-45} textAnchor="end" height={100} />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                    labelStyle={{ color: '#f1f5f9' }}
                  />
                  <Bar dataKey="totalPoints" fill="#f97316" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Bonus Analysis View */}
        {view === 'bonus' && !selectedBonus && (
          <div className="space-y-6">
            {/* Total Boxes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Total Vias */}
              <div 
                className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 rounded-lg shadow-xl p-6 border-2 border-blue-600 hover:border-blue-500 cursor-pointer transition-all"
                onClick={() => setSelectedBonus('Total Vias')}
              >
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                  Total Routes (Vias)
                </h2>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-blue-300 text-sm mb-1">Total climbs</div>
                    <div className="text-4xl font-bold text-white">{typeTotals.via.count}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-blue-300 text-sm mb-1">Total points</div>
                    <div className="text-2xl font-bold text-blue-400">{typeTotals.via.points}</div>
                  </div>
                </div>
              </div>

              {/* Total Boulders */}
              <div 
                className="bg-gradient-to-br from-green-900/40 to-green-800/20 rounded-lg shadow-xl p-6 border-2 border-green-600 hover:border-green-500 cursor-pointer transition-all"
                onClick={() => setSelectedBonus('Total Boulders')}
              >
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Mountain className="w-6 h-6 text-green-400" />
                  Total Boulders
                </h2>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-green-300 text-sm mb-1">Total climbs</div>
                    <div className="text-4xl font-bold text-white">{typeTotals.boulder.count}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-300 text-sm mb-1">Total points</div>
                    <div className="text-2xl font-bold text-green-400">{typeTotals.boulder.points}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Aligned Bonus Types */}
            <div className="bg-slate-800 rounded-lg shadow-xl p-6 border border-slate-700">
              <h2 className="text-2xl font-bold text-white mb-6">Bonus Types Comparison</h2>
              
              <div className="space-y-4">
                {orderedBonusTypes.map((pair, index) => (
                  <div key={index} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Via */}
                    <div 
                      className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:bg-slate-600/50 cursor-pointer transition-all"
                      onClick={() => setSelectedBonus(pair.via)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="text-blue-300 font-medium">{pair.via}</div>
                        <div className="text-right">
                          <div className="text-blue-400 font-bold text-3xl">
                            {bonusBreakdown.via[pair.via]?.count || 0}
                          </div>
                          <div className="text-slate-400 text-sm">
                            {bonusBreakdown.via[pair.via]?.points || 0} pts
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Boulder */}
                    <div 
                      className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:bg-slate-600/50 cursor-pointer transition-all"
                      onClick={() => setSelectedBonus(pair.boulder)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="text-green-300 font-medium">{pair.boulder}</div>
                        <div className="text-right">
                          <div className="text-green-400 font-bold text-3xl">
                            {bonusBreakdown.boulder[pair.boulder]?.count || 0}
                          </div>
                          <div className="text-slate-400 text-sm">
                            {bonusBreakdown.boulder[pair.boulder]?.points || 0} pts
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bonus Detail View */}
        {view === 'bonus' && selectedBonus && bonusDetailData && (
          <div className="space-y-6">
            {/* Back Button */}
            <button
              onClick={() => setSelectedBonus(null)}
              className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
            >
              <span className="text-xl">←</span> Back to Bonus Analysis
            </button>

            {/* Header */}
            <div className="bg-slate-800 rounded-lg shadow-xl p-6 border border-slate-700">
              <h2 className="text-2xl font-bold text-white mb-2">{selectedBonus}</h2>
              <p className="text-slate-400">Athletes ranked by number of logs</p>
            </div>

            {/* Athlete Rankings */}
            <div className="bg-slate-800 rounded-lg shadow-xl p-6 border border-slate-700">
              <h3 className="text-xl font-bold text-white mb-4">Athlete Rankings</h3>
              
              <div className="space-y-3">
                {bonusDetailData.map((athlete, index) => (
                  <div
                    key={athlete.athlete}
                    className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                      index === 0
                        ? 'bg-gradient-to-r from-yellow-900/40 to-yellow-800/20 border-2 border-yellow-600'
                        : index === 1
                        ? 'bg-gradient-to-r from-slate-700/40 to-slate-600/20 border-2 border-slate-500'
                        : index === 2
                        ? 'bg-gradient-to-r from-orange-900/40 to-orange-800/20 border-2 border-orange-600'
                        : 'bg-slate-700/50 border border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                          index === 0
                            ? 'bg-yellow-500 text-yellow-900'
                            : index === 1
                            ? 'bg-slate-400 text-slate-900'
                            : index === 2
                            ? 'bg-orange-500 text-orange-900'
                            : 'bg-slate-600 text-slate-200'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-white font-semibold text-lg">{athlete.athlete}</div>
                        <div className="text-slate-400 text-sm">{athlete.totalPoints} total points</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-orange-400">{athlete.count}</div>
                      <div className="text-slate-400 text-sm">logs</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart */}
            <div className="bg-slate-800 rounded-lg shadow-xl p-6 border border-slate-700">
              <h3 className="text-xl font-bold text-white mb-4">Log Count Comparison</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={bonusDetailData.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="athlete" stroke="#9ca3af" angle={-45} textAnchor="end" height={100} />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                    labelStyle={{ color: '#f1f5f9' }}
                  />
                  <Bar dataKey="count" fill="#f97316" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Recent Logs for This Bonus Type */}
            <div className="bg-slate-800 rounded-lg shadow-xl p-6 border border-slate-700">
              <h3 className="text-xl font-bold text-white mb-4">Recent Logs</h3>
              <div className="space-y-2">
                {(selectedBonus === 'Total Vias' || selectedBonus === 'Total Boulders'
                  ? data.filter(climb => climb.type === (selectedBonus === 'Total Vias' ? 'Via' : 'Boulder'))
                  : data.filter(climb => climb.bonusDescription === selectedBonus)
                )
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .slice(0, 20)
                  .map((climb, index) => (
                    <div key={index} className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-white font-semibold">{climb.athlete}</div>
                          <div className="text-slate-300 text-sm">{climb.routeName || 'Unnamed route'}</div>
                          <div className="text-slate-400 text-xs">
                            {climb.crag} • Grade {climb.grade} • {climb.bonusDescription} • {climb.date}
                          </div>
                        </div>
                        <div className="text-orange-400 font-bold">{Math.round(climb.points)} pts</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Athlete Stats View */}
        {view === 'athlete' && !selectedAthleteBonus && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg shadow-xl p-6 border border-slate-700">
              <h2 className="text-2xl font-bold text-white mb-4">Select Athlete</h2>
              <select
                value={selectedAthlete}
                onChange={(e) => setSelectedAthlete(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">-- Select an athlete --</option>
                {leaderboard.map(athlete => (
                  <option key={athlete.athlete} value={athlete.athlete}>
                    {athlete.athlete}
                  </option>
                ))}
              </select>
            </div>

            {athleteData && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-orange-900/40 to-orange-800/20 rounded-lg shadow-xl p-6 border border-orange-700">
                    <div className="text-orange-400 text-sm font-medium mb-2">Total Points</div>
                    <div className="text-4xl font-bold text-white">{athleteData.totalPoints}</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 rounded-lg shadow-xl p-6 border border-blue-700">
                    <div className="text-blue-400 text-sm font-medium mb-2">Total Climbs</div>
                    <div className="text-4xl font-bold text-white">{athleteData.totalClimbs}</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-900/40 to-green-800/20 rounded-lg shadow-xl p-6 border border-green-700">
                    <div className="text-green-400 text-sm font-medium mb-2">Avg Points/Climb</div>
                    <div className="text-4xl font-bold text-white">
                      {athleteData.totalClimbs > 0 ? Math.round(athleteData.totalPoints / athleteData.totalClimbs) : 0}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800 rounded-lg shadow-xl p-6 border border-slate-700">
                  <h3 className="text-xl font-bold text-white mb-4">Bonus Type Distribution</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(athleteData.bonusCounts)
                      .sort((a, b) => b[1] - a[1])
                      .map(([bonus, count]) => (
                        <div 
                          key={bonus} 
                          className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:bg-slate-600/50 cursor-pointer transition-all"
                          onClick={() => setSelectedAthleteBonus(bonus)}
                        >
                          <div className="flex justify-between items-center">
                            <div className="text-white text-sm">{bonus}</div>
                            <div className="text-orange-400 font-bold text-lg">{count}</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="bg-slate-800 rounded-lg shadow-xl p-6 border border-slate-700">
                  <h3 className="text-xl font-bold text-white mb-4">Recent Climbs</h3>
                  <div className="space-y-2">
                    {athleteData.climbs
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .slice(0, 15)
                      .map((climb, index) => (
                        <div key={index} className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="text-white font-medium">{climb.routeName || 'Unnamed route'}</div>
                              <div className="text-slate-500 text-xs mt-1">{climb.date}</div>
                            </div>
                            <div className="text-orange-400 font-bold">{Math.round(climb.points)} pts</div>
                          </div>
                          <div className="flex flex-wrap gap-2 text-sm">
                            <span className="bg-slate-600 text-slate-200 px-3 py-1 rounded-full">
                              {climb.crag}
                            </span>
                            <span className="bg-blue-900/50 text-blue-200 px-3 py-1 rounded-full">
                              Grade {climb.grade}
                            </span>
                            <span className="bg-purple-900/50 text-purple-200 px-3 py-1 rounded-full">
                              {climb.bonusDescription}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Athlete Bonus Detail View */}
        {view === 'athlete' && selectedAthleteBonus && athleteData && (
          <div className="space-y-6">
            {/* Back Button */}
            <button
              onClick={() => setSelectedAthleteBonus(null)}
              className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
            >
              <span className="text-xl">←</span> Back to {selectedAthlete}'s Stats
            </button>

            {/* Header */}
            <div className="bg-slate-800 rounded-lg shadow-xl p-6 border border-slate-700">
              <h2 className="text-2xl font-bold text-white mb-2">{selectedAthlete} - {selectedAthleteBonus}</h2>
              <p className="text-slate-400">{athleteData.bonusCounts[selectedAthleteBonus]} total logs</p>
            </div>

            {/* Grade Distribution Pie Chart */}
            <div className="bg-slate-800 rounded-lg shadow-xl p-6 border border-slate-700">
              <h3 className="text-xl font-bold text-white mb-4">Grade Distribution</h3>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={(() => {
                      const gradeCounts = {};
                      athleteData.climbs
                        .filter(climb => climb.bonusDescription === selectedAthleteBonus)
                        .forEach(climb => {
                          const grade = climb.grade || 'Unknown';
                          gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
                        });
                      return Object.entries(gradeCounts)
                        .map(([grade, count]) => ({ name: `Grade ${grade}`, value: count }))
                        .sort((a, b) => b.value - a.value);
                    })()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(() => {
                      const gradeCounts = {};
                      athleteData.climbs
                        .filter(climb => climb.bonusDescription === selectedAthleteBonus)
                        .forEach(climb => {
                          const grade = climb.grade || 'Unknown';
                          gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
                        });
                      return Object.entries(gradeCounts)
                        .map(([grade, count]) => ({ name: `Grade ${grade}`, value: count }))
                        .sort((a, b) => b.value - a.value);
                    })().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                    labelStyle={{ color: '#f1f5f9' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* All Logs for This Bonus Type */}
            <div className="bg-slate-800 rounded-lg shadow-xl p-6 border border-slate-700">
              <h3 className="text-xl font-bold text-white mb-4">All Logs</h3>
              <div className="space-y-3">
                {athleteData.climbs
                  .filter(climb => climb.bonusDescription === selectedAthleteBonus)
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((climb, index) => (
                    <div key={index} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="text-white font-semibold text-lg">{climb.routeName || 'Unnamed route'}</div>
                          <div className="text-slate-500 text-xs mt-1">{climb.date}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-orange-400 font-bold text-xl">{Math.round(climb.points)}</div>
                          <div className="text-slate-400 text-sm">points</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm">
                        <span className="bg-slate-600 text-slate-200 px-3 py-1 rounded-full">
                          {climb.crag}
                        </span>
                        <span className="bg-blue-900/50 text-blue-200 px-3 py-1 rounded-full">
                          Grade {climb.grade}
                        </span>
                        <span className={`px-3 py-1 rounded-full ${
                          climb.type === 'Boulder'
                            ? 'bg-green-900/50 text-green-200'
                            : 'bg-orange-900/50 text-orange-200'
                        }`}>
                          {climb.type}
                        </span>
                        <span className="bg-purple-900/50 text-purple-200 px-3 py-1 rounded-full">
                          {climb.bonusDescription}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity View */}
        {view === 'recent' && (
          <div className="bg-slate-800 rounded-lg shadow-xl p-6 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-purple-500" />
              Latest Logged Climbs
            </h2>
            
            <div className="space-y-3">
              {recentActivity.map((climb, index) => (
                <div key={index} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:bg-slate-700 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-white font-semibold text-lg">{climb.athlete}</div>
                      <div className="text-slate-300">{climb.routeName || 'Unnamed route'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-orange-400 font-bold text-xl">{Math.round(climb.points)}</div>
                      <div className="text-slate-400 text-sm">points</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="bg-slate-600 text-slate-200 px-3 py-1 rounded-full">
                      {climb.crag}
                    </span>
                    <span className="bg-blue-900/50 text-blue-200 px-3 py-1 rounded-full">
                      Grade {climb.grade}
                    </span>
                    <span className={`px-3 py-1 rounded-full ${
                      climb.type === 'Boulder'
                        ? 'bg-green-900/50 text-green-200'
                        : 'bg-orange-900/50 text-orange-200'
                    }`}>
                      {climb.type}
                    </span>
                    <span className="bg-purple-900/50 text-purple-200 px-3 py-1 rounded-full">
                      {climb.bonusDescription}
                    </span>
                  </div>
                  <div className="text-slate-400 text-xs mt-2">{climb.date}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <div className="mt-8 text-center">
          <button
            onClick={fetchData}
            className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            🔄 Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClimbingDashboard;