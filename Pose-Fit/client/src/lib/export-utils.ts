import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { Session, Workout } from "@shared/schema";
import { format } from "date-fns";

export const exportToPDF = (sessions: Session[], workouts: Workout[]) => {
  const doc = new jsPDF() as any;
  
  doc.setFontSize(20);
  doc.text("PoseToFit - Performance Report", 14, 22);
  doc.setFontSize(10);
  doc.text(`Generated on ${format(new Date(), "PPP")}`, 14, 30);

  const tableData = sessions.map(session => [
    format(new Date(session.completedAt!), "yyyy-MM-dd HH:mm"),
    workouts.find(w => w.id === session.workoutId)?.title || "Unknown",
    `${session.score}%`,
    `${Math.floor(session.duration! / 60)}m ${session.duration! % 60}s`,
    session.feedback || "No feedback"
  ]);

  doc.autoTable({
    startY: 40,
    head: [["Date", "Workout", "Accuracy", "Duration", "Trainer Feedback"]],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [100, 50, 200] },
    alternateRowStyles: { fillColor: [245, 245, 245] }
  });

  doc.save(`PoseToFit_Report_${format(new Date(), "yyyyMMdd")}.pdf`);
};

export const exportToExcel = (sessions: Session[], workouts: Workout[]) => {
  const data = sessions.map(session => ({
    Date: format(new Date(session.completedAt!), "yyyy-MM-dd HH:mm"),
    Workout: workouts.find(w => w.id === session.workoutId)?.title || "Unknown",
    Accuracy: `${session.score}%`,
    Duration: `${Math.floor(session.duration! / 60)}m ${session.duration! % 60}s`,
    Feedback: session.feedback || "No feedback"
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Performance");
  XLSX.writeFile(workbook, `PoseToFit_Report_${format(new Date(), "yyyyMMdd")}.xlsx`);
};
