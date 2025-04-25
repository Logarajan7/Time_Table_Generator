'use client';

import type * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CalendarDays, BookOpen, Users, ClipboardList, Loader2, Clock } from 'lucide-react'; // Added Clock icon

const formSchema = z.object({
  workingDays: z.coerce // Use coerce to convert string input to number
    .number({ invalid_type_error: 'Must be a number' })
    .int()
    .positive({ message: 'Working days must be positive.' })
    .min(1, { message: 'Minimum 1 working day.' })
    .max(7, { message: 'Maximum 7 working days.' }),
  classesPerDay: z.coerce // New field for classes per day
    .number({ invalid_type_error: 'Must be a number' })
    .int()
    .positive({ message: 'Classes per day must be positive.' })
    .min(1, { message: 'Minimum 1 class per day.' })
    .max(12, { message: 'Maximum 12 classes per day.' }), // Reasonable upper limit
  subjects: z.string().min(1, { message: 'Please enter at least one subject.' })
    .refine(value => value.split(',').map(s => s.trim()).every(s => s.length > 0), {
      message: 'Ensure all subject names are valid (comma-separated).',
    }),
  teachersPerSubject: z
    .string()
    .min(1, { message: 'Please enter teacher counts.' })
    .refine(
      (value) => {
        const counts = value.split(',').map((t) => parseInt(t.trim(), 10));
        return counts.every((count) => !isNaN(count) && count >= 0);
      },
      { message: 'Teacher counts must be valid numbers (comma-separated).' }
    )
    .refine(
      (value) => {
        const counts = value.split(',').map((t) => parseInt(t.trim(), 10));
        return counts.every((count) => count >= 0);
      },
      { message: 'Teacher counts cannot be negative.' }
    ),
  otherConstraints: z.string().optional(),
}).refine(
  (data) => {
    const subjectCount = data.subjects.split(',').map(s => s.trim()).filter(s => s).length;
    const teacherCount = data.teachersPerSubject.split(',').map(t => t.trim()).filter(t => t).length;
    return subjectCount === teacherCount;
  },
  {
    message: "The number of subjects must match the number of teacher counts provided.",
    path: ["teachersPerSubject"], // Attach error to teachersPerSubject field
  }
);


export type TimetableFormValues = z.infer<typeof formSchema>;

interface TimetableFormProps {
  onSubmit: (values: TimetableFormValues) => Promise<void>;
  isLoading: boolean;
}

export function TimetableForm({ onSubmit, isLoading }: TimetableFormProps) {
  const form = useForm<TimetableFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      workingDays: 5,
      classesPerDay: 6, // Default value for classes per day
      subjects: '',
      teachersPerSubject: '',
      otherConstraints: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="workingDays"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <CalendarDays className="text-primary" />
                Number of Working Days per Week
              </FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 5" {...field} />
              </FormControl>
              <FormDescription>
                Enter the total number of working days in a school/college week.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="classesPerDay"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Clock className="text-primary" />
                Number of Classes/Periods per Day
              </FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 6" {...field} />
              </FormControl>
              <FormDescription>
                Enter the desired number of teaching periods per day (excluding breaks).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="subjects"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <BookOpen className="text-primary" />
                Subjects
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g., Math, Science, History" {...field} />
              </FormControl>
              <FormDescription>
                Enter the names of the subjects, separated by commas.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="teachersPerSubject"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Users className="text-primary" />
                Teachers per Subject
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g., 2, 3, 1" {...field} />
              </FormControl>
              <FormDescription>
                Enter the number of available teachers for each subject, in the same order as subjects, separated by commas.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="otherConstraints"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <ClipboardList className="text-primary" />
                Other Constraints (Optional)
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., No Math classes on Friday afternoon, Teacher X prefers morning slots, Add a Lunch break after period 3..."
                  className="resize-y min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Specify any additional rules, preferences, or breaks for the timetable generation.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Timetable'
          )}
        </Button>
      </form>
    </Form>
  );
}
