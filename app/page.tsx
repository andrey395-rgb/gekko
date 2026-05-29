import Image from "next/image";

export default function DashboardPage() {
  // Static data for Sprint 1 
  const metrics = [
    { title: 'Total Tickets', value: '24', color: 'bg-gray-100 text-gray-600 border-gray-200' }, // [cite: 17]
    { title: 'Open', value: '8', color: 'bg-blue-50 text-blue-700 border-blue-200' }, // [cite: 17]
    { title: 'In Progress', value: '12', color: 'bg-amber-50 text-amber-700 border-amber-200' }, // [cite: 17]
    { title: 'Closed This Week', value: '4', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }, // [cite: 17]
    { title: 'Active Blockers', value: '1', color: 'bg-red-50 text-red-700 border-red-200' }, // [cite: 17]
    { title: 'PRs Open', value: '3', color: 'bg-purple-50 text-purple-700 border-purple-200' }, // [cite: 17]
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome to your Developer Home Base.</p>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map((metric) => (
          <div 
            key={metric.title} 
            className={`p-4 rounded-lg border ${metric.color} shadow-sm`}
          >
            <p className="text-sm font-medium opacity-80">{metric.title}</p>
            <p className="text-3xl font-bold mt-1">{metric.value}</p>
          </div>
        ))}
      </div>

      {/* Main Content Area - Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Center Column (Tickets & Feed) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm min-h-[400px]">
            <h2 className="text-lg font-semibold mb-4">Recent Tickets</h2>
            <div className="text-center text-gray-400 mt-20">
              Ticket table component will go here
            </div>
          </div>
        </div>

        {/* Right Panel (Focus & Events) [cite: 28] */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm min-h-[200px]">
            <h2 className="text-lg font-semibold mb-4">My Focus</h2>
            <div className="text-center text-gray-400 mt-10">
              Focus widget will go here
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}