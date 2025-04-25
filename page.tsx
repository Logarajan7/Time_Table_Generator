
'use client';

import * as React from 'react';
import {TimetableForm, type TimetableFormValues} from '@/components/timetable-form';
import {TimetableDisplay} from '@/components/timetable-display';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {generateTimetableAction} from '@/actions/generate-timetable-action';
import type { GenerateTimetableOutput } from '@/ai/flows/generate-timetable'; // Import the type
import {Loader2} from 'lucide-react';
import {useToast} from '@/hooks/use-toast';

export default function Home() {
  // State to hold the structured timetable data
  const [timetableData, setTimetableData] = React.useState<GenerateTimetableOutput | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const {toast} = useToast();

  const handleGenerateTimetable = async (values: TimetableFormValues) => {
    setIsLoading(true);
    setTimetableData(null); // Clear previous timetable data

    try {
       // Prepare input for the action, including the new classesPerDay field
      const input = {
        workingDays: values.workingDays,
        classesPerDay: values.classesPerDay, // Pass the new value
        subjects: values.subjects.split(',').map(s => s.trim()).filter(s => s),
        teachersPerSubject: values.teachersPerSubject
          .split(',')
          .map(t => parseInt(t.trim(), 10))
          .filter(n => !isNaN(n) && n >= 0), // Ensure non-negative integers
        otherConstraints: values.otherConstraints || '',
      };

      // Basic client-side check for consistency before calling the action
       if (input.subjects.length !== input.teachersPerSubject.length) {
         toast({
           variant: 'destructive',
           title: 'Input Error',
           description: 'The number of subjects must match the number of teacher counts provided.',
         });
         setIsLoading(false);
         return;
       }


      const result = await generateTimetableAction(input);

      if (result.error) {
        console.error('Error generating timetable:', result.error);
        toast({
          variant: 'destructive',
          title: 'Error Generating Timetable',
          description: result.error,
        });
        setTimetableData(null);
      } else if (result.data) {
        // Ensure the structure is valid before setting state
        if (result.data.days && result.data.periods && result.data.schedule) {
            setTimetableData(result.data);
            toast({
              title: 'Timetable Generated',
              description: 'Your timetable has been successfully generated.',
            });
        } else {
             console.error('Invalid timetable structure received:', result.data);
             toast({
               variant: 'destructive',
               title: 'Error Generating Timetable',
               description: 'Received invalid timetable data structure from the AI.',
             });
             setTimetableData(null);
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        variant: 'destructive',
        title: 'An Unexpected Error Occurred',
        description: 'Please try again later.',
      });
      setTimetableData(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container mx-auto p-4 md:p-8 lg:p-12 min-h-screen flex flex-col items-center">
      <Card className="w-full max-w-6xl shadow-lg"> {/* Increased max-width for table */}
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">
            TimeTable Pro
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter your requirements below to generate an optimal timetable.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Keep Form max-width smaller if desired */}
          <div className="max-w-2xl mx-auto">
             <TimetableForm onSubmit={handleGenerateTimetable} isLoading={isLoading} />
          </div>


          {isLoading && (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <span className="ml-4 text-lg text-muted-foreground">
                Generating Timetable...
              </span>
            </div>
          )}

          {/* Pass the structured data to the display component */}
          {timetableData && !isLoading && (
             <TimetableDisplay timetableData={timetableData} />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
