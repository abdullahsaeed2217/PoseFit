import { useSessions, useWorkouts } from "@/hooks/use-workouts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, LineChart, PieChart, TrendingUp, Download, Table } from "lucide-react";
import { exportToPDF, exportToExcel } from "@/lib/export-utils";
import { 
  ResponsiveContainer, 
  LineChart as ReLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip as ReTooltip, 
  CartesianGrid,
  AreaChart,
  Area
} from "recharts";
import { format } from "date-fns";

export function ReportingAnalytics() {
  const { data: sessions, isLoading: sLoading } = useSessions();
  const { data: workouts, isLoading: wLoading } = useWorkouts();

  if (sLoading || wLoading) return <div className="h-96 animate-pulse bg-white/5 rounded-[2rem]" />;

  const chartData = sessions?.slice().reverse().map(s => ({
    date: format(new Date(s.completedAt!), "MMM d"),
    score: s.score || 0,
    duration: Math.round((s.duration || 0) / 60)
  }));

  const handleExportPDF = () => sessions && workouts && exportToPDF(sessions, workouts);
  const handleExportExcel = () => sessions && workouts && exportToExcel(sessions, workouts);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-white">Analytics & Insights</h2>
          <p className="text-muted-foreground">Comprehensive overview of your fitness journey</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 border-white/10 hover-elevate" onClick={handleExportExcel}>
            <Download className="w-4 h-4" /> Excel
          </Button>
          <Button className="btn-primary-gradient gap-2 hover-elevate" onClick={handleExportPDF}>
            <FileDown className="w-4 h-4" /> PDF Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="glass-panel border-white/5 p-6">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Accuracy Trend
            </CardTitle>
            <CardDescription>Posture analysis scores over recent sessions</CardDescription>
          </CardHeader>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(263, 85%, 60%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(263, 85%, 60%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <ReTooltip 
                  contentStyle={{ backgroundColor: '#1a1b26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="score" stroke="hsl(263, 85%, 60%)" fillOpacity={1} fill="url(#colorScore)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="glass-panel border-white/5 p-6">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="flex items-center gap-2">
              <LineChart className="w-5 h-5 text-secondary" /> Volume Analysis
            </CardTitle>
            <CardDescription>Active minutes tracked per session</CardDescription>
          </CardHeader>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ReLineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <ReTooltip 
                  contentStyle={{ backgroundColor: '#1a1b26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Line type="monotone" dataKey="duration" stroke="hsl(172, 66%, 50%)" strokeWidth={3} dot={{ fill: 'hsl(172, 66%, 50%)', r: 4 }} activeDot={{ r: 6 }} />
              </ReLineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
