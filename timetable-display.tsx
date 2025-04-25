// src/components/timetable-display.tsx
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, ClipboardCopy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { GenerateTimetableOutput } from '@/ai/flows/generate-timetable'; // Import the type

interface TimetableDisplayProps {
  timetableData: GenerateTimetableOutput;
}

// Helper function to convert structured data to a simple text format
const convertToPlainText = (data: GenerateTimetableOutput): string => {
  let text = "Timetable\n\n";
  // Header row
  text += "Period".padEnd(15) + data.days.map(day => day.padEnd(20)).join("") + "\n";
  text += "".padEnd(15, "-") + data.days.map(() => "".padEnd(20, "-")).join("") + "\n";

  // Schedule rows
  data.periods.forEach((period, periodIndex) => {
    text += period.padEnd(15);
    data.days.forEach((_, dayIndex) => {
      const entry = data.schedule[periodIndex]?.[dayIndex] || "Free";
      text += entry.padEnd(20);
    });
    text += "\n";
  });

  return text;
};


export function TimetableDisplay({ timetableData }: TimetableDisplayProps) {
  const { toast } = useToast();
  const { days, periods, schedule } = timetableData;

  const plainTextTimetable = React.useMemo(() => convertToPlainText(timetableData), [timetableData]);

  const handleExportText = () => {
    const blob = new Blob([plainTextTimetable], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'timetable.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Exported as Text', description: 'Timetable saved as timetable.txt' });
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(plainTextTimetable)
      .then(() => {
        toast({ title: 'Copied to Clipboard', description: 'Timetable (text format) copied successfully.' });
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        toast({ variant: 'destructive', title: 'Copy Failed', description: 'Could not copy timetable to clipboard.' });
      });
  };

  // Basic validation for rendering
  if (!days?.length || !periods?.length || !schedule?.length) {
    return (
        <Card className="mt-8 border-destructive shadow-md">
            <CardHeader>
                <CardTitle className="text-2xl text-destructive">Error Displaying Timetable</CardTitle>
            </CardHeader>
            <CardContent>
                <p>The generated timetable data seems incomplete or invalid.</p>
            </CardContent>
        </Card>
    );
  }


  return (
    <Card className="mt-8 border-primary shadow-md overflow-hidden">
      <CardHeader>
        <CardTitle className="text-2xl text-primary">Generated Timetable</CardTitle>
        <CardDescription>Review the generated schedule below.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
         {/* Responsive wrapper for the table */}
        <div className="w-full overflow-x-auto">
          <Table className="min-w-full border">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-semibold border-r w-1/12 min-w-[100px]">Period</TableHead>
                {days.map((day) => (
                  <TableHead key={day} className="font-semibold border-r text-center min-w-[150px]">{day}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {periods.map((period, periodIndex) => (
                <TableRow key={period} className="border-b">
                  <TableHead className="font-medium border-r align-top pt-2 pb-2 h-full">{period}</TableHead>
                  {days.map((_, dayIndex) => (
                    <TableCell key={`${period}-${dayIndex}`} className="border-r text-sm p-2 align-top min-h-[50px]">
                      {schedule[periodIndex]?.[dayIndex] || <span className="text-muted-foreground italic">Free</span>}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-end mt-4">
          <Button variant="outline" onClick={handleCopyToClipboard}>
            <ClipboardCopy className="mr-2 h-4 w-4" />
            Copy as Text
          </Button>
          <Button onClick={handleExportText} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Download className="mr-2 h-4 w-4" />
            Export as Text
          </Button>
          {/* Add other export options here if needed (e.g., CSV, PDF) */}
        </div>
      </CardContent>
    </Card>
  );
}
